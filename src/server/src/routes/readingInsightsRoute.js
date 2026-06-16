import {readingInsights} from '../db/readingInsights.js';

 const readingInsightsRoute = {
    method: 'get',
    path: '/reading-insights',
    handler: async (req, res) => {
        const insights = await readingInsights();
        res.status(200).json(insights);
    }
}
export default readingInsightsRoute
export {readingInsightsRoute}
