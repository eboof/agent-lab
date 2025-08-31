# api.py (v1.2)
# RAG-Lab Backend API
# Version ID: 20250827-1220

import os
import glob
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from local_llm import create_local_chat_model
import openai

# 🔑 Load secrets from .env (never hardcode!)
# Always load from repo root to match Node.js server behavior
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(repo_root, ".env")

if load_dotenv(env_path):
    print(f"✅ Loaded environment from {env_path}")
else:
    print(f"❌ Failed to load .env from {env_path}")
    exit(1)

# Validate critical environment variables
required_env_vars = ["OPENAI_API_KEY"]
for var in required_env_vars:
    if not os.getenv(var):
        print(f"❌ Missing required environment variable: {var}")
        exit(1)

# init app
app = FastAPI(title="RAG Lab API")

# enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to ["http://localhost:5173"] in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# request schema
class QueryRequest(BaseModel):
    question: str
    k: int = 3
    model: str = "gpt-4o-mini"  # Options: "gpt-4o-mini", "local-gpt2", "local-distilgpt2"

class QueryResponse(BaseModel):
    answer: str
    sources: list[str]

class LoadDocsRequest(BaseModel):
    file_paths: list[str]
    source_dir: str = "/Users/rob/dev/agent-lab/data/uploads"

class LoadDocsResponse(BaseModel):
    status: str
    message: str
    documents_processed: int

# load vector DB once (with proper OpenAI key handling)
# Initialize as None for now - will create when needed
embeddings = None
db = None

def get_vector_db():
    """Lazy load vector database"""
    global embeddings, db
    if db is None:
        try:
            embeddings = OpenAIEmbeddings()
            # Use the Agent-Lab vector database we created earlier
            db_path = "/Users/rob/dev/agent-lab/server/db"
            db = Chroma(persist_directory=db_path, embedding_function=embeddings)
            print(f"✅ Vector database loaded from {db_path}")
        except Exception as e:
            print(f"Warning: Could not initialize vector database: {e}")
            return None
    return db

# Initialize local models (cached)
local_models = {}

def get_local_model(model_name: str):
    """Get or create a local model instance (cached)"""
    if model_name not in local_models:
        if model_name == "local-gpt2":
            local_models[model_name] = create_local_chat_model("gpt2")
        elif model_name == "local-distilgpt2":
            local_models[model_name] = create_local_chat_model("distilgpt2")
        else:
            raise ValueError(f"Unknown local model: {model_name}")
    return local_models[model_name]

@app.post("/query", response_model=QueryResponse)
async def query_rag(req: QueryRequest):
    """RAG query endpoint."""
    
    print(f"🔍 Query received: model={req.model}, question={req.question[:50]}...")

    # Get vector database
    vector_db = get_vector_db()
    
    if vector_db is None:
        # Fallback to direct LLM query without RAG context
        if req.model.startswith("local-"):
            try:
                llm = get_local_model(req.model)
                result = llm.invoke(f"Please answer this question: {req.question}")
                return QueryResponse(
                    answer=result.content,
                    sources=["Direct local model response (no vector database)"]
                )
            except Exception as e:
                return QueryResponse(
                    answer=f"Error with local model: {str(e)}",
                    sources=["Error"]
                )
        else:
            # Use OpenAI directly
            try:
                client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                response = client.chat.completions.create(
                    model=req.model,
                    messages=[{"role": "user", "content": f"Please answer this question: {req.question}"}],
                    max_tokens=1000
                )
                return QueryResponse(
                    answer=response.choices[0].message.content,
                    sources=["Direct OpenAI response (no vector database)"]
                )
            except Exception as e:
                return QueryResponse(
                    answer=f"Error calling OpenAI: {str(e)}",
                    sources=["Error"]
                )

    # Try to search the vector database
    try:
        docs = vector_db.similarity_search(req.question, k=req.k)
        if not docs:
            # No relevant docs found, fall back to direct model query
            if req.model.startswith("local-"):
                try:
                    llm = get_local_model(req.model)
                    result = llm.invoke(f"Please answer this question: {req.question}")
                    return QueryResponse(
                        answer=result.content,
                        sources=["Direct local model response (no relevant documents)"]
                    )
                except Exception as e:
                    return QueryResponse(
                        answer=f"Error with local model: {str(e)}",
                        sources=["Error"]
                    )
            else:
                try:
                    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                    response = client.chat.completions.create(
                        model=req.model,
                        messages=[{"role": "user", "content": f"Please answer this question: {req.question}"}],
                        max_tokens=1000
                    )
                    return QueryResponse(
                        answer=response.choices[0].message.content,
                        sources=["Direct OpenAI response (no relevant documents)"]
                    )
                except Exception as e:
                    return QueryResponse(
                        answer=f"Error calling OpenAI: {str(e)}",
                        sources=["Error"]
                    )
    except Exception as e:
        return QueryResponse(
            answer=f"Error searching vector database: {str(e)}",
            sources=["Error"]
        )

    # Use RAG context with the found documents
    context = "\n\n".join([d.page_content for d in docs])

    # Choose model - OpenAI or local
    if req.model.startswith("local-"):
        # Use local model
        try:
            llm = get_local_model(req.model)
            prompt = f"Based on the following context, answer the question concisely:\n\nContext:\n{context}\n\nQuestion: {req.question}\n\nAnswer:"
            result = llm.invoke(prompt)
            result_content = result.content
        except Exception as e:
            return QueryResponse(
                answer=f"Error with local model: {str(e)}",
                sources=["Error"]
            )
    else:
        # Use OpenAI directly  
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            prompt = f"Use the following context to answer:\n\n{context}\n\nQ: {req.question}\nA:"
            response = client.chat.completions.create(
                model=req.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            result_content = response.choices[0].message.content
        except Exception as e:
            return QueryResponse(
                answer=f"Error calling OpenAI: {str(e)}",
                sources=["Error"]
            )

    return QueryResponse(
        answer=result_content,
        sources=[d.metadata.get("source", "Unknown") for d in docs]
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "RAG Lab API is running"}

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "openai_models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        "local_models": ["local-gpt2", "local-distilgpt2"],
        "default": "gpt-4o-mini"
    }

@app.get("/test-embeddings")
async def test_embeddings():
    """Test embeddings initialization"""
    try:
        vector_db = get_vector_db()
        global embeddings
        return {"status": "ok", "embeddings_loaded": embeddings is not None, "db_loaded": vector_db is not None}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/upload-files")
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload files to the uploads directory"""
    try:
        uploads_dir = "/Users/rob/dev/agent-lab/data/uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        
        uploaded_files = []
        for file in files:
            # Save file to uploads directory
            file_path = os.path.join(uploads_dir, file.filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            uploaded_files.append(file_path)
            print(f"📤 Uploaded {file.filename} to {file_path}")
        
        return {
            "status": "success", 
            "message": f"Uploaded {len(uploaded_files)} files",
            "file_paths": uploaded_files
        }
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")

@app.post("/load-docs", response_model=LoadDocsResponse)
async def load_docs(req: LoadDocsRequest):
    """Load documents into the vector database"""
    try:
        # Check if source directory exists
        if not os.path.exists(req.source_dir):
            raise HTTPException(status_code=400, detail=f"Source directory {req.source_dir} does not exist")
        
        # Set up processing directories
        processed_dir = "/Users/rob/dev/agent-lab/data/processed_docs"
        os.makedirs(processed_dir, exist_ok=True)
        
        # Initialize text splitter and embeddings
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        embeddings_instance = OpenAIEmbeddings()
        
        # Process files
        all_docs = []
        processed_count = 0
        
        # If specific file paths provided, use those; otherwise process all supported files in directory
        if req.file_paths:
            supported_files = [f for f in req.file_paths if (f.endswith('.pdf') or f.endswith('.md')) and os.path.exists(f)]
            print(f"🔍 Checking specific files: {req.file_paths}")
            print(f"✅ Found supported files: {supported_files}")
        else:
            pdf_files = glob.glob(os.path.join(req.source_dir, "*.pdf"))
            md_files = glob.glob(os.path.join(req.source_dir, "*.md"))
            supported_files = pdf_files + md_files
            print(f"🔍 Scanning directory {req.source_dir}")
            print(f"✅ Found supported files: {supported_files}")
        
        for file_path in supported_files:
            try:
                print(f"📥 Loading {file_path}")
                
                # Choose appropriate loader based on file extension
                if file_path.endswith('.pdf'):
                    loader = PyPDFLoader(file_path)
                elif file_path.endswith('.md'):
                    loader = TextLoader(file_path)
                else:
                    print(f"⚠️ Unsupported file type: {file_path}")
                    continue
                
                pages = loader.load()
                docs = text_splitter.split_documents(pages)
                
                # Add source metadata
                for doc in docs:
                    doc.metadata["source"] = os.path.basename(file_path)
                
                all_docs.extend(docs)
                
                # Move to processed directory
                dest = os.path.join(processed_dir, os.path.basename(file_path))
                if os.path.exists(dest):
                    os.remove(dest)  # Remove existing file to avoid conflicts
                shutil.move(file_path, dest)
                processed_count += 1
                
                print(f"✅ Processed {file_path} ({len(docs)} chunks) → moved to {dest}")
                
            except Exception as e:
                print(f"❌ Failed to process {file_path}: {e}")
                continue
        
        if all_docs:
            # Create or update vector store
            db_path = "/Users/rob/dev/agent-lab/server/db"
            try:
                # Try to load existing database and add documents
                existing_db = Chroma(persist_directory=db_path, embedding_function=embeddings_instance)
                existing_db.add_documents(all_docs)
                print(f"🎉 Added {len(all_docs)} document chunks to existing vector database")
            except Exception as e:
                # If loading fails, create a new database
                print(f"Creating new vector database: {e}")
                new_db = Chroma.from_documents(all_docs, embeddings_instance, persist_directory=db_path)
                print(f"🎉 Created new vector database with {len(all_docs)} document chunks")
            
            # Reset global db to None so it reloads next time
            global db
            db = None
            
            return LoadDocsResponse(
                status="success",
                message=f"Successfully processed {processed_count} documents with {len(all_docs)} chunks",
                documents_processed=processed_count
            )
        else:
            return LoadDocsResponse(
                status="warning", 
                message="No documents were processed",
                documents_processed=0
            )
            
    except Exception as e:
        print(f"❌ LoadDocs error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load documents: {str(e)}")
