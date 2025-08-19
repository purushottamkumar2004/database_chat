// formatter.js
function formatEmployees(employees) {
  return employees.map(emp => 
    `${emp.name} (ID: ${emp.emp_id}, Position: ${emp.position}, Salary: $${emp.salary})`
  ).join("\n");
}

module.exports = { formatEmployees };
