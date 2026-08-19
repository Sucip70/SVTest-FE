import { useEffect, useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ArrowLeft, Bold, ChevronLeft, ChevronRight, Eye, FilePenLine, Heading2, Italic, List as ListIcon, ListOrdered, Plus, RotateCcw, Send, Trash2 } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://svtest-1014951496037.asia-southeast2.run.app'
const POST_LIMIT = 2

const tabs = [
  { label: 'Published', value: 'Publish' },
  { label: 'Drafts', value: 'Draft' },
  { label: 'Trashed', value: 'Trash' },
]

const emptyArticle = {
  title: '',
  category: '',
  content: '',
}

async function apiRequest(path, options = {}) {
  const headers = options.body
    ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
    : options.headers

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = 'Request failed'

    try {
      const error = await response.json()
      message = error.message || message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

function getPostList({ status, page = 1, limit = POST_LIMIT }) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
    sort_by: 'created_date',
    sort_order: 'desc',
  })

  return apiRequest(`/posts?${params.toString()}`)
}

function getPlainText(content) {
  return content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function App() {
  const [articles, setArticles] = useState([])
  const [statusCounts, setStatusCounts] = useState({ Publish: 0, Draft: 0, Trash: 0 })
  const [listPage, setListPage] = useState(1)
  const [listPagination, setListPagination] = useState({ page: 1, limit: POST_LIMIT, total: 0, total_pages: 1 })
  const [currentArticle, setCurrentArticle] = useState(emptyArticle)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState('all')
  const [activeTab, setActiveTab] = useState('Publish')
  const [confirmation, setConfirmation] = useState(null)
  const [previewArticle, setPreviewArticle] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const isEditing = editingId !== null
  const isFormOpen = page === 'add' || page === 'edit'
  const visibleArticles = useMemo(() => articles, [articles])

  useEffect(() => {
    if (page !== 'all') {
      return
    }

    let ignore = false

    async function loadPosts() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [listResponse, ...countResponses] = await Promise.all([
          getPostList({ status: activeTab, page: listPage }),
          ...tabs.map((tab) => getPostList({ status: tab.value, page: 1, limit: 1 })),
        ])

        if (ignore) {
          return
        }

        setArticles(listResponse.data || [])
        setListPagination(listResponse.pagination || { page: listPage, limit: POST_LIMIT, total: 0, total_pages: 1 })
        setStatusCounts(Object.fromEntries(tabs.map((tab, index) => [
          tab.value,
          countResponses[index]?.pagination?.total || 0,
        ])))
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadPosts()

    return () => {
      ignore = true
    }
  }, [activeTab, listPage, page, refreshKey])

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

  async function saveArticle(event, status) {
    event.preventDefault()

    if (!currentArticle.title.trim() || !currentArticle.category.trim() || !getPlainText(currentArticle.content)) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      if (isEditing) {
        await apiRequest(`/post?id=${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: currentArticle.title,
            content: currentArticle.content,
            category: currentArticle.category,
          }),
        })
        await apiRequest(`/post/status?id=${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
      } else {
        await apiRequest('/post', {
          method: 'POST',
          body: JSON.stringify({ ...currentArticle, status }),
        })
      }

      setActiveTab(status)
      setListPage(1)
      setRefreshKey((key) => key + 1)
      closeForm()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  function requestMoveToTrash(articleId) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    setConfirmation({ action: 'trash', article })
  }

  async function moveToTrash(articleId) {
    setConfirmation(null)

    try {
      await apiRequest(`/post/status?id=${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Trash' }),
      })
      setActiveTab('Trash')
      setListPage(1)
      setRefreshKey((key) => key + 1)

      if (articleId === editingId) {
        closeForm()
      }
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  function requestRestoreArticle(articleId) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    setConfirmation({ action: 'restore', article })
  }

  async function restoreArticle(articleId) {
    setConfirmation(null)

    try {
      await apiRequest(`/post/status?id=${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Draft' }),
      })
      setActiveTab('Draft')
      setListPage(1)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setErrorMessage(error.message)
    }
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

        {errorMessage && page !== 'preview' && <div className="error-banner">{errorMessage}</div>}

        {isFormOpen ? (
          <ArticleForm
            article={currentArticle}
            isEditing={isEditing}
            onBack={closeForm}
            onChange={updateField}
            onSubmit={saveArticle}
          />
        ) : page === 'preview' ? (
          <Preview onReadMore={setPreviewArticle} />
        ) : (
          <ArticleList
            activeTab={activeTab}
            articles={visibleArticles}
            isLoading={isLoading}
            pagination={listPagination}
            onEdit={openEditForm}
            onPageChange={setListPage}
            onTabChange={setActiveTab}
            onRestore={requestRestoreArticle}
            onTrash={requestMoveToTrash}
            statusCounts={statusCounts}
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

function ArticleList({ activeTab, articles, isLoading, onEdit, onPageChange, onRestore, onTabChange, onTrash, pagination, statusCounts }) {
  function changeTab(tab) {
    onTabChange(tab)
    onPageChange(1)
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
            <span>{statusCounts[tab.value] || 0}</span>
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-head">
          <span>Title</span>
          <span>Category</span>
          <span>Actions</span>
        </div>

        {isLoading ? (
          <div className="empty-state inside-table">
            <strong>Loading posts...</strong>
          </div>
        ) : articles.length ? articles.map((article) => (
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
              {activeTab === 'Trash' ? (
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
          currentPage={pagination.page || 1}
          totalPages={pagination.total_pages || 1}
          onPageChange={onPageChange}
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
          <button className="button button-primary" type="button" onClick={(event) => submitWithStatus(event, 'Publish')}>
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

function Preview({ onReadMore }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageArticles, setPageArticles] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: POST_LIMIT, total: 0, total_pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadPreview() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await getPostList({ status: 'Publish', page: currentPage })

        if (ignore) {
          return
        }

        setPageArticles(response.data || [])
        setPagination(response.pagination || { page: currentPage, limit: POST_LIMIT, total: 0, total_pages: 1 })
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadPreview()

    return () => {
      ignore = true
    }
  }, [currentPage])

  if (isLoading) {
    return (
      <div className="empty-state">
        <strong>Loading preview...</strong>
      </div>
    )
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (!pageArticles.length) {
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

      <Pagination currentPage={pagination.page || 1} totalPages={pagination.total_pages || 1} onPageChange={setCurrentPage} />
    </>
  )
}

export default App
