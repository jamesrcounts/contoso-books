# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⛔ RESPECT THE WORKTREE SETTING — CHECK BEFORE THE FIRST EDIT

This overrides convenience, momentum, and whatever the current working directory happens to be.

- **Before the first edit or write/commit command in ANY session, check the session's
  worktree setting.** Do not start editing just because the CWD is the main checkout.
- **Setting ENABLED:** do ALL edits, commands, commits, and pushes in THIS session's own
  worktree. If not in it yet, enter it FIRST (EnterWorktree) before touching any file.
  Never edit, commit, or push on `main`.
- **Setting DISABLED:** work in the main checkout.
- **Never write into or clean up another session's worktree.** A worktree that merely
  appears in `git worktree list` is not mine. Never run destructive git commands
  (`git checkout HEAD -- <file>`, `git restore`, `git clean`, `git worktree remove`) in a
  worktree that isn't this session's.
- If unsure whether the setting is on, STOP and ask before editing — do not guess, do not
  default to `main`.

See the project memory `always-edit-in-worktree`.

## Project overview

This repository is a Jekyll-based training lab (just-the-docs theme, published to GitHub Pages). The instructional content lives under `docs/` and its image assets under `media/`; the companion sample application the exercises operate on lives entirely under `src/`. The two trees are siblings and never interleave.

The sample app (`src/`) is a bookstore demonstrating Azure DocumentDB (the vCore-based, MongoDB wire-protocol-compatible service). Express + native `mongodb` driver on the backend, Vite/React on the frontend.

## Repo structure & taxonomy

A workshop/training repository published as a GitHub Pages site (Jekyll + just-the-docs). Content is organized as a sequence of numbered exercises, each containing numbered tasks, alongside the companion sample application. `docs/` and `media/` currently hold only `.gitkeep` placeholders, so the scheme below describes the structure that authored content follows.

### Top-level layout

| Path | Role |
| --- | --- |
| `_config.yml` | Jekyll site config: theme (just-the-docs), `aux_links`, callouts. |
| `Gemfile` / `Gemfile.lock` | Jekyll/Ruby dependencies for local build. |
| `index.md` | Site landing page (`layout: home`, `nav_order: 1`) — lab introduction, exercise list, prerequisites. |
| `README.md` | GitHub-facing readme (distinct from the site landing). |
| `LICENSE`, `SECURITY.md`, `SUPPORT.md` | Standard Microsoft OSS repo files (when present). |
| `.devcontainer/devcontainer.json` | Codespaces / dev container definition (when present). |
| `.github/workflows/` | CI workflows, including the Pages build/deploy (`pages.yml`). |
| `docs/` | All instructional content (prose). |
| `media/` | Image assets referenced by `docs/`. |
| `src/` | The companion sample application the exercises operate on. |

### `docs/` — exercises and tasks

Two-level hierarchy: **exercises** at the top, **tasks** within each. An exercise is a major topic or chapter; a task is a single step or sub-topic within an exercise. The count of each varies freely from lab to lab. Sequence is conveyed through a shared numeric prefix scheme, so order is inferable from filenames alone.

Each exercise folder typically contains an **exercise landing page** (introduces the topic — scenario, objectives, estimated duration — and acts as the parent navigation node) plus **one file per task** (each a self-contained walkthrough). Task pages tend to follow a predictable rhythm — context, what the learner will do, success criteria, external resources, then the actual steps (often in collapsible detail sections) — but the exact section set is a stylistic choice, not a structural requirement.

### `media/` — assets keyed to content

Image assets live separately from the prose that references them. Here they sit in a single flat `media/` directory, with the filename encoding the exercise + task the image belongs to (e.g. a `0202_` prefix means exercise 02, task 02). Flat-with-prefixed-names vs. nested subfolders is a style decision; the underlying principle is that assets stay out of the prose tree and are discoverably linked to the content that uses them.

### `src/` — companion sample application

The application being taught on lives entirely under `src/`, scoped to its own directory so it never interleaves with documentation. Its internal structure is whatever is idiomatic for its stack (see [Architecture](#architecture) for this repo's). The important property is the separation: `docs/` and `src/` are siblings, never mixed.

### Cross-cutting conventions

- **Numbering is the spine of navigation.** Folder names, filenames, asset names, and `nav_order` values share a common ordinal scheme, so any artifact's place in the lab is inferable from its name.
- **Two parallel content trees.** `docs/` (instructional prose) and `src/` (the artifact being taught on) sit side-by-side and stay separate.
- **Assets are kept out of the prose tree** and linked by name.
- **Site navigation is declarative,** driven entirely by front matter (an exercise page declares itself a parent; task pages reference their parent by title; `nav_order` controls sort order) — no manually maintained sidebar or TOC.
- **Build and deploy are automated** via a GitHub Actions workflow that publishes the Jekyll site to Pages.

## Common commands

The app's npm workspace lives in `src/` (that's where the root `package.json` is), so run these from `src/` unless noted:

- `npm install` — recursive install: runs `npm i` in `src/server/` then `src/client/` (see `src/package.json`'s `install` script).
- `npm run develop` — runs both tiers concurrently: server with `nodemon` on port 8080, client (Vite dev server) on port 3000 with `proxy` forwarding API calls to 8080.
- `npm run build` — builds the React client into `src/client/dist/`.
- `npm start` — runs `node server/server.js` from `src/` (production-style; expects `src/client/dist/` to exist if `NODE_ENV=production`).
- `cd src/client && npm test` — Vitest tests for the client.
- `cd src/deployment/seed && npm install && npm run seed` — seeds the `books` (96,419 docs) and `genres` (1 doc) collections from a vendored dataset (`data/seed-data.tar.gz`). Requires `BOOKSTORE_SEED_DB_CONNECTION_STRING` in `src/deployment/seed/.env` (loaded via `dotenv`).

## Required environment variables

Read by `src/server/server.js` (via `dotenv`):

- `BOOKSTORE_DB_CONNECTION_STRING` — Mongo connection string. Connects to the `bookstore` database (hard-coded in [db.js](src/server/src/db/db.js)).
- `PORT` — server port, defaults to `8080`.
- `NODE_ENV=production` — when set, server also serves the built React app from `../client/dist`.

The seed script uses a separate env var `BOOKSTORE_SEED_DB_CONNECTION_STRING` (distinct from the server's `BOOKSTORE_DB_CONNECTION_STRING`).

## Architecture

### Server (`src/server/`, ES modules — `"type": "module"`)

- [server.js](src/server/server.js) bootstraps Express, registers all routes by iterating the array exported from [routes/index.js](src/server/src/routes/index.js), connects to Mongo, then listens.
- Routes are declarative objects of shape `{ method, path, handler }` (see e.g. [getAllBooksRoute.js](src/server/src/routes/getAllBooksRoute.js)). To add an endpoint: write a handler in `src/server/src/db/`, wrap it in a route object under `src/server/src/routes/`, then add it to the array in `routes/index.js`. There is no router middleware layer — handlers are bound directly via `app[method](path, handler)`.
- [db.js](src/server/src/db/db.js) exports a singleton `db` with `connect(url)` and `getConnection()`. Every db-layer function calls `db.getConnection().collection('books' | 'genres')`. A single `MongoClient` with `poolSize: 10` is shared process-wide.
- [getAllBooks.js](src/server/src/db/getAllBooks.js) handles direct Mongo `find` with paging/sort/filter for the `/books` route.
- [searchGenres.js](src/server/src/db/searchGenres.js) demonstrates an aggregation pipeline (`$unwind` → `$match` → `$group`) for genre autocomplete.
- Comments on a book are stored as an array on the `books` document and edited via `$push` / `$unset` + `$pull` ([updateComment.js](src/server/src/db/updateComment.js), [removeComment.js](src/server/src/db/removeComment.js)).

### Client (`src/client/`, Vite/React)

- Three top-level feature folders: `App/` (shell, navbar, router, filter state), `Home/` (list page + infinite-scroll hook), `Book/` (detail page + comments).
- Global filter state (`rating`, `format`, `genre`) lives in [useNavbarFilters.js](src/client/src/App/useNavbarFilters.js) and is threaded through `App` → `Routes` → page components as props.
- Lists are paged via infinite scroll in [useBooks.js](src/client/src/Home/useBooks.js); changing any filter resets `page` and `sortby` back to `0`/`""`.
- The dev server proxies API calls to `http://localhost:8080` (see `proxy` in [client/package.json](src/client/package.json)), so `fetch('/books?...')` Just Works in dev.

### Deployment (`src/deployment/`)

- [azuredeploy.json](src/deployment/azuredeploy.json) — ARM template provisioning App Service + DocumentDB vCore cluster (`Microsoft.DocumentDB/mongoClusters`).
- [ecosystem.config.js](src/ecosystem.config.js) — PM2 config used by the App Service host; it `cd`s into `/home/site/wwwroot/src/server/` and runs `server.js`.
- [deployment/seed/](src/deployment/seed/) — standalone Node script (CommonJS, separate `package.json`) that downloads `books.json`/`genres.json` from a public Azure Storage URL and bulk-inserts them.

## Conventions worth knowing

- The server uses native ESM (`"type": "module"`), so every internal import needs the `.js` extension (e.g. `import db from './db.js'`). The seed script under `src/deployment/seed/` is CommonJS — don't mix patterns across that boundary.
- Most db modules export both `export default x` and `export { x }`. New modules should follow the same pattern to stay consistent with existing imports.
- Collection names (`books`, `genres`) and the database name (`bookstore`) are hard-coded; there is no schema/model layer.
