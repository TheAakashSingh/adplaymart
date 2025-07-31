'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyRupeeIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  WalletIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  username: string;
  email: string;
  wallets?: {
    upgrade: number;
    withdrawal: number;
  };
  totalEarnings: number;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [addFundsData, setAddFundsData] = useState({
    amount: '',
    method: 'upi'
  });
  
  const [transferData, setTransferData] = useState({
    amount: '',
    fromWallet: 'upgrade',
    toWallet: 'withdrawal'
  });

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Pay with UPI apps' },
    { id: 'card', name: 'Card', icon: '💳', description: 'Debit/Credit Card' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'Online Banking' },
    { id: 'wallet', name: 'Digital Wallet', icon: '💰', description: 'Paytm, PhonePe, etc.' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchWalletData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchWalletData = async (token: string) => {
    try {
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(prev => ({ ...prev!, wallets: data.data.wallets }));
        setTransactions(data.data.recentTransactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(addFundsData.amount);
    
    if (amount < 100 || amount > 50000) {
      alert('Amount must be between ₹100 and ₹50,000');
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add_funds',
          amount,
          method: addFundsData.method
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // In production, redirect to payment gateway
        alert(`Payment order created! Order ID: ${data.data.orderId}\nAmount: ₹${amount}\n\nIn production, you would be redirected to payment gateway.`);
        
        // For demo, simulate successful payment
        setTimeout(() => {
          // Update user wallet (simulation)
          setUser(prev => ({
            ...prev!,
            wallets: {
              ...prev!.wallets!,
              upgrade: (prev!.wallets?.upgrade || 0) + amount
            }
          }));
          
          setShowAddFunds(false);
          setAddFundsData({ amount: '', method: 'upi' });
          fetchWalletData(token!);
        }, 2000);
      } else {
        alert(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(transferData.amount);
    const fromBalance = user?.wallets?.[transferData.fromWallet as keyof typeof user.wallets] || 0;
    
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount > fromBalance) {
      alert(`Insufficient balance in ${transferData.fromWallet} wallet`);
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'transfer',
          amount,
          fromWallet: transferData.fromWallet,
          toWallet: transferData.toWallet
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Transfer completed successfully!');
        setUser(prev => ({ ...prev!, wallets: data.data.wallets }));
        setShowTransfer(false);
        setTransferData({ amount: '', fromWallet: 'upgrade', toWallet: 'withdrawal' });
        fetchWalletData(token!);
      } else {
        alert(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Error transferring funds:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownIcon className="w-5 h-5 text-green-500" />;
      case 'withdrawal': return <ArrowUpIcon className="w-5 h-5 text-red-500" />;
      case 'transfer': return <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />;
      case 'package_purchase': return <CurrencyRupeeIcon className="w-5 h-5 text-purple-500" />;
      default: return <CurrencyRupeeIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const totalBalance = (user?.wallets?.upgrade || 0) + (user?.wallets?.withdrawal || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/user')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Wallet
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Balance</p>
                <p className="text-3xl font-bold">₹{totalBalance.toLocaleString()}</p>
              </div>
              <WalletIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          {/* Upgrade Wallet */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Upgrade Wallet</p>
                <p className="text-3xl font-bold">₹{(user?.wallets?.upgrade || 0).toLocaleString()}</p>
                <p className="text-blue-200 text-xs">For investments</p>
              </div>
              <ArrowUpIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          {/* Withdrawal Wallet */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Withdrawal Wallet</p>
                <p className="text-3xl font-bold">₹{(user?.wallets?.withdrawal || 0).toLocaleString()}</p>
                <p className="text-green-200 text-xs">Available to withdraw</p>
              </div>
              <ArrowDownIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Add Funds */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Add Funds</h3>
                  <p className="text-gray-600 text-sm">Deposit money to your wallet</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddFunds(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
            >
              Add Money
            </button>
          </div>

          {/* Transfer Funds */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <ArrowsRightLeftIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Transfer Funds</h3>
                  <p className="text-gray-600 text-sm">Move money between wallets</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTransfer(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
            >
              Transfer Money
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyRupeeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()} • 
                        <span className={`ml-1 ${
                          transaction.status === 'completed' ? 'text-green-600' :
                          transaction.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {transaction.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add Funds</h3>
              <button
                onClick={() => setShowAddFunds(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddFunds} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹100 - ₹50,000)
                </label>
                <input
                  type="number"
                  value={addFundsData.amount}
                  onChange={(e) => setAddFundsData({...addFundsData, amount: e.target.value})}
                  min="100"
                  max="50000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setAddFundsData({...addFundsData, method: method.id})}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        addFundsData.method === method.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium">{method.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={processing || !addFundsData.amount}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                  processing || !addFundsData.amount
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                {processing ? 'Processing...' : 'Add Funds'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Transfer Funds</h3>
              <button
                onClick={() => setShowTransfer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <select
                    value={transferData.fromWallet}
                    onChange={(e) => setTransferData({...transferData, fromWallet: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="upgrade">Upgrade Wallet</option>
                    <option value="withdrawal">Withdrawal Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <select
                    value={transferData.toWallet}
                    onChange={(e) => setTransferData({...transferData, toWallet: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="withdrawal">Withdrawal Wallet</option>
                    <option value="upgrade">Upgrade Wallet</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={processing || !transferData.amount || transferData.fromWallet === transferData.toWallet}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                  processing || !transferData.amount || transferData.fromWallet === transferData.toWallet
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                }`}
              >
                {processing ? 'Processing...' : 'Transfer Funds'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
