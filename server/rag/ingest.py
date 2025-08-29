# rag-lab/ingest.py (v2.2)
# 🧪 Ingest PDFs & Markdown into Chroma Vector Store
# - Converts .md → .pdf using Pandoc + WeasyPrint
# - Uses stable langchain v0.0.348 + pydantic v1 stack
# - Moves processed files into processed/
# - Logs activity to ingest.log
# Run: source env/bin/activate && python ingest.py

import os, glob, shutil, subprocess, logging
from dotenv import load_dotenv
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings

# Load env vars
load_dotenv()

DATA_DIR = "data"
PROCESSED_DIR = "processed"
DB_DIR = "db"
LOG_FILE = "ingest.log"

# Configure logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def convert_md_to_pdf(md_file: str):
    """Convert a Markdown file to PDF using Pandoc + WeasyPrint."""
    pdf_file = md_file.replace(".md", ".pdf")
    try:
        subprocess.run(
            ["pandoc", md_file, "-o", pdf_file, "--pdf-engine=weasyprint"],
            check=True
        )
        print(f"📝 Converted {md_file} → {pdf_file}")
        return pdf_file
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to convert {md_file}: {e}")
        return None

def ingest_files():
    if not os.path.exists(DATA_DIR):
        raise FileNotFoundError(f"No {DATA_DIR}/ folder found")

    os.makedirs(PROCESSED_DIR, exist_ok=True)

    embeddings = OpenAIEmbeddings()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    # First handle Markdown → PDF conversion
    md_files = glob.glob(os.path.join(DATA_DIR, "*.md"))
    for md in md_files:
        pdf = convert_md_to_pdf(md)
        if pdf:
            shutil.move(md, os.path.join(PROCESSED_DIR, os.path.basename(md)))

    # Now process PDFs
    pdf_files = glob.glob(os.path.join(DATA_DIR, "*.pdf"))
    if not pdf_files:
        msg = "⚠️ No new files found in data/"
        print(msg)
        logging.info(msg)
        return

    all_docs = []
    for pdf in pdf_files:
        try:
            print(f"📥 Loading {pdf}")
            loader = PyPDFLoader(pdf)
            pages = loader.load()
            docs = splitter.split_documents(pages)

            for d in docs:
                d.metadata["source"] = os.path.basename(pdf)

            all_docs.extend(docs)

            dest = os.path.join(PROCESSED_DIR, os.path.basename(pdf))
            shutil.move(pdf, dest)

            msg = f"✅ Ingested {pdf} ({len(docs)} chunks) → moved to {dest}"
            print(msg)
            logging.info(msg)

        except Exception as e:
            msg = f"❌ Failed to ingest {pdf}: {e}"
            print(msg)
            logging.error(msg)

    if all_docs:
        db = Chroma.from_documents(all_docs, embeddings, persist_directory=DB_DIR)
        db.persist()
        print(f"🎉 Ingestion complete: {len(all_docs)} chunks into {DB_DIR}/")
        logging.info(f"Ingestion complete: {len(all_docs)} chunks into {DB_DIR}/")

if __name__ == "__main__":
    logging.info("----- Ingest Run Started -----")
    ingest_files()
    logging.info("----- Ingest Run Finished -----\n")
