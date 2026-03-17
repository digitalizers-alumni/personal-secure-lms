#!/usr/bin/env python3
"""
Download BGE-M3 model from Hugging Face
This should be run once to cache the model locally
"""

import os
from sentence_transformers import SentenceTransformer

def main():
    # Create models directory
    models_dir = "./data/models"
    os.makedirs(models_dir, exist_ok=True)
    
    # Set cache directory
    os.environ["HUGGINGFACE_HOME"] = models_dir
    
    print("Downloading BGE-M3 model")
    print("This may take a few minutes (~1.5GB)")
    print(f"Cache directory: {models_dir}\n")
    
    try:
        model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        print("Model downloaded successfully!")
        print(f"Model: {model}\n")
        
        # Quick test
        print("Testing model with sample text")
        test_text = "This is an embedding test"
        embedding = model.encode([test_text])
        print(f"Generated embedding with {embedding.shape[1]} dimensions\n")
        
        return 0
        
    except Exception as e:
        print(f"Error downloading model: {e}\n")
        print("Troubleshooting:")
        print("  1. Check internet connection")
        print("  2. Ensure Hugging Face is accessible")
        print("  3. Try again later (HF might be rate-limiting)")
        return 1

if __name__ == "__main__":
    exit(main())
