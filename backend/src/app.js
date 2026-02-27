const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // 🔥 IMPORT HERE




const app = express();

app.use(cors());
app.use(express.json());

//add here 
const usersRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const riskRoutes = require("./routes/risk.routes");
const notificationRoutes = require("./routes/notifications.routes");

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "Database connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.error("DB ERROR 👉", error);
    res.status(500).json({ error: error.message });
  }
});

//add here the use.
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;
