import fs from "fs";
import path from "path";

const AUTHOR = "Author: Yzrel Jade B. Eborde";
const ROOT = path.resolve(import.meta.dirname, "..");

const TS_HEADER = `/**\n * ${AUTHOR}\n */\n\n`;
const JAVA_HEADER = `/**\n * ${AUTHOR}\n */\n`;

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "target" || entry.name === "dist") continue;
      walk(full, ext, out);
    } else if (entry.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function addHeader(file, header) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes(AUTHOR)) return false;

  if (file.endsWith(".java")) {
    const pkg = content.match(/^package\s/m);
    if (pkg) {
      content = JAVA_HEADER + content;
    } else {
      content = JAVA_HEADER + "\n" + content;
    }
  } else {
    content = TS_HEADER + content;
  }

  fs.writeFileSync(file, content, "utf8");
  return true;
}

const files = [
  ...walk(path.join(ROOT, "src"), ".ts"),
  ...walk(path.join(ROOT, "src"), ".tsx"),
  ...walk(path.join(ROOT, "backend", "src"), ".java"),
  path.join(ROOT, "vite.config.ts"),
].filter((f) => fs.existsSync(f));

let updated = 0;
for (const file of files) {
  const header = file.endsWith(".java") ? JAVA_HEADER : TS_HEADER;
  if (addHeader(file, header)) {
    updated++;
    console.log("updated:", path.relative(ROOT, file));
  }
}

console.log(`\nDone. Updated ${updated} of ${files.length} files.`);
