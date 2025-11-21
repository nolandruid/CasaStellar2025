import { useState } from 'react'
import './Employees.css'

interface Employee {
  id: string
  fullName: string
  walletAddress: string
  monthlySalary: number
  addedDate: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      fullName: 'John Doe',
      walletAddress: 'GAXYZ...ABC123',
      monthlySalary: 3500,
      addedDate: 'May 28, 2024'
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      walletAddress: 'GBDEF...XYZ789',
      monthlySalary: 4200,
      addedDate: 'May 25, 2024'
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    walletAddress: '',
    monthlySalary: ''
  })

  const handleAddEmployee = () => {
    if (newEmployee.fullName && newEmployee.walletAddress && newEmployee.monthlySalary) {
      const employee: Employee = {
        id: Date.now().toString(),
        fullName: newEmployee.fullName,
        walletAddress: newEmployee.walletAddress,
        monthlySalary: parseFloat(newEmployee.monthlySalary),
        addedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
      setEmployees([...employees, employee])
      setNewEmployee({ fullName: '', walletAddress: '', monthlySalary: '' })
      setShowAddModal(false)
    }
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const lines = text.split('\n').slice(1) // Skip header
        const newEmployees: Employee[] = []

        lines.forEach(line => {
          const [fullName, walletAddress, salary] = line.split(',').map(s => s.trim())
          if (fullName && walletAddress && salary) {
            newEmployees.push({
              id: Date.now().toString() + Math.random(),
              fullName,
              walletAddress,
              monthlySalary: parseFloat(salary),
              addedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            })
          }
        })

        setEmployees([...employees, ...newEmployees])
      }
      reader.readAsText(file)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Full Name,Wallet Address,Monthly Salary']
    const rows = employees.map(emp => 
      `${emp.fullName},${emp.walletAddress},${emp.monthlySalary}`
    )
    const csv = [headers, ...rows].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employees.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id))
  }

  return (
    <div className="employees-container">
      {/* Header */}
      <div className="employees-header">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">Manage your team members</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="actions-bar">
        <div className="actions-left">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Add Employee
          </button>
          
          <label className="btn-secondary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Import CSV
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <p className="stat-label">Total Employees</p>
          <p className="stat-number">{employees.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-label">Monthly Payroll</p>
          <p className="stat-number">
            ${employees.reduce((sum, emp) => sum + emp.monthlySalary, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Employees List */}
      <div className="employees-list">
        {employees.map(employee => (
          <div key={employee.id} className="employee-card">
            <div className="employee-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="employee-info">
              <h3 className="employee-name">{employee.fullName}</h3>
              <p className="employee-wallet">{employee.walletAddress}</p>
              <p className="employee-date">Added: {employee.addedDate}</p>
            </div>
            <div className="employee-salary">
              <p className="salary-label">Monthly Salary</p>
              <p className="salary-amount">${employee.monthlySalary.toLocaleString()}</p>
            </div>
            <button 
              className="btn-delete"
              onClick={() => handleDeleteEmployee(employee.id)}
              title="Delete employee"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Employee</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Wallet Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="GAXYZ...ABC123"
                  value={newEmployee.walletAddress}
                  onChange={(e) => setNewEmployee({ ...newEmployee, walletAddress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Salary ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="3500"
                  value={newEmployee.monthlySalary}
                  onChange={(e) => setNewEmployee({ ...newEmployee, monthlySalary: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddEmployee}
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
