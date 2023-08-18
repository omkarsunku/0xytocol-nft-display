import React, { useState } from "react";
import Web3 from "web3";
import "./App.css";
import { main } from "./getNFTs";

function App() {
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await switchToMumbaiTestnet();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      // Fetch NFTs (replace with actual logic)
      fetchNFTs(accounts[0], web3);
    } else {
      alert("Please install MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);  // Clear the user account state
    // You can also clear any other related states here, if you have them.
  };

  async function switchToMumbaiTestnet() {
    const chainId = '0x13881'; // Chain ID for Mumbai testnet

    if (typeof window.ethereum !== 'undefined') {
      try {
        // Try to switch to Mumbai testnet if it's already added to MetaMask
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
      } catch (switchError) {
        // If the network hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId,
                chainName: 'Mumbai Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-mumbai.matic.today'],
                blockExplorerUrls: ['https://explorer-mumbai.maticvigil.com/'],
                // Optional: you might need to provide an icon URL if you have one
                iconUrls: ['https://matic.network/static/img/favicon.png']
              }]
            });
          } catch (addError) {
            console.error('Error adding Mumbai Testnet:', addError);
          }
        } else {
          console.error('Error switching to Mumbai Testnet:', switchError);
        }
      }
    } else {
      console.error('Ethereum provider is not available');
    }
  }

  const fetchNFTs = async (account, web3) => {
    const userNFTs = await main(account);

    // Sort by time held
    userNFTs.sort((a, b) => b.timeStamp - a.timeStamp);

    setNfts(userNFTs);
  };

  function timeAgo(timeStamp) {
    const secondsPerMinute = 60;
    const minutesPerHour = 60;
    const hoursPerDay = 24;
    const daysPerYear = 365.25;

    const then = new Date(timeStamp * 1000);
    const now = new Date();
    const secondsAgo = Math.floor((now - then) / 1000);

    if (secondsAgo < secondsPerMinute) {
      return `${secondsAgo} seconds ago`;
    } else if (secondsAgo < secondsPerMinute * minutesPerHour) {
      const minutesAgo = Math.floor(secondsAgo / secondsPerMinute);
      return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    } else if (secondsAgo < secondsPerMinute * minutesPerHour * hoursPerDay) {
      const hoursAgo = Math.floor(secondsAgo / (secondsPerMinute * minutesPerHour));
      return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    } else if (secondsAgo < secondsPerMinute * minutesPerHour * hoursPerDay * daysPerYear) {
      const daysAgo = Math.floor(secondsAgo / (secondsPerMinute * minutesPerHour * hoursPerDay));
      return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    } else {
      const yearsAgo = Math.floor(secondsAgo / (secondsPerMinute * minutesPerHour * hoursPerDay * daysPerYear));
      return `${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago`;
    }
  }



  return (
    <div className="App">
      <div className="walletSection">
        {account !== null ? (
          <>
            <span className="walletAddress">{account}</span>
            <button className="disconnectBtn" onClick={disconnectWallet}>Disconnect</button>
          </>
        ) : (
          <button className="connectBtn" onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>

      {account && (
        <table className="nftTable">
          <thead>
            <tr>
              <th>NFT Name with tokenID</th>
              <th>NFT Image</th>
              <th>Rank</th>
              <th>Time</th>
              <th>Contract Address</th>
            </tr>
          </thead>
          <tbody>
            {nfts.map((nft, index) => (
              <tr key={index}>
                <td>{nft.tokenName + " " + nft.tokenID}</td>
                <td>
                {(nft.metadata && nft.metadata.media[0].thumbnail) ? (
                    <img src={nft.metadata.media[0].thumbnail} alt={`${nft.tokenName} ${nft.tokenID}`} width="50" /> 
                  ) : (
                    'No Image'
                  )}
                </td>
                <td>{index + 1}</td>
                <td>{timeAgo(parseInt(nft.timeStamp))}</td>
                <td>{nft.contractAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
