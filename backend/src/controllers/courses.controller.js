const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

// Ensure public_courses table exists on boot
const setupTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_courses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100),
        name VARCHAR(255),
        campus VARCHAR(100),
        open_from VARCHAR(50),
        open_until VARCHAR(50),
        status VARCHAR(50),
        document_url TEXT
      );
    `);
    
    // Seed initial data if empty
    const check = await pool.query('SELECT COUNT(*) FROM public_courses');
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO public_courses (category, name, campus, open_from, open_until, status) VALUES 
        ('Doctoral (PhD)', 'Doctor of Philosophy (PhD) in Chemistry', 'Bangalore Central Campus', '03-Mar-2026', '14-Jun-2026', 'Open'),
        ('Doctoral (PhD)', 'Ph.D. in Computer Science', 'Bangalore Central Campus', '03-Mar-2026', '14-Jun-2026', 'Open'),
        ('Doctoral (PhD)', 'Ph.D. in Business Administration', 'Bangalore Central Campus', '03-Mar-2026', '14-Jun-2026', 'Open'),
        
        ('Post Graduate', 'Master of Computer Applications (MCA)', 'Bangalore Central Campus', '15-Mar-2026', '20-Jul-2026', 'Open'),
        ('Post Graduate', 'Master of Business Administration (MBA)', 'Bangalore Central Campus', '15-Mar-2026', '20-Jul-2026', 'Open'),
        ('Post Graduate', 'MSc. Data Science', 'Bangalore Central Campus', '15-Mar-2026', '20-Jul-2026', 'Open'),
        
        ('Under Graduate', 'BSc. Computer Science', 'Bangalore Central Campus', '10-Apr-2026', '30-Aug-2026', 'Open'),
        ('Under Graduate', 'B.Tech in Artificial Intelligence', 'Bangalore Central Campus', '10-Apr-2026', '30-Aug-2026', 'Open'),
        ('Under Graduate', 'Bachelor of Business Administration (BBA)', 'Bangalore Central Campus', '10-Apr-2026', '30-Aug-2026', 'Open'),
        
        ('Online Degree', 'Online MBA (Data Science)', 'Virtual Campus', '01-Jan-2026', '31-Dec-2026', 'Rolling'),
        ('Online Degree', 'Online BCA (Bachelor of Computer Applications)', 'Virtual Campus', '01-Jan-2026', '31-Dec-2026', 'Rolling'),
        ('Online Degree', 'Online Master of Commerce (M.Com)', 'Virtual Campus', '01-Jan-2026', '31-Dec-2026', 'Rolling');
      `);
      console.log("Public Courses seeded successfully.");
    }
  } catch (error) {
    console.error("Public Course table setup failed:", error);
  }
};
setupTable();

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public_courses ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { category, name, campus, open_from, open_until, status } = req.body;
    let document_url = null;
    
    if (req.file) {
      document_url = `/uploads/courses/${req.file.filename}`;
    }

    const newCourse = await pool.query(
      "INSERT INTO public_courses (category, name, campus, open_from, open_until, status, document_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [category, name, campus, open_from, open_until, status, document_url]
    );

    res.status(201).json(newCourse.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, campus, open_from, open_until, status } = req.body;
    
    // Find existing course
    const existing = await pool.query("SELECT * FROM public_courses WHERE id = $1", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    let document_url = existing.rows[0].document_url;
    
    // If new file attached, replace old one
    if (req.file) {
      document_url = `/uploads/courses/${req.file.filename}`;
    }

    const updated = await pool.query(
      "UPDATE public_courses SET category = $1, name = $2, campus = $3, open_from = $4, open_until = $5, status = $6, document_url = $7 WHERE id = $8 RETURNING *",
      [category, name, campus, open_from, open_until, status, document_url, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM public_courses WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully", course: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
