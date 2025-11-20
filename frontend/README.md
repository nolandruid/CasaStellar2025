# CasaStellar Frontend

Frontend application for CasaStellar - A Soroban-powered payroll platform for LATAM businesses.

## 🚀 Features

- **Wallet Integration**: Connect with Freighter/Albedo wallets
- **Payroll Upload**: Submit payroll batches for processing on Stellar
- **Status Tracking**: Monitor payroll batches and yield generation
- **Mock API**: Test API connections with mock GET/POST endpoints

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Blockchain**: Stellar SDK + Freighter API
- **Styling**: CSS Modules

## 📦 Installation

```bash
npm install
```

## 🏃 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔨 Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── components/          # Reusable components
│   ├── WalletConnect    # Wallet connection UI
│   ├── PayrollUpload    # Payroll submission form
│   └── PayrollStatus    # Status dashboard
├── context/             # React contexts
│   └── WalletContext    # Wallet state management
├── pages/               # Page components
│   ├── Dashboard        # Main upload page
│   └── Status           # Status tracking page
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

## 🔗 Wallet Setup

This project uses **Stellar Wallets Kit** by Creit.tech for seamless wallet integration.

### Supported Wallets

1. **Freighter** - [Install extension](https://www.freighter.app/)
2. **Albedo** - Web-based wallet
3. **xBull** - Multi-platform wallet

### How to Connect

1. Click "Connect Wallet" button
2. Select your preferred wallet from the modal
3. Approve the connection in your wallet
4. Your address will be displayed in the header

## 🧪 Mock API

The app includes mock API functions for testing:

- **POST** `/api/payroll/upload` - Submit payroll batch
- **GET** `/api/payroll/status` - Fetch payroll status

Mock responses simulate:
- 1.5s network delay
- Realistic data structures
- Success/error states

## 📝 Next Steps

- [ ] Connect to real backend API
- [ ] Implement Soroban smart contract calls
- [ ] Add ZK proof generation
- [ ] Integrate Albedo wallet
- [ ] Add CSV file upload
- [ ] Implement yield calculation

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 📄 License

MIT
