# Q&A Preparation: Institutional Automation System (IAS)

*This guide prepares you for common technical and conceptual questions from an invigilator.*

---

## 1. Technical Stack Questions

**Q: Why use PostgreSQL and Supabase together?**
*   **A:** PostgreSQL provides powerful relational data handling, while Supabase offers real-time subscription support and simplifies database hosting and auth. This allows for rapid development without sacrificing the reliability of SQL.

**Q: Why did you separate the AI service into a FastAPI Python server?**
*   **A:** Language-specific advantages. Node.js is excellent for real-time APIs and I/O-heavy frontend interactions, while Python (FastAPI) is the industry standard for AI/ML due to its massive library support (Scikit-Learn, FAISS, PyPDF, Gemini SDK).

---

## 2. AI & Machine Learning Questions

**Q: Explain RAG (Retrieval Augmented Generation) in your quiz generator.**
*   **A:** Standard LLMs (like Gemini) might hallucinate or miss niche textbook details. In our RAG system:
    1.  **Extraction:** We convert the PDF into text.
    2.  **Chunking:** We split text into small pieces.
    3.  **Embedding:** We use a FAISS vector store to index these pieces.
    4.  **Retrieval:** When generating a quiz, we "search" for relevant text chunks and "inject" them into the Gemini prompt as context. This makes the quiz accurate to the uploaded material.

**Q: How does the Student Risk Prediction model work?**
*   **A:** It uses a **Logistic Regression** model (supervised learning). We trained it on features like `attendance_percentage`, `internal_marks`, `assignment_scores`, and `previous_gpa`. It outputs a probability (0-1) where >0.7 is "At-Risk". We used Scikit-Learn for training and Joblib for model persistence.

---

## 3. Architecture & Security Questions

**Q: How are you managing user authentication?**
*   **A:** We use **JWT (JSON Web Tokens)**. When a user logs in, the backend validates credentials (using Bcrypt for hashing) and issues a signed token. This token is stored in the frontend's local storage and sent in every API request header for validation in our `authMiddleware`.

**Q: How do you handle role-based access?**
*   **A:** Each user has a `role` field (Student, Faculty, Admin). Our backend routes have middleware that checks the role in the JWT before allowing access to specific operations (e.g., only Faculty can lock attendance).

---

## 4. Challenges & Future Scope

**Q: What was the biggest challenge you faced?**
*   **A:** *Typical response:* Handling PDF extraction and grounding the AI model in that text without exceeding the prompt's token limit. We solved this by using text chunking and vector search (FAISS).

**Q: How would you scale this to 10,000+ students?**
*   **A:** 
    1.  **Caching:** Use Redis for frequently accessed dashboard metrics.
    2.  **Database:** Vertical or horizontal scaling of the PostgreSQL instance.
    3.  **Async Processing:** Moving textbook processing tasks to a message queue like RabbitMQ or Celery to prevent blocking the UI.
