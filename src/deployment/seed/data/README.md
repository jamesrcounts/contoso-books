# Seed data

These files are the dataset that `populate_data.js` loads into the `bookstore` database's
`books` and `genres` collections.

| File | What it is |
| --- | --- |
| `seed-data.tar.gz` | gzipped tarball bundling both JSON documents (see below) |
| &nbsp;&nbsp;↳ `books.json` | JSON array of 93,624 book documents |
| &nbsp;&nbsp;↳ `genres.json` | single document `{ "genresList": [...] }` — the de-duped, sorted list of every genre |
| `build_dataset.py` | the generator that produces the tarball from the Kaggle CSV |
| `content_filter.json` | shared content-filter rule set (consumed by both scripts) |
| `refilter_seed_data.js` | re-applies the filter to the existing tarball, no CSV needed |

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

Because this is Microsoft-branded training content, the seeded catalog is filtered to keep it
appropriate for a general professional audience.

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
