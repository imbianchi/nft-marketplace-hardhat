import { ethers } from 'ethers';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Navigation from './Navbar';
import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'

import './App.css';
import { useEffect, useState } from 'react';
import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import NFTAbi from '../contractsData/NFT.json';
import NFTAddress from '../contractsData/NFT-address.json';
import { Spinner } from 'react-bootstrap'

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nft, setNft] = useState();
  const [marketplace, setMarketplace] = useState();

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    await loadContracts(signer);
  }

  const loadContracts = async (signer) => {
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);

    setMarketplace(marketplace);
    setNft(nft);
    setLoading(false);
  }

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    web3Handler();  
  } , []);

  return (
    <BrowserRouter>
      <div className="App">
        <div>
          <>
            <Navigation web3Handler={web3Handler} account={account} />
          </>
          <div>
            {
              loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                  <Spinner animation="border" style={{ display: 'flex' }} />
                  <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
                </div>
              ) : (
                <Routes>
                  <Route path="/" element={
                    <Home marketplace={marketplace} nft={nft} />
                  } />
                  <Route path="/create" element={
                    <Create marketplace={marketplace} nft={nft} />
                  } />
                  <Route path="/my-listed-items" element={
                    <MyListedItems marketplace={marketplace} nft={nft} account={account} />
                  } />
                  <Route path="/my-purchases" element={
                    <MyPurchases marketplace={marketplace} nft={nft} account={account} />
                  } />
                </Routes>
              )
            }
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
