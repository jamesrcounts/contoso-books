# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Sample bookstore app demonstrating Azure Cosmos DB's API for MongoDB. Express + native `mongodb` driver on the backend, Create React App (React 16) on the frontend. Optional Azure Cognitive Search integration powers full-text search.

## Common commands

Run from repo root unless noted:

- `npm install` — recursive install: runs `npm i` in `server/` then `client/` (see root `package.json`'s `install` script).
- `npm run develop` — runs both tiers concurrently: server with `nodemon` on port 8080, client (CRA dev server) on port 3000 with `proxy` forwarding API calls to 8080.
- `npm run build` — builds the React client into `client/build/`.
- `npm start` — runs `node server/server.js` (production-style; expects `client/build/` to exist if `NODE_ENV=production`).
- `cd client && npm test` — CRA/Jest tests for the client. There are no server tests.
- `cd deployment/seed && ./seed_data.sh` — seeds the `books` (~85k docs) and `genres` (1 doc) collections from a public blob. Requires `COSMOS_DB_CONNECTION_STRING` in `deployment/seed/.env`.

## Required environment variables

Read by `server/server.js` and `server/src/db/searchBooks.js` (via `dotenv`):

- `COSMOS_BOOKSTORE_DB_CONNECTION_STRING` — Mongo connection string to Cosmos DB. Connects to the `cosmosbookstore` database (hard-coded in [db.js](server/src/db/db.js)).
- `PORT` — server port, defaults to `8080`.
- `NODE_ENV=production` — when set, server also serves the built React app from `../client/build`.
- `SEARCH_API_ENDPOINT`, `SEARCH_API_KEY`, `SEARCH_INDEX_NAME` — only needed for the Azure Cognitive Search-backed `/search` route. See [azuresearchsetup.md](deployment/docs/azuresearchsetup.md).

The seed script uses a separate env var `COSMOS_DB_CONNECTION_STRING` (note: different name).

## Architecture

### Server (`server/`, ES modules — `"type": "module"`)

- [server.js](server/server.js) bootstraps Express, registers all routes by iterating the array exported from [routes/index.js](server/src/routes/index.js), connects to Mongo, then listens.
- Routes are declarative objects of shape `{ method, path, handler }` (see e.g. [getAllBooksRoute.js](server/src/routes/getAllBooksRoute.js)). To add an endpoint: write a handler in `server/src/db/`, wrap it in a route object under `server/src/routes/`, then add it to the array in `routes/index.js`. There is no router middleware layer — handlers are bound directly via `app[method](path, handler)`.
- [db.js](server/src/db/db.js) exports a singleton `db` with `connect(url)` and `getConnection()`. Every db-layer function calls `db.getConnection().collection('books' | 'genres')`. A single `MongoClient` with `poolSize: 10` is shared process-wide.
- Two read paths intentionally exist side-by-side and are demoed by the app:
  - **`/books`** ([getAllBooks.js](server/src/db/getAllBooks.js)) — direct Mongo `find` with paging/sort/filter. Used when there is no search text.
  - **`/search`** ([searchBooks.js](server/src/db/searchBooks.js)) — Azure Cognitive Search using `@azure/search-documents`, with OData `$filter` / `$orderby`. Used when the user types into the search box.
  The client switches between them in [useBooks.js](client/src/Home/useBooks.js) based on whether `searchText` is empty.
- [searchGenres.js](server/src/db/searchGenres.js) demonstrates Cosmos's aggregation pipeline (`$unwind` → `$match` → `$group`) and logs the RU cost via `getLastRequestStatistics`.
- Comments on a book are stored as an array on the `books` document and edited via `$push` / `$unset` + `$pull` ([updateComment.js](server/src/db/updateComment.js), [removeComment.js](server/src/db/removeComment.js)).

### Client (`client/`, CRA, React 16)

- Three top-level feature folders: `App/` (shell, navbar, router, filter state), `Home/` (list page + infinite-scroll hook), `Book/` (detail page + comments).
- Global filter state (`rating`, `format`, `genre`, `searchText`) lives in [useNavbarFilters.js](client/src/App/useNavbarFilters.js) and is threaded through `App` → `Routes` → page components as props.
- Lists are paged via infinite scroll in [useBooks.js](client/src/Home/useBooks.js); changing any filter resets `page` and `sortby` back to `0`/`""`.
- The dev server proxies API calls to `http://localhost:8080` (see `proxy` in [client/package.json](client/package.json)), so `fetch('/books?...')` Just Works in dev.

### Deployment (`deployment/`)

- [azuredeploy.json](deployment/azuredeploy.json) — ARM template provisioning App Service + Cosmos DB account.
- [ecosystem.config.js](ecosystem.config.js) — PM2 config used by the App Service host; it `cd`s into `/home/site/wwwroot/server/` and runs `server.js`.
- [deployment/seed/](deployment/seed/) — standalone Node script (CommonJS, separate `package.json`) that downloads `books.json`/`genres.json` from a public Azure Storage URL and bulk-inserts them.

## Conventions worth knowing

- The server uses native ESM (`"type": "module"`), so every internal import needs the `.js` extension (e.g. `import db from './db.js'`). The seed script under `deployment/seed/` is CommonJS — don't mix patterns across that boundary.
- Most db modules export both `export default x` and `export { x }`. New modules should follow the same pattern to stay consistent with existing imports.
- Collection names (`books`, `genres`) and the database name (`cosmosbookstore`) are hard-coded; there is no schema/model layer.
