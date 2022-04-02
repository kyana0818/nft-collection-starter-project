import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, {useEffect, useState} from "react";

import myEpicNft from './utils/MyEpicNFT.json';

// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = 'hobbykyana';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/';
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = '0x0729bcc8f3604508C32a2506E46e6664db4C5601';


const RenderMintUI = (props) => {
    const [loadFlag, setLoadFlag] = useState(false);
    const {handler} = props;
    
    const wrapHandler = async () => {
        setLoadFlag(true);
        try {
            await handler();   
        } catch (error) {
            console.log(error);
        }
        setLoadFlag(false);
    };

    return (
        <button onClick={wrapHandler} className="cta-button connect-wallet-button" disabled={loadFlag}>
          {loadFlag? 'Waiting...': 'Mint NFT'}
        </button>
    );
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [count, setCount] = useState(0);

  console.log("currentAccount: ", currentAccount);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if(!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    } else {
      console.log('We have the etherreum object', ethereum);
    }
    const accounts = await ethereum.request({ method: 'eth_accounts'});

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);

      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  }

  const checkConnectedNetwork = async () => {
    const { ethereum } = window;
    if(ethereum) {
      let chainId = await ethereum.request({ method: 'eth_chainId'});
      console.log('Connected to chain', chainId);
      const rinkebyChainId = '0x4';
      if ( chainId !== rinkebyChainId ) {
        alert('You are not connected to the Rinkeby Test Network!');
      }
    }
  }

  const checkMintOrderTime = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        const time = await connectedContract.getMintOrderTime()

        setCount(time.toNumber());
      }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts"});
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(`あなたのウォレットに NFT を送信しました。 OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: ${OPENSEA_LINK}${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
          setCount(tokenId.toNumber());
        });
        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const askContractToMintNft = async () => {
    const {ethereum} = window;
    if (ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
    let nftTxn = await connectedContract.makeAnEpicNFT();
    console.log("Going to pop wlallet now to pay gas...");
    await nftTxn.wait()

    console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
    } else {
    console.log("Ethereum object doesn't exist!");
    }
  }

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );


  useEffect(() => {
    checkIfWalletIsConnected();
    checkConnectedNetwork();
    checkMintOrderTime();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            あなただけの特別な NFT を Mint しよう💫
          </p>
          <p className="sub-text">
            {count} / {TOTAL_MINT_COUNT}
          </p>
          {currentAccount === '' 
            ? renderNotConnectedContainer()
            : <RenderMintUI handler={askContractToMintNft} />
          }
        </div>
        <div className="footer-container">
          <a alt="collection link" href="#" className="footer-text" target="_blank">コレクションを表示</a>
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
