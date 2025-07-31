'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyRupeeIcon,
  ChartBarIcon,
  TrophyIcon,
  VideoCameraIcon,
  PlayIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface EarningsReport {
  summary: {
    totalEarnings: number;
    todayEarnings: number;
    thisMonthEarnings: number;
    totalTransactions: number;
    walletBalance: {
      upgrade: number;
      withdrawal: number;
      total: number;
    };
  };
  earningsByType: {
    daily_income: number;
    level_income: number;
    referral_bonus: number;
    video_reward: number;
    game_reward: number;
    ad_reward: number;
    welcome_bonus: number;
  };
  monthlyEarnings: Array<{
    month: string;
    amount: number;
    transactions: number;
  }>;
  dailyEarnings: Array<{
    date: string;
    amount: number;
    transactions: number;
  }>;
  roiData: {
    packageName: string;
    investmentAmount: number;
    totalEarned: number;
    roiPercentage: number;
    daysActive: number;
    daysRemaining: number;
    dailyAverage: number;
    projectedTotal: number;
    projectedROI: number;
  } | null;
  referralData: {
    totalReferrals: number;
    directReferrals: number;
    referralEarnings: number;
    averagePerReferral: number;
  };
  recentTransactions: Array<{
    type: string;
    amount: number;
    description: string;
    date: string;
    status: string;
  }>;
}

export default function EarningsPage() {
  const router = useRouter();
  const [report, setReport] = useState<EarningsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchEarningsReport(token);
  }, [router]);

  const fetchEarningsReport = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/earnings-report', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Failed to load earnings report</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                Earnings Report
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold">₹{report.summary.totalEarnings.toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Earnings</p>
                <p className="text-3xl font-bold">₹{report.summary.todayEarnings.toLocaleString()}</p>
              </div>
              <CalendarDaysIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">This Month</p>
                <p className="text-3xl font-bold">₹{report.summary.thisMonthEarnings.toLocaleString()}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Wallet Balance</p>
                <p className="text-3xl font-bold">₹{report.summary.walletBalance.total.toLocaleString()}</p>
              </div>
              <BanknotesIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>

        {/* ROI Section */}
        {report.roiData && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Investment ROI Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{report.roiData.investmentAmount.toLocaleString()}</div>
                <div className="text-gray-600 text-sm">Investment Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{report.roiData.totalEarned.toLocaleString()}</div>
                <div className="text-gray-600 text-sm">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{report.roiData.roiPercentage}%</div>
                <div className="text-gray-600 text-sm">Current ROI</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{report.roiData.projectedROI}%</div>
                <div className="text-gray-600 text-sm">Projected ROI</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-blue-600">{report.roiData.daysActive}</div>
                <div className="text-blue-700 text-sm">Days Active</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-green-600">{report.roiData.daysRemaining}</div>
                <div className="text-green-700 text-sm">Days Remaining</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-purple-600">₹{report.roiData.dailyAverage}</div>
                <div className="text-purple-700 text-sm">Daily Average</div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Earnings by Type</h3>
            <div className="space-y-4">
              {Object.entries(report.earningsByType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      type === 'daily_income' ? 'bg-green-500' :
                      type === 'level_income' ? 'bg-blue-500' :
                      type === 'referral_bonus' ? 'bg-purple-500' :
                      type === 'video_reward' ? 'bg-orange-500' :
                      type === 'game_reward' ? 'bg-pink-500' :
                      type === 'ad_reward' ? 'bg-indigo-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Referral Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.referralData.totalReferrals}</div>
                <div className="text-gray-600 text-sm">Total Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.referralData.directReferrals}</div>
                <div className="text-gray-600 text-sm">Direct Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{report.referralData.referralEarnings.toLocaleString()}</div>
                <div className="text-gray-600 text-sm">Referral Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{report.referralData.averagePerReferral}</div>
                <div className="text-gray-600 text-sm">Avg per Referral</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.recentTransactions.map((tx, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'daily_income' ? 'bg-green-100 text-green-800' :
                        tx.type === 'level_income' ? 'bg-blue-100 text-blue-800' :
                        tx.type === 'referral_bonus' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-green-600">₹{tx.amount}</td>
                    <td className="py-3 px-4 text-gray-700">{tx.description}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
