#!/bin/sh
set -e

. ./.env

echo "Preparing to import data..."

echo "Installing Node modules..."

npm i --silent

echo "Populating database..."
node ./populate_data.js --endpoint "$BOOKSTORE_SEED_DB_CONNECTION_STRING"

echo "Finished! Your database is now ready to play around!"
