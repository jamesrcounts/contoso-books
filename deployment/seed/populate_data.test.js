import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import seeder from "./populate_data.js";

const { prepareBooks, prepareGenres, insertCollection, seed } = seeder;

const sampleBooks = [
  { _id: "abc", title: "Book A", author: "Author A", isbn: 123, isbn13: 456789 },
  { _id: "def", title: "Book B", author: "Author B", isbn: 999, isbn13: 111222 },
];
const sampleGenre = { _id: "ghi", genres: ["Fiction", "History"] };

describe("prepareBooks", () => {
  it("strips _id and stringifies isbn fields", () => {
    const result = prepareBooks(sampleBooks);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("_id");
    expect(result[0].isbn).toBe("123");
    expect(result[0].isbn13).toBe("456789");
    expect(result[0].title).toBe("Book A");
  });

  it("does not mutate the input", () => {
    const input = [{ _id: "x", title: "T", isbn: 1, isbn13: 2 }];
    prepareBooks(input);
    expect(input[0]).toHaveProperty("_id", "x");
    expect(input[0].isbn).toBe(1);
  });
});

describe("prepareGenres", () => {
  it("strips _id and wraps the document in an array", () => {
    const result = prepareGenres(sampleGenre);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("_id");
    expect(result[0].genres).toEqual(["Fiction", "History"]);
  });
});

describe("insertCollection / seed (in-memory mongo)", () => {
  let mongod;
  let uri;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  it("insertCollection inserts the provided docs", async () => {
    const client = await MongoClient.connect(uri);
    try {
      const db = client.db("bookstore");
      await insertCollection(db, "books", prepareBooks(sampleBooks));
      const count = await db.collection("books").countDocuments();
      expect(count).toBe(2);
      const a = await db.collection("books").findOne({ title: "Book A" });
      expect(a.isbn).toBe("123");
    } finally {
      await client.close();
    }
  });

  it("seed populates both collections via injected fetchers", async () => {
    await seed(uri, {
      getBooks: async () => prepareBooks(sampleBooks),
      getGenres: async () => prepareGenres(sampleGenre),
    });

    const client = await MongoClient.connect(uri);
    try {
      const db = client.db("bookstore");
      expect(await db.collection("books").countDocuments()).toBeGreaterThanOrEqual(2);
      expect(await db.collection("genres").countDocuments()).toBe(1);
      const genre = await db.collection("genres").findOne({});
      expect(genre.genres).toContain("Fiction");
    } finally {
      await client.close();
    }
  });
});
