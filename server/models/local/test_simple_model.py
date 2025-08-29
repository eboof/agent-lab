#!/usr/bin/env python3
"""
Test with a proven small model for RAG - GPT-2 or DialoGPT
"""
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import time

def test_gpt2_small():
    model_name = "gpt2"  # 124M parameters, very reliable
    
    print(f"📥 Loading {model_name}...")
    start_time = time.time()
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token
        print("✅ Tokenizer loaded")
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True
        )
        
        load_time = time.time() - start_time
        param_count = sum(p.numel() for p in model.parameters()) / 1e6
        print(f"✅ Model loaded in {load_time:.1f}s")
        print(f"📊 Parameters: {param_count:.1f}M")
        
        # Test RAG-style prompts
        print("\n🧠 Testing inference...")
        test_prompts = [
            "Question: What is machine learning?\nAnswer:",
            "Context: Python is a programming language.\nQuestion: What is Python?\nAnswer:",
            "Based on the information provided, the main concept is"
        ]
        
        for prompt in test_prompts:
            print(f"\n💭 Prompt: '{prompt[:50]}...'")
            
            # Tokenize
            inputs = tokenizer(prompt, return_tensors="pt", max_length=100, truncation=True)
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    max_new_tokens=30,
                    temperature=0.8,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id,
                    attention_mask=inputs.attention_mask
                )
            
            # Decode
            full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            response = full_response[len(prompt):].strip()
            print(f"🤖 Response: {response}")
        
        print(f"\n✅ {model_name} test completed successfully!")
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_distilgpt2():
    """Test DistilGPT-2 - smaller and faster version"""
    model_name = "distilgpt2"  # 82M parameters
    
    print(f"\n📥 Loading {model_name}...")
    start_time = time.time()
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(model_name)
        
        load_time = time.time() - start_time
        param_count = sum(p.numel() for p in model.parameters()) / 1e6
        print(f"✅ DistilGPT-2 loaded in {load_time:.1f}s ({param_count:.1f}M params)")
        
        # Quick test
        prompt = "The benefits of using small language models include"
        inputs = tokenizer(prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_new_tokens=25,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"🤖 Test: {response}")
        
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ DistilGPT-2 Error: {e}")
        return None, None

if __name__ == "__main__":
    print("🔬 Testing small models for RAG integration...\n")
    
    # Test GPT-2
    gpt2_model, gpt2_tokenizer = test_gpt2_small()
    
    # Test DistilGPT-2
    distil_model, distil_tokenizer = test_distilgpt2()
    
    if gpt2_model and distil_model:
        print("\n✅ Both models work! Ready for RAG integration.")
    elif gpt2_model:
        print("\n✅ GPT-2 works! Ready for RAG integration.")
    elif distil_model:
        print("\n✅ DistilGPT-2 works! Ready for RAG integration.")
    else:
        print("\n❌ No models worked successfully.")