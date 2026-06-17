const { MongoClient } = require("mongodb");
const crypto = require("crypto");

// The two collections seeded/migrated by the lab, and the database that holds them.
const DB_NAME = "bookstore";
const COLLECTIONS = ["books", "genres"];

// Produce a deterministic string for any BSON/JS value so that two equal documents always
// hash to the same digest regardless of the field order the driver hands them back in.
// Object keys are sorted recursively; arrays keep their order (order is part of the value);
// ObjectId/Date and any other BSON type serialize via a stable tagged form.
function canonicalize(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (typeof value === "object") {
    if (value._bsontype === "ObjectId") return '{"$oid":"' + value.toHexString() + '"}';
    if (value instanceof Date) return '{"$date":"' + value.toISOString() + '"}';
    // Any other BSON wrapper (Decimal128, Long, Binary, ...) has a stable toString().
    if (value._bsontype) return '{"$' + value._bsontype + '":' + JSON.stringify(value.toString()) + "}";
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  // Primitives: number, string, boolean.
  return JSON.stringify(value);
}

// XOR `buf` into `acc` in place. Combining per-document digests with XOR is commutative, so
// the collection digest does not depend on iteration order — no server-side sort over 96k
// documents is needed, and source/target match iff their document sets match.
function xorInto(acc, buf) {
  for (let i = 0; i < acc.length; i++) acc[i] ^= buf[i];
  return acc;
}

// Stream one collection and fold it down to { count, checksum }. The checksum is the XOR of
// each document's md5(canonical JSON); count is the number of documents actually hashed.
async function collectionChecksum(db, collectionName) {
  const acc = Buffer.alloc(16, 0); // md5 digest length
  let count = 0;
  const cursor = db.collection(collectionName).find({});
  try {
    for await (const doc of cursor) {
      xorInto(acc, crypto.createHash("md5").update(canonicalize(doc)).digest());
      count++;
    }
  } finally {
    await cursor.close();
  }
  return { count, checksum: acc.toString("hex") };
}

// Connect to one endpoint and summarize every collection on it.
async function inspect(connectionString) {
  const client = await MongoClient.connect(connectionString);
  try {
    const db = client.db(DB_NAME);
    const summary = {};
    for (const name of COLLECTIONS) {
      summary[name] = await collectionChecksum(db, name);
    }
    return summary;
  } finally {
    await client.close();
  }
}

// Inspect both endpoints (concurrently) and build per-collection comparison rows plus an
// overall pass flag (every collection must match on both count and checksum).
async function compare(sourceConn, targetConn) {
  const [source, target] = await Promise.all([inspect(sourceConn), inspect(targetConn)]);
  const rows = COLLECTIONS.map((name) => {
    const s = source[name];
    const t = target[name];
    return {
      collection: name,
      sourceCount: s.count,
      targetCount: t.count,
      countMatch: s.count === t.count,
      sourceChecksum: s.checksum,
      targetChecksum: t.checksum,
      checksumMatch: s.checksum === t.checksum,
    };
  });
  return { rows, pass: rows.every((r) => r.countMatch && r.checksumMatch) };
}

// Render the comparison as a fixed-width table followed by an overall verdict.
function formatReport({ rows, pass }) {
  const short = (hex) => hex.slice(0, 12) + "...";
  const header =
    "Collection   Source count   Target count   Count   Source cksum     Target cksum     Cksum";
  const rule =
    "----------   ------------   ------------   -----   --------------   --------------   -----";
  const lines = ["", header, rule];
  for (const r of rows) {
    lines.push(
      [
        r.collection.padEnd(10),
        String(r.sourceCount).padStart(12),
        String(r.targetCount).padStart(12),
        (r.countMatch ? "OK" : "DIFF").padStart(5),
        short(r.sourceChecksum).padEnd(14),
        short(r.targetChecksum).padEnd(14),
        (r.checksumMatch ? "OK" : "DIFF").padStart(5),
      ].join("   ")
    );
  }
  lines.push("");
  lines.push(
    pass
      ? "RESULT: PASS - source and target hold identical data."
      : "RESULT: FAIL - see the DIFF rows above."
  );
  return lines.join("\n");
}

module.exports = {
  canonicalize,
  collectionChecksum,
  inspect,
  compare,
  formatReport,
};

if (require.main === module) {
  require("dotenv").config();
  const source = process.env.BOOKSTORE_SOURCE_DB_CONNECTION_STRING;
  const target = process.env.BOOKSTORE_TARGET_DB_CONNECTION_STRING;

  // A missing or empty connection string comes through as undefined/"". Reject both up front
  // so the run fails clearly instead of with MongoClient's opaque
  // "connectionString.startsWith is not a function".
  const missing = [];
  if (typeof source !== "string" || !source.trim()) missing.push("BOOKSTORE_SOURCE_DB_CONNECTION_STRING");
  if (typeof target !== "string" || !target.trim()) missing.push("BOOKSTORE_TARGET_DB_CONNECTION_STRING");
  if (missing.length) {
    console.error(
      "Error: no connection string. Set " +
        missing.join(" and ") +
        " in src/deployment/validate/.env (see Exercise 07 Task 03)."
    );
    process.exit(1);
  }

  console.log("$$$ Validation started " + new Date().toLocaleString());
  compare(source, target)
    .then((result) => {
      console.log(formatReport(result));
      process.exit(result.pass ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
