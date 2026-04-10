# Advanced AI Architecture & Engineering Specification

This document provides a deep, code-level architectural breakdown of the Artificial Intelligence microservices within the Smart Institutional Automation System. The AI architecture operates as an isolated Python FastApi microservice (`backend/ai-service`) that seamlessly interfaces with the Node.js ERP backend, utilizing **Scikit-Learn**, **Google GenAI (Gemini)**, **LangChain**, **FAISS Vector Databases**, and **HuggingFace Transformers**.

The system is structurally divided into two revolutionary engines: the **Hyper-Contextual RAG Quiz Generator** and the **Predictive Risk Analytics Engine**.

---

## 1. Hyper-Contextual RAG Quiz Generator

The Quiz Generator goes beyond simple Prompt Engineering. It utilizes a highly advanced Retrieval-Augmented Generation (RAG) pipeline that fuses locally indexed textbook data with live internet scraping to guarantee comprehensive and syllabus-accurate multiple-choice assessments.

### Core Technology Stack
- **API Framework**: FastAPI (`main.py`)
- **Large Language Model (LLM)**: Google Gemini 2.5 Flash
- **Orchestration**: LangChain Framework
- **Vector Database**: FAISS (Facebook AI Similarity Search)
- **Embedding Model**: HuggingFace `all-MiniLM-L6-v2` (`Sentence-Transformers`)
- **Internet Scrapers**: Custom Wikipedia, DuckDuckGo/Web, and GeeksforGeeks query scrapers.

### The RAG Pipeline: Step-by-Step

#### Step A: Data Ingestion & Chunking (`pdf_reader.py` & `text_chunker.py`)
When a faculty member uploads a textbook via `/upload-textbook`, the system executes mathematical chunking.
1. **PyPDF** strips raw, unformatted text strings from the raw binary PDF file.
2. The context is passed into LangChain's `RecursiveCharacterTextSplitter`.
3. **Engineering Specs**: The splitter is rigorously tuned to a `chunk_size` of **1000 characters** with a `chunk_overlap` of **200 characters**. This overlap ensures that semantic meaning is not abruptly severed if a critical concept lands on the border of a chunk.

#### Step B: Vectorization & Storage (`embeddings.py` & `vector_store.py`)
1. The chunks are passed through a local HuggingFace embedding pipeline utilizing the `sentence-transformers/all-MiniLM-L6-v2` model. This assigns a high-dimensional mathematical vector (an array of floats) to each textual chunk based on its semantic meaning.
2. These vectors are inserted into a **FAISS** index (`faiss_index` directory). FAISS allows for hyper-fast, localized nearest-neighbor spatial searches without relying on expensive cloud-based vector databases like Pinecone.

#### Step C: The Multi-Stream Context Builder (`context_builder.py`)
When a quiz is requested on a specific `topic` (e.g., "Linked Lists"), the engine does not just query the textbook. It executes a multi-stream conceptual gathering phase:
1. **Local FAISS Search**: Queries the FAISS database to pull the top 5 chunks (`k=5`) from the textbook that mathematically align closest with the topic.
2. **Wikipedia Engine**: Hits the Wikipedia API to retrieve the globally accepted encyclopedia summary of the topic.
3. **Web Search**: Executes a live internet HTTP search to pull modern context.
4. **Educational Scraper**: Specifically scrapes `GeeksforGeeks` to capture how the topic is structured in academic/interview scenarios.
5. All four data streams are concatenated into a massive **Hyper-Context Block**.

#### Step D: Generation & Validation (`main.py`)
1. The huge context block is injected directly into a highly engineered Prompt Template designed for the **Gemini 2.5 Flash** model. 
2. The Prompt enforces strict systemic constraints:
   - Must output an exact JSON array of objects.
   - Keys must specifically match: `"question"`, `"option_a"`, `"option_b"`, `"option_c"`, `"option_d"`, `"correct_answer"`, and `"explanation"`.
   - The correct answer must literally be restricted to `"a"`, `"b"`, `"c"`, or `"d"`.
3. A Regex validation layer scrubs the LLM output, aggressively removing markdown artifacts (like ` ```json ` wrappers) to prevent frontend JSON parsing crashes. The pristine JSON is deployed straight to the React frontend.

---

## 2. Predictive AI Risk Analytics Engine

The Risk Engine serves as a proactive defense mechanism against student dropout and academic failure. Instead of relying on gut feelings, it employs continuous Machine Learning over the live PostgreSQL database.

### Core Technology Stack
- **Machine Learning**: Scikit-Learn (`LogisticRegression`)
- **Data Engineering**: Pandas (DataFrames), `psycopg2` (PostgreSQL adapter)
- **Model Storage**: Joblib (`risk_model.pkl`)

### The Predictive Pipeline: Step-by-Step

#### Step A: The Training Phase (`train_risk_model.py`)
The system learns what "failure" looks like by analyzing historical metrics directly from the DB.
1. The script uses raw SQL aggregations to calculate four primary pillars for every student:
   - **Attendance Index**: Averaged historical presence.
   - **Marks Index**: Smoothed quiz and test scores.
   - **Assignment Index**: Submission track records.
   - **Previous GPA**: Normalized on a 1-100 scale (e.g., `GPA * 25`).
2. **Heuristic Labeling**: It injects a harsh logical constraint to establish ground truth. If a student's `attendance < 60%` OR `marks < 50%`, the Pandas DataFrame forces their target label (`risk`) to `1` (At Risk). Otherwise, `0`.
3. **Logistic Regression Fitting**: Scikit-Learn fits a mathematically calibrated logistic curve across these 4 dimensions against the `risk` label. Logistic Regression is utilized specifically because its Sigmoid function outputs a *probability curve* (0.0 to 1.0) rather than a rigid binary guess.
4. The calibrated model is serialized and written to disk as `risk_model.pkl`.

#### Step B: Live Probability Assessment (`main.py`)
1. When a faculty clicks the "Analyze" button, a request is bridged to `/api/ai/predict-student-risk/{student_id}`.
2. The system fetches the student's *live* unified data array (current attendance run rate, current test averages).
3. The array is submitted to `model.predict_proba()`, which extrapolates against the historical math weighting and spits out an exact decimal probability (e.g., `0.854`).

#### Step C: The Output Mapping Layer
To make the raw math useful to humans, the API wraps the probability in a UI-ready data packet:
- **Decision Boundaries**:
  - `Probability > 0.70` → Set `risk_level` to **"High"**.
  - `Probability > 0.40` → Set `risk_level` to **"Medium"**.
  - Otherwise → **"Safe"**.
- **Reason Mapping**: It applies simplistic bounds to the live array to generate an array of string `reasons` (e.g., If current attendance < 60, append *"Low attendance"* string).
- This guarantees the React Frontend automatically shifts CSS styling (Red vs Green gauges) and prints actionable text for the faculty viewing the dashboard.
