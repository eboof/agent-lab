import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const dbPath = path.resolve("server", "docs.json");

// 🗓 Parse date from filename (PocketBlog250304.pdf → 2025-03-04)
function extractDate(filename: string): string {
  const match = filename.match(/(\d{6})/);
  if (!match) return "Unknown Date";

  const [yy, mm, dd] = [match[1].slice(0,2), match[1].slice(2,4), match[1].slice(4,6)];
  return `20${yy}-${mm}-${dd}`;
}

// 🏷 Extract title (first non-empty line)
function extractTitle(content: string): string {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  return lines[0] || "Untitled Blog";
}

// 📥 Load one PDF
async function loadPDF(filePath: string) {
  console.log(`📥 Reading: ${filePath}`);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const data = fs.readFileSync(filePath);
  const parsed = await pdfParse(data);

  const filename = path.basename(filePath);
  const date = extractDate(filename);
  const title = extractTitle(parsed.text);

  return {
    filename,
    date,
    title,
    content: parsed.text
  };
}

// 📚 Load all PDFs from docs/ folder
export async function loadPDFs() {
  const folderPath = path.resolve("docs"); // root-level docs
  console.log(`🔍 Looking for PDFs in ${folderPath}`);

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".pdf"));
  if (files.length === 0) {
    console.warn("⚠️ No PDFs found!");
    return;
  }

  const docs: any[] = [];
  for (const file of files) {
    try {
      const doc = await loadPDF(path.join(folderPath, file));
      docs.push(doc);
      console.log(`📄 Loaded ${doc.filename} (${doc.content.length} chars)`);
    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err);
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(docs, null, 2));
  console.log(`✅ Saved ${docs.length} docs to ${dbPath}`);
}

// 🔎 Search helper
export function searchDocs(query: string) {
  if (!fs.existsSync(dbPath)) {
    throw new Error("No docs.json found. Run loadDocs.ts first.");
  }

  const docs = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  return docs.filter((d: any) => d.content.toLowerCase().includes(query.toLowerCase()));
}
