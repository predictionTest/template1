import React, { useEffect, useState } from 'react'
import { useWeb3Modal } from "@web3modal/react";
import {
  useContract,
  useProvider,
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  useNetwork,
  useSwitchNetwork,
  useWaitForTransaction,
  useSigner
} from 'wagmi';
import { Button, TextField, Tooltip, Typography } from '@mui/material';
import { sepolia } from 'wagmi';
import { ethers } from "ethers";
import Nav from "../../components/Nav";
import { wallet, bsc, settings, refresh } from "../../assets/img";
import { useStyles } from './styles';
import LoadingAnimation from '../../components/Spinner';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

import { NFT_ContractConfig } from "../../web3";
import { USDT_ContractConfig } from "../../web3";

const Exchange = () => {
  const { classes } = useStyles();


  const [amountNFTs, setAmountNFTs] = useState("");
  const [addressForButton, setAddressForButton] = useState("connect");
  const [spinner, setSpinner] = useState(false);
  const [errorR, setErrorR] = useState("");
  const { open } = useWeb3Modal();
  const provider = useProvider();
  const { data } = useSigner();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { isLoading: SwNetworkLoading, switchNetwork } = useSwitchNetwork();

  const handleSW = () => switchNetwork?.(sepolia.id);

  const handleAmountNFTsChange = (e) => {
    setAmountNFTs(e.target.value);
  }


  const USDT_CONTRACT = useContract({
    ...USDT_ContractConfig,
    signerOrProvider: data,
  })

  const NFT_CONTRACT = useContract({
    ...NFT_ContractConfig,
    signerOrProvider: data,
  })

  const { data: BalanceUSDT } = useBalance({
    address: address,
    token: USDT_ContractConfig.address,
    watch: true,
  });

  const totalSupply = useContractRead({
    ...NFT_ContractConfig,
    functionName: 'totalSupply',
    watch: true,
  });

  const maxSupply = useContractRead({
    ...NFT_ContractConfig,
    functionName: 'maxSupply',
    watch: true,
  });

  const checkAvailableToBuy = (amount) => {
    const cap = Number(maxSupply.data);
    const current = Number(totalSupply.data);
    return current + amount <= cap && amount < 21 && amount > 0;
  };

  const checkIsZeroToBuy = (amount) => Number(amount) > 0;

  const handleAddressButton = () => {
    if (address) {
      setAddressForButton(`${address.slice(0, 4)}...${address.slice(-4)}`);
    } else {
      setAddressForButton("connect");
    }
  };

  useEffect(() => {
    handleAddressButton();
  }, [address]);







  const handleBuy = async (e) => {
    try {
      e.preventDefault();
      const amount = (amountNFTs * 1000);
      setErrorR("");

      // Check if network is supported
      if (chain?.unsupported) {
        handleSW();
        return;
      }

      // Validate amount
      if (!checkIsZeroToBuy(amountNFTs)) {
        setErrorR("Specify amount NFTs to buy!");
        return;
      }

      if (!checkAvailableToBuy(Number(amountNFTs))) {
        setErrorR("Available tokens to buy exceeded!");
        return;
      }

      // Check USDT balance
      if (Number(BalanceUSDT?.formatted) / 1000 < amountNFTs) {
        setErrorR("You don't have enough USDT for purchase!");
        return;
      }

      // Check and handle allowance
      let allowance = Number(ethers.utils.formatUnits(
        await USDT_CONTRACT?.allowance(address, NFT_ContractConfig.address),
        6
      ));

      if (allowance < amount) {
        setSpinner(true);

        if (allowance === 0) {
          // Approve for first time
          const approve = await USDT_CONTRACT?.approve(
            NFT_ContractConfig.address,
            ethers.utils.parseUnits(amount.toString(), 6)
          );
          await approve.wait();
        } else {
          // USDT requires resetting allowance to 0 first
          setErrorR("Resetting USDT allowance (required for USDT security)...");
          const approveZero = await USDT_CONTRACT?.approve(NFT_ContractConfig.address, 0);
          await approveZero.wait();

          setErrorR("Approving USDT spend...");
          const approve = await USDT_CONTRACT?.approve(
            NFT_ContractConfig.address,
            ethers.utils.parseUnits(amount.toString(), 6)
          );
          await approve.wait();
          setErrorR("");
        }
      }

      // Mint NFTs
      setSpinner(true);
      const tx = await NFT_CONTRACT?.mint(Number(amountNFTs));
      await tx.wait();

      setSpinner(false);
      setAmountNFTs("");
      setErrorR("NFTs minted successfully!");

    } catch (error) {
      setSpinner(false);

      if (error.code === "ACTION_REJECTED") {
        setErrorR("Transaction was rejected");
      } else {
        console.error("Purchase error:", error);
        setErrorR(error?.message || "Transaction failed");
        document.documentElement.scrollTop = 0;
      }
    }
  };



  return (
    <>


      <div className={classes.wrapper}>
        <Nav
          // setModal={setModalActive}
          page="Buy NFTs"
        />
        <div className={classes.main}>
          <div className={classes.main2}>

            <header className={classes.header}>
              <div className={classes.headerDiv}>
                <div className={classes.headerDivExchange}>
                  <a className={classes.headerDivExchangeLink}>
                    {"Buy NFT"}
                  </a>
                </div>

                <div className={classes.headerChain}>
                  <img src={bsc} alt="Sepolia" className={classes.headerChainImage} />
                  <p className={classes.headerChainText}>Sepolia</p>
                </div>


                <div className={classes.headerWallet}>
                  <button onClick={open} className={classes.headerWalletButton}>
                    <img src={wallet} alt="wallet" className={classes.headerWalletButtonImg} />
                    <div className={classes.headerWalletButtonDiv}>{addressForButton}</div>
                  </button>
                </div>
              </div>
            </header>



            <div className={classes.content}>
              <div className={classes.contentH}>
              </div>
              <div className={classes.mainBack}>
                <div className={classes.cMain1}>
                  <div>




                    <div className={classes.hero}>
                      <div className={classes.batman}>
                        <div className={classes.fx1}>
                          <div className={classes.item3}
                          // data-title="Maximum 20 NFTs for 1 transaction"
                          >
                            <Tooltip
                              title={
                                <Typography
                                  variant="body3"
                                  className={classes.tooltipContent}
                                >
                                  Maximum 20 NFTs for 1 transaction
                                </Typography>
                              }
                              placement="top"
                            >
                              <InfoRoundedIcon
                                className={classes.fx}
                                fontSize="medium"
                                color="action"
                              />
                            </Tooltip>
                            {/* Additional content goes here */}
                          </div>
                          {/* <InfoRoundedIcon
                            className={classes.fx}
                            fontSize='medium'
                            color="action"
                            titleAccess='Maximum 20 NFTs for 1 transaction'
                          /> */}
                          {/* <img
                            src={refresh}
                            alt="refresh"
                            className="settings"
                          // onClick={handleBuy}
                          />
                          <img
                            src={settings}
                            alt="settings"
                            className="cup"
                          /> */}
                        </div>

                        <div className={classes.ex1}></div>
                        <div className={classes.ex2}>
                          <div
                          // className={classes.ex3}
                          >


                            <form onSubmit={handleBuy} className={classes.formContainer}>
                              <TextField
                                name="amountNFTs"
                                onChange={handleAmountNFTsChange}
                                autoComplete="off"
                                placeholder="0"
                                id="outlined-basic"
                                label="NFT Amount"
                                variant="outlined"
                                className={classes.input}
                                InputProps={{
                                  inputProps: {
                                    maxLength: 2,
                                  },
                                }}
                              />
                              <div className={classes.buttonContainer}>
                                {isConnected
                                  ? (SwNetworkLoading
                                    ? <div className={classes.formContainer}>
                                      <LoadingAnimation />
                                      <div >
                                        Please change network
                                      </div>
                                    </div>
                                    : spinner
                                      ? <div className={classes.formContainer}>
                                        <LoadingAnimation />
                                        <div >
                                          transaction pending
                                        </div>
                                      </div>
                                      : (
                                        <Button
                                          className={classes.button64}
                                          type="submit"
                                          onClick={handleBuy}
                                        >
                                          <span className={classes.span}>Buy NFT</span>
                                        </Button>
                                      ))
                                  : (
                                    <Button
                                      className={classes.button64}
                                      type="button"
                                      onClick={open}
                                    >
                                      <span className={classes.span}>Buy NFT</span>
                                    </Button>
                                  )}
                              </div>

                              <div className={classes.errorR}>
                                {errorR}
                              </div>

                            </form>
                          </div>
                        </div>
                      </div>



                      <div>
                        <div className={classes.svg}>
                          <svg>
                            <filter id="filter">
                              <feTurbulence type="turbulence" baseFrequency="0.0001 0.01" numOctaves="6" seed="4" stitchTiles="stitch" result="turbulence" />
                              <feColorMatrix type="saturate" values="30" in="turbulence" result="colormatrix" />
                              <feColorMatrix type="matrix" values="1 1 1 0 0 0 1 0 1 1 1 0 1 0 0 0 0 0 150 -1" in="colormatrix" result="colormatrix1" />
                              <feComposite in="SourceGraphic" in2="colormatrix1" operator="in" result="composite" />
                              <feDisplacementMap in="SourceGraphic" in2="colormatrix1" scale="15" xChannelSelector="R" yChannelSelector="A" result="displacementMap" />
                            </filter>
                          </svg>
                        </div>

                        <div
                          className={classes.textPrice}
                          contentEditable={false}
                          spellCheck={false}>
                          1000 USDT for 1 NFT
                        </div>
                      </div>

                      <div className="center">
                        <h6>
                          <span>GENESIS</span>
                          <span>GENESIS</span>
                          <span>GENESIS</span>
                        </h6>
                      </div>











                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>






        </div>

      </div >





    </>
  );
};
export default Exchange;
