# Seed data

These files are the dataset that `populate_data.js` loads into the `bookstore` database's
`books` and `genres` collections.

| File | What it is |
| --- | --- |
| `seed-data.tar.gz` | gzipped tarball bundling both JSON documents (see below) |
| &nbsp;&nbsp;↳ `books.json` | JSON array of 96,419 book documents |
| &nbsp;&nbsp;↳ `genres.json` | single document `{ "genresList": [...] }` — the de-duped, sorted list of every genre |
| `build_dataset.py` | the generator that produced the tarball above |

The data is vendored into the repo on purpose so seeding has no third-party download
dependency — clone, set a connection string, run `npm run seed`, done.

## Source

The data is the **GoodReads 100k books** dataset by *mdhamani* on Kaggle:
<https://www.kaggle.com/datasets/mdhamani/goodreads-books-100k>

**License:** [CC0 1.0 Universal (Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/)
— the dataset is dedicated to the public domain, so it can be redistributed in this repo freely
with no attribution requirement. (Credit to the original author is kept here as a courtesy.)

The fields are reshaped to match what the app expects (see below).

## Content filtering

Because this is Microsoft-branded training content, sexually explicit / pornographic titles
are excluded from the seed data. `build_dataset.py` drops any book tagged with an explicit
genre (`Erotica`, `Erotic Romance`, `Pornography`, `BDSM`, `Gay Erotica`, `Sex Work`, …) or
whose **title** contains an explicit term. The filter is intentionally narrow — mainstream
`Romance`, `LGBT`, Young Adult, and literary `Adult Fiction` titles are preserved. This drops
the source dataset from 100,000 to **96,419** books (and removes the corresponding genres from
`genres.json`).

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
