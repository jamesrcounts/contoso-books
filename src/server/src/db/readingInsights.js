import  db  from './db.js';

// Legacy "reading insights" report.
// Classifies each book into a page-count "effort tier" using server-side JavaScript
// ($function), then aggregates the count of books and the average rating per tier.
// This runs fine on MongoDB, but $function (server-side JS) is NOT supported on Azure
// DocumentDB — the Exercise 03 pre-migration assessment flags it as a Critical finding.
 const readingInsights = async () => {
    const connection = db.getConnection();

    // Uses an aggregation pipeline: $addFields (server-side JS classification),
    // $group (count + average rating per tier) and $sort.
    const aggCursor = await connection.collection('books').aggregate([
                                                        {$addFields: {
                                                            effortTier: {
                                                                $function: {
                                                                    // body is server-side JavaScript, supplied as a string source.
                                                                    body: `function (pages) {
                                                                        if (pages == null) return 'Unknown';
                                                                        if (pages < 250) return 'Quick Read';
                                                                        if (pages < 500) return 'Standard';
                                                                        return 'Epic';
                                                                    }`,
                                                                    args: ["$pages"],
                                                                    lang: "js"
                                                                }
                                                            }
                                                        }},
                                                        {$group: {_id: "$effortTier", count: {$sum: 1}, avgRating: {$avg: "$rating"}}},
                                                        {$sort: {count: -1}}
                                                    ])

    //Convert pipeline cursor to an array
    const insights = await aggCursor.toArray();

    return insights;
}
export default readingInsights
export {readingInsights}
