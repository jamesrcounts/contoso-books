import  db  from './db.js';
import { ObjectId } from 'mongodb';

const removeComment = async (bookId, commentIndex) => {
    const connection = db.getConnection();

    await connection.collection('books').updateOne(
                                            {"_id": new ObjectId(bookId)},
                                            {$unset: {[`reviewcomments.${commentIndex}`]: 1}}
                                        );
    await connection.collection('books').updateOne(
                                            {"_id": new ObjectId(bookId)},
                                            {$pull: {"reviewcomments": null}}
                                        );

}
export default removeComment
export {removeComment}