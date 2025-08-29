# api.py (v1.2)
# RAG-Lab Backend API
# Version ID: 20250827-1220

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from local_llm import create_local_chat_model

# 🔑 Load secrets from .env (never hardcode!)
load_dotenv()

# make sure key exists
if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("Missing OPENAI_API_KEY in environment or .env file")

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

# load vector DB once
embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
db = Chroma(persist_directory="db", embedding_function=embeddings)

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

    docs = db.similarity_search(req.question, k=req.k)
    if not docs:
        return QueryResponse(
            answer="⚠️ No relevant context found in vector store.",
            sources=[]
        )

    context = "\n\n".join([d.page_content for d in docs])

    # Choose model - OpenAI or local
    if req.model.startswith("local-"):
        # Use local model
        llm = get_local_model(req.model)
        prompt = f"Based on the following context, answer the question concisely:\n\nContext:\n{context}\n\nQuestion: {req.question}\n\nAnswer:"
    else:
        # Use OpenAI model
        llm = ChatOpenAI(model=req.model, openai_api_key=os.getenv("OPENAI_API_KEY"))
        prompt = f"Use the following context to answer:\n\n{context}\n\nQ: {req.question}\nA:"
    
    result = llm.invoke(prompt)

    return QueryResponse(
        answer=result.content,
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
