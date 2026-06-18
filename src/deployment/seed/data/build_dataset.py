#!/usr/bin/env python3
"""Reconstruct the bookstore seed data files from the GoodReads 100k CSV.

The original `books.json` / `genres.json` were hosted on an Azure Storage account that
no longer exists. This script regenerates equivalent files from the public Kaggle
dataset `mdhamani/goodreads-books-100k` (see README.md for the no-auth download URL),
emitting documents in the exact shape the app expects:

  books.json  -> JSON array; each doc has string title/author/img/desc/bookformat/
                 isbn/isbn13, numeric rating/totalratings/pages/reviews, and `genre` as an
                 ARRAY of strings (the client calls genre.map(); the server filters with $in).
  genres.json -> single JSON document { "genresList": [ ...sorted unique genres... ] }
                 (the server aggregation unwinds $genresList).

Both files are bundled into a single gzipped tarball, `seed-data.tar.gz`.

Usage:
  python3 build_dataset.py /path/to/GoodReads_100k_books.csv [out_dir]

Output (defaults to this script's directory):
  seed-data.tar.gz  (contains books.json + genres.json)

Stdlib only — no third-party dependencies.
"""

import csv
import io
import json
import os
import re
import sys
import tarfile

# The CSV's `desc` cells are large; raise the field-size limit so csv won't choke.
csv.field_size_limit(10 * 1024 * 1024)

_ISBN10_RE = re.compile(r"\d{9}[\dXx]")
_ISBN13_RE = re.compile(r"\d{13}")

# Content filter: this is Microsoft-branded training content, so the seeded catalog is filtered
# to keep it appropriate for a general professional audience. The rule set lives in
# content_filter.json — shared with refilter_seed_data.js so the from-CSV rebuild here and the
# in-repo re-pack stay in sync. A book is dropped if ANY of its genres matches an entry in
# excludeGenresExact (case-insensitive) or contains any substring in excludeGenresSubstring
# (e.g. "sex" -> Sexuality, Bisexual, Asexual, …), or if its TITLE matches excludeTitleRegex.
# Descriptions are intentionally NOT scanned (literary/historical works often mention these
# words without being explicit).
_FILTER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content_filter.json")
with open(_FILTER_PATH, encoding="utf-8") as _fh:
    _FILTER = json.load(_fh)
EXCLUDE_GENRES_EXACT = frozenset(g.lower() for g in _FILTER["excludeGenresExact"])
EXCLUDE_GENRES_SUBSTR = tuple(s.lower() for s in _FILTER["excludeGenresSubstring"])
EXPLICIT_TITLE_RE = re.compile(_FILTER["excludeTitleRegex"], re.IGNORECASE)


def is_inappropriate(title, genre_list):
    """True if a book should be excluded from the seed catalog.

    Matches on an excluded genre tag (exact OR substring) or an explicit term in the title.
    See content_filter.json and the README "Content filtering" section for the rule set.
    """
    for g in genre_list:
        gl = g.lower()
        if gl in EXCLUDE_GENRES_EXACT or any(s in gl for s in EXCLUDE_GENRES_SUBSTR):
            return True
    return bool(EXPLICIT_TITLE_RE.search(title or ""))


def normalize_isbn13(raw_isbn13, isbn10):
    """Return a clean ISBN-13 string, or '' when one can't be trusted.

    This particular CSV was round-tripped through Excel, which mangled most `isbn13`
    cells into scientific notation ('9.78E+12') — those digits are unrecoverable. So:
      * keep `raw_isbn13` only if it's already a real 13-digit number,
      * otherwise derive it from a valid ISBN-10 (prefix 978 + recomputed check digit),
      * otherwise return '' rather than propagating a fake value.
    """
    raw = (raw_isbn13 or "").strip()
    if _ISBN13_RE.fullmatch(raw):
        return raw
    isbn10 = (isbn10 or "").strip()
    if _ISBN10_RE.fullmatch(isbn10):
        core = "978" + isbn10[:9]
        total = sum((1 if i % 2 == 0 else 3) * int(d) for i, d in enumerate(core))
        check = (10 - (total % 10)) % 10
        return core + str(check)
    return ""


def to_int(value):
    """Parse an int, tolerating blanks, floats, and stray formatting -> 0 on failure."""
    if value is None:
        return 0
    text = value.strip()
    if not text:
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def to_float(value):
    """Parse a float, tolerating blanks -> 0.0 on failure."""
    if value is None:
        return 0.0
    text = value.strip()
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def split_genres(value):
    """Split the comma-joined genre cell into a de-duped, order-preserving list."""
    if not value:
        return []
    seen = set()
    out = []
    for token in value.split(","):
        g = token.strip()
        if g and g not in seen:
            seen.add(g)
            out.append(g)
    return out


def build(csv_path, out_dir):
    books = []
    genres_seen = set()
    skipped = 0
    filtered = 0

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            title = (row.get("title") or "").strip()
            if not title:
                skipped += 1
                continue

            genre_list = split_genres(row.get("genre"))

            # Drop filtered books (see is_inappropriate). Done before collecting genres so
            # excluded genres (e.g. "Erotica", "Sexuality") don't leak into genres.json.
            if is_inappropriate(title, genre_list):
                filtered += 1
                continue

            genres_seen.update(genre_list)

            books.append(
                {
                    "title": title,
                    "author": (row.get("author") or "").strip(),
                    "img": (row.get("img") or "").strip(),
                    "desc": row.get("desc") or "",
                    "bookformat": (row.get("bookformat") or "").strip(),
                    "isbn": (row.get("isbn") or "").strip(),
                    "isbn13": normalize_isbn13(row.get("isbn13"), row.get("isbn")),
                    "genre": genre_list,
                    "rating": to_float(row.get("rating")),
                    "totalratings": to_int(row.get("totalratings")),
                    "pages": to_int(row.get("pages")),
                    "reviews": to_int(row.get("reviews")),
                    "link": (row.get("link") or "").strip(),
                }
            )

    genres_doc = {"genresList": sorted(genres_seen)}

    archive_path = os.path.join(out_dir, "seed-data.tar.gz")

    # Both collections ship in one gzipped tarball: books.json (compact) + genres.json
    # (pretty). USTAR format + mtime=0 keep the archive simple to parse and reproducible
    # (no PAX extended headers, byte-identical rebuilds for clean git diffs).
    with tarfile.open(archive_path, "w:gz", format=tarfile.USTAR_FORMAT, compresslevel=9) as tar:
        _add_json(tar, "books.json", books)
        _add_json(tar, "genres.json", genres_doc, indent=2)

    print(f"books written:  {len(books):>7} docs")
    print(f"genres written: {len(genres_doc['genresList']):>7} unique")
    print(f"rows skipped (empty title): {skipped}")
    print(f"rows filtered (explicit content): {filtered}")
    print(f"archive -> {archive_path}")


def _add_json(tar, name, obj, indent=None):
    """Add an in-memory JSON document to the tar archive as `name`."""
    data = json.dumps(obj, ensure_ascii=False, indent=indent).encode("utf-8")
    info = tarfile.TarInfo(name=name)
    info.size = len(data)
    info.mtime = 0  # deterministic builds
    tar.addfile(info, io.BytesIO(data))


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        sys.exit(1)
    csv_path = argv[1]
    out_dir = argv[2] if len(argv) > 2 else os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    build(csv_path, out_dir)


if __name__ == "__main__":
    main(sys.argv)
