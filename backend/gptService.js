// gptService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Google Gemini client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Kept original function name: askGPTForSQL
async function askGPTForSQL(question, schema) {
  // Select the Gemini model to use
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const systemPrompt = `You are a SQL expert for an Employee Management System. Generate ONLY the SQL query based on the user's question.

Database Schema:
${schema}

Database Schema:
Table: departments
Columns: id, dept_code, dept_name, manager_name, location, budget, phone, email, established_date, status, description, created_at, updated_at

Table: employees
Columns: id, emp_id, name, email, phone, position, department_id, salary, hire_date, birth_date, address, emergency_contact, emergency_phone, status, manager_id, performance_rating, created_at, updated_at

Table: projects
Columns: id, project_code, project_name, description, manager_id, department_id, budget, start_date, end_date, actual_end_date, status, priority, progress_percentage, client_name, created_at, updated_at

Table: attendance
Columns: id, employee_id, date, check_in_time, check_out_time, total_hours, status, project_id, overtime_hours, break_time, location, notes, approved_by, created_at, updated_at

Rules:
1. Return ONLY the SQL query, no explanations or markdown.
2. Use proper MySQL syntax.
3. You MUST use the column and table names exactly as they are defined in the 'Database Schema' section above. Do not invent or guess names.
4. For safety, only generate SELECT queries. Avoid DELETE, DROP, or UPDATE.
5. Use JOINs when data from multiple tables is needed.
6. if there is any spelling mistake for attributes, correct it to match the schema.

Examples:
- "How many employees are there?" → SELECT COUNT(*) as total_employees FROM employees
- "Who are the highest paid employees?" → SELECT name, position, salary FROM employees ORDER BY salary DESC LIMIT 5
- "Average salary by department" → SELECT d.dept_name, AVG(e.salary) as avg_salary FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.dept_name`;

  const prompt = `${systemPrompt}\n\nUser question: "${question}"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let sqlQuery = response.text();
  
  // Clean up the response - remove markdown formatting if present
  sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

  return sqlQuery;
}

// Kept original function name: askGPTForAnalysis
async function askGPTForAnalysis(originalQuestion, queryResults) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a helpful HR assistant. Analyze the employee database query results and provide a clear, natural language answer. Be professional and include relevant insights about the workforce data.

Original question: "${originalQuestion}"

Query results:
${JSON.stringify(queryResults, null, 2)}

Please provide a natural language response based on these results with professional insights.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Kept original module exports
module.exports = { 
  askGPTForSQL, 
  askGPTForAnalysis 
};