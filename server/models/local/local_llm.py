#!/usr/bin/env python3
"""
Local LLM wrapper compatible with langchain ChatOpenAI interface
Replaces OpenAI API calls with local model inference
"""
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.language_models.llms import LLM
from typing import Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class LocalChatModel:
    """
    Local model wrapper that mimics ChatOpenAI interface
    """
    
    def __init__(self, model_name: str = "gpt2", max_new_tokens: int = 150, temperature: float = 0.7, max_input_length: int = 400):
        self.model_name = model_name
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.max_input_length = max_input_length  # Limit input to prevent context overflow
        self.model = None
        self.tokenizer = None
        
        self._load_model()
    
    def _load_model(self):
        """Load the local model and tokenizer"""
        try:
            logger.info(f"Loading local model: {self.model_name}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model with optimizations
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True,
            )
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self.model = self.model.cuda()
                logger.info("Model loaded on GPU")
            else:
                logger.info("Model loaded on CPU")
                
            logger.info(f"✅ Local model {self.model_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}: {e}")
            raise
    
    def invoke(self, prompt: str) -> "LocalChatResponse":
        """
        Generate response for a given prompt (compatible with ChatOpenAI.invoke)
        """
        try:
            # Clean and prepare prompt
            if isinstance(prompt, (list, tuple)):
                # Handle message format
                prompt_text = prompt[0] if len(prompt) > 0 else ""
            else:
                prompt_text = str(prompt)
            
            # Truncate prompt if too long (preserve the question at the end)
            if len(prompt_text) > self.max_input_length:
                # Try to keep the question by finding it after "Question:" or "Q:"
                question_markers = ["Question:", "Q:"]
                question_start = -1
                
                for marker in question_markers:
                    pos = prompt_text.rfind(marker)
                    if pos != -1:
                        question_start = pos
                        break
                
                if question_start != -1 and question_start > self.max_input_length // 2:
                    # Keep some context + the question
                    context_budget = self.max_input_length - (len(prompt_text) - question_start)
                    if context_budget > 50:  # Minimum context
                        prompt_text = prompt_text[:context_budget] + "..." + prompt_text[question_start:]
                    else:
                        # Just keep the question part
                        prompt_text = prompt_text[question_start:]
                else:
                    # Simple truncation
                    prompt_text = prompt_text[:self.max_input_length] + "..."
            
            # Tokenize input
            inputs = self.tokenizer(
                prompt_text, 
                return_tensors="pt", 
                max_length=512, 
                truncation=True,
                padding=True
            )
            
            # Move to same device as model
            if torch.cuda.is_available() and self.model.device.type == 'cuda':
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    max_new_tokens=self.max_new_tokens,
                    temperature=self.temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode response
            full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the new content (after the prompt)
            response_text = full_response[len(prompt_text):].strip()
            
            # Clean up response
            response_text = self._clean_response(response_text)
            
            return LocalChatResponse(content=response_text)
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return LocalChatResponse(content=f"Error: {str(e)}")
    
    def _clean_response(self, response: str) -> str:
        """Clean up the generated response"""
        # Remove excessive whitespace
        response = response.strip()
        
        # Remove repetitive patterns (common in small models)
        lines = response.split('\n')
        unique_lines = []
        seen_lines = set()
        
        for line in lines:
            line = line.strip()
            if line and line not in seen_lines:
                unique_lines.append(line)
                seen_lines.add(line)
            elif line and len(unique_lines) > 0:
                # Stop at first repetition
                break
        
        response = '\n'.join(unique_lines)
        
        # Remove repeated question patterns
        question_patterns = ["Question:", "Q:"]
        for pattern in question_patterns:
            if response.count(pattern) > 1:
                # Keep only content before the second occurrence
                parts = response.split(pattern)
                response = parts[0].strip()
                break
        
        # Stop at natural break points if response is too long
        if len(response) > 400:
            # Try to cut at sentence boundary
            sentences = response.split('. ')
            if len(sentences) > 1:
                response = '. '.join(sentences[:-1]) + '.'
        
        # Remove incomplete sentences at the end
        if response and not response.endswith(('.', '!', '?', ':')):
            words = response.split()
            if len(words) > 3:  # Keep response if it's reasonably long
                # Find last complete sentence
                last_period = response.rfind('.')
                last_excl = response.rfind('!')
                last_quest = response.rfind('?')
                last_punct = max(last_period, last_excl, last_quest)
                
                if last_punct > len(response) * 0.4:  # If we find punctuation in latter part
                    response = response[:last_punct + 1]
        
        return response


class LocalChatResponse:
    """Response object compatible with ChatOpenAI response"""
    def __init__(self, content: str):
        self.content = content


def create_local_chat_model(model_name: str = "gpt2") -> LocalChatModel:
    """Factory function to create a local chat model"""
    return LocalChatModel(model_name=model_name)


# Test function
def test_local_model():
    """Test the local model wrapper"""
    print("🔬 Testing LocalChatModel...")
    
    try:
        # Create model
        model = create_local_chat_model("gpt2")
        
        # Test prompts
        test_prompts = [
            "What is machine learning?",
            "Explain the concept of neural networks in simple terms.",
            "What are the benefits of using Python for data science?"
        ]
        
        for prompt in test_prompts:
            print(f"\n💭 Prompt: {prompt}")
            response = model.invoke(prompt)
            print(f"🤖 Response: {response.content}")
        
        print("\n✅ LocalChatModel test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


if __name__ == "__main__":
    test_local_model()