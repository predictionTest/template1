# Upgrade Guide - NFT Staking DApp

## Current Issues & Recommended Upgrades

### 1. ⚠️ Critical: Goerli Testnet Deprecated

**Issue**: Goerli testnet was shut down and is no longer operational.

**Fix**: Migrate to Sepolia testnet

```javascript
// src/web3/index.js
import { sepolia } from "wagmi/chains";

const { provider, chains } = configureChains(
  [sepolia], // Changed from goerli
  [w3mProvider({ projectId })]
);
```

**Required**: Redeploy contracts on Sepolia and update addresses in `.env`

### 2. 📦 Outdated Dependencies

**Current versions** (severely outdated):
- wagmi: v0.12.16 (current: v2.x)
- @web3modal/react: v2.3.7 (current: v3.x)
- ethers: v5.7.2 (current: v6.x)

**Recommended upgrade path**:

#### Option A: Stay on wagmi v1 (easier, less breaking changes)

```json
{
  "wagmi": "^1.4.13",
  "@web3modal/ethereum": "^2.7.1",
  "@web3modal/react": "^2.7.1",
  "ethers": "^5.7.2"
}
```

#### Option B: Upgrade to wagmi v2 (modern, breaking changes)

```json
{
  "wagmi": "^2.5.7",
  "@web3modal/wagmi": "^4.1.0",
  "ethers": "^6.11.1",
  "viem": "^2.7.0"
}
```

**Note**: Option B requires significant code refactoring as wagmi v2 uses viem instead of ethers.

### 3. 🔐 Environment Variables

**Current**: Hardcoded API keys in code (security risk)
**Fixed**: Now using environment variables

Create `.env` file:

```env
# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Smart Contract Addresses (Sepolia)
VITE_NFT_CONTRACT_ADDRESS=0xYourNFTContractAddress
VITE_USDT_CONTRACT_ADDRESS=0xYourUSDTContractAddress

# Network
VITE_CHAIN_ID=11155111
```

### 4. 🐛 Code Quality Issues Fixed

#### Removed:
- ❌ Unused variables (`internal`, `error`, `pendingChainId`)
- ❌ Commented-out code
- ❌ Console.log statements in production
- ❌ Empty try-catch blocks
- ❌ Unnecessary async/await

#### Improved:
- ✅ Better error handling
- ✅ Cleaner boolean logic
- ✅ React best practices (className instead of class)
- ✅ Proper HTML attributes (contentEditable, spellCheck)
- ✅ Input validation

### 5. 📚 Documentation Added

- ✅ `README.md` - Complete project documentation
- ✅ `.gitignore` - Added .env protection
- ✅ `UPGRADE_GUIDE.md` - This file

### 6. 🔄 Migration Steps (Recommended)

#### Step 1: Update to Sepolia (Required)

```bash
# 1. Deploy contracts on Sepolia testnet
# 2. Update .env with new addresses
# 3. Get Sepolia testnet ETH from faucet
# 4. Get Sepolia USDT from faucet or deploy mock
```

#### Step 2: Update Dependencies (Recommended)

```bash
# Backup current node_modules
mv node_modules node_modules.backup

# Update package.json (Option A - easier)
npm install wagmi@^1.4.13 @web3modal/ethereum@^2.7.1 @web3modal/react@^2.7.1

# Or Option B - full upgrade (requires code changes)
# See wagmi migration guide: https://wagmi.sh/react/migration-guide
```

#### Step 3: Test Thoroughly

```bash
# Run development server
npm run dev

# Test all functionality:
# - Wallet connection
# - Network switching
# - NFT minting
# - USDT approval flow
# - Error handling
```

### 7. 🚀 Performance Improvements

Consider adding:

1. **React Query** for better cache management
2. **Error boundaries** for graceful error handling
3. **Loading states** for better UX
4. **Transaction confirmations** with toast notifications
5. **Gas estimation** before transactions

### 8. 🔒 Security Enhancements

Consider adding:

1. **Contract verification** on Etherscan
2. **Rate limiting** for transactions
3. **Slippage protection**
4. **Max approval limits** instead of unlimited
5. **Audit** contracts before mainnet

### 9. 📱 Mobile Optimization

The current design works on mobile but could be improved:

1. Responsive breakpoints
2. Touch-friendly button sizes
3. Mobile wallet deep linking
4. Progressive Web App (PWA) support

### 10. 🧪 Testing

Currently missing:

1. Unit tests for utility functions
2. Integration tests for Web3 interactions
3. E2E tests for user flows
4. Contract tests

Recommended setup:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## Quick Start After Improvements

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Get WalletConnect Project ID
# Visit: https://cloud.walletconnect.com

# 3. Update .env with your values

# 4. Install dependencies
npm install

# 5. Run development server
npm run dev
```

## Breaking Changes Summary

If upgrading to wagmi v2:

1. `useContract` → Removed (use `useContractRead`/`useContractWrite`)
2. `useProvider` → `usePublicClient`
3. `useSigner` → `useWalletClient`
4. `ethers` → `viem` for utilities
5. Contract ABI format changes

## Resources

- [Wagmi v2 Migration Guide](https://wagmi.sh/react/migration-guide)
- [WalletConnect v2 Docs](https://docs.walletconnect.com/)
- [Sepolia Testnet](https://sepolia.dev/)
- [Viem Docs](https://viem.sh/)

## Support

For issues with upgrades, check:

1. Wagmi Discord: https://discord.gg/wagmi
2. GitHub Discussions
3. Stack Overflow (tag: wagmi)

---

**Status**: ✅ Environment variables and code quality improvements applied
**Next**: 🔄 Migrate to Sepolia testnet (required)
**Future**: 📦 Consider upgrading to wagmi v2 for long-term maintainability

