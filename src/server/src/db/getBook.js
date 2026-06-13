import  db  from './db.js';
import { ObjectId } from 'mongodb';

const getBook = async (bookId) => {
    const connection = db.getConnection();
    const book = await connection.collection('books').findOne({"_id": new ObjectId(bookId)})
    return book;
}
export default getBook
export {getBook}