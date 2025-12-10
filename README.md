# NFT Staking DApp

A decentralized application for minting and staking NFTs with USDT payment on Ethereum.

## Features

- 🎨 Mint NFTs with USDT payment
- 💰 Price: 1000 USDT per NFT
- 🔗 Web3 wallet connection (WalletConnect v2)
- ⚡ Built with Vite + React
- 🎯 Support for Sepolia testnet (and mainnet-ready)

## Prerequisites

- Node.js 18+
- MetaMask or any Web3 wallet
- USDT tokens for minting

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp ENV_TEMPLATE.txt .env

# Edit .env with your values
# Required: VITE_WALLETCONNECT_PROJECT_ID
```

## Configuration

1. Get a WalletConnect Project ID from [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Update `.env` file with your credentials
3. Update contract addresses if deploying new contracts

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Smart Contracts

- **NFT Contract**: Handles NFT minting with max supply cap
- **USDT Contract**: ERC20 token for payments

### Contract Addresses (Goerli - DEPRECATED)

⚠️ **Note**: Goerli testnet is deprecated. Please migrate to Sepolia.

## Technology Stack

- **React 18** - UI framework
- **Wagmi** - React hooks for Ethereum
- **WalletConnect** - Wallet connection
- **Ethers.js** - Ethereum library
- **Material-UI** - Component library
- **Vite** - Build tool

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Nav/          # Navigation
│   ├── Footer/       # Footer
│   └── Spinner/      # Loading spinner
├── pages/            # Page components
│   └── Exchange/     # NFT minting page
├── web3/             # Web3 configuration
│   ├── index.js      # Wagmi config
│   ├── NFT_ABI.json  # NFT contract ABI
│   └── USDT_ABI.json # USDT contract ABI
├── assets/           # Images and static files
├── theme/            # MUI theme configuration
└── App.jsx           # Main app component
```

## Key Features Explained

### NFT Minting Flow

1. User connects wallet
2. User specifies amount of NFTs to mint (max 20 per transaction)
3. DApp checks:
   - Available supply
   - User's USDT balance
   - USDT allowance
4. If needed, requests USDT approval
5. Mints NFTs after approval

### USDT Allowance Reset

USDT requires resetting allowance to 0 before setting a new value (security feature). The DApp handles this automatically.

## Deployment

### Vercel (Recommended)

```bash
# Build
npm run build

# Deploy
vercel deploy
```

Configuration is included in `vercel.json`.

### Other Platforms

Build with `npm run build` and serve the `dist/` folder.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `VITE_NFT_CONTRACT_ADDRESS` | NFT contract address | Yes |
| `VITE_USDT_CONTRACT_ADDRESS` | USDT contract address | Yes |
| `VITE_CHAIN_ID` | Network chain ID | Yes |

## Security Notes

- ⚠️ Never commit `.env` file to git
- ⚠️ Always verify contract addresses before transactions
- ⚠️ Test on testnets before mainnet deployment
- ⚠️ Goerli is deprecated - use Sepolia testnet

## Known Issues

- This project uses older wagmi v0.12 which is outdated
- Goerli testnet is deprecated (migrate to Sepolia)
- Some dependencies need updates for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

