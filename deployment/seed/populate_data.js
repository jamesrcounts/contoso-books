const { MongoClient } = require("mongodb");
const fetch = require("node-fetch");

const BOOKS_URL = "https://cosmosbookstorestg.blob.core.windows.net/bookstore/books.json";
const GENRES_URL = "https://cosmosbookstorestg.blob.core.windows.net/bookstore/genres.json";

async function fetchJson(target) {
  const res = await fetch(target, {
    method: "get",
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
  if (res.status !== 200) {
    throw new Error(`Error fetching ${target}: status ${res.status}`);
  }
  return res.json();
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
  console.log("Fetching books");
  return prepareBooks(await fetchJson(BOOKS_URL));
}

async function getGenres() {
  console.log("Fetching genres");
  return prepareGenres(await fetchJson(GENRES_URL));
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
  console.log("$$$ Seeding data started " + new Date().toLocaleString());
  seed(endpoint).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
