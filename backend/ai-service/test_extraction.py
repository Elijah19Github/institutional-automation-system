import os
from pdf_reader import extract_pdf_text
from text_chunker import split_text
from vector_store import search_context

import sys
sys.stdout.reconfigure(encoding='utf-8')

pdf_path = "uploads/R20CSE2202-OPERATING-SYSTEMS.pdf"

if os.path.exists(pdf_path):
    print(f"\n--- [1] Extracting raw text from {pdf_path}... ---")
    raw_text = extract_pdf_text(pdf_path)
    print(f"Total raw characters extracted: {len(raw_text)}")
    print(f"Preview of raw text (first 500 chars):\n{raw_text[:500]}...\n")

    print("\n--- [2] Splitting text into chunks... ---")
    chunks = split_text(raw_text)
    print(f"Total chunks generated: {len(chunks)}")
    if len(chunks) > 0:
        print(f"\nPreview of Chunk 1:\n{'-'*40}\n{chunks[0]}\n{'-'*40}\n")
        print(f"Preview of Chunk 2:\n{'-'*40}\n{chunks[1]}\n{'-'*40}\n")
    
    print("\n--- [3] Testing RAG FAISS Vector Search for 'Virtual Memory' ---")
    context = search_context("Virtual Memory")
    print(f"RAG Retrieved Context (fed to Gemini):\n{'-'*40}\n{context}\n{'-'*40}\n")
else:
    print("Could not find the uploaded PDF.")
