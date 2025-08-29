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
import openai

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
