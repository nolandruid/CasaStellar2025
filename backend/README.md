# Payroll Backend - Stellar/Soroban

A simple backend for managing employee payroll with Stellar blockchain integration via Soroban.

## Requirements

- Node.js v22+
- npm v10+
- yarn

## Installation

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma:generate

# Copy environment configuration
cp .env.example .env

# Start server in development mode
yarn dev
```

The server will be available at `http://localhost:3003`

## Available Scripts

```bash
yarn dev             # Start server with auto-reload
yarn start               # Run compiled version
yarn build           # Compile TypeScript
yarn prisma:generate # Generate Prisma client (required after schema changes)
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=3003
NODE_ENV=development
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

## API Endpoints

### POST /uploadPayroll
Upload employee payroll

**Request:**
```json
{
  "employees": [
    {
      "id": "emp_001",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "amount": "1500.50",
      "walletAddress": "GBRPYHIL2CI3O7Q4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW2QC7OX2H"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payroll uploaded successfully",
  "payrollId": "payroll_1763657812343_qkrcxp2hu",
  "employeeCount": 1,
  "status": "uploaded",
  "timestamp": "2025-11-20T16:56:52.343Z"
}
```

### POST /claimPay
Claim payment from payroll

**Request:**
```json
{
  "employeeId": "emp_001",
  "payrollId": "payroll_1763657812343_qkrcxp2hu",
  "walletAddress": "GBRPYHIL2CI3O7Q4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW2QC7OX2H"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment claim initiated",
  "claimId": "claim_1763657846076_gu7hbnhiy",
  "employeeId": "emp_001",
  "payrollId": "payroll_1763657812343_qkrcxp2hu",
  "status": "pending",
  "timestamp": "2025-11-20T16:57:26.076Z"
}
```

## Validation with Zod

All endpoints use **Zod** for request validation:

- **Email:** Email format validation
- **Wallet Address:** Stellar wallet address validation (GXXX... format)
- **Amount:** Decimal number validation
- **Required Fields:** Required field validation

**Validation errors return 400:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "employees.0.email": ["Invalid email format"],
    "employees.0.walletAddress": ["Invalid Stellar wallet address format"]
  }
}
```

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **@stellar/stellar-sdk** - Stellar integration
- **tsx** - TypeScript executor with watch mode

## Project Structure

```
src/
├── index.ts              # Main server
├── config/
│   └── constants.ts      # Configuration
├── routes/
│   └── payroll.ts        # Endpoints
├── schemas/
│   └── payroll.ts        # Zod validation
└── services/
    └── stellar.ts        # Stellar SDK integration
```

## Development

The server has auto-reload enabled. Any changes to `.ts` files will automatically restart the server.

## Network

- **Network:** Stellar Testnet
- **RPC:** https://soroban-testnet.stellar.org
- **Status:** ✓ Connected

## License

ISC
