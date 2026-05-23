# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

**Scalable** — a web application for ingesting user-submitted images and screenshots into a database that feeds a downstream ML pipeline for pattern recognition. This repo is the React front-end only. The backend (FastAPI + PostgreSQL + S3/R2) is a separate project not yet built.

---

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # Type-check (tsc -b) then Vite production build
npm run lint       # ESLint across all .ts/.tsx files
npm run preview    # Serve the production build locally
```

---

## Stack

- **React 19** + **TypeScript ~6** bundled by **Vite 8**
- **Bootstrap 5** — imported globally in `main.tsx`; all styling done via Bootstrap utility classes
- ESLint flat config with `typescript-eslint`, `react-hooks`, `react-refresh`

---

## App Structure & Routing

There is no React Router. Routing is a single `view` state in `App.tsx`:

```
"login"     →  <Login />
"dashboard" →  <Dashboard />
```

`App.tsx` is also the root of the **toast system** — `<ToastProvider>` wraps the entire tree and `<ToastContainer>` is rendered once at this level so it floats above all other content.

```
App
├── ToastProvider          (context/ToastContext.tsx)
│   ├── Login  OR  Dashboard
│   └── ToastContainer     (components/ToastContainer.tsx)
```

**Transition points:**
- `Login` receives `onSuccess: () => void` → called after auth resolves → writes token to localStorage → sets `view = "dashboard"`
- `Dashboard` receives `onSignOut: () => void` → called by Sign Out button → removes token from localStorage → sets `view = "login"`

**Auth persistence:**
On mount, `useState` uses a lazy initializer to check `localStorage` for `TOKEN_KEY = "scalable_auth_token"`. If a token exists the user lands directly on the dashboard — the login screen is never shown. On sign-out the token is removed and the user is returned to login.

Currently stores `"mock-auth-token"`. When the real backend is ready, replace `localStorage.setItem(TOKEN_KEY, "mock-auth-token")` in `handleLoginSuccess` with the actual JWT returned by `POST /api/auth/login`. Token expiry validation should also be added at that point inside the lazy initializer.

---

## Component Map

### `components/Login.tsx`
**Props:** `{ onSuccess: () => void }`

Collects `identifier` (username or email) and `password`. On submit fires a mock `POST /api/auth/login`. Currently always succeeds after 1 s and calls `onSuccess`.

**When wiring the real backend:** replace the `setTimeout` in `handleSubmit` with a real fetch, store the returned auth token, then call `onSuccess`.

---

### `components/Dashboard.tsx`
**Props:** `{ onSignOut: () => void }`

Layout shell only — dark navbar + Bootstrap fluid grid. Assembles the three tiles:

```
Top row:   col-md-4  SubmissionCountTile
           col-md-8  FileDropTile
Bottom row: col-12   UploadsListTile
```

---

### `components/SubmissionCountTile.tsx`
**Props:** none

On mount fires mock `GET /api/submissions/count` (800 ms delay, returns hardcoded `24`).
Displays: spinner → large count number, or error message on failure.

**Real endpoint shape:**
```json
GET /api/submissions/count
→ { "count": number }
```

---

### `components/UploadsListTile.tsx`
**Props:** none — consumes `useToast()` internally

Paginated upload history table. Fetches `PAGE_SIZE = 4` records at a time, appending on each Load More press. Initial fetch on mount; subsequent fetches triggered by the user.

**State:**
- `uploads` — accumulated list, grows with each page
- `total` — total record count returned by the API
- `hasMore` — whether another page exists
- `offset` — current position for the next fetch
- `loading` — initial fetch spinner
- `loadingMore` — Load More button spinner (table stays visible)

**Upload model:**
```ts
interface Upload {
  id: string;
  name: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;   // YYYY-MM-DD
}
```

**Real endpoint shape:**
```
GET /api/uploads?offset=0&limit=4
→ { uploads: Upload[], hasMore: boolean, total: number }
```

**Behaviour:**
- Header badge shows `N of Total` while more records exist, `N of N` when all loaded
- Load More button shows a spinner and disables during fetch
- When `hasMore` is false the button is replaced with `"All N uploads shown"`
- Load More errors fire an `error` toast (table is preserved); initial load errors show inline text

Status badge colours: `approved` → green, `pending` → yellow, `rejected` → red.

---

### `components/FileDropTile.tsx`
**Props:** none — consumes `useToast()` internally

The most complex component. Manages a `QueuedFile[]` queue:

```ts
interface QueuedFile {
  id: string;
  file: File;
  progress: number;   // 0–100
  status: "waiting" | "uploading" | "done" | "error";
}
```

**Validation** (runs before a file enters the queue):
- MIME type must be in `ACCEPTED_TYPES` Set, or extension must be in `ACCEPTED_EXTENSIONS` as fallback
- File size must be ≤ 10 MB (`MAX_FILE_SIZE`)
- Invalid files never enter the queue — a `warning` toast fires per rejected file

**Accepted formats:** PNG, JPG/JPEG, WEBP, GIF, BMP, TIFF, HEIC, HEIF, SVG

**Upload flow:** `handleSubmit` → sets all queued files to `"uploading"` → `Promise.all(simulateUpload per file)` → on completion fires a `success` toast.

**`simulateUpload(id)`** is the mock. Replace its body with an `XMLHttpRequest` when the backend is ready. The commented-out XHR block is already inside the function showing exactly what to swap in:
```ts
//   xhr.upload.onprogress = (e) => { … update progress … };
//   xhr.open("POST", "/api/uploads");
//   fd.append("file", file);
//   xhr.send(fd);
```

**Real endpoint shape:**
```
POST /api/uploads
Body: multipart/form-data  { file: File }   (one request per file)
→ { id: string, name: string, status: "pending", submittedAt: string }
```

**Header states:**
- Uploading: shows `"Uploading N files…"` in blue
- All done: shows a **Clear** button that resets the queue
- Partial progress: shows `"X/N done"` counter

---

## Toast System

**Files:** `context/ToastContext.tsx` + `components/ToastContainer.tsx`

Any component can fire a notification with one line:
```ts
const { addToast } = useToast();
addToast("Message here", "success");          // auto-dismisses in 4 s
addToast("Something failed", "error", 6000);  // custom duration (ms)
```

**Toast types:** `"success"` (green) | `"warning"` (yellow) | `"error"` (red) | `"info"` (dark)

`ToastContainer` renders at `z-index: 1100`, fixed top-right. `useToast()` will throw if called outside `<ToastProvider>` — the provider lives in `App.tsx` and wraps the whole tree, so this should never be an issue.

**Current callers:**
- `FileDropTile` — `warning` per rejected file, `success` after all uploads complete

**Expected future callers:**
- `Login` — `error` on bad credentials from real API
- `UploadsListTile` — `error` if fetch fails (currently shows inline text)
- Any component that performs a server action

---

## Mock API Summary

All API calls are currently mocked with `setTimeout`. Each mock is commented with the real endpoint it will become:

| Component | Mock | Real endpoint |
|---|---|---|
| `Login` | 1 000 ms always-success | `POST /api/auth/login` |
| `SubmissionCountTile` | 800 ms → `{ count: 24 }` | `GET /api/submissions/count` |
| `UploadsListTile` | 1 000 ms → 6 hardcoded rows | `GET /api/uploads` |
| `FileDropTile` | `simulateUpload()` per file | `POST /api/uploads` (one per file, multipart) |

---

## Architecture Conventions

- **Props interfaces** defined locally in each file as `interface Props { … }`
- **Children** typed as `ReactNode` from `react`
- **No global state manager** — toast system is the only cross-component state (via context)
- **No React Router** — `view` state in `App.tsx` handles all navigation
- **Bootstrap only** for styling — no CSS Modules, no styled-components, `App.css` intentionally empty
- Bootstrap CSS imported once in `main.tsx`; do not import it elsewhere
