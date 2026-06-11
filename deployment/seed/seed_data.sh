 
 #!/bin/sh
    . .env

    echo "Preparing to import data..." 

    echo "Installing Node modules..."

    npm i --silent
    #     echo "Getting connection string..."

    echo "Populating database..."
    node ./populate_data.js --endpoint $BOOKSTORE_SEED_DB_CONNECTION_STRING

    echo "Finished! Seeding, $BOOKSTORE_SEED_DB_ACCOUNT, is now ready to play around!"

# fi