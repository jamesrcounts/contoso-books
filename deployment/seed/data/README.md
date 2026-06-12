# Seed data

These files are the dataset that `populate_data.js` loads into the `bookstore` database's
`books` and `genres` collections.

| File | What it is |
| --- | --- |
| `seed-data.tar.gz` | gzipped tarball bundling both JSON documents (see below) |
| &nbsp;&nbsp;↳ `books.json` | JSON array of 100,000 book documents |
| &nbsp;&nbsp;↳ `genres.json` | single document `{ "genresList": [...] }` — the de-duped, sorted list of every genre |
| `build_dataset.py` | the generator that produced the tarball above |

The data is vendored into the repo on purpose: it used to be downloaded at seed time from an
Azure Storage blob (`cosmosbookstorestg.blob.core.windows.net`) that no longer exists, so
seeding broke for anyone cloning the repo. Shipping the dataset in-repo removes that
third-party dependency — clone, set a connection string, run `seed_data.sh`, done.

## Source

The data is the **GoodReads 100k books** dataset by *mdhamani* on Kaggle:
<https://www.kaggle.com/datasets/mdhamani/goodreads-books-100k>

**License:** [CC0 1.0 Universal (Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/)
— the dataset is dedicated to the public domain, so it can be redistributed in this repo freely
with no attribution requirement. (Credit to the original author is kept here as a courtesy.)

The fields are reshaped to match what the app expects (see below).

## Document shape

Each book document:

```jsonc
{
  "title":        "string",
  "author":       "string",
  "img":          "string (cover image URL, may be \"\")",
  "desc":         "string",
  "bookformat":   "string (e.g. \"Hardcover\", \"Paperback\", \"Kindle Edition\")",
  "isbn":         "string",
  "isbn13":       "string (derived from a valid ISBN-10, else \"\")",
  "genre":        ["array", "of", "genre", "strings"],
  "rating":       3.52,      // number
  "totalratings": 33,        // number
  "pages":        0,         // number
  "reviews":      5,         // number
  "link":         "string"
}
```

`genre` is an **array** (the UI renders it with `.map()` and the API filters it with `$in`);
`rating`/`totalratings`/`pages`/`reviews` are **numbers**.

> Note: the Kaggle CSV's `isbn13` column was corrupted into scientific notation by a
> spreadsheet round-trip. The generator discards those unrecoverable values and instead
> recomputes a correct ISBN-13 from the intact ISBN-10 where one is available; the rest are
> left blank rather than storing a fake value. `isbn13` is not displayed by the app today.

## Regenerating

```sh
# 1. Download the dataset (no Kaggle login required):
curl -L -o /tmp/gr100k.zip \
  "https://www.kaggle.com/api/v1/datasets/download/mdhamani/goodreads-books-100k"
unzip -o /tmp/gr100k.zip -d /tmp/gr100k

# 2. Rebuild seed-data.tar.gz into this folder:
python3 build_dataset.py /tmp/gr100k/GoodReads_100k_books.csv
```

The generator uses only the Python standard library.
