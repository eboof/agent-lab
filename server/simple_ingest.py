#!/usr/bin/env python3
# Simple document ingestion for Agent-Lab RAG system
# Ingest PDF documents from docs/ directory into vector database

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

def ingest_documents():
    """Ingest PDF documents into Chroma vector database"""
    
    # Define paths
    docs_dir = Path("/Users/rob/dev/agent-lab/docs")
    db_dir = Path("/Users/rob/dev/agent-lab/server/db")
    
    print(f"📂 Looking for PDFs in: {docs_dir}")
    print(f"💾 Database directory: {db_dir}")
    
    # Find all PDF files
    pdf_files = list(docs_dir.glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in docs directory")
        return
    
    print(f"📄 Found {len(pdf_files)} PDF files")
    
    # Initialize embeddings and text splitter
    try:
        embeddings = OpenAIEmbeddings()
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
    except Exception as e:
        print(f"❌ Failed to initialize embeddings: {e}")
        return
    
    # Process each PDF
    all_documents = []
    
    for pdf_file in pdf_files:
        try:
            print(f"📥 Processing: {pdf_file.name}")
            
            # Load PDF
            loader = PyPDFLoader(str(pdf_file))
            pages = loader.load()
            
            # Split into chunks
            chunks = text_splitter.split_documents(pages)
            
            # Add source metadata
            for chunk in chunks:
                chunk.metadata["source"] = pdf_file.name
            
            all_documents.extend(chunks)
            print(f"   ✅ Created {len(chunks)} chunks from {pdf_file.name}")
            
        except Exception as e:
            print(f"   ❌ Failed to process {pdf_file.name}: {e}")
    
    if not all_documents:
        print("❌ No documents were successfully processed")
        return
    
    print(f"\n📊 Total chunks to ingest: {len(all_documents)}")
    
    # Create/update vector database
    try:
        print("💾 Creating vector database...")
        db = Chroma.from_documents(
            documents=all_documents,
            embedding=embeddings,
            persist_directory=str(db_dir)
        )
        
        print("✅ Vector database created successfully!")
        print(f"📈 Ingested {len(all_documents)} document chunks")
        
        # Test query
        print("\n🧪 Testing with sample query...")
        results = db.similarity_search("Agent-Lab", k=3)
        print(f"Found {len(results)} relevant chunks")
        
        for i, result in enumerate(results[:2], 1):
            print(f"  {i}. Source: {result.metadata.get('source', 'unknown')}")
            print(f"     Preview: {result.page_content[:100]}...")
        
    except Exception as e:
        print(f"❌ Failed to create vector database: {e}")
        return

if __name__ == "__main__":
    print("🚀 Starting document ingestion...")
    ingest_documents()
    print("🏁 Ingestion complete!")