# Prediction Oracle Frontend

**Modern Web3 dApp for Decentralized Predictions on Sonic Network**

Built with React, TypeScript, Viem, and RainbowKit.

## 🌐 Live Demo

**Production URL:** https://dax4b3poakzhl.cloudfront.net

**Contract:** `0x9492a0c32Fb22d1b8940e44C4D69f82B6C3cb298` (Sonic Network)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- AWS CLI + AWS CDK (for deployment)

### 1️⃣ Installation

```bash
# Install frontend dependencies
npm install

# Install infrastructure dependencies
cd infrastructure
npm install
cd ..
```

### 2️⃣ Configuration

```bash
# Create environment file
cp env.template .env
```

Edit `.env`:

```env
# Your PredictionOracle contract address on Sonic
VITE_ORACLE_CONTRACT_ADDRESS=0x6B9Aeb74A2dD2e3488577DC43fb97a7DC2468ab6
# Your Prediction Market Factory address on Sonic
MARKET_FACTORY_CONTRACT_ADDRESS=0xA46901Db277ed14a136C3146784D4eC9e0C98628

# Block when contract was deployed (optimization)
VITE_DEPLOYMENT_BLOCK=52892114

# Get FREE Project ID at: https://cloud.walletconnect.com
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Get WalletConnect Project ID** (2 minutes, free):

1. Go to https://cloud.walletconnect.com
2. Sign up (free, no card needed)
3. Create New Project → Copy Project ID
4. Paste in `.env`

See [WALLETCONNECT_SETUP.md](./WALLETCONNECT_SETUP.md) for step-by-step instructions.

### 3️⃣ Local Development

```bash
npm run dev
```

Open http://localhost:3000

**Add Sonic to MetaMask:**

- Network: Sonic
- Chain ID: 146
- RPC: https://rpc.soniclabs.com
- Currency: S

Or let the app prompt you automatically.

### 4️⃣ Build

```bash
npm run build
```

---

## ☁️ AWS Deployment

### Prerequisites

```bash
# Configure AWS credentials
aws configure

# Install AWS CDK globally
npm install -g aws-cdk
```

### Deploy

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to development
./scripts/deploy.sh development

# Deploy to staging
./scripts/deploy.sh staging us-east-1

# Deploy to production
./scripts/deploy.sh production us-east-1
```

**Deployment includes:**

- ✅ S3 bucket
- ✅ CloudFront CDN
- ✅ Global distribution
- ✅ HTTPS only

**Output:** CloudFront URL for your app

### Destroy Infrastructure

```bash
chmod +x scripts/destroy.sh
./scripts/destroy.sh development
```

---

## 🌐 Sonic Network

| Parameter      | Value                          |
| -------------- | ------------------------------ |
| **Chain ID**   | 146                            |
| **Network**    | Sonic                          |
| **Currency**   | S (Sonic)                      |
| **RPC**        | https://rpc.soniclabs.com      |
| **Explorer**   | https://explorer.soniclabs.com |
| **Block Time** | ~630ms ⚡                      |

See [SONIC_SETUP.md](./SONIC_SETUP.md) for detailed Sonic configuration.

## ✨ Features

- 🔐 **Wallet Connection** - MetaMask, WalletConnect, Rabbit, and 50+ wallets
- 📊 **Create Polls** - Date/time picker (no manual block numbers!)
- 📋 **All Polls** - Search, filters, pagination, caching
- 👤 **My Polls** - View your created polls
- 📈 **Statistics** - Platform metrics with Clear Cache button
- 🔄 **Refresh Polls** - Free (2x) or paid refresh
- 🌓 **Dark/Light Theme** - Toggle with save preference
- 🎨 **Animated Background** - Trading charts + category photos + YES/NO orbs
- 📱 **Mobile Responsive** - Optimized for all devices
- ⚡ **Smart Caching** - Instant page loads (confirmed + future blocks)
- 🚀 **Sonic Network** - Ultra-fast 630ms block times

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   ├── config/          # Contract ABI & Sonic config
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app
├── infrastructure/      # AWS CDK
├── scripts/            # Deployment scripts
└── package.json
```

## 🔧 Technology Stack

- **React 18** + TypeScript
- **Viem** - Blockchain interactions
- **RainbowKit + Wagmi** - Wallet connections
- **Tailwind CSS** - Styling
- **AWS CDK** - Infrastructure
- **Vite** - Build tool

## 🐛 Troubleshooting

### Wallet Won't Connect

```bash
# Check WalletConnect Project ID is set
cat .env | grep VITE_WALLETCONNECT_PROJECT_ID

# Add Sonic network to MetaMask (Chain ID: 146)
```

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Contract Call Fails

1. Verify `VITE_ORACLE_CONTRACT_ADDRESS` in `.env`
2. Ensure you have S tokens (Sonic gas)
3. Check you're on Sonic network (Chain ID: 146)
4. Check contract on https://explorer.soniclabs.com

### AWS Deployment Fails

```bash
# Verify credentials
aws sts get-caller-identity

# Bootstrap CDK (first time only)
cd infrastructure
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

## 💰 AWS Cost Estimate

| Environment     | Traffic     | Cost/Month |
| --------------- | ----------- | ---------- |
| **Development** | Low         | $0.12-0.50 |
| **Production**  | 10k visits  | $1-2       |
| **Production**  | 50k visits  | $3-5       |
| **Production**  | 100k visits | $5-8       |

**Free tier (first 12 months):** Almost free! 🎉

## 📚 Additional Documentation

- **SONIC_SETUP.md** - Detailed Sonic Network configuration and troubleshooting
- **WALLETCONNECT_SETUP.md** - Step-by-step WalletConnect Project ID setup

## 🔒 Security

- ✅ Never commit `.env` file
- ✅ Never share private keys
- ✅ Verify contract addresses
- ✅ Test on Sonic testnet first
- ✅ Use hardware wallet for production

## 📝 License

MIT License

---

**Built for Sonic Network ⚡**
