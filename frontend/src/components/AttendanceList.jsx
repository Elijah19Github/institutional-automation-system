import { useEffect, useState } from "react";
import API from "../api/api";

function AttendanceList() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    API.get("/attendance")
      .then((res) => setRecords(res.data))
      .catch(() => alert("Failed to load attendance records"));
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>📊 Attendance Records</h3>
      <ul>
        {records.map((r, i) => (
          <li key={i}>
            {r.student} — {r.attendance_date} — {r.status ? "Present" : "Absent"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AttendanceList;
