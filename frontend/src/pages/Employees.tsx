import { useState, useEffect } from 'react'
import { employeesAPI, type Employee as APIEmployee, type CreateEmployeeData, type UpdateEmployeeData } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Employees.css'

export default function Employees() {
  const { employer } = useAuth()
  const [employees, setEmployees] = useState<APIEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<APIEmployee | null>(null)
  
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({
    firstName: '',
    lastName: '',
    walletAddress: '',
    salary: 0,
    department: ''
  })

  // Load employees on component mount
  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await employeesAPI.getAll()
      setEmployees(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load employees')
      console.error('Error loading employees:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.walletAddress || !newEmployee.salary) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError('')
      const employeeData: CreateEmployeeData = {
        ...newEmployee,
        employerId: employer?.id
      }
      
      const response = await employeesAPI.create(employeeData)
      setEmployees([...employees, response.data])
      setNewEmployee({ firstName: '', lastName: '', walletAddress: '', salary: 0, department: '' })
      setShowAddModal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add employee')
      console.error('Error adding employee:', err)
    }
  }

  const handleEditEmployee = async () => {
    if (!editingEmployee) return

    try {
      setError('')
      const updateData: UpdateEmployeeData = {
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        walletAddress: editingEmployee.walletAddress,
        salary: editingEmployee.salary,
        department: editingEmployee.department
      }
      
      const response = await employeesAPI.update(editingEmployee.id, updateData)
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? response.data : emp
      ))
      setEditingEmployee(null)
      setShowEditModal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update employee')
      console.error('Error updating employee:', err)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      setError('')
      await employeesAPI.delete(id)
      setEmployees(employees.filter(emp => emp.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee')
      console.error('Error deleting employee:', err)
    }
  }

  const handleExportCSV = () => {
    const headers = ['First Name,Last Name,Wallet Address,Monthly Salary (cents),Department']
    const rows = employees.map(emp => 
      `${emp.firstName},${emp.lastName},${emp.walletAddress},${emp.salary},${emp.department || ''}`
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

  if (isLoading) {
    return (
      <div className="employees-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p style={{ marginTop: '16px', color: '#9ca3af' }}>Loading employees...</p>
        </div>
      </div>
    )
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
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgb(239, 68, 68)',
          color: '#fecaca',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <p className="stat-label">Total Employees</p>
          <p className="stat-number">{employees.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-label">Monthly Payroll</p>
          <p className="stat-number">
            ${(employees.reduce((sum, emp) => sum + emp.salary, 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Employees List */}
      <div className="employees-list">
        {employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <p>No employees yet. Click "Add Employee" to get started.</p>
          </div>
        ) : (
          employees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="employee-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="employee-info">
                <h3 className="employee-name">{employee.firstName} {employee.lastName}</h3>
                <p className="employee-wallet">{employee.walletAddress}</p>
                <p className="employee-date">
                  {employee.department || 'No Department'} • Added: {new Date(employee.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="employee-salary">
                <p className="salary-label">Monthly Salary</p>
                <p className="salary-amount">${(employee.salary / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setEditingEmployee(employee)
                    setShowEditModal(true)
                  }}
                  title="Edit employee"
                  style={{ padding: '8px 12px', minWidth: 'auto' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
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
            </div>
          ))
        )}
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
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John"
                  value={newEmployee.firstName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doe"
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
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
                  step="0.01"
                  value={newEmployee.salary ? newEmployee.salary / 100 : ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary: Math.round(parseFloat(e.target.value || '0') * 100) })}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                  Amount will be stored in cents
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Department (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Engineering"
                  value={newEmployee.department || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
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

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Employee</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John"
                  value={editingEmployee.firstName}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doe"
                  value={editingEmployee.lastName}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Wallet Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="GAXYZ...ABC123"
                  value={editingEmployee.walletAddress}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, walletAddress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Salary ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="3500"
                  step="0.01"
                  value={editingEmployee.salary / 100}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: Math.round(parseFloat(e.target.value || '0') * 100) })}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                  Amount will be stored in cents
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Department (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Engineering"
                  value={editingEmployee.department || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditEmployee}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
