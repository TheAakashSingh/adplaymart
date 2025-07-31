'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface WithdrawalRequest {
  _id: string;
  amount: number;
  netAmount: number;
  tdsAmount: number;
  method: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  upiDetails?: {
    upiId: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  requestedAt: string;
  processedAt?: string;
  remarks?: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  wallets?: {
    upgrade: number;
    withdrawal: number;
  };
  totalEarnings: number;
  totalWithdrawals: number;
}

export default function WithdrawalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank',
    // Bank details
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    // UPI details
    upiId: '',
    upiName: ''
  });

  const minWithdrawal = 100;
  const maxWithdrawal = 50000;
  const tdsRate = 0.1; // 10% TDS

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
      fetchWithdrawalRequests(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchWithdrawalRequests = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/withdrawal', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    const availableBalance = user?.wallets?.withdrawal || 0;
    
    // Validation
    if (amount < minWithdrawal) {
      alert(`Minimum withdrawal amount is ₹${minWithdrawal}`);
      return;
    }
    
    if (amount > maxWithdrawal) {
      alert(`Maximum withdrawal amount is ₹${maxWithdrawal}`);
      return;
    }
    
    if (amount > availableBalance) {
      alert(`Insufficient balance. Available: ₹${availableBalance}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const requestData = {
        amount,
        method: formData.method,
        ...(formData.method === 'bank' ? {
          bankDetails: {
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName
          }
        } : {
          upiDetails: {
            upiId: formData.upiId,
            name: formData.upiName
          }
        })
      };
      
      const response = await fetch('/api/mlm/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Withdrawal request submitted successfully!');
        setShowForm(false);
        setFormData({
          amount: '',
          method: 'bank',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          bankName: '',
          upiId: '',
          upiName: ''
        });
        
        // Update user data
        if (data.data.user) {
          const updatedUser = { ...user, ...data.data.user };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Refresh withdrawal requests
        fetchWithdrawalRequests(token!);
      } else {
        alert(data.message || 'Withdrawal request failed');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'approved': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'processing': return <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const availableBalance = user?.wallets?.withdrawal || 0;
  const netAmount = formData.amount ? parseFloat(formData.amount) * (1 - tdsRate) : 0;
  const tdsAmount = formData.amount ? parseFloat(formData.amount) * tdsRate : 0;

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
                Withdrawal Center
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Available Balance</p>
                <p className="text-3xl font-bold">₹{availableBalance.toLocaleString()}</p>
              </div>
              <BanknotesIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold">₹{user?.totalEarnings.toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Withdrawals</p>
                <p className="text-3xl font-bold">₹{user?.totalWithdrawals.toLocaleString()}</p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Request Withdrawal</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              {showForm ? 'Cancel' : 'New Request'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (₹{minWithdrawal} - ₹{maxWithdrawal})
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  min={minWithdrawal}
                  max={Math.min(maxWithdrawal, availableBalance)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
                {formData.amount && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Withdrawal Amount:</span>
                      <span>₹{parseFloat(formData.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>TDS (10%):</span>
                      <span>-₹{tdsAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                      <span>Net Amount:</span>
                      <span className="text-green-600">₹{netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, method: 'bank'})}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      formData.method === 'bank' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <BuildingLibraryIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">Bank Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, method: 'upi'})}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      formData.method === 'upi' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCardIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">UPI</span>
                  </button>
                </div>
              </div>

              {/* Bank Details */}
              {formData.method === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* UPI Details */}
              {formData.method === 'upi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                      required
                      placeholder="example@paytm"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.upiName}
                      onChange={(e) => setFormData({...formData, upiName: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formData.amount || parseFloat(formData.amount) < minWithdrawal}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                  submitting || !formData.amount || parseFloat(formData.amount) < minWithdrawal
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
              </button>
            </form>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Withdrawal History</h3>
          
          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Net Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => (
                    <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{request.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-green-600">
                        ₹{request.netAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700 capitalize">
                        {request.method}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal Guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Withdrawal Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Processing Time</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bank Transfer: 1-3 business days</li>
                <li>• UPI: Instant to 24 hours</li>
                <li>• Processing on weekdays only</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Important Notes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Minimum withdrawal: ₹{minWithdrawal}</li>
                <li>• Maximum withdrawal: ₹{maxWithdrawal}</li>
                <li>• TDS: 10% as per government rules</li>
                <li>• Ensure correct bank/UPI details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
