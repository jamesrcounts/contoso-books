# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Sample bookstore app demonstrating Azure DocumentDB (the vCore-based, MongoDB wire-protocol-compatible service). Express + native `mongodb` driver on the backend, Vite/React on the frontend.

## Common commands

Run from repo root unless noted:

- `npm install` — recursive install: runs `npm i` in `server/` then `client/` (see root `package.json`'s `install` script).
- `npm run develop` — runs both tiers concurrently: server with `nodemon` on port 8080, client (CRA dev server) on port 3000 with `proxy` forwarding API calls to 8080.
- `npm run build` — builds the React client into `client/build/`.
- `npm start` — runs `node server/server.js` (production-style; expects `client/build/` to exist if `NODE_ENV=production`).
- `cd client && npm test` — CRA/Jest tests for the client. There are no server tests.
- `cd deployment/seed && ./seed_data.sh` — seeds the `books` (~85k docs) and `genres` (1 doc) collections from a public blob. Requires `BOOKSTORE_SEED_DB_CONNECTION_STRING` in `deployment/seed/.env`.

## Required environment variables

Read by `server/server.js` (via `dotenv`):

- `BOOKSTORE_DB_CONNECTION_STRING` — Mongo connection string. Connects to the `bookstore` database (hard-coded in [db.js](server/src/db/db.js)).
- `PORT` — server port, defaults to `8080`.
- `NODE_ENV=production` — when set, server also serves the built React app from `../client/build`.

The seed script uses a separate env var `BOOKSTORE_SEED_DB_CONNECTION_STRING` (distinct from the server's `BOOKSTORE_DB_CONNECTION_STRING`).

## Architecture

### Server (`server/`, ES modules — `"type": "module"`)

- [server.js](server/server.js) bootstraps Express, registers all routes by iterating the array exported from [routes/index.js](server/src/routes/index.js), connects to Mongo, then listens.
- Routes are declarative objects of shape `{ method, path, handler }` (see e.g. [getAllBooksRoute.js](server/src/routes/getAllBooksRoute.js)). To add an endpoint: write a handler in `server/src/db/`, wrap it in a route object under `server/src/routes/`, then add it to the array in `routes/index.js`. There is no router middleware layer — handlers are bound directly via `app[method](path, handler)`.
- [db.js](server/src/db/db.js) exports a singleton `db` with `connect(url)` and `getConnection()`. Every db-layer function calls `db.getConnection().collection('books' | 'genres')`. A single `MongoClient` with `poolSize: 10` is shared process-wide.
- [getAllBooks.js](server/src/db/getAllBooks.js) handles direct Mongo `find` with paging/sort/filter for the `/books` route.
- [searchGenres.js](server/src/db/searchGenres.js) demonstrates an aggregation pipeline (`$unwind` → `$match` → `$group`) for genre autocomplete.
- Comments on a book are stored as an array on the `books` document and edited via `$push` / `$unset` + `$pull` ([updateComment.js](server/src/db/updateComment.js), [removeComment.js](server/src/db/removeComment.js)).

### Client (`client/`, CRA, React 16)

- Three top-level feature folders: `App/` (shell, navbar, router, filter state), `Home/` (list page + infinite-scroll hook), `Book/` (detail page + comments).
- Global filter state (`rating`, `format`, `genre`) lives in [useNavbarFilters.js](client/src/App/useNavbarFilters.js) and is threaded through `App` → `Routes` → page components as props.
- Lists are paged via infinite scroll in [useBooks.js](client/src/Home/useBooks.js); changing any filter resets `page` and `sortby` back to `0`/`""`.
- The dev server proxies API calls to `http://localhost:8080` (see `proxy` in [client/package.json](client/package.json)), so `fetch('/books?...')` Just Works in dev.

### Deployment (`deployment/`)

- [azuredeploy.json](deployment/azuredeploy.json) — ARM template provisioning App Service + DocumentDB vCore cluster (`Microsoft.DocumentDB/mongoClusters`).
- [ecosystem.config.js](ecosystem.config.js) — PM2 config used by the App Service host; it `cd`s into `/home/site/wwwroot/server/` and runs `server.js`.
- [deployment/seed/](deployment/seed/) — standalone Node script (CommonJS, separate `package.json`) that downloads `books.json`/`genres.json` from a public Azure Storage URL and bulk-inserts them.

## Conventions worth knowing

- The server uses native ESM (`"type": "module"`), so every internal import needs the `.js` extension (e.g. `import db from './db.js'`). The seed script under `deployment/seed/` is CommonJS — don't mix patterns across that boundary.
- Most db modules export both `export default x` and `export { x }`. New modules should follow the same pattern to stay consistent with existing imports.
- Collection names (`books`, `genres`) and the database name (`bookstore`) are hard-coded; there is no schema/model layer.
