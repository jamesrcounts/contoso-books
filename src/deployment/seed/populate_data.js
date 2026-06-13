const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Seed data is vendored into ./data (see data/README.md). It was previously fetched
// from an Azure blob host that no longer exists, so the dataset now ships in-repo as a
// single gzipped tarball holding books.json + genres.json.
const ARCHIVE_FILE = path.join(__dirname, "data", "seed-data.tar.gz");

// Minimal USTAR reader: gunzip, then walk 512-byte tar blocks pulling out each regular
// file as { name: Buffer }. The archive is produced by data/build_dataset.py in plain
// USTAR format (no PAX headers), so this stays small and dependency-free.
function readTarGz(file) {
  const buf = zlib.gunzipSync(fs.readFileSync(file));
  const files = {};
  for (let off = 0; off + 512 <= buf.length; ) {
    const name = buf.toString("utf8", off, off + 100).replace(/\0.*$/, "");
    if (!name) break; // zero block marks end of archive
    const size = parseInt(buf.toString("utf8", off + 124, off + 136).replace(/\0.*$/, "").trim(), 8) || 0;
    const start = off + 512;
    files[name] = buf.subarray(start, start + size);
    off = start + Math.ceil(size / 512) * 512;
  }
  return files;
}

// Extract + parse both documents once; getBooks/getGenres share the result.
let _archive = null;
function loadArchive() {
  if (!_archive) {
    const files = readTarGz(ARCHIVE_FILE);
    _archive = {
      books: JSON.parse(files["books.json"].toString("utf8")),
      genres: JSON.parse(files["genres.json"].toString("utf8")),
    };
  }
  return _archive;
}

// Pure transform: drop _id and stringify isbn fields. Does not mutate the input.
function prepareBooks(books) {
  return books.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      isbn: rest.isbn.toString(),
      isbn13: rest.isbn13.toString(),
    };
  });
}

// Pure transform: drop _id and wrap the single genres document in an array.
function prepareGenres(result) {
  const { _id, ...rest } = result;
  return [rest];
}

async function getBooks() {
  console.log("Loading books from " + ARCHIVE_FILE);
  return prepareBooks(loadArchive().books);
}

async function getGenres() {
  console.log("Loading genres from " + ARCHIVE_FILE);
  return prepareGenres(loadArchive().genres);
}

async function insertCollection(db, collectionName, docs) {
  const result = await db.collection(collectionName).insertMany(docs);
  console.log(
    `Seeding completed on ${collectionName} Collection`,
    new Date().toLocaleString()
  );
  return result;
}

async function seed(endpoint, deps = {}) {
  const getBooksFn = deps.getBooks || getBooks;
  const getGenresFn = deps.getGenres || getGenres;

  const client = await MongoClient.connect(endpoint);
  try {
    const db = client.db("bookstore");
    const [books, genres] = await Promise.all([getBooksFn(), getGenresFn()]);
    await insertCollection(db, "books", books);
    await insertCollection(db, "genres", genres);
  } finally {
    await client.close();
  }
}

module.exports = {
  prepareBooks,
  prepareGenres,
  getBooks,
  getGenres,
  insertCollection,
  seed,
};

if (require.main === module) {
  const { endpoint } = require("yargs").argv;
  // yargs gives a bare `--endpoint` (no value) the boolean `true`, and an empty
  // BOOKSTORE_SEED_DB_CONNECTION_STRING comes through as "". Reject both up front
  // so the run fails clearly instead of with MongoClient's opaque
  // "connectionString.startsWith is not a function".
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    console.error(
      "Error: no connection string. Set BOOKSTORE_SEED_DB_CONNECTION_STRING in src/deployment/seed/.env (see Task 04)."
    );
    process.exit(1);
  }
  console.log("$$$ Seeding data started " + new Date().toLocaleString());
  seed(endpoint).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
