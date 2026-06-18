import { MongoClient } from 'mongodb';

const DB_NAME = 'bookstore';

const db = {
    _dbClient: null,
    connect: async function(url) {
        const client = await MongoClient.connect(url, {
            maxPoolSize: 10,
        });
        const host = url.replace(/^mongodb(\+srv)?:\/\//, '').replace(/^[^@]*@/, '').replace(/[/?].*$/, '');
        console.log(`DocumentDB connected to ${host}`);
        this._dbClient = client;
    },
    
    getConnection: function() {
        if (!this._dbClient) {
            console.log('You need to call .connect() first!');
            process.exit(1);
        }
        return this._dbClient.db(DB_NAME);
    }
}
export default db
export {db}