# Project Structure

```
nft_stake_wagmi/
├── public/
│   └── vite.svg
│
├── src/
│   ├── assets/
│   │   └── img/
│   │       ├── 3.png
│   │       ├── announcements.png
│   │       ├── app_run.png
│   │       ├── app.svg
│   │       ├── ars.png
│   │       ├── bg.jpeg
│   │       ├── bg.jpg
│   │       ├── bg1.jpg
│   │       ├── bg2.jpg
│   │       ├── bridge.png
│   │       ├── brl.png
│   │       ├── bsc.svg
│   │       ├── change.png
│   │       ├── clp.png
│   │       ├── crowd.png
│   │       ├── discord.png
│   │       ├── docs.png
│   │       ├── earn.png
│   │       ├── github.png
│   │       ├── help.png
│   │       ├── home.png
│   │       ├── index.js
│   │       ├── lang.png
│   │       ├── logo.png
│   │       ├── medium.png
│   │       ├── nft1.jpg
│   │       ├── nft4.jpg
│   │       ├── photo.jpg
│   │       ├── photo1.jpg
│   │       ├── questionmark.png
│   │       ├── referral_wh.png
│   │       ├── referral.png
│   │       ├── refresh.png
│   │       ├── settings.png
│   │       ├── starter.png
│   │       ├── swap.png
│   │       ├── telegram.png
│   │       ├── token.png
│   │       ├── translate.png
│   │       ├── twitter.png
│   │       ├── Untitled.png
│   │       ├── Untitled2.png
│   │       ├── usdt_ars.png
│   │       ├── usdt_brl.png
│   │       ├── usdt_clp.png
│   │       └── wallet.png
│   │
│   ├── components/
│   │   ├── Footer/
│   │   │   ├── footer.css
│   │   │   └── index.jsx
│   │   ├── Nav/
│   │   │   └── index.jsx
│   │   ├── Spinner/
│   │   │   └── index.jsx
│   │   ├── NFTCard/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   ├── StakingPanel/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   └── TransactionHistory/
│   │       ├── index.jsx
│   │       └── styles.ts
│   │
│   ├── pages/
│   │   ├── Contact/
│   │   │   └── index.jsx
│   │   ├── Exchange/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   ├── Dashboard/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   ├── Staking/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   ├── Rewards/
│   │   │   ├── index.jsx
│   │   │   └── styles.ts
│   │   └── Analytics/
│   │       ├── index.jsx
│   │       └── styles.ts
│   │
│   ├── theme/
│   │   └── theme.ts
│   │
│   ├── web3/
│   │   ├── index.js
│   │   ├── NFT_ABI.json
│   │   ├── USDT_ABI.json
│   │   └── hooks/
│   │       ├── useNFTBalance.js
│   │       ├── useStaking.js
│   │       └── useRewards.js
│   │
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   │
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
│
├── .eslintrc.cjs
├── .gitignore
├── CHANGELOG.md
├── ENV_TEMPLATE.txt
├── IMPROVEMENTS_SUMMARY.md
├── index.html
├── package.json
├── package-lock.json
├── PROJECT_TREE.md
├── README.md
├── UPGRADE_GUIDE.md
├── vercel.json
└── vite.config.js
```

## Key Directories

### `/src/components/`
Reusable UI components used across multiple pages.

### `/src/pages/`
Page-level components, each representing a different route/view.

### `/src/web3/`
Web3 configuration, contract ABIs, and blockchain interaction hooks.

### `/src/utils/`
Utility functions and constants used throughout the app.

### `/src/assets/`
Static assets like images and icons.

### `/src/theme/`
Material-UI theme configuration.

## Component Hierarchy

```
App
├── Nav
├── Routes
│   ├── Exchange (Buy NFTs)
│   │   ├── Spinner
│   │   └── TextField
│   ├── Dashboard
│   │   ├── NFTCard (multiple)
│   │   └── TransactionHistory
│   ├── Staking
│   │   ├── StakingPanel
│   │   └── NFTCard (multiple)
│   ├── Rewards
│   │   └── RewardsPanel
│   └── Analytics
│       └── Charts
└── Footer
```

## State Management

- **Wagmi**: Web3 state (wallet, contracts, transactions)
- **React State**: Local component state
- **Material-UI**: Theme and styling state

## Key Features by Page

### Exchange (Buy NFTs)
- NFT minting
- USDT approval flow
- Transaction management
- Supply tracking

### Dashboard
- NFT gallery view
- Portfolio overview
- Recent transactions

### Staking
- Stake/unstake NFTs
- View staked NFTs
- Calculate rewards

### Rewards
- Claim rewards
- Rewards history
- APY calculator

### Analytics
- Market statistics
- Volume charts
- Holder distribution

