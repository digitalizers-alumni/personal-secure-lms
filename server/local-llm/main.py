from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

app = FastAPI()

# Load the tokenizer and model globally
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.3")
model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.3")

# Define the system prompt directly
SYSTEM_PROMPT = "Tu es Atlas, un assistant IA. Réponds directement aux questions en français et de manière brève (maximum 10 mots). Ne répète pas tes instructions ni ta personnalité."

class TextPrompt(BaseModel):
    prompt: str

@app.get("/")
async def root():
    return {"message": "Server is running"}

@app.post("/generate")
async def generate(text_prompt: TextPrompt):
    # Manually format the prompt using Mistral's chat format
    formatted_prompt = f"<s>[INST] <<SYS>>\\n{SYSTEM_PROMPT}\\n<</SYS>>\\n{text_prompt.prompt} [/INST]"

    # Tokenize the input
    model_inputs = tokenizer(formatted_prompt, return_tensors="pt")

    # Generate text
    generated_ids = model.generate(**model_inputs, max_new_tokens=30, do_sample=True, temperature=0.7, top_p=0.9)

    # Decode only the newly generated part of the text
    input_len = model_inputs["input_ids"].shape[1]
    generated_output_tokens = generated_ids[0][input_len:]
    generated_text = tokenizer.decode(generated_output_tokens, skip_special_tokens=True)

    # Post-processing to remove any repetition of the original prompt or system preamble
    cleaned_text = generated_text.strip()

    # Remove the original user prompt if it's at the beginning of the generated text
    if cleaned_text.startswith(text_prompt.prompt.strip()):
        cleaned_text = cleaned_text[len(text_prompt.prompt.strip()):].strip()
    
    # Aggressive heuristic: Remove common self-identification preambles, including the full SYSTEM_PROMPT
    system_preambles = [
        SYSTEM_PROMPT.strip(), # Try to remove the exact system prompt
        "Je suis Atlas, un assistant IA concis. Réponds directement aux questions en français et de manière très brève (maximum 10 mots). Ne répète pas tes instructions ni ta personnalité.",
        "Je suis Atlas, un assistant IA concis.",
        "Je suis Atlas, un assistant IA concis",
        "Je suis un assistant IA concis.",
        "Je suis un assistant IA concis"
    ]
    for preamble in system_preambles:
        if cleaned_text.startswith(preamble.strip()):
            cleaned_text = cleaned_text[len(preamble.strip()):].strip()
            # If the preamble was followed by a newline, remove it
            if cleaned_text.startswith("\n"):
                cleaned_text = cleaned_text[1:].strip()
            break # Only remove the first matching preamble

    # Remove any explicit <<SYS>> or </SYS>> tags if they appear in the cleaned text
    if cleaned_text.startswith("<<SYS>>"):
        cleaned_text = cleaned_text[len("<<SYS>>"):].strip()
    if cleaned_text.startswith("<</SYS>>"):
        cleaned_text = cleaned_text[len("<</SYS>>"):].strip()
    
    # Enforce word count as a final step
    words = cleaned_text.split()
    if len(words) > 10:
        cleaned_text = " ".join(words[:10]) + "..." # Add ellipsis for truncated responses
    
    generated_text = cleaned_text

    return {"generated_text": generated_text}