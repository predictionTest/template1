import { Route, Routes } from "react-router-dom";

import Exchange from "./pages/Exchange";

import { Web3Modal, useWeb3ModalTheme } from "@web3modal/react";
import { WagmiConfig } from "wagmi";
import { wagmiClient, projectId, ethereumClient } from "./web3";

const App = () => {
  const { setTheme } = useWeb3ModalTheme();
  setTheme({
    themeMode: "dark",
  });
  
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <Routes>
          <Route path="*" element={<Exchange />} />
          {/* <Route path="/earn" element={<Earn />} />
          <Route path="/add-liquidity" element={<AddLiquidity />} />
          <Route path="/referralZone" element={<ReferralZone />} /> */}
        </Routes>
      </WagmiConfig>
      <Web3Modal 
      projectId={projectId}
      ethereumClient={ethereumClient}
      themeVariables={{
          "--w3m-accent-color": "#3766f1",
          "--w3m-background-color": "0",
          "--w3m-accent-fill-color": "#000000",
          "--w3m-color-overlay": "none",
          "--w3m-overlay-backdrop-filter": "blur(5px)",
        }} />
    </>
  );
};

export default App;
