// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors'); // <-- ADDED THIS LINE

const { 
  createTables, 
  insertEmployee, 
  insertDepartment,
  insertProject,
  insertAttendance,
  getAllEmployees,
  executeQuery,
  getTableSchema 
} = require("./queryService");
const { formatEmployees } = require("./formatter");
const { askGPTForSQL, askGPTForAnalysis } = require("./gptService");

const app = express();

app.use(cors()); // <-- AND ADDED THIS LINE
app.use(bodyParser.json());

// Create tables when server starts
createTables();

// Routes for all tables
app.post("/add-department", async (req, res) => {
  const { deptCode, deptName, manager, location, budget } = req.body;
  try {
    const id = await insertDepartment(deptCode, deptName, manager, location, budget);
    res.send({ message: "Department added successfully", id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post("/add-employee", async (req, res) => {
  const { empId, name, email, phone, position, departmentId, salary, hireDate } = req.body;
  try {
    const id = await insertEmployee(empId, name, email, phone, position, departmentId, salary, hireDate);
    res.send({ message: "Employee added successfully", id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post("/add-project", async (req, res) => {
  const { projectCode, projectName, description, managerId, departmentId, budget, startDate, endDate } = req.body;
  try {
    const id = await insertProject(projectCode, projectName, description, managerId, departmentId, budget, startDate, endDate);
    res.send({ message: "Project added successfully", id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post("/add-attendance", async (req, res) => {
  const { employeeId, date, checkIn, checkOut, status, projectId } = req.body;
  try {
    const id = await insertAttendance(employeeId, date, checkIn, checkOut, status, projectId);
    res.send({ message: "Attendance recorded successfully", id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.get("/employees", async (req, res) => {
  const employees = await getAllEmployees();
  res.send(employees);
});

// Enhanced ask endpoint with SQL generation
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    // Get database schema
    const schema = await getTableSchema();
    
    // Ask GPT to generate SQL query
    const sqlQuery = await askGPTForSQL(question, schema);
    
    console.log("Generated SQL:", sqlQuery);
    
    // Execute the SQL query
    const queryResults = await executeQuery(sqlQuery);
    
    // Ask GPT to format/analyze the results
    const finalAnswer = await askGPTForAnalysis(question, queryResults);
    
    res.send({ 
      answer: finalAnswer,
      sql: sqlQuery,
      rawResults: queryResults 
    });
    
  } catch (error) {
    console.error("Error in /ask endpoint:", error);
    res.status(500).send({ 
      error: "Something went wrong", 
      details: error.message 
    });
  }
});

// This route listens for POST requests to /profile-data/callback
app.post("/profile-data/callback", (req, res) => {
  console.log("Received data on /profile-data/callback:", req.body);
  res.status(200).send({ message: "Callback received successfully!" });
});

app.listen(3000, () => console.log("🚀 Employee Management Server running on port 3000"));