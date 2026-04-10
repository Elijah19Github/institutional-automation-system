# 13. SYSTEM TESTING

Testing is a critical phase in the development of the Intelligent Cloud-Based Institutional Automation and Decision Support System. It ensures that the system functions correctly, meets user requirements, and operates reliably under different conditions. The testing process helps identify and eliminate errors, improve system performance, and ensure data accuracy.

The system is tested at multiple levels, including individual modules and integrated components. Special attention is given to modules such as user authentication, attendance management, marks entry, quiz system, and AI-based risk prediction, as they directly impact academic decision-making.

## 13.1 TEST CASE EXECUTION REPORT

The following table summarizes the comprehensive test cases manually executed across all critical system modules. It validates core operational boundaries, including authentication workflows, academic data logging, quiz evaluations, and the artificial intelligence decision-support logic.

| Test ID | Module | Test Condition | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC01** | Authentication | Valid Administrator Login | Email: `admin@college.com`<br>Pwd: `admin123` | Secure redirection to the administrative dashboard | User authenticated and successfully redirected to dashboard | **Pass** |
| **TC02** | Authentication | Invalid Credentials | Email: `faculty@college.com`<br>Pwd: `wrongpass` | Access denied with an appropriate error message | "Invalid Email or Password" error prompt displayed | **Pass** |
| **TC03** | Authentication | Empty Login Fields Submission | Email: ` ` (blank)<br>Pwd: ` ` (blank) | Client-side validation prevents form submission | Validation prompt "Fields cannot be empty" displayed natively | **Pass** |
| **TC04** | Attendance | Mark Valid Daily Attendance | Select Student ID: `STU25MCA001`<br>Status: `Present` | Attendance status persisted precisely to the database | Record securely saved with immediate UI confirmation | **Pass** |
| **TC05** | Attendance | Duplicate Attendance Entry | Re-submitting attendance for logged Student ID at same date/hour | System rejects the entry to prevent redundancy | Prompt generated indicating "Attendance already logged for session" | **Pass** |
| **TC06** | Marks | Valid Academic Marks Entry | Student ID: `STU25MCA005`<br>Score: `85` (Max: 100) | Marks accepted and successfully committed | Marks correctly aggregated and stored in the database | **Pass** |
| **TC07** | Marks | Invalid Marks (Exceeding Maximum Boundary) | Student ID: `STU25MCA008`<br>Score: `150` (Max: 100) | Server rejects input due to logical constraint violation | Validation error triggered preventing submission | **Pass** |
| **TC08** | Marks | Negative Marks Entry Attempt | Student ID: `STU25MCA003`<br>Score: `-10` | Disallowed due to numerical boundary validation | UI prevents input of negative values; submission blocked | **Pass** |
| **TC09** | Quiz Module | Procedural Quiz Generation | Topic: `Database Systems`<br>Count: `10 Questions` | Output of valid localized quiz object interface | System generated and rendered the requested question set | **Pass** |
| **TC10** | Quiz Module | Standard Quiz Submission | Array of 10 fully completed answers | Accurate algorithmic evaluation of quiz score | Score parsed correctly, evaluated, and saved to profile | **Pass** |
| **TC11** | Quiz Module | Incomplete Quiz Submission | Array of 6 completed, 4 skipped answers | Skipped answers are accurately graded as zero (0) | System warned of blank responses; evaluated gracefully | **Pass** |
| **TC12** | AI Prediction | Low Risk Profile Calculation | Attendance: `95%`<br>Marks Average: `90/100` | AI engine categorizes student trajectory as "Low Risk" | ML classifier output exactly mapped to "Low Risk" | **Pass** |
| **TC13** | AI Prediction | Medium Risk Profile Calculation | Attendance: `72%`<br>Marks Average: `60/100` | AI engine escalates student trajectory to "Medium Risk" | ML classifier output mapped accurately to "Medium Risk" | **Pass** |
| **TC14** | AI Prediction | High Risk Profile Calculation | Attendance: `45%`<br>Marks Average: `35/100` | AI engine alerts student trajectory as "High Risk" | ML classifier safely flagged candidate as "High Risk" | **Pass** |
| **TC15** | Dashboard | Student Data Drill-Down Invocation | UI interaction selecting an flagged student row | Detailed analytical modal expands with precise granular data | Drill-down modal rendered smoothly populated with DB metrics | **Pass** |

## 13.2 TESTING SUMMARY AND SYSTEM VALIDATION

The manual testing verification of the Intelligent Cloud-Based Institutional Automation and Decision Support System demonstrates a high degree of operational reliability and structural robustness. The system exhibits excellent error handling protocols, systematically gracefully catching unauthorized access attempts, averting duplicate log anomalies, and imposing strict boundary verifications for academic scoring integrations safely prior to server interaction. Furthermore, the AI-Based Academic Risk Prediction module performs impeccably, translating varied spectrums of granular attendance and academic scoring combinations into accurate, logical risk categorizations (Low, Medium, and High). 

All major functional testing pathways successfully passed operational expectations with no structural deviations. All test cases were executed manually using the developed system interface, and the results were extensively verified through actual system behavior outputs, ensuring exceptional stability for real-world institutional utilization.
