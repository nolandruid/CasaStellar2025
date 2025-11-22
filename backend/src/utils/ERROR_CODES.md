# Error Codes Reference

## Quick Reference Table

| Code | HTTP Status | Description | Usage |
|------|-------------|-------------|-------|
| `VALIDATION_ERROR` | 400 | Input validation failed | Missing or invalid parameters |
| `INVALID_INPUT` | 400 | Invalid input format | Malformed data |
| `MISSING_PARAMETER` | 400 | Required parameter missing | Required field not provided |
| `UNAUTHORIZED` | 401 | Authentication required | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Access denied | User lacks permissions |
| `INVALID_CREDENTIALS` | 401 | Login failed | Wrong username/password |
| `NOT_FOUND` | 404 | Resource not found | Requested resource doesn't exist |
| `RESOURCE_NOT_FOUND` | 404 | Specific resource not found | Payroll batch, employee, etc. |
| `CONFLICT` | 409 | Resource conflict | Duplicate entry |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists | Attempting to create duplicate |
| `CONTRACT_ERROR` | 422 | Smart contract error | General contract operation failure |
| `TRANSACTION_FAILED` | 422 | Transaction failed | Blockchain transaction failed |
| `SIMULATION_FAILED` | 422 | Simulation failed | Contract simulation error |
| `INSUFFICIENT_BALANCE` | 422 | Insufficient funds | Not enough tokens |
| `CONTRACT_NOT_CONFIGURED` | 422 | Contract not configured | Missing contract configuration |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service error | Third-party service failure |
| `SOROBAN_ERROR` | 502 | Soroban RPC error | Soroban network issue |
| `HORIZON_ERROR` | 502 | Horizon API error | Stellar Horizon issue |
| `SDP_ERROR` | 502 | SDP service error | Disbursement platform issue |
| `DATABASE_ERROR` | 503 | Database error | Database connection/query failure |
| `INTERNAL_ERROR` | 500 | Internal server error | Unexpected server error |
| `UNKNOWN_ERROR` | 500 | Unknown error | Unhandled error |

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "value": "invalidValue",
      "constraint": "validation rule"
    },
    "timestamp": "2024-11-22T18:59:00.000Z",
    "path": "/api/endpoint",
    "txHash": "transaction_hash_if_applicable"
  }
}
```

## Frontend Error Handling Example

```typescript
try {
  const response = await fetch('/api/payroll/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // Handle error based on code
    switch (result.error.code) {
      case 'VALIDATION_ERROR':
        // Show validation error to user
        showFieldError(result.error.details.field, result.error.message);
        break;
        
      case 'TRANSACTION_FAILED':
        // Show transaction failure with hash
        showError(`Transaction failed: ${result.error.txHash}`);
        break;
        
      case 'SOROBAN_ERROR':
      case 'HORIZON_ERROR':
        // Network issue - suggest retry
        showError('Network issue. Please try again.');
        break;
        
      case 'UNAUTHORIZED':
        // Redirect to login
        redirectToLogin();
        break;
        
      default:
        // Generic error
        showError(result.error.message);
    }
  }
} catch (error) {
  // Network error or JSON parse error
  showError('Unable to connect to server');
}
```

## Common Error Scenarios

### 1. Validation Errors
**Trigger**: Missing or invalid input parameters
**Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Employer address is required",
    "details": {
      "field": "employerAddress",
      "value": ""
    },
    "timestamp": "2024-11-22T18:59:00.000Z",
    "path": "/api/payroll/lock"
  }
}
```

### 2. Transaction Failures
**Trigger**: Blockchain transaction fails
**Response**:
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED",
    "message": "Transaction failed with status: FAILED",
    "details": {
      "status": "FAILED",
      "duration": 2500
    },
    "timestamp": "2024-11-22T18:59:00.000Z",
    "path": "/api/payroll/lock",
    "txHash": "abc123..."
  }
}
```

### 3. Configuration Errors
**Trigger**: Missing environment variables
**Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONTRACT_ERROR",
    "message": "TOKEN_ADDRESS not configured in environment",
    "details": {
      "configMissing": "TOKEN_ADDRESS"
    },
    "timestamp": "2024-11-22T18:59:00.000Z",
    "path": "/api/payroll/lock"
  }
}
```

### 4. Network Errors
**Trigger**: Cannot connect to Soroban/Horizon
**Response**:
```json
{
  "success": false,
  "error": {
    "code": "SOROBAN_ERROR",
    "message": "Soroban error: Failed to simulate transaction",
    "details": {
      "originalError": "Network timeout"
    },
    "timestamp": "2024-11-22T18:59:00.000Z",
    "path": "/api/payroll/lock"
  }
}
```

## Best Practices

### 1. Always Check `success` Field
```typescript
if (!response.success) {
  // Handle error
}
```

### 2. Use Error Codes for Logic
Don't rely on error messages for logic - use error codes:
```typescript
if (error.code === 'UNAUTHORIZED') {
  // Redirect to login
}
```

### 3. Show User-Friendly Messages
Map technical errors to user-friendly messages:
```typescript
const userMessages = {
  'SOROBAN_ERROR': 'Network issue. Please try again.',
  'VALIDATION_ERROR': 'Please check your input.',
  'TRANSACTION_FAILED': 'Transaction failed. Please try again.',
};
```

### 4. Log Errors for Debugging
Always log the full error object for debugging:
```typescript
console.error('API Error:', result.error);
```

### 5. Handle Retryable Errors
Some errors can be retried:
```typescript
const retryableErrors = [
  'SOROBAN_ERROR',
  'HORIZON_ERROR',
  'EXTERNAL_SERVICE_ERROR'
];

if (retryableErrors.includes(error.code)) {
  // Implement retry logic
}
```
