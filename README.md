# SVTest Frontend

Frontend dashboard for managing SVTest posts. The app supports:

- All Posts with `Published`, `Drafts`, and `Trashed` tabs
- Add and edit article forms
- Rich text content editor using Tiptap
- Publish and Draft actions
- Move to Trash and Restore actions with confirmation modal
- Preview page with pagination and full article detail view

## Tech Stack

- React
- Vite
- Tiptap rich text editor
- Lucide React icons
- SVTest posts API

## Requirements

Install these tools first:

- Node.js 20 or newer
- npm
- Git

## Installation

Clone the repository, then install dependencies:

```powershell
git clone https://github.com/sucip70/SVTest-FE.git
cd SVTest-FE
npm install
```

## Run Locally

Start the development server:

```powershell
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

If you need the app to bind only to localhost explicitly:

```powershell
npm run dev -- --host 127.0.0.1
```

## API Configuration

The app uses this API service:

```text
https://svtest-1014951496037.asia-southeast2.run.app
```

During local development, the app calls `/api`, and Vite proxies it to the deployed API. This avoids browser CORS issues while developing locally.

If the API requires an identity token, set it before running the dev server:

```powershell
$env:SVTEST_IDENTITY_TOKEN = "<identity-token>"
npm run dev
```

The Vite proxy will send it as:

```http
Authorization: bearer <identity-token>
```

For production static hosting, the browser calls the deployed API directly. The API must allow CORS from the production frontend domain, for example:

```text
https://sucip70.github.io
```

## Available Scripts

### Development

```powershell
npm run dev
```

Runs the Vite development server.

### Lint

```powershell
npm run lint
```

Runs ESLint checks.

### Build

```powershell
npm run build
```

Builds the production files into the `dist` folder.

### Preview Production Build

```powershell
npm run preview
```

Serves the built `dist` output locally.

Run `npm run build` before using this command.

### Deploy to GitHub Pages

```powershell
npm run deploy
```

This runs the build and publishes the `dist` folder to the `gh-pages` branch.

The Vite base path is configured for:

```text
/SVTest-FE/
```

The deployed URL is:

```text
https://sucip70.github.io/SVTest-FE/
```

## Basic Workflow

1. Install dependencies:

```powershell
npm install
```

2. Start local development:

```powershell
npm run dev
```

3. Check code quality:

```powershell
npm run lint
```

4. Build production files:

```powershell
npm run build
```

5. Deploy to GitHub Pages:

```powershell
npm run deploy
```

## Notes

- Local API requests use the Vite proxy at `/api`.
- GitHub Pages cannot run the Vite proxy because it is static hosting.
- If API calls fail on GitHub Pages with `Failed to fetch`, check the API CORS configuration.
- The Tiptap editor can make the production JavaScript bundle larger; the Vite bundle-size warning is expected and does not mean the build failed.
