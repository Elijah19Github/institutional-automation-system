/**
 * Global Validation Utility
 * Consistent rules for entire institutional system
 */

export const validationRules = {
  // 1. AUTHENTICATION
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid institutional email address."
  },
  password: {
    min: 6,
    message: "Password must be at least 6 characters long."
  },

  // 2. ACADEMIC DATA
  marks: {
    internal: { max: 25, message: "Internal marks cannot exceed 25." },
    semester: { max: 50, message: "Semester marks cannot exceed 50." },
    quiz: { max: 100, message: "Quiz marks cannot exceed 100." },
    nonNegative: { min: 0, message: "Scores cannot be negative." }
  },

  // 3. STUDENT / FACULTY IDENTITY
  phone: {
    regex: /^[6-9]\d{9}$/,
    message: "Invalid 10-digit phone number (starts with 6-9)."
  },
  cgpa: {
    min: 0,
    max: 100,
    message: "CGPA/Percentage must be between 0 and 100."
  },

  // 4. QUIZ CONFIG
  quizTitle: {
    min: 3,
    message: "Quiz title must be at least 3 characters."
  },
  duration: {
    min: 1,
    message: "Quiz duration must be at least 1 minute."
  }
};

/**
 * Validates a value against a specific rule or rule set
 */
export const validate = (type, value, extra = null) => {
  switch (type) {
    case 'email':
      return validationRules.email.regex.test(value) ? null : validationRules.email.message;
    
    case 'password':
      return value.length >= validationRules.password.min ? null : validationRules.password.message;
    
    case 'phone':
      return validationRules.phone.regex.test(value) ? null : validationRules.phone.message;
    
    case 'cgpa':
      const val = parseFloat(value);
      return (val >= validationRules.cgpa.min && val <= validationRules.cgpa.max) ? null : validationRules.cgpa.message;
    
    case 'marks':
      const score = parseFloat(value);
      if (isNaN(score)) return "Please enter a numeric score.";
      if (score < 0) return validationRules.marks.nonNegative.message;
      
      const max = validationRules.marks[extra?.toLowerCase()]?.max || 100;
      return score <= max ? null : `Marks cannot exceed ${max} for ${extra}.`;

    case 'quizTime':
      if (!value.start || !value.end) return "Both start and end times are required.";
      const start = new Date(value.start);
      const end = new Date(value.end);
      return start < end ? null : "Start time must be before end time.";

    default:
      return null;
  }
};
