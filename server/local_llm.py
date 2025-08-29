# local_llm.py
# Local LLM integration for RAG-Lab

from typing import Any
import transformers
from transformers import pipeline, Pipeline

class LocalChatModel:
    """Simple wrapper for local Hugging Face models to work with LangChain"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.pipeline = pipeline(
            "text-generation",
            model=model_name,
            max_length=512,
            do_sample=True,
            temperature=0.7,
            pad_token_id=50256  # For GPT-2 compatibility
        )
    
    def invoke(self, prompt: str) -> Any:
        """Generate response from local model"""
        try:
            # Generate response
            response = self.pipeline(prompt, max_new_tokens=150, num_return_sequences=1)
            
            # Extract generated text (remove the input prompt)
            full_text = response[0]['generated_text']
            generated_text = full_text[len(prompt):].strip()
            
            # Create a simple response object that mimics LangChain's structure
            class LocalResponse:
                def __init__(self, content):
                    self.content = content
            
            return LocalResponse(generated_text)
            
        except Exception as e:
            # Fallback response
            class LocalResponse:
                def __init__(self, content):
                    self.content = content
            
            return LocalResponse(f"Local model error: {str(e)}")

def create_local_chat_model(model_name: str) -> LocalChatModel:
    """Create a local chat model instance"""
    return LocalChatModel(model_name)