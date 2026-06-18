#!/usr/bin/env node
/**
 * Re-apply the content filter to the vendored seed tarball, in place.
 *
 * Why this exists: build_dataset.py is the canonical generator, but it rebuilds from the Kaggle
 * CSV (GoodReads_100k_books.csv), which is NOT vendored in this repo — and the build box may not
 * have Python. This tool instead re-filters the EXISTING seed-data.tar.gz (whose books are already
 * reshaped into the app's schema), so a maintainer can prune content with just Node and no CSV
 * download. It shares the rule set in content_filter.json with build_dataset.py, so both paths
 * drop the same books. Re-running is idempotent (already-filtered data matches nothing).
 *
 * Scope: GENRE filtering only (exact + substring from content_filter.json). The title regex is the
 * from-CSV generator's job — the vendored data was already title-filtered at its original build, so
 * re-applying it here would be redundant.
 *
 * Output: overwrites seed-data.tar.gz. The archive is content-equivalent to a Python rebuild but NOT
 * byte-identical (Node's zlib and Python's gzip differ); runs are reproducible because every tar
 * header uses mtime=0. genresList is recomputed as the sorted unique genres across surviving books —
 * JS String#sort and Python's sorted() both order by code point, and the surviving genres are
 * overwhelmingly ASCII (the two non-ASCII entries sort to the tail either way), so the order matches.
 *
 * Usage: node refilter_seed_data.js   (paths resolve relative to this file)
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const DATA_DIR = __dirname;
const ARCHIVE = path.join(DATA_DIR, "seed-data.tar.gz");
const FILTER = path.join(DATA_DIR, "content_filter.json");

// --- read: minimal USTAR reader, identical to populate_data.js's readTarGz ---
function readTarGz(file) {
  const buf = zlib.gunzipSync(fs.readFileSync(file));
  const files = {};
  for (let off = 0; off + 512 <= buf.length; ) {
    const name = buf.toString("utf8", off, off + 100).replace(/\0.*$/, "");
    if (!name) break; // zero block marks end of archive
    const size = parseInt(buf.toString("utf8", off + 124, off + 136).replace(/\0.*$/, "").trim(), 8) || 0;
    const start = off + 512;
    files[name] = buf.subarray(start, start + size);
    off = start + Math.ceil(size / 512) * 512;
  }
  return files;
}

// --- write: minimal USTAR writer producing archives readTarGz can parse ---
// 512-byte zero-filled header; octal numeric fields; checksum = unsigned sum of all 512 header
// bytes with the 8-byte chksum field treated as spaces, written as 6 octal digits + NUL + space.
function ustarHeader(name, size) {
  const h = Buffer.alloc(512);
  h.write(name, 0, "utf8"); // name @0 (100)
  h.write("0000644\0", 100, "ascii"); // mode @100 (8)
  h.write("0000000\0", 108, "ascii"); // uid @108 (8)
  h.write("0000000\0", 116, "ascii"); // gid @116 (8)
  h.write(size.toString(8).padStart(11, "0") + "\0", 124, "ascii"); // size @124 (12)
  h.write("00000000000\0", 136, "ascii"); // mtime=0 @136 (12)
  h.write("        ", 148, "ascii"); // chksum field = 8 spaces while summing
  h.write("0", 156, "ascii"); // typeflag '0' (regular file) @156
  h.write("ustar\0", 257, "ascii"); // magic @257 (6)
  h.write("00", 263, "ascii"); // version @263 (2)
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii"); // final checksum @148 (8)
  return h;
}

function entryBlock(name, dataBuf) {
  const pad = (512 - (dataBuf.length % 512)) % 512;
  return Buffer.concat([ustarHeader(name, dataBuf.length), dataBuf, Buffer.alloc(pad)]);
}

function writeTarGz(file, entries) {
  const parts = entries.map(([name, dataBuf]) => entryBlock(name, dataBuf));
  parts.push(Buffer.alloc(1024)); // two 512-byte zero blocks terminate the archive
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat(parts), { level: 9 }));
}

// --- filter rules (shared with build_dataset.py via content_filter.json) ---
const filter = JSON.parse(fs.readFileSync(FILTER, "utf8"));
const EXACT = new Set(filter.excludeGenresExact.map((g) => g.toLowerCase()));
const SUBSTR = filter.excludeGenresSubstring.map((s) => s.toLowerCase());
function isExcludedGenre(g) {
  const l = g.toLowerCase();
  return EXACT.has(l) || SUBSTR.some((s) => l.includes(s));
}
function isExcludedBook(b) {
  return Array.isArray(b.genre) && b.genre.some(isExcludedGenre);
}

// --- run ---
const files = readTarGz(ARCHIVE);
const books = JSON.parse(files["books.json"].toString("utf8"));
const before = books.length;
const survivors = books.filter((b) => !isExcludedBook(b));
const genresList = [...new Set(survivors.flatMap((b) => b.genre || []))].sort();

// Serialize with default JSON.stringify — no \u escaping of non-ASCII (the JS equivalent of
// Python's ensure_ascii=False). Two genres are double-encoded mojibake that must round-trip
// byte-for-byte; an escaping step would corrupt them. books.json compact, genres.json indent 2.
const booksBuf = Buffer.from(JSON.stringify(survivors), "utf8");
const genresBuf = Buffer.from(JSON.stringify({ genresList }, null, 2), "utf8");

writeTarGz(ARCHIVE, [
  ["books.json", booksBuf],
  ["genres.json", genresBuf],
]);

console.log(`books:  ${before} -> ${survivors.length} (removed ${before - survivors.length})`);
console.log(`genres: ${genresList.length} unique`);
console.log(`archive -> ${ARCHIVE}`);
