import { useState } from "react";
import API from "../api/api";

function RiskDashboard() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState(null);

  const calculateRisk = async () => {
    try {
      const res = await API.post("/risk/calculate", {
        student_id: studentId,
      });
      setResult(res.data);
    } catch {
      alert("Risk calculation failed");
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>🧠 Academic Risk Prediction</h3>

      <input
        placeholder="Student UUID"
        onChange={(e) => setStudentId(e.target.value)}
      />
      <button onClick={calculateRisk}>Calculate Risk</button>

      {result && (
        <div style={{ marginTop: "10px" }}>
          <p>Attendance: {result.attendance}%</p>
          <p>Average Marks: {result.avgMarks}</p>
          <h4>
            Risk Level:{" "}
            <span style={{ color: result.risk === "HIGH" ? "red" : result.risk === "MEDIUM" ? "orange" : "green" }}>
              {result.risk}
            </span>
          </h4>
        </div>
      )}
    </div>
  );
}

export default RiskDashboard;
