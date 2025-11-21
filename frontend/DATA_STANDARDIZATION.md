# Estandarización de Datos - PayDay

Este documento explica la estructura de datos centralizada de la aplicación PayDay.

## 📊 Datos Centralizados

Todos los datos mock están centralizados en `/frontend/src/data/mockData.ts` para mantener coherencia entre todas las pantallas.

### Fecha Actual Simulada
**21 de Noviembre, 2025**

---

## 👥 Empleados (12 activos)

### Total de Nómina Mensual: **$50,000**

| Nombre | Departamento | Salario Mensual | Fecha de Alta |
|--------|--------------|-----------------|---------------|
| John Doe | Engineering | $4,200 | Oct 15, 2025 |
| Jane Smith | Design | $4,800 | Oct 10, 2025 |
| Michael Johnson | Marketing | $3,900 | Sep 22, 2025 |
| Emily Davis | Engineering | $5,200 | Sep 18, 2025 |
| David Wilson | Sales | $3,600 | Aug 30, 2025 |
| Sarah Brown | Product | $4,500 | Aug 25, 2025 |
| James Taylor | Operations | $3,800 | Jul 12, 2025 |
| Lisa Anderson | Engineering | $4,100 | Jul 5, 2025 |
| Robert Martinez | Customer Support | $3,700 | Jun 20, 2025 |
| Jennifer Garcia | Design | $4,400 | Jun 15, 2025 |
| William Rodriguez | Marketing | $3,500 | May 28, 2025 |
| Mary Lee | Product | $4,600 | May 22, 2025 |

---

## 💰 Próxima Nómina (Diciembre 2025)

- **Período**: Diciembre 2025
- **Fecha de inicio**: Dec 1, 2025
- **Fecha de fin**: Dec 31, 2025
- **Fecha de pago**: Dec 31, 2025
- **Días restantes**: 40 días
- **Monto total**: $50,000
- **Empleados**: 12
- **Estado**: Pendiente

### Pool de Fondos
- **Meta**: $50,000
- **Depositado**: $32,500 (65%)
- **Restante**: $17,500
- **Último depósito**: $5,000 el Nov 18, 2025

---

## 📈 Historial de Yield (Últimos 6 meses)

Yield generado del capital depositado en **Defindex** (2.5% mensual promedio):

| Mes | Nómina Base | Yield Generado |
|-----|-------------|----------------|
| Junio 2025 | $28,900 | $723 |
| Julio 2025 | $32,700 | $818 |
| Agosto 2025 | $37,800 | $945 |
| Septiembre 2025 | $41,600 | $1,040 |
| Octubre 2025 | $46,800 | $1,170 |
| Noviembre 2025 | $50,000 | $1,250 |

### Estadísticas de Yield
- **Yield del ciclo actual**: $1,250 (+2.5%)
- **Yield acumulado del año**: $5,946 (+15.8%)

---

## 📋 Historial de Nóminas

### Noviembre 2025 (Más Reciente - COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Nov 30, 2025 (A tiempo)
- **Monto**: $50,000
- **Empleados**: 12
- **ZK Proof**: `0x4a2e...b8f9`

### Octubre 2025 (COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Oct 31, 2025 (A tiempo)
- **Monto**: $46,800
- **Empleados**: 11

### Septiembre 2025 (COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Sep 30, 2025 (A tiempo)
- **Monto**: $41,600
- **Empleados**: 10

### Agosto 2025 (COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Aug 31, 2025 (A tiempo)
- **Monto**: $37,800
- **Empleados**: 9

### Julio 2025 (COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Jul 31, 2025 (A tiempo)
- **Monto**: $32,700
- **Empleados**: 8

### Junio 2025 (COMPLETADA ✓)
- **Estado**: Completada
- **Pagado**: Jun 30, 2025 (A tiempo)
- **Monto**: $28,900
- **Empleados**: 7

---

## 🔔 Actividad Reciente

1. **Nómina procesada** - Payroll for November 2025 processed. (Nov 30, 2025) - $50,000
2. **Depósito al pool** - Deposit of $5,000 to pool. (Nov 18, 2025)
3. **Nuevo empleado** - New employee, John Doe, was added. (Oct 15, 2025)
4. **Actualización** - Jane Smith's salary was updated. (Oct 12, 2025)

---

## 🔐 Última Prueba de Pago (ZK Proof)

### Nómina de Noviembre 2025
- **Hash completo**: `0x4a2e8f3d9c1b5a7e2d4f6a8b0c3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9f8b8f9`
- **Hash corto**: `0x4a2e...b8f9`
- **Verificado**: ✓ Sí
- **Estado**: A tiempo
- **Empleados pagados**: 12
- **Monto total**: $50,000

---

## 🎯 Coherencia entre Pantallas

### Dashboard
- Muestra próxima nómina de **Diciembre 2025** ($50,000, 12 empleados, 40 días restantes)
- Pool de fondos: $32,500 / $50,000 (65%)
- Estadísticas de yield del mes actual: $1,250
- Total de empleados activos: 12
- Gráfica de yield de últimos 6 meses
- Actividad reciente con fechas coherentes

### Employees
- Lista de 12 empleados con salarios que suman $50,000
- Cada empleado tiene departamento y fecha de alta
- CSV de exportación incluye: Nombre, Wallet, Salario, Departamento

### Payment Proof
- Muestra la última nómina completada (Noviembre 2025)
- Fechas: Nov 1-30, 2025
- Pagado a tiempo: Nov 30, 2025
- 12 empleados, $50,000 total
- ZK proof hash verificado

### Status (Pendiente de actualizar)
- Debería mostrar el estado de la nómina actual (Diciembre 2025)
- Pool progress y yield generation

---

## 🔄 Crecimiento de la Empresa

La empresa ha estado creciendo consistentemente:
- **Junio 2025**: 7 empleados, $28,900/mes
- **Julio 2025**: 8 empleados, $32,700/mes
- **Agosto 2025**: 9 empleados, $37,800/mes
- **Septiembre 2025**: 10 empleados, $41,600/mes
- **Octubre 2025**: 11 empleados, $46,800/mes
- **Noviembre 2025**: 12 empleados, $50,000/mes
- **Diciembre 2025**: 12 empleados, $50,000/mes (próxima)

**Tasa de crecimiento**: ~9.1% mensual en empleados

---

## 📝 Notas de Implementación

### Uso de los datos

```typescript
import { 
  mockEmployees,
  nextPayrollCycle,
  payrollPool,
  yieldStats,
  yieldHistory,
  recentActivity,
  getDaysUntilNextPayroll
} from '../data/mockData'

// Obtener días hasta próxima nómina
const daysLeft = getDaysUntilNextPayroll() // 40 días

// Total de nómina
const totalPayroll = mockEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0)
// = $50,000
```

### Próximos pasos

Cuando se conecte al smart contract real:
1. Reemplazar `payrollPool.currentDeposited` con dato del contrato
2. Actualizar `nextPayrollCycle` con información de blockchain
3. Generar `yieldHistory` desde eventos del contrato Defindex
4. Obtener `mockEmployees` desde almacenamiento del contrato

---

**Última actualización**: Noviembre 21, 2025
