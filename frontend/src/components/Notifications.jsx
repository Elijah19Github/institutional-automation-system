import { useEffect, useState } from "react";
import API from "../api/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    API.get("/notifications")
      .then(res => setNotifications(res.data))
      .catch(() => console.error("Failed to load notifications"));
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>🔔 Notifications</h3>

      {notifications.length === 0 && <p>No alerts</p>}

      <ul>
        {notifications.map((n, i) => (
          <li key={i}>
            <strong>{n.risk_level}</strong> — {n.message}
            <br />
            <small>{new Date(n.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
