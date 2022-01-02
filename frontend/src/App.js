import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import myEpicNft from './utils/MyEpicNFT.json';

//Loading icon
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import Loader from 'react-loader-spinner';

const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const PERSONAL_TWITTER_HANDLE = '@Henry89421';
const PERSONAL_TWITTER_LINK = `https://twitter.com/${PERSONAL_TWITTER_HANDLE}`;

// I moved the contract address to the top for easy access.
const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [raribleLink, setRaribleLink] = useState('');
  const [collectionLink, setCollectionLink] = useState('');
  const [currentMintCount, setCurrentMintCount] = useState(0);
  const [miningTransaction, setMiningTransaction] = useState(false);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log('Connected to chain ' + chainId);

    //Making sure only Rinkeby test net accounts are connected
    const rinkebyChainId = '0x4';
    if (chainId !== rinkebyChainId) {
      alert('Please connect to the Rinkeby Test Network!');
    }

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log('No authorized account found');
    }
  };

  //Making sure wallet is connected
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  //Setting the Rarible collection link
  useEffect(() => {
    setRaribleLink(
      `https://rinkeby.rarible.com/collection/${CONTRACT_ADDRESS}/items`
    );
  }, []);

  //Setting the initial current mint count
  useEffect(() => {
    async function setInitialMintCount() {
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

          let newMintCount = await connectedContract.getTotalMintedNFTs();
          setCurrentMintCount(newMintCount.toNumber());
          console.log('Successfully set the current mint count!');
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error);
      }
    }
    setInitialMintCount();
  }, []);

  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className='cta-button connect-wallet-button'
    >
      Connect to Wallet
    </button>
  );

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listeners
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        //This will "capture" our event when our contract throws it (very similar to webhooks)
        connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          setRaribleLink(
            `https://rinkeby.rarible.com/token/${CONTRACT_ADDRESS}:${tokenId.toNumber()}`
          );
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://rinkeby.rarible.com/token/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log('Setting up event listener!');
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
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

        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining...please wait.');
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );

        let newMintCount = await connectedContract.getTotalMintedNFTs();
        setCurrentMintCount(newMintCount.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className='cta-button connect-wallet-button'
    >
      Mint a New NFT
    </button>
  );

  return (
    <div className='App'>
      <div className='container'>
        <div className='header-container'>
          <p className='header gradient-text'>My NFT Collection</p>
          <p className='sub-text'>A unique collection of 100 epic NFTs.</p>
          <p className='sub-text'>
            <strong>{currentMintCount} / 100 NFTs minted so far</strong>
          </p>
        </div>

        <div className='buttons-container'>
          {currentAccount === ''
            ? renderNotConnectedContainer()
            : renderMintUI()}
          {raribleLink !== '' && (
            <div>
              <a href={raribleLink} target='_blank'>
                <button className='cta-button connect-wallet-button rarible-button'>
                  See your <i>new NFT </i>on Rarible
                </button>
              </a>
            </div>
          )}
          {/* {collectionLink && ( */}
          <div>
            <a href={raribleLink} target='_blank'>
              <button className='cta-button connect-wallet-button rarible-button'>
                View the Full Collection on Rarible!
              </button>
            </a>
          </div>
          {/* )} */}
        </div>

        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built on @${TWITTER_HANDLE}`}</a>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={PERSONAL_TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`Checkout my personal Twitter ${PERSONAL_TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
