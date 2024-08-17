import { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = createContext({});

const { ethereum } = window;

const getEthereumContract = async () => {
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: e.target.value,
    }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert('Please install MetaMask');
      }

      const transactionContract = await getEthereumContract();
      const availableTransactions = await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map((transaction) => ({
        addressTo: transaction.receiver,
        addressFrom: transaction.sender,
        timestamp: new Date((+transaction.timestamp.toString()) * 1000).toLocaleString(),
        message: transaction.message,
        keyword: transaction.keyword,
        amount: parseInt(transaction.amount) / (10 ** 18),
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        return alert('Please install MetaMask');
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        await getAllTransactions();
      } else {
        console.log('No accounts found');
      }
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object');
    }
  };

  const checkIfTransactionExist = async () => {
    try {
      const transactionContract = await getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      localStorage.setItem('transactionCount', transactionCount.toString());
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object');
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert('Please install MetaMask');
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object');
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert('Please install MetaMask');
      }

      const { addressTo, amount, keyword, message } = formData;

      const transactionContract = await getEthereumContract();
      const parsedAmount = ethers.hexlify(ethers.toUtf8Bytes(amount));

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: '0x5208', // 21000 GWEI
          value: parsedAmount, // 0.00001
        }],
      });

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

      setIsLoading(true);

      await transactionHash.wait();

      setIsLoading(false);

      const transactionCount = await transactionContract.getTransactionCount();

      setTransactionCount(+transactionCount.toString());

      window.location.reload();
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        currentAccount,
        connectWallet,
        sendTransaction,
        formData,
        setFormData,
        handleChange,
        isLoading,
        transactions,
        transactionCount,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
