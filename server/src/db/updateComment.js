import  db  from './db.js';
import { ObjectId } from 'mongodb';

const updateComment = async (bookId, name, comment) => {
    const connection = db.getConnection();
    await connection.collection('books').updateOne(
                                            {"_id": new ObjectId(bookId)},
                                            {$push: {reviewcomments: {"name": name,
                                                                      "comment": comment }
                                                                    }})
}
export default updateComment
export {updateComment}