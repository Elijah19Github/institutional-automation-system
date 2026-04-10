import pandas as pd
import psycopg2
from sklearn.linear_model import LogisticRegression
import joblib
import os
from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_URL = os.getenv("DATABASE_URL")

def train():
    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(DB_URL)
        
        # Query features for all students
        # We join students with attendance, marks, submissions, and results
        query = """
        SELECT 
            s.id,
            COALESCE(AVG(CASE WHEN a.status = 'present' THEN 100 ELSE 0 END), 0) as attendance,
            COALESCE(AVG(m.score), 0) as marks,
            COALESCE(AVG(sub.score), 0) as assignment,
            COALESCE(AVG(res.gpa), 0) * 25 as prev_perf -- Normalize GPA (0-4.0) to 100 scale
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        LEFT JOIN marks m ON s.id = m.student_id
        LEFT JOIN submissions sub ON s.id = sub.student_id
        LEFT JOIN results res ON s.id = res.student_id
        GROUP BY s.id
        """
        
        print("Extracting features for training...")
        df = pd.read_sql(query, conn)
        
        if df.empty:
            print("No data found for training.")
            return

        # 🧠 Generate Risk Label (Initial training logic)
        # IF attendance < 60 OR marks < 50 → risk = 1 (At Risk)
        df['risk'] = ((df['attendance'] < 60) | (df['marks'] < 50)).astype(int)
        
        X = df[['attendance', 'marks', 'assignment', 'prev_perf']]
        y = df['risk']
        
        print(f"Training model with {len(df)} samples...")
        model = LogisticRegression()
        model.fit(X, y)
        
        # Save model
        model_path = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
        joblib.dump(model, model_path)
        
        # Save a sample CSV for reference
        df.to_csv(os.path.join(os.path.dirname(__file__), "student_data_sample.csv"), index=False)
        
        print(f"Model trained and saved to {model_path} ✅")
        
        conn.close()
    except Exception as e:
        print(f"Error training model: {e}")

if __name__ == "__main__":
    train()
