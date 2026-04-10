const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const courseController = require("../controllers/courses.controller");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/courses");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `course-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

router.get("/", courseController.getAllCourses);
router.post("/", upload.single("document"), courseController.createCourse);
router.put("/:id", upload.single("document"), courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
