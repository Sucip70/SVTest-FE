import { useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ArrowLeft, Bold, ChevronLeft, ChevronRight, Eye, FilePenLine, Heading2, Italic, List as ListIcon, ListOrdered, Plus, RotateCcw, Send, Trash2 } from 'lucide-react'
import './App.css'

const tabs = [
  { label: 'Published', value: 'Published' },
  { label: 'Drafts', value: 'Draft' },
  { label: 'Trashed', value: 'Trashed' },
]

const initialArticles = [
  {
    id: 1,
    title: 'Getting started with React',
    category: 'Frontend',
    content: 'React helps build reusable user interface components.',
    status: 'Published',
  },
  {
    id: 2,
    title: 'Basic form validation',
    category: 'Frontend',
    content: 'Validation keeps submitted data complete and easier to process.',
    status: 'Draft',
  },
  {
    id: 3,
    title: 'Working with database indexes',
    category: 'Database',
    content: 'Indexes help database queries find rows faster when used on the right columns.',
    status: 'Published',
  },
]

const emptyArticle = {
  title: '',
  category: '',
  content: '',
}

function getPlainText(content) {
  return content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function App() {
  const [articles, setArticles] = useState(initialArticles)
  const [currentArticle, setCurrentArticle] = useState(emptyArticle)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState('all')
  const [activeTab, setActiveTab] = useState('Published')
  const [confirmation, setConfirmation] = useState(null)
  const [previewArticle, setPreviewArticle] = useState(null)

  const isEditing = editingId !== null
  const isFormOpen = page === 'add' || page === 'edit'
  const visibleArticles = useMemo(
    () => articles.filter((article) => article.status === activeTab),
    [articles, activeTab],
  )

  function openAllPosts() {
    setCurrentArticle(emptyArticle)
    setEditingId(null)
    setPreviewArticle(null)
    setPage('all')
  }

  function openCreateForm() {
    setCurrentArticle(emptyArticle)
    setEditingId(null)
    setPreviewArticle(null)
    setPage('add')
  }

  function openEditForm(article) {
    setCurrentArticle({
      title: article.title,
      category: article.category,
      content: article.content,
    })
    setEditingId(article.id)
    setPage('edit')
  }

  function closeForm() {
    setCurrentArticle(emptyArticle)
    setEditingId(null)
    setPage('all')
  }

  function openPreview() {
    setCurrentArticle(emptyArticle)
    setEditingId(null)
    setPreviewArticle(null)
    setPage('preview')
  }

  function updateField(field, value) {
    setCurrentArticle((article) => ({ ...article, [field]: value }))
  }

  function saveArticle(event, status) {
    event.preventDefault()

    if (!currentArticle.title.trim() || !currentArticle.category.trim() || !getPlainText(currentArticle.content)) {
      return
    }

    if (isEditing) {
      setArticles((items) => items.map((article) => (
        article.id === editingId ? { ...article, ...currentArticle, status } : article
      )))
    } else {
      setArticles((items) => [
        ...items,
        {
          ...currentArticle,
          id: Date.now(),
          status,
        },
      ])
    }

    setActiveTab(status)
    closeForm()
  }

  function requestMoveToTrash(articleId) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    setConfirmation({ action: 'trash', article })
  }

  function moveToTrash(articleId) {
    setConfirmation(null)

    setArticles((items) => items.map((article) => (
      article.id === articleId ? { ...article, status: 'Trashed' } : article
    )))
    setActiveTab('Trashed')

    if (articleId === editingId) {
      closeForm()
    }
  }

  function requestRestoreArticle(articleId) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    setConfirmation({ action: 'restore', article })
  }

  function restoreArticle(articleId) {
    setConfirmation(null)

    setArticles((items) => items.map((article) => (
      article.id === articleId ? { ...article, status: 'Draft' } : article
    )))
    setActiveTab('Draft')
  }

  if (previewArticle) {
    return (
      <main className="preview-shell">
        <ArticleDetail article={previewArticle} onBack={() => setPreviewArticle(null)} />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">Article Manager</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={page === 'all' || page === 'edit' ? 'nav-item active' : 'nav-item'} onClick={openAllPosts}>
            <ListIcon size={18} />
            All Posts
          </button>
          <button className={isFormOpen && !isEditing ? 'nav-item active' : 'nav-item'} onClick={openCreateForm}>
            <Plus size={18} />
            Add article
          </button>
          <button className={page === 'preview' ? 'nav-item active' : 'nav-item'} onClick={openPreview}>
            <Eye size={18} />
            Preview
          </button>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">Article manager</p>
            <h1>{page === 'preview' ? 'Preview' : 'All Posts'}</h1>
            <p className="subheading">
              {page === 'preview'
                ? 'Read-only blog preview for published posts.'
                : 'Create, update, and delete article data.'}
            </p>
          </div>
          {page === 'all' && (
            <button className="button button-primary" onClick={openCreateForm}>
              <Plus size={18} />
              Add article
            </button>
          )}
        </header>

        {isFormOpen ? (
          <ArticleForm
            article={currentArticle}
            isEditing={isEditing}
            onBack={closeForm}
            onChange={updateField}
            onSubmit={saveArticle}
          />
        ) : page === 'preview' ? (
          <Preview articles={articles} onReadMore={setPreviewArticle} />
        ) : (
          <ArticleList
            activeTab={activeTab}
            articles={visibleArticles}
            allArticles={articles}
            onEdit={openEditForm}
            onTabChange={setActiveTab}
            onRestore={requestRestoreArticle}
            onTrash={requestMoveToTrash}
          />
        )}
      </section>

      {confirmation && (
        <ConfirmModal
          action={confirmation.action}
          article={confirmation.article}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            if (confirmation.action === 'trash') {
              moveToTrash(confirmation.article.id)
            } else {
              restoreArticle(confirmation.article.id)
            }
          }}
        />
      )}
    </main>
  )
}

function ConfirmModal({ action, article, onCancel, onConfirm }) {
  const isRestore = action === 'restore'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{isRestore ? 'Restore article?' : 'Move to trash?'}</h2>
        <p>
          {isRestore
            ? `Restore "${article.title}" to Drafts?`
            : `Move "${article.title}" to Trashed?`}
        </p>
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className={isRestore ? 'button button-success' : 'button button-danger'} type="button" onClick={onConfirm}>
            {isRestore ? 'Restore' : 'Move to trash'}
          </button>
        </div>
      </section>
    </div>
  )
}

function ArticleList({ activeTab, articles, allArticles, onEdit, onRestore, onTabChange, onTrash }) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 2
  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize))
  const visiblePage = Math.min(currentPage, totalPages)
  const startIndex = (visiblePage - 1) * pageSize
  const pageArticles = articles.slice(startIndex, startIndex + pageSize)

  function changeTab(tab) {
    setCurrentPage(1)
    onTabChange(tab)
  }

  return (
    <>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.value ? 'tab active' : 'tab'}
            key={tab.value}
            onClick={() => changeTab(tab.value)}
          >
            {tab.label}
            <span>{allArticles.filter((article) => article.status === tab.value).length}</span>
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-head">
          <span>Title</span>
          <span>Category</span>
          <span>Actions</span>
        </div>

        {articles.length ? pageArticles.map((article) => (
          <article className="table-row" key={article.id}>
            <div className="article-cell">
              <strong>{article.title}</strong>
              <span>{getPlainText(article.content)}</span>
            </div>
            <span className="category">{article.category}</span>
            <div className="row-actions">
              <button className="icon-button" onClick={() => onEdit(article)} aria-label={`Edit ${article.title}`}>
                <FilePenLine size={17} />
              </button>
              {activeTab === 'Trashed' ? (
                <button className="icon-button restore" onClick={() => onRestore(article.id)} aria-label={`Restore ${article.title}`}>
                  <RotateCcw size={17} />
                </button>
              ) : (
                <button className="icon-button danger" onClick={() => onTrash(article.id)} aria-label={`Move ${article.title} to trash`}>
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </article>
        )) : (
          <div className="empty-state inside-table">
            <strong>No articles in {activeTab.toLowerCase()}</strong>
            <span>Choose another tab or add a new article.</span>
          </div>
        )}
      </div>

      {articles.length > 0 && (
        <Pagination
          currentPage={visiblePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  )
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div>
        <button
          className="page-button"
          disabled={currentPage === 1}
          onClick={() => onPageChange((pageNumber) => Math.max(1, pageNumber - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            className={currentPage === index + 1 ? 'page-button active' : 'page-button'}
            key={index + 1}
            onClick={() => onPageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className="page-button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange((pageNumber) => Math.min(totalPages, pageNumber + 1))}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function ArticleForm({ article, isEditing, onBack, onChange, onSubmit }) {
  const [errors, setErrors] = useState({})

  function validateArticle() {
    const nextErrors = {}

    if (!article.title.trim()) {
      nextErrors.title = 'Title is required.'
    }

    if (!article.category.trim()) {
      nextErrors.category = 'Category is required.'
    }

    if (!getPlainText(article.content)) {
      nextErrors.content = 'Content is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function updateArticleField(field, value) {
    onChange(field, value)

    if (errors[field]) {
      setErrors((currentErrors) => ({ ...currentErrors, [field]: '' }))
    }
  }

  function submitWithStatus(event, status) {
    event.preventDefault()

    if (validateArticle()) {
      onSubmit(event, status)
    }
  }

  return (
    <form className="editor-card">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to list
      </button>

      <div className="form-heading">
        <h2>{isEditing ? 'Edit article' : 'Add article'}</h2>
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={(event) => submitWithStatus(event, 'Draft')}>
            Draft
          </button>
          <button className="button button-primary" type="button" onClick={(event) => submitWithStatus(event, 'Published')}>
            <Send size={16} />
            Publish
          </button>
        </div>
      </div>

      <label>
        Title
        <input
          value={article.title}
          onChange={(event) => updateArticleField('title', event.target.value)}
          placeholder="Enter title"
          aria-invalid={Boolean(errors.title)}
          required
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <label>
        Category
        <input
          value={article.category}
          onChange={(event) => updateArticleField('category', event.target.value)}
          placeholder="Enter category"
          aria-invalid={Boolean(errors.category)}
          required
        />
        {errors.category && <span className="field-error">{errors.category}</span>}
      </label>

      <RichTextEditor
        error={errors.content}
        value={article.content}
        onChange={(value) => updateArticleField('content', value)}
      />
    </form>
  )
}

function RichTextEditor({ error, value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor',
        'aria-label': 'Content',
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML())
    },
  })

  function activeClass(name, attributes) {
    return editor?.isActive(name, attributes) ? 'tool-button active' : 'tool-button'
  }

  return (
    <div className="rich-field">
      <span className="field-label">Content</span>
      <div className="editor-shell">
        <div className="rich-toolbar" aria-label="Content formatting">
          <button
            className={activeClass('heading', { level: 2 })}
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading"
          >
            <Heading2 size={16} />
          </button>
          <button
            className={activeClass('bold')}
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            className={activeClass('italic')}
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            className={activeClass('bulletList')}
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <ListIcon size={16} />
          </button>
          <button
            className={activeClass('orderedList')}
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <ListOrdered size={16} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function ArticleDetail({ article, onBack }) {
  return (
    <article className="article-detail">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to preview
      </button>
      <span>{article.category}</span>
      <h1>{article.title}</h1>
      <div className="preview-content" dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  )
}

function Preview({ articles, onReadMore }) {
  const [currentPage, setCurrentPage] = useState(1)
  const publishedArticles = articles.filter((article) => article.status === 'Published')
  const pageSize = 2
  const totalPages = Math.max(1, Math.ceil(publishedArticles.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const pageArticles = publishedArticles.slice(startIndex, startIndex + pageSize)

  if (!publishedArticles.length) {
    return (
      <div className="empty-state">
        <strong>No posts to preview</strong>
        <span>Publish an article first.</span>
      </div>
    )
  }

  return (
    <>
      <div className="preview-list">
        {pageArticles.map((article) => (
          <article className="preview-card" key={article.id}>
            <span>{article.category}</span>
            <h2 className="truncate-title">{article.title}</h2>
            <p className="truncate-content">{getPlainText(article.content)}</p>
            <button className="read-more" type="button" onClick={() => onReadMore(article)}>
              Read more
              <ChevronRight size={15} />
            </button>
          </article>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}

export default App
