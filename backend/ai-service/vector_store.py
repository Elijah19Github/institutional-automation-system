import os
try:
    from langchain_community.vectorstores import FAISS
except ImportError:
    from langchain.vectorstores import FAISS

from embeddings import get_embeddings

DB_PATH = "./faiss_index"

def create_vector_store(chunks):
    embeddings = get_embeddings()
    db = FAISS.from_texts(chunks, embeddings)
    db.save_local(DB_PATH)
    return db

def search_context(query):
    embeddings = get_embeddings()
    try:
        if not os.path.exists(DB_PATH):
            return ""
        # Allow dangerous deserialization is required by FAISS for local loads in newer Langchain versions
        db = FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)
        results = db.similarity_search(query, k=5)
        context = ""
        for r in results:
            context += r.page_content + "\n"
        return context
    except Exception as e:
        print("Vector DB Search Error:", e)
        return ""