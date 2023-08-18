import { Network, Alchemy } from "alchemy-sdk";

const settings = {
  apiKey: "UhcrnitjAWQ4J2KhQI7atNDxAx0-TMlK", 
  network: Network.MATIC_MUMBAI, 
};

const alchemy = new Alchemy(settings);

export const main = async (address) => {
  try {
    const res = await fetchNFTTransactionsForOwner(address);
    const enhancedTransactions = await enhanceNFTTransactionsWithMetadata(res);
    return enhancedTransactions;
  } catch (err) {
    throw err;
  }
};


export const fetchNFTTransactionsForOwner = async (owner) => {
  const baseUrl = 'https://api-testnet.polygonscan.com/api';
  const params = {
    module: 'account',
    action: 'tokennfttx',
    address: owner,
    page: 1,
    offset: 100,
    startblock: 0,
    endblock: 99999999,
    sort: 'asc',
    apikey: 'KJH2W1HKBSQVD1FJE7AREQB1Q4AJ5ZXS5R' // Replace 'YourApiKeyToken' with your actual API key
  };

  // Convert the params object to a URL query string
  const queryString = new URLSearchParams(params).toString();
  const url = `${baseUrl}?${queryString}`;

  try {
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.status === "1") {
        let res = await filterHeldTokens(data.result);
        return res;
      } else {
        throw new Error(data.message);
      }
    } else {
      throw new Error(`HTTP Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function filterHeldTokens(transactions) {
  const transferredOrBurnedTokens = new Set();

  // Identify tokens (with contract addresses) that have been transferred or burned
  for (const tx of transactions) {
    if (tx.from !== "0x0000000000000000000000000000000000000000") {
      const uniqueKey = `${tx.tokenID}-${tx.contractAddress}`;
      transferredOrBurnedTokens.add(uniqueKey);
    }
  }

  // Filter out transactions for tokens (with contract addresses) that were transferred or burned
  const filteredTransactions = transactions.filter(tx => {
    const uniqueKey = `${tx.tokenID}-${tx.contractAddress}`;
    return !transferredOrBurnedTokens.has(uniqueKey);
  });

  return filteredTransactions;
}



export const enhanceNFTTransactionsWithMetadata = async (transactions) => {
  // Use a map function to fetch metadata for each transaction and return an array of promises
  const promises = transactions.map(async (tx) => {
      try {
          // Fetch metadata for the current NFT using the alchemy API
          const metadata = await alchemy.nft.getNftMetadata(tx.contractAddress, tx.tokenID);

          // Return the transaction data combined with the fetched metadata
          return { ...tx, metadata };
      } catch (error) {
          console.error('Error fetching metadata for NFT:', tx.tokenID, 'Error:', error);
          // Return the original transaction if metadata fetch fails
          return tx;
      }
  });

  // Wait for all promises to resolve and return the combined array
  const enhancedTransactions = await Promise.all(promises);
  return enhancedTransactions;
};