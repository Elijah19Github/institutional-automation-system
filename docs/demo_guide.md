# Demonstration Guide: Institutional Automation System (IAS)

*Follow this 3-4 minute demonstration sequence for maximum impact.*

---

## Pre-Demo Checklist (30 min before)
- [ ] **Backend Running:** `npm run dev` in `backend/`.
- [ ] **Frontend Running:** `npm run dev` in `frontend/`.
- [ ] **AI Service Running:** `uvicorn main:app --reload` (or similar) in `backend/ai-service/`.
- [ ] **Test PDFs Ready:** Have a 2-3 page PDF textbook/syllabus ready on your desktop.
- [ ] **Browser Tabs:** Clear all unrelated tabs. Zoom in slightly (110%) for better visibility.

---

## Step 1: Authentication & RBAC (30 seconds)
1.  **Start at the Login Page:** Briefly mention "Multi-role Support".
2.  **Login as Admin/Faculty:** Use your test credentials.
3.  **Visual Impact:** Show the sleek dashboard. Point out the navigation menu.

---

## Step 2: AI Dashboard & Risk Analysis (1 minute)
1.  **Direct Attention to "Student Risk Distribution":** Show the high/medium/safe charts.
2.  **Explain the "Why":** Mention how the backend uses a trained machine learning model to predict these values in real-time.
3.  **Student Search:** Search for a specific student and show their individual risk breakdown (e.g., "Reason: Low Attendance"). This demonstrates "Actionable Insights".

---

## Step 3: AI Quiz Generator (1.5 minutes) — *The "WOW" Moment*
1.  **Navigate to AI Quiz Generator:** Show the clean UI.
2.  **Upload a PDF:** Drag and drop your test PDF.
3.  **Process it:** Mention "RAG Extraction" while it's processing.
4.  **Generate Quiz:** Enter a topic (e.g., "Inheritance", "Photosynthesis", or whatever is in your PDF).
5.  **View Results:** Show the generated MCQs. Highlight the "Explanation" for the correct answer.
6.  **Key Point:** Explain that the AI "read" your PDF and didn't just guess.

---

## Step 4: Closing & UI Polish (30 seconds)
1.  **Toggle Dark/Light Mode (if available):** Show the modern look.
2.  **Responsive Check:** Quickly resize the browser to show it works on tablets/phones.
3.  **Conclusion:** "IAS isn't just about record-keeping; it's about using AI to actively improve education quality."

---

## Pro-Tips for the Presenter:
- **Don't just click; explain why:** Instead of saying "I click here," say "I am accessing the faculty dashboard to monitor student performance."
- **Handle errors gracefully:** If the AI takes 5 seconds to load, use that time to explain the complexity of RAG retrieval.
- **Maintain Eye Contact:** If presenting in person, look at the invigilators, not just the screen.
