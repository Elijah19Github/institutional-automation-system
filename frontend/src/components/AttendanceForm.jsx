import { useState } from "react";
import API from "../api/api";

function AttendanceForm() {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState(true);

  const submitAttendance = async () => {
    try {
      await API.post("/attendance", {
        student_id: studentId,
        course_id: courseId,
        attendance_date: date,
        status,
      });
      alert("Attendance marked successfully ✅");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to mark attendance ❌");
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>📘 Faculty Attendance Panel</h3>

      <input
        placeholder="Student UUID"
        onChange={(e) => setStudentId(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Course UUID"
        onChange={(e) => setCourseId(e.target.value)}
      />
      <br /><br />

      <input
        type="date"
        onChange={(e) => setDate(e.target.value)}
      />
      <br /><br />

      <select onChange={(e) => setStatus(e.target.value === "true")}>
        <option value="true">Present</option>
        <option value="false">Absent</option>
      </select>
      <br /><br />

      <button onClick={submitAttendance}>Save Attendance</button>
    </div>
  );
}

export default AttendanceForm;
