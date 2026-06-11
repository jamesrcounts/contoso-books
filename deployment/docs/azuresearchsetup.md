# Setup Azure AI Search integration

> **Note:** Azure AI Search's built-in "Azure Cosmos DB for MongoDB API" indexer connector targets the RU-based service, not DocumentDB vCore. For this lab, full-text search uses a **push model**: the app calls the Azure AI Search REST API directly (via `@azure/search-documents`) with pre-built index documents. The steps below cover creating the search service and the index; data import is handled by the seeding script and any incremental sync you add.

## 1. Create an Azure AI Search service

Follow the [portal guide](https://docs.microsoft.com/azure/search/search-create-service-portal) to create a Free or Basic tier Search resource in the same region as your DocumentDB cluster.

## 2. Create the search index

Create an index named (e.g.) `books-index` with at least the following fields:

| Field name | Type | Attributes |
|---|---|---|
| `doc_id` | `Edm.String` | Key, Retrievable |
| `title` | `Edm.String` | Retrievable, Searchable |
| `author` | `Edm.String` | Retrievable, Searchable |
| `img` | `Edm.String` | Retrievable |
| `rating` | `Edm.Double` | Retrievable, Filterable, Sortable |
| `bookformat` | `Edm.String` | Retrievable, Filterable |
| `genre` | `Edm.String` | Retrievable, Filterable, Searchable |

These attributes mirror what `server/src/db/searchBooks.js` passes in `select`, `filter`, and `orderBy` options.

## 3. Wire up the App Service application settings

Edit the **Configuration > Application settings** of the App Service resource and set:

- `SEARCH_API_ENDPOINT` — the Search service URL from its Overview blade (e.g. `https://<service-name>.search.windows.net`).
- `SEARCH_API_KEY` — a query key or admin key from **Search service > Keys**.
- `SEARCH_INDEX_NAME` — the name of the index you created above.

Save and restart. The `/search` route will now return Azure AI Search results when the user types in the search box.
