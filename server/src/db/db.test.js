import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import db from './db.js';
import getAllBooks from './getAllBooks.js';
import getBook from './getBook.js';
import { updateComment } from './updateComment.js';
import removeComment from './removeComment.js';

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await db.connect(mongod.getUri());
});

afterAll(async () => {
    await db._dbClient.close();
    await mongod.stop();
});

describe('db.connect', () => {
    it('connects without throwing', () => {
        expect(db._dbClient).toBeTruthy();
    });
});

describe('getAllBooks', () => {
    it('returns seeded books', async () => {
        const conn = db.getConnection();
        await conn.collection('books').insertMany([
            { title: 'Book A', author: 'Author A', img: '' },
            { title: 'Book B', author: 'Author B', img: '' },
        ]);
        const books = await getAllBooks(0, 10);
        expect(books.length).toBeGreaterThanOrEqual(2);
        const titles = books.map(b => b.title);
        expect(titles).toContain('Book A');
        expect(titles).toContain('Book B');
    });
});

describe('getBook', () => {
    it('returns the correct book by id', async () => {
        const conn = db.getConnection();
        const { insertedId } = await conn.collection('books').insertOne({
            title: 'Test Book',
            author: 'Test Author',
            img: '',
        });
        const book = await getBook(insertedId.toString());
        expect(book.title).toBe('Test Book');
    });
});

describe('updateComment', () => {
    it('appends a comment to the book', async () => {
        const conn = db.getConnection();
        const { insertedId } = await conn.collection('books').insertOne({ title: 'Commented Book', reviewcomments: [] });
        await updateComment(insertedId.toString(), 'Alice', 'Great read!');
        const book = await conn.collection('books').findOne({ _id: insertedId });
        expect(book.reviewcomments).toHaveLength(1);
        expect(book.reviewcomments[0]).toMatchObject({ name: 'Alice', comment: 'Great read!' });
    });
});

describe('removeComment', () => {
    it('removes a comment from the book', async () => {
        const conn = db.getConnection();
        const { insertedId } = await conn.collection('books').insertOne({
            title: 'Book With Comment',
            reviewcomments: [{ name: 'Bob', comment: 'Interesting.' }],
        });
        await removeComment(insertedId.toString(), 0);
        const book = await conn.collection('books').findOne({ _id: insertedId });
        expect(book.reviewcomments).toHaveLength(0);
    });
});
