// Mock data centralizado para toda la aplicación
// Fecha actual: Noviembre 2025

export interface Employee {
  id: string
  fullName: string
  walletAddress: string
  monthlySalary: number
  addedDate: string
  department: string
}

export interface PayrollCycle {
  id: string
  period: string
  startDate: string
  endDate: string
  dueDate: string
  status: 'pending' | 'processing' | 'completed'
  totalAmount: number
  employeeCount: number
  actualPaymentDate?: string
}

export interface YieldData {
  month: string
  amount: number
}

// Empleados activos (12 empleados)
export const mockEmployees: Employee[] = [
  {
    id: '1',
    fullName: 'John Doe',
    walletAddress: 'GAXYZ...ABC123',
    monthlySalary: 4200,
    addedDate: 'Oct 15, 2025',
    department: 'Engineering'
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    walletAddress: 'GBDEF...XYZ789',
    monthlySalary: 4800,
    addedDate: 'Oct 10, 2025',
    department: 'Design'
  },
  {
    id: '3',
    fullName: 'Michael Johnson',
    walletAddress: 'GCGHI...DEF456',
    monthlySalary: 3900,
    addedDate: 'Sep 22, 2025',
    department: 'Marketing'
  },
  {
    id: '4',
    fullName: 'Emily Davis',
    walletAddress: 'GDJKL...GHI789',
    monthlySalary: 5200,
    addedDate: 'Sep 18, 2025',
    department: 'Engineering'
  },
  {
    id: '5',
    fullName: 'David Wilson',
    walletAddress: 'GEMNO...JKL012',
    monthlySalary: 3600,
    addedDate: 'Aug 30, 2025',
    department: 'Sales'
  },
  {
    id: '6',
    fullName: 'Sarah Brown',
    walletAddress: 'GFPQR...MNO345',
    monthlySalary: 4500,
    addedDate: 'Aug 25, 2025',
    department: 'Product'
  },
  {
    id: '7',
    fullName: 'James Taylor',
    walletAddress: 'GGSTU...PQR678',
    monthlySalary: 3800,
    addedDate: 'Jul 12, 2025',
    department: 'Operations'
  },
  {
    id: '8',
    fullName: 'Lisa Anderson',
    walletAddress: 'GHVWX...STU901',
    monthlySalary: 4100,
    addedDate: 'Jul 5, 2025',
    department: 'Engineering'
  },
  {
    id: '9',
    fullName: 'Robert Martinez',
    walletAddress: 'GIYZA...VWX234',
    monthlySalary: 3700,
    addedDate: 'Jun 20, 2025',
    department: 'Customer Support'
  },
  {
    id: '10',
    fullName: 'Jennifer Garcia',
    walletAddress: 'GJBCD...YZA567',
    monthlySalary: 4400,
    addedDate: 'Jun 15, 2025',
    department: 'Design'
  },
  {
    id: '11',
    fullName: 'William Rodriguez',
    walletAddress: 'GKEFG...BCD890',
    monthlySalary: 3500,
    addedDate: 'May 28, 2025',
    department: 'Marketing'
  },
  {
    id: '12',
    fullName: 'Mary Lee',
    walletAddress: 'GLHIJ...EFG123',
    monthlySalary: 4600,
    addedDate: 'May 22, 2025',
    department: 'Product'
  }
]

// Calcular nómina total mensual
export const getTotalMonthlyPayroll = () => {
  return mockEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0)
}

// Nómina próxima (Diciembre 2025)
export const nextPayrollCycle: PayrollCycle = {
  id: 'payroll-2025-12',
  period: 'December 2025',
  startDate: 'Dec 1, 2025',
  endDate: 'Dec 31, 2025',
  dueDate: 'Dec 31, 2025',
  status: 'pending',
  totalAmount: getTotalMonthlyPayroll(),
  employeeCount: mockEmployees.length
}

// Pool de fondos para próxima nómina
export const payrollPool = {
  targetAmount: getTotalMonthlyPayroll(),
  currentDeposited: 32500, // 65% completado
  lastDepositDate: 'Nov 18, 2025',
  lastDepositAmount: 5000
}

// Historial de nóminas (últimos 6 meses)
export const payrollHistory: PayrollCycle[] = [
  {
    id: 'payroll-2025-11',
    period: 'November 2025',
    startDate: 'Nov 1, 2025',
    endDate: 'Nov 30, 2025',
    dueDate: 'Nov 30, 2025',
    actualPaymentDate: 'Nov 30, 2025',
    status: 'completed',
    totalAmount: 50000,
    employeeCount: 12
  },
  {
    id: 'payroll-2025-10',
    period: 'October 2025',
    startDate: 'Oct 1, 2025',
    endDate: 'Oct 31, 2025',
    dueDate: 'Oct 31, 2025',
    actualPaymentDate: 'Oct 31, 2025',
    status: 'completed',
    totalAmount: 46800,
    employeeCount: 11
  },
  {
    id: 'payroll-2025-09',
    period: 'September 2025',
    startDate: 'Sep 1, 2025',
    endDate: 'Sep 30, 2025',
    dueDate: 'Sep 30, 2025',
    actualPaymentDate: 'Sep 30, 2025',
    status: 'completed',
    totalAmount: 41600,
    employeeCount: 10
  },
  {
    id: 'payroll-2025-08',
    period: 'August 2025',
    startDate: 'Aug 1, 2025',
    endDate: 'Aug 31, 2025',
    dueDate: 'Aug 31, 2025',
    actualPaymentDate: 'Aug 31, 2025',
    status: 'completed',
    totalAmount: 37800,
    employeeCount: 9
  },
  {
    id: 'payroll-2025-07',
    period: 'July 2025',
    startDate: 'Jul 1, 2025',
    endDate: 'Jul 31, 2025',
    dueDate: 'Jul 31, 2025',
    actualPaymentDate: 'Jul 31, 2025',
    status: 'completed',
    totalAmount: 32700,
    employeeCount: 8
  },
  {
    id: 'payroll-2025-06',
    period: 'June 2025',
    startDate: 'Jun 1, 2025',
    endDate: 'Jun 30, 2025',
    dueDate: 'Jun 30, 2025',
    actualPaymentDate: 'Jun 30, 2025',
    status: 'completed',
    totalAmount: 28900,
    employeeCount: 7
  }
]

// Datos de yield (últimos 6 meses)
export const yieldHistory: YieldData[] = [
  { month: 'Jun', amount: 723 },   // 2.5% de 28,900
  { month: 'Jul', amount: 818 },   // 2.5% de 32,700
  { month: 'Aug', amount: 945 },   // 2.5% de 37,800
  { month: 'Sep', amount: 1040 },  // 2.5% de 41,600
  { month: 'Oct', amount: 1170 },  // 2.5% de 46,800
  { month: 'Nov', amount: 1250 }   // 2.5% de 50,000
]

// Estadísticas de yield
export const yieldStats = {
  currentCycle: 1250,
  cycleChange: 2.5,
  yearToDate: yieldHistory.reduce((sum, y) => sum + y.amount, 0),
  ytdChange: 15.8
}

// Actividad reciente
export const recentActivity = [
  {
    id: '1',
    type: 'payroll' as const,
    title: `Payroll for ${payrollHistory[0].period} processed.`,
    date: payrollHistory[0].actualPaymentDate || payrollHistory[0].dueDate,
    amount: payrollHistory[0].totalAmount
  },
  {
    id: '2',
    type: 'deposit' as const,
    title: `Deposit of $${payrollPool.lastDepositAmount.toLocaleString()} to pool.`,
    date: payrollPool.lastDepositDate
  },
  {
    id: '3',
    type: 'employee' as const,
    title: `New employee, ${mockEmployees[0].fullName}, was added.`,
    date: mockEmployees[0].addedDate
  },
  {
    id: '4',
    type: 'employee' as const,
    title: `${mockEmployees[1].fullName}'s salary was updated.`,
    date: 'Oct 12, 2025'
  }
]

// Cálculo de días restantes hasta próxima nómina
export const getDaysUntilNextPayroll = () => {
  const today = new Date('2025-11-21') // Fecha actual simulada
  const dueDate = new Date('2025-12-31')
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Proof para última nómina completada
export const lastPaymentProof = {
  payrollCycle: payrollHistory[0],
  proofHash: '0x4a2e8f3d9c1b5a7e2d4f6a8b0c3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9f8b8f9',
  proofHashShort: '0x4a2e...b8f9',
  verified: true,
  onTime: true
}
