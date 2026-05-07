const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd(), "src");
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) files.push(full);
  }
}

walk(root);

const bad = [];
const re = /import\s+(?:[^'"`;]+?\s+from\s+)?['"]([^'"]+)['"]/g;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1];
    if (!spec.startsWith(".")) continue;
    const base = path.resolve(path.dirname(file), spec);
    const candidates = [
      base,
      `${base}.js`,
      `${base}.mjs`,
      `${base}.cjs`,
      path.join(base, "index.js"),
    ];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      bad.push({ file: path.relative(process.cwd(), file), spec });
    }
  }
}

console.log(JSON.stringify({ fileCount: files.length, brokenCount: bad.length, broken: bad }, null, 2));
