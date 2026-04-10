import os
from dotenv import load_dotenv

# Load the .env from the parent backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

# Ensure we use the GEMINI_API_KEY and keep GOOGLE_API_KEY in sync for the SDK
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    os.environ["GOOGLE_API_KEY"] = api_key
    # Debug print (masked) to verify key in terminal
    print(f"AI Service using key: {api_key[:8]}...{api_key[-4:]}")

from fastapi import FastAPI, Form, File, UploadFile
from pydantic import BaseModel
from google import genai
from pypdf import PdfReader
import requests
import json
import re
from pdf_reader import extract_pdf_text
from text_chunker import split_text
from vector_store import create_vector_store, search_context
from context_builder import build_context
import joblib
import psycopg2
from sklearn.linear_model import LogisticRegression # for type hinting if needed

client = genai.Client(api_key=api_key)

app = FastAPI()

# Load trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)

DB_URL = os.getenv("DATABASE_URL")

def get_db_conn():
    return psycopg2.connect(DB_URL)

def predict_risk_logic(attendance, marks, assignment, prev_perf):
    if model is None:
        return 0, 0.0
    features = [[attendance, marks, assignment, prev_perf]]
    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features)[0][1])
    return prediction, probability

@app.get("/")
def home():
    return {"message": "Institutional AI Service Running", "model_loaded": model is not None}

@app.get("/api/ai/dashboard-risk-distribution")
def get_risk_distribution():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Fetch features for all students
        cur.execute("""
            SELECT 
                s.id,
                COALESCE(AVG(CASE WHEN ar.status = 'P' THEN 100 ELSE 0 END), 0) as attendance,
                COALESCE(AVG(m.score), 0) as marks,
                COALESCE(AVG(sub.score), 0) as assignment,
                COALESCE(AVG(res.gpa), 0) * 25 as prev_perf
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            LEFT JOIN marks m ON s.id = m.student_id
            LEFT JOIN submissions sub ON s.id = sub.student_id
            LEFT JOIN results res ON s.id = res.student_id
            GROUP BY s.id
        """)
        
        students = cur.fetchall()
        
        at_risk = 0
        medium = 0
        safe = 0
        
        for s in students:
            # att, marks, assign, prev
            pred, prob = predict_risk_logic(float(s[1]), float(s[2]), float(s[3]), float(s[4]))
            
            if prob > 0.7:
                at_risk += 1
            elif prob > 0.4:
                medium += 1
            else:
                safe += 1
        
        cur.close()
        conn.close()
        
        return {
            "at_risk_students": at_risk,
            "risk_distribution": {
                "high": at_risk,
                "medium": medium,
                "safe": safe
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ai/predict-student-risk/{student_id}")
def predict_student_risk(student_id: str):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COALESCE(AVG(CASE WHEN a.status = 'P' THEN 100 ELSE 0 END), 0) as attendance,
                COALESCE(AVG(m.score), 0) as marks,
                COALESCE(AVG(sub.score), 0) as assignment,
                COALESCE(AVG(res.gpa), 0) * 25 as prev_perf
            FROM students s
            LEFT JOIN attendance_records a ON s.id = a.student_id
            LEFT JOIN marks m ON s.id = m.student_id
            LEFT JOIN submissions sub ON s.id = sub.student_id
            LEFT JOIN results res ON s.id = res.student_id
            WHERE s.id = %s
            GROUP BY s.id
        """, (student_id,))
        
        row = cur.fetchone()
        if not row:
            return {"error": "Student not found"}
            
        pred, prob = predict_risk_logic(float(row[0]), float(row[1]), float(row[2]), float(row[3]))
        
        reasons = []
        if float(row[0]) < 60: reasons.append("Low attendance")
        if float(row[1]) < 50: reasons.append("Poor academic performance")
        if float(row[2]) < 50: reasons.append("Missing assignments")
        
        cur.close()
        conn.close()
        
        return {
            "prediction": pred,
            "probability": prob,
            "risk_level": "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Safe",
            "reasons": reasons
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-textbook")
async def upload_textbook(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"

    with open(path, "wb") as f:
        f.write(await file.read())

    text = extract_pdf_text(path)
    chunks = split_text(text)
    create_vector_store(chunks)

    return {"message": "Textbook processed successfully"}

@app.post("/api/quiz/generate")
def generate_quiz(
    course_name: str = Form("General"),
    subject: str = Form("General"),
    topic: str = Form("General"),
    difficulty: str = Form("Medium"),
    num_questions: int = Form(5),
    content: str = Form(""),
    pdf: UploadFile = File(None)
):
    pdf_text = ""
    if pdf is not None and pdf.filename:
        try:
            reader = PdfReader(pdf.file)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    pdf_text += extracted + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")

    # Process new PDF on the fly if uploaded during generation (optional RAG add)
    if pdf_text:
        try:
            temp_chunks = split_text(pdf_text)
            create_vector_store(temp_chunks)
        except Exception as e:
            print("Error adding on-the-fly PDF to vector store:", e)

    rag_context = search_context(topic)
    
    # Merge FAISS RAG Context with Live Internet Search Engines
    rich_context = build_context(topic, rag_context)
    combined_content = f"Syllabus Content:\n{content}\n{rich_context}"

    prompt = f"""
    Generate {num_questions} multiple choice questions.

    Course: {course_name}
    Subject: {subject}
    Topic: {topic}
    Difficulty: {difficulty}

    Use this study material:
    {combined_content}

    Return ONLY a JSON array of objects with the exact following structure:
    [
      {{
        "question": "Question text here",
        "option_a": "Option A text",
        "option_b": "Option B text",
        "option_c": "Option C text",
        "option_d": "Option D text",
        "correct_answer": "a", 
        "explanation": "Explanation for the correct answer"
      }}
    ]

    Notes on correct_answer: Must be exactly "a", "b", "c", or "d".
    DO NOT stringify the JSON. Return proper JSON. DO NOT wrap with markdown blocks like ```json.
    """

    try:
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt,
        )
        text = response.text
        # Clean up possible markdown wrappers
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"```\s*$", "", text)
        quiz_json = json.loads(text.strip())
        return {"quiz": quiz_json}
    except Exception as e:
        error_msg = str(e)
        print(f"Error during Gemini generation or JSON parsing: {error_msg}")
        
        # INVINCIBLE FALLBACK: Catch key expiry or quota issues during demo
        if "expired" in error_msg.lower() or "400" in error_msg or "403" in error_msg:
            print("🚀 API issues detected. Activating Invincible Demo Fallback...")
            fallback_quiz = []
            for i in range(1, num_questions + 1):
                fallback_quiz.append({
                    "question": f"Sample question {i} about {topic} (Demo Fallback Mode)",
                    "option_a": f"Specific to {course_name}",
                    "option_b": f"Focus on {subject}",
                    "option_c": "The universally correct demo answer",
                    "option_d": f"Difficulty level: {difficulty}",
                    "correct_answer": "c",
                    "explanation": f"This is an automated fallback placeholder for '{topic}' because the live AI service returned: {error_msg[:50]}..."
                })
            return {"quiz": fallback_quiz}

        return {"error": "Failed to generate valid quiz format. Try again.", "details": error_msg}

