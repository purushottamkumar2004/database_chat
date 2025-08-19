// queryService.js
const pool = require("./db");

// Function to create 4 employee-related tables
async function createTables() {
  const queries = [
    // Table 1: Departments
    `CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dept_code VARCHAR(10) UNIQUE NOT NULL,
      dept_name VARCHAR(100) NOT NULL,
      manager_name VARCHAR(100),
      location VARCHAR(100),
      budget DECIMAL(15,2),
      phone VARCHAR(15),
      email VARCHAR(100),
      established_date DATE,
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dept_code (dept_code)
    )`,

    // Table 2: Employees
    `CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(15),
      position VARCHAR(100) NOT NULL,
      department_id INT,
      salary DECIMAL(10,2) NOT NULL,
      hire_date DATE NOT NULL,
      birth_date DATE,
      address TEXT,
      emergency_contact VARCHAR(100),
      emergency_phone VARCHAR(15),
      status ENUM('Active', 'Inactive', 'Terminated', 'On Leave') DEFAULT 'Active',
      manager_id INT,
      performance_rating DECIMAL(3,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
      INDEX idx_emp_id (emp_id),
      INDEX idx_department (department_id),
      INDEX idx_manager (manager_id)
    )`,

    // Table 3: Projects
    `CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_code VARCHAR(20) UNIQUE NOT NULL,
      project_name VARCHAR(200) NOT NULL,
      description TEXT,
      manager_id INT,
      department_id INT,
      budget DECIMAL(15,2),
      start_date DATE NOT NULL,
      end_date DATE,
      actual_end_date DATE,
      status ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'Planning',
      priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
      progress_percentage DECIMAL(5,2) DEFAULT 0.00,
      client_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      INDEX idx_project_code (project_code),
      INDEX idx_manager (manager_id),
      INDEX idx_department (department_id),
      INDEX idx_status (status)
    )`,

    // Table 4: Attendance (includes project tracking)
    `CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      date DATE NOT NULL,
      check_in_time TIME,
      check_out_time TIME,
      total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE 
          WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
          THEN TIME_TO_SEC(TIMEDIFF(check_out_time, check_in_time)) / 3600 
          ELSE NULL 
        END
      ) STORED,
      status ENUM('Present', 'Absent', 'Late', 'Half Day', 'Work From Home') DEFAULT 'Present',
      project_id INT,
      overtime_hours DECIMAL(4,2) DEFAULT 0.00,
      break_time DECIMAL(4,2) DEFAULT 0.00,
      location ENUM('Office', 'Remote', 'Client Site', 'Field') DEFAULT 'Office',
      notes TEXT,
      approved_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
      UNIQUE KEY unique_employee_date (employee_id, date),
      INDEX idx_employee (employee_id),
      INDEX idx_date (date),
      INDEX idx_project (project_id)
    )`
  ];

  try {
    const conn = await pool.getConnection();
    
    // Create tables
    for (let q of queries) {
      await conn.query(q);
    }
    
    conn.release();
    console.log("✅ Employee Management Tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
}

// Get database schema for GPT
async function getTableSchema() {
  try {
    const conn = await pool.getConnection();
    
    // Get all tables
    const [tables] = await conn.query("SHOW TABLES");
    
    let schema = "Employee Management System Database Schema:\n\n";
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await conn.query(`DESCRIBE ${tableName}`);
      
      schema += `Table: ${tableName}\n`;
      schema += "Columns:\n";
      
      columns.forEach(col => {
        schema += `  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}${col.Key === 'MUL' ? 'FOREIGN KEY' : ''}\n`;
      });
      
      schema += "\n";
    }
    
    conn.release();
    return schema;
  } catch (err) {
    console.error("Error getting schema:", err);
    throw err;
  }
}

// Execute any SELECT query safely
async function executeQuery(query) {
  try {
    // Security check - only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed for security reasons');
    }
    
    const [rows] = await pool.query(query);
    return rows;
  } catch (err) {
    console.error("Query execution error:", err);
    throw err;
  }
}

// Insert functions for all tables
async function insertDepartment(deptCode, deptName, manager, location, budget) {
  try {
    const [result] = await pool.query(
      "INSERT INTO departments (dept_code, dept_name, manager_name, location, budget) VALUES (?, ?, ?, ?, ?)",
      [deptCode, deptName, manager, location, budget]
    );
    return result.insertId;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function insertEmployee(empId, name, email, phone, position, departmentId, salary, hireDate) {
  try {
    const [result] = await pool.query(
      "INSERT INTO employees (emp_id, name, email, phone, position, department_id, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [empId, name, email, phone, position, departmentId, salary, hireDate]
    );
    return result.insertId;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function insertProject(projectCode, projectName, description, managerId, departmentId, budget, startDate, endDate) {
  try {
    const [result] = await pool.query(
      "INSERT INTO projects (project_code, project_name, description, manager_id, department_id, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [projectCode, projectName, description, managerId, departmentId, budget, startDate, endDate]
    );
    return result.insertId;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function insertAttendance(employeeId, date, checkIn, checkOut, status, projectId) {
  try {
    const [result] = await pool.query(
      "INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, status, project_id) VALUES (?, ?, ?, ?, ?, ?)",
      [employeeId, date, checkIn, checkOut, status, projectId]
    );
    return result.insertId;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getAllEmployees() {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, d.dept_name, d.location as dept_location 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'Active'
    `);
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { 
  createTables, 
  insertEmployee,
  insertDepartment,
  insertProject,
  insertAttendance,
  getAllEmployees, 
  executeQuery, 
  getTableSchema 
};

// Enhanced test data insertion script for Employee Management
async function insertTestData() {
  try {
    // Insert Departments
    const itId = await insertDepartment("IT", "Information Technology", "John Smith", "Building A, Floor 3", 750000);
    const hrId = await insertDepartment("HR", "Human Resources", "Sarah Wilson", "Building B, Floor 1", 400000);
    const finId = await insertDepartment("FIN", "Finance", "Michael Johnson", "Building A, Floor 2", 600000);
    const mktId = await insertDepartment("MKT", "Marketing", "Emily Davis", "Building C, Floor 1", 500000);

    // Insert Employees
    const emp1 = await insertEmployee("EMP001", "Alice Johnson", "alice.j@company.com", "555-0101", "Software Engineer", itId, 75000, "2022-01-15");
    const emp2 = await insertEmployee("EMP002", "Bob Smith", "bob.smith@company.com", "555-0102", "Senior Developer", itId, 95000, "2021-03-20");
    const emp3 = await insertEmployee("EMP003", "Carol Davis", "carol.davis@company.com", "555-0103", "HR Manager", hrId, 80000, "2020-06-10");
    const emp4 = await insertEmployee("EMP004", "David Wilson", "david.wilson@company.com", "555-0104", "Financial Analyst", finId, 70000, "2022-08-05");
    const emp5 = await insertEmployee("EMP005", "Eva Brown", "eva.brown@company.com", "555-0105", "Marketing Specialist", mktId, 65000, "2023-02-01");
    const emp6 = await insertEmployee("EMP006", "Frank Miller", "frank.miller@company.com", "555-0106", "DevOps Engineer", itId, 85000, "2021-11-12");
    const emp7 = await insertEmployee("EMP007", "Grace Lee", "grace.lee@company.com", "555-0107", "Accountant", finId, 60000, "2022-05-18");

    // Insert Projects
    const proj1 = await insertProject("PROJ001", "E-commerce Platform", "Building a new e-commerce platform", emp2, itId, 200000, "2024-01-01", "2024-12-31");
    const proj2 = await insertProject("PROJ002", "HR Management System", "Internal HR management system", emp3, hrId, 150000, "2024-02-01", "2024-10-31");
    const proj3 = await insertProject("PROJ003", "Financial Dashboard", "Real-time financial reporting dashboard", emp4, finId, 100000, "2024-03-01", "2024-09-30");
    const proj4 = await insertProject("PROJ004", "Brand Redesign", "Complete brand identity redesign", emp5, mktId, 80000, "2024-01-15", "2024-08-15");

    // Insert Attendance Records (last 7 days)
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      await insertAttendance(emp1, dateStr, "09:00:00", "17:30:00", "Present", proj1);
      await insertAttendance(emp2, dateStr, "08:45:00", "18:00:00", "Present", proj1);
      await insertAttendance(emp3, dateStr, "09:15:00", "17:15:00", "Present", proj2);
      await insertAttendance(emp4, dateStr, "09:00:00", "17:00:00", "Present", proj3);
      await insertAttendance(emp5, dateStr, "10:00:00", "18:00:00", "Present", proj4);
      await insertAttendance(emp6, dateStr, "08:30:00", "17:30:00", "Present", proj1);
      await insertAttendance(emp7, dateStr, "09:30:00", "17:30:00", "Present", proj3);
    }
    
    console.log("✅ Employee Management test data inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting test data:", error);
  }
}

// Uncomment the line below to run this when needed
insertTestData();