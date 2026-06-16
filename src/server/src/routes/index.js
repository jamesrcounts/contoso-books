import  getAllBooksRoute  from './getAllBooksRoute.js';
import  getBookRoute  from './getBookRoute.js';
import  updateCommentRoute from './updateCommentRoute.js';
import  removeCommentRoute  from './removeCommentRoute.js';
import  searchGenresRoute  from './searchGenresRoute.js';
import  readingInsightsRoute  from './readingInsightsRoute.js';

const routes = [
    getAllBooksRoute,
    getBookRoute,
    updateCommentRoute,
    removeCommentRoute,
    searchGenresRoute,
    readingInsightsRoute
]
export default routes
export {routes}
