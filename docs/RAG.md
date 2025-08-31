# RAG System Integration Guide

Complete guide to using the Retrieval-Augmented Generation (RAG) system in Agent-Lab v4.0.1.

---

## 🎯 Overview

The RAG system enables agents to query and analyze your document collections using semantic search and AI-powered analysis. It combines vector embeddings with large language models to provide context-aware responses from your knowledge base.

### Architecture

```
Documents → Processing → Vector Storage → Semantic Search → AI Analysis → Response
    ↓           ↓             ↓              ↓              ↓           ↓
   PDFs    Chunking      ChromaDB      Similarity    GPT/Claude   Structured
  Text     Embedding                    Search        Analysis     Answer
  Files    Generation                   
```

### Key Features
- **Multiple File Formats**: PDF, TXT, Markdown, DOCX
- **Semantic Search**: Find relevant content beyond keyword matching
- **Vector Storage**: ChromaDB for efficient similarity search
- **AI Integration**: OpenAI GPT-4 and Anthropic Claude support
- **Source Attribution**: Track which documents provided answers
- **Multi-language Support**: Process documents in various languages

---

## 🚀 Quick Start

### 1. Start the RAG System

```bash
# Start Agent-Lab (includes RAG)
./start-agent-lab.sh

# Or start RAG server manually
cd server
python api.py
```

The RAG server will be available at: http://localhost:8000

### 2. Check RAG Status

```bash
# Via API
curl http://localhost:3001/rag/status

# Expected response:
{
  "ready": true,
  "process": "running", 
  "port": 8000
}
```

### 3. Add Documents

```bash
# Copy documents to the docs directory
cp your-documents.pdf docs/

# Documents are automatically processed on startup
```

### 4. Query Your Documents

```bash
# Via API
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"What are the key findings?","model":"gpt-4","k":5}' \
  http://localhost:3001/rag/query

# Response includes answer and source documents
{
  "answer": "Based on your documents, the key findings are...",
  "sources": ["document1.pdf", "document2.pdf"]
}
```

---

## 📁 Document Management

### Supported File Formats

**Text Documents:**
- **.pdf** - PDF documents with text content
- **.txt** - Plain text files  
- **.md** - Markdown files
- **.docx** - Microsoft Word documents (coming soon)

**Structured Data:**
- **.json** - JSON data files (basic support)
- **.csv** - CSV data files (basic support)

### Document Processing Pipeline

1. **File Detection**: System scans `/docs/` directory for new files
2. **Content Extraction**: Text extracted from various file formats
3. **Text Chunking**: Long documents split into manageable chunks
4. **Embedding Generation**: OpenAI embeddings created for each chunk
5. **Vector Storage**: Embeddings stored in ChromaDB with metadata
6. **Indexing**: Search index created for efficient retrieval

### Adding Documents

**Method 1: Direct File Copy**
```bash
# Copy files to docs directory
cp /path/to/your/documents/* docs/

# Restart RAG server to process new files
curl -X POST http://localhost:3001/rag/start
```

**Method 2: Programmatic Upload (Coming Soon)**
```bash
# Upload via API
curl -X POST -F "file=@document.pdf" \
  http://localhost:3001/rag/upload
```

### Document Status

```bash
# Check processed documents
curl http://localhost:3001/rag/documents

# Response shows document status
{
  "documents": [
    {
      "filename": "report.pdf",
      "status": "processed",
      "chunks": 45,
      "lastModified": "2025-08-29T10:00:00Z"
    }
  ]
}
```

---

## 🔍 Querying System

### Query Methods

**Direct RAG API:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"Your question","model":"gpt-4","k":5}' \
  http://localhost:3001/rag/query
```

**Via Agent Integration:**
- Agents with RAG tool automatically have access
- No additional configuration needed
- Responses include source attribution

**Via UI Interface:**
- RAG Chat tab in the web interface
- Interactive query and response
- Visual source document display

### Query Parameters

```typescript
interface RAGQuery {
  question: string;      // Your question
  model?: string;        // AI model (gpt-4, claude-3, etc.)
  k?: number;           // Number of similar documents (default: 5)
  threshold?: number;    // Similarity threshold (0-1)
  filters?: {           // Document filters (optional)
    type?: string;      // File type filter
    date?: string;      // Date range filter
    author?: string;    // Author filter
  };
}
```

### Advanced Query Examples

**Basic Question:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"What is the project timeline?"}' \
  http://localhost:3001/rag/query
```

**Specific Model:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"Analyze the financial data","model":"claude-3-sonnet"}' \
  http://localhost:3001/rag/query
```

**More Context Documents:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"Comprehensive risk analysis","k":10}' \
  http://localhost:3001/rag/query
```

---

## 🤖 Agent Integration

### Automatic RAG Integration

When creating agents, the RAG system is automatically available for agents with AI tools:

```typescript
// Agent automatically has access to RAG when using AI tools
export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: "Research Agent",
      tools: ["openai-api", "rag-query"], // RAG tool included
      inputSchema: {
        question: { type: "string", required: true }
      }
    });
  }
  
  protected async execute(input: any) {
    // RAG query is automatically integrated
    const ragResponse = await this.queryRAG(input.question);
    const aiAnalysis = await this.analyzeWithAI(ragResponse);
    
    return {
      answer: aiAnalysis,
      sources: ragResponse.sources
    };
  }
}
```

### Manual RAG Integration

For custom agents, integrate RAG manually:

```typescript
// In your agent's execute method
const ragQuery = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: input.question,
    model: 'gpt-4',
    k: 5
  })
});

const ragResponse = await ragQuery.json();
```

### RAG-Enabled Agent Examples

**Document Q&A Agent:**
```typescript
// Input: { question: "What are the compliance requirements?" }
// Output: { answer: "...", sources: ["compliance.pdf", "policy.pdf"] }
```

**Research Summary Agent:**
```typescript
// Input: { topic: "market trends", depth: "comprehensive" }
// Output: { summary: "...", key_points: [...], sources: [...] }
```

**Policy Checker Agent:**
```typescript
// Input: { action: "expense claim", amount: 500 }
// Output: { allowed: true, policy: "...", source: "expense-policy.pdf" }
```

---

## ⚙️ Configuration

### RAG Server Configuration

**Environment Variables:**
```bash
# In .env file
OPENAI_API_KEY=your-openai-key          # Required for embeddings
ANTHROPIC_API_KEY=your-anthropic-key    # Optional for Claude queries
RAG_PORT=8000                           # RAG server port
RAG_DB_PATH=./server/db                 # ChromaDB storage path
RAG_DOCS_PATH=./docs                    # Documents directory
RAG_CHUNK_SIZE=1000                     # Text chunk size
RAG_CHUNK_OVERLAP=200                   # Chunk overlap
RAG_MAX_TOKENS=4000                     # Max response tokens
```

**Python Configuration:**
```python
# server/api.py configuration
CHROMA_SETTINGS = {
    "persist_directory": "db",
    "allow_reset": False,
    "anonymized_telemetry": False
}

EMBEDDING_SETTINGS = {
    "model": "text-embedding-ada-002",
    "chunk_size": 1000,
    "chunk_overlap": 200
}
```

### ChromaDB Configuration

**Database Settings:**
```python
# Custom ChromaDB configuration
client = chromadb.PersistentClient(
    path="./db",
    settings=chromadb.Settings(
        anonymized_telemetry=False,
        allow_reset=False
    )
)

collection = client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}
)
```

**Performance Tuning:**
```python
# Optimize for your use case
BATCH_SIZE = 100        # Documents processed per batch
MAX_CONNECTIONS = 50    # Max concurrent connections
CACHE_SIZE = 1000       # Embedding cache size
```

---

## 🔧 Advanced Features

### Custom Document Processors

Add support for new file formats:

```python
# server/rag/processors/custom_processor.py
class CustomDocumentProcessor:
    def __init__(self):
        self.supported_extensions = ['.xyz']
    
    def can_process(self, file_path: str) -> bool:
        return file_path.lower().endswith(tuple(self.supported_extensions))
    
    def extract_text(self, file_path: str) -> str:
        # Your custom extraction logic
        with open(file_path, 'r') as f:
            return f.read()
    
    def extract_metadata(self, file_path: str) -> dict:
        return {
            'filename': os.path.basename(file_path),
            'type': 'custom',
            'processor': 'CustomDocumentProcessor'
        }
```

### Embedding Customization

Use different embedding models:

```python
# Alternative embedding models
from langchain_community.embeddings import HuggingFaceEmbeddings

# Use Sentence Transformers
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Use local model
embeddings = HuggingFaceEmbeddings(
    model_name="local-model-path",
    model_kwargs={'device': 'cpu'}
)
```

### Vector Store Alternatives

Replace ChromaDB with other vector stores:

```python
# Pinecone integration
from langchain_community.vectorstores import Pinecone
import pinecone

pinecone.init(
    api_key="your-pinecone-key",
    environment="your-pinecone-env"
)

vectorstore = Pinecone.from_documents(
    documents, embeddings, index_name="agent-lab"
)

# Weaviate integration
from langchain_community.vectorstores import Weaviate
import weaviate

client = weaviate.Client(url="http://localhost:8080")
vectorstore = Weaviate(client, "Document", "content")
```

---

## 📊 Monitoring & Analytics

### Query Analytics

**Track Query Performance:**
```python
# Add to query endpoint
import time
import logging

start_time = time.time()
# ... process query
duration = time.time() - start_time

logging.info(f"RAG query processed in {duration:.2f}s", extra={
    'question': question,
    'model': model,
    'duration': duration,
    'sources_count': len(sources)
})
```

**Query Metrics Dashboard:**
```python
# Collect metrics
metrics = {
    'total_queries': query_count,
    'avg_response_time': avg_duration,
    'most_common_questions': top_questions,
    'document_usage': document_stats
}
```

### Document Analytics

**Track Document Usage:**
```bash
# Via API
curl http://localhost:3001/rag/analytics

# Response
{
  "total_documents": 150,
  "total_chunks": 3420,
  "most_referenced": ["important-doc.pdf", "policy.pdf"],
  "storage_size": "245 MB",
  "last_indexed": "2025-08-29T10:00:00Z"
}
```

### Performance Monitoring

**System Metrics:**
```bash
# Monitor ChromaDB performance
curl http://localhost:8000/health

# Monitor vector store size
du -sh server/db/

# Monitor memory usage
ps aux | grep python | grep api.py
```

---

## 🛠️ Troubleshooting

### Common Issues

**RAG Server Not Starting:**
```bash
# Check Python dependencies
pip list | grep langchain
pip list | grep chromadb

# Check port availability
netstat -tlnp | grep :8000

# Check logs
tail -f server/rag-server.log
```

**No Documents Found:**
```bash
# Check documents directory
ls -la docs/

# Check file permissions
chmod 644 docs/*.pdf

# Manually trigger processing
curl -X POST http://localhost:3001/rag/start
```

**Poor Query Results:**
```bash
# Check embedding model
# Verify document content extracted properly
# Adjust chunk size and overlap
# Try different AI models
```

**Memory Issues:**
```bash
# Monitor memory usage
free -h
htop

# Reduce batch size in configuration
# Clear vector database and rebuild
rm -rf server/db/
```

### Debugging Queries

**Enable Debug Logging:**
```python
# In server/api.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Log query details
logger.debug(f"Query: {question}")
logger.debug(f"Retrieved chunks: {len(docs)}")
logger.debug(f"Context length: {len(context)}")
```

**Test Embeddings:**
```python
# Test embedding generation
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings()

test_text = "This is a test document"
vector = embeddings.embed_query(test_text)
print(f"Embedding dimension: {len(vector)}")
```

**Inspect Vector Store:**
```bash
# Check ChromaDB contents
curl http://localhost:8000/collections
curl http://localhost:8000/collections/documents/count
```

---

## 🔒 Security & Privacy

### Data Security

**Document Encryption:**
```python
# Encrypt sensitive documents before storage
from cryptography.fernet import Fernet

key = Fernet.generate_key()
cipher = Fernet(key)

encrypted_content = cipher.encrypt(document_content.encode())
```

**Access Control:**
```python
# Add user authentication to RAG queries
def require_auth(user_token):
    # Verify user permissions
    if not verify_token(user_token):
        raise UnauthorizedException("Invalid token")
```

**Audit Logging:**
```python
# Log all RAG queries for audit
audit_log.info("RAG query", extra={
    'user': user_id,
    'question': question,
    'timestamp': datetime.now(),
    'sources_accessed': sources
})
```

### Privacy Considerations

1. **Sensitive Data**: Don't store sensitive information in vector database
2. **Data Retention**: Implement document expiration policies
3. **Access Logs**: Monitor who accesses which documents
4. **Anonymization**: Remove PII before processing documents

---

## 📈 Optimization

### Performance Tuning

**Embedding Optimization:**
```python
# Batch embedding generation
def embed_documents_batch(texts, batch_size=100):
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        batch_embeddings = embedding_model.embed_documents(batch)
        embeddings.extend(batch_embeddings)
    return embeddings
```

**Query Optimization:**
```python
# Pre-filter documents before vector search
def optimized_query(question, filters=None):
    # Apply metadata filters first
    if filters:
        filtered_docs = apply_metadata_filters(filters)
    
    # Then perform vector search on filtered set
    results = vector_search(question, filtered_docs)
    return results
```

**Caching Strategy:**
```python
# Cache frequently asked questions
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_rag_query(question_hash, model):
    return perform_rag_query(question, model)
```

---

## 📚 Integration Examples

### E-commerce Support Bot

```typescript
// Agent for product support using manual database
export class SupportAgent extends BaseAgent {
  async execute(input: { question: string }) {
    // Query product manuals and FAQs
    const ragResponse = await this.queryRAG(input.question);
    
    // Analyze with AI for personalized response
    const support_answer = await this.analyzeWithAI(ragResponse);
    
    return {
      answer: support_answer,
      helpful_documents: ragResponse.sources,
      confidence: ragResponse.score
    };
  }
}
```

### Legal Document Analysis

```typescript
// Agent for legal document research
export class LegalAgent extends BaseAgent {
  async execute(input: { legal_question: string, jurisdiction: string }) {
    // Query legal documents and precedents
    const legal_docs = await this.queryRAG(
      `${input.legal_question} ${input.jurisdiction}`,
      { k: 10, threshold: 0.8 }
    );
    
    return {
      legal_analysis: legal_docs.answer,
      relevant_cases: legal_docs.sources,
      jurisdiction: input.jurisdiction
    };
  }
}
```

### Technical Documentation Helper

```typescript
// Agent for API documentation queries
export class TechDocsAgent extends BaseAgent {
  async execute(input: { api_question: string, version: string }) {
    const docs_query = `${input.api_question} version ${input.version}`;
    const tech_docs = await this.queryRAG(docs_query);
    
    return {
      documentation: tech_docs.answer,
      code_examples: this.extractCodeExamples(tech_docs.answer),
      related_docs: tech_docs.sources
    };
  }
}
```

---

## 🚀 Future Enhancements

### Roadmap Features

- **Multi-modal RAG**: Support for images, tables, charts
- **Real-time Updates**: Live document synchronization
- **Collaborative Features**: Shared document collections
- **Advanced Analytics**: Query insights and recommendations
- **Custom Models**: Fine-tuned embeddings for domain-specific content

### Contributing

Want to improve the RAG system?

1. **Add Document Processors**: Support new file formats
2. **Enhance Search**: Implement hybrid search (vector + keyword)
3. **Improve UI**: Build better query and results interface
4. **Add Analytics**: More detailed usage and performance metrics

---

## 📖 Additional Resources

- **[ChromaDB Documentation](https://docs.trychroma.com/)**
- **[LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering)**
- **[OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)**
- **[Vector Database Comparison](https://github.com/vector-database-benchmark)**

---

**Ready to power your agents with document intelligence?** 📚

Start by adding your documents to the `/docs/` directory and querying away!