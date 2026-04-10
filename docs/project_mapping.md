# 🗺️ Project Architecture & File Mapping

*Use this guide to quickly locate features and explain the "where and what" of your codebase to an invigilator.*

---

## 1. 🧠 AI & Machine Learning (`backend/ai-service/`)
*This directory contains the Python-based intelligence of the system.*

| Feature | Key File(s) | Description |
| :--- | :--- | :--- |
| **Quiz Generation** | `main.py` | Contains the `/api/quiz/generate` endpoint that uses Google Gemini to create MCQs. |
| **RAG (Retrieval)** | `vector_store.py` & `faiss_index/` | Handles indexing and searching textbook content using FAISS (Facebook AI Similarity Search). |
| **Hybrid Context** | `context_builder.py` | **Crucial:** Merges Textbook content with **Wikipedia**, **Web Search**, and **GeeksforGeeks** scraping for highly accurate results. |
| **PDF Processing** | `pdf_reader.py` & `text_chunker.py` | Extracts raw text from PDFs and splits it into small chunks for the RAG system. |
| **Risk Prediction** | `main.py` & `risk_model.pkl` | Uses a trained Logistic Regression model to predict if a student is "At-Risk" based on scores and attendance. |
| **Model Training** | `train_risk_model.py` | The original script used to train the `risk_model.pkl` using Scikit-Learn. |

---

## 2. ⚡ Core Backend (`backend/src/`)
*This is the Node.js/Express server that manages data and business logic.*

| Feature | Key File(s) | Description |
| :--- | :--- | :--- |
| **Entry Point** | `server.js` | Starts the server and connects to the database. |
| **Routes** | `routes/` (e.g., `attendanceRoutes.js`) | Defines the API endpoints (e.g., `/api/attendance`). |
| **Controllers** | `controllers/` | Contains the actual logic for database operations (Create, Read, Update, Delete). |
| **Authentication** | `middleware/authMiddleware.js` | Validates JWT tokens to ensure only logged-in users can access the system. |
| **Database Config** | `config/db.js` | Handles the connection to PostgreSQL/Supabase. |

---

## 3. 🎨 Frontend & UI (`frontend/src/`)
*The React application that provides the user interface.*

| Feature | Key File(s) | Description |
| :--- | :--- | :--- |
| **Dashboard** | `pages/Dashboard.jsx` | The main visual overview with charts and risk distribution. |
| **AI Quiz Tool** | `pages/AIQuizGenerator.jsx` | The UI for uploading PDFs and generating/taking quizzes. |
| **Attendance** | `pages/Attendance.jsx` | Where faculty can mark and lock attendance. |
| **Admissions** | `pages/Admissions.jsx` | Management view for processing student applications. |
| **Public Apply** | `pages/Apply.jsx` | The form that prospective students use to apply. |
| **Components** | `components/` | Reusable UI bits like Sidebar, Navbar, and specialized Charts. |

---

## 🔒 Environment & Configuration
*   **`.env`**: (Root & Backend) Stores sensitive API keys (GEMINI_API_KEY) and Database URLs. **Crucial: Do not show this file's contents in the presentation for security reasons.**
*   **`package.json`**: (Root/Backend/Frontend) Lists all dependencies like `express`, `react`, `fastapi`, and `scikit-learn`.

---

## 🚀 How to explain this to an Invigilator:
If they ask: *"Where is the RAG logic precisely?"*
**Answer:** *"The core retrieval logic is in `backend/ai-service/vector_store.py` where we use FAISS for vector search, and it's integrated into the generation endpoint in `main.py`."*

If they ask: *"Where do you handle security?"*
**Answer:** *"Security is managed in the backend-src-middleware folder via `authMiddleware.js`. It checks the JWT token on every protected request."*
