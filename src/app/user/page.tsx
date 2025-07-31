'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyRupeeIcon,
  UserGroupIcon,
  ChartBarIcon,
  GiftIcon,
  PlayIcon,
  ShoppingBagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  VideoCameraIcon,
  TrophyIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import VideoPlayer from '@/components/VideoPlayer';

interface User {
  _id: string;
  username: string;
  email: string;
  wallets?: {
    upgrade: number;
    withdrawal: number;
  };
  totalEarnings: number;
  totalReferrals: number;
  referralCode: string;
  currentPackage?: any;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [dailyIncomeStatus, setDailyIncomeStatus] = useState<any>(null);
  const [claimingIncome, setClaimingIncome] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchEarnings(token);
      fetchDailyIncomeStatus(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchEarnings = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleVideoComplete = (watchData: any) => {
    console.log('Video completed:', watchData);
    setShowWelcomeVideo(false);
    // Here you can add API call to update user's earnings
  };

  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
  };

  const fetchDailyIncomeStatus = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/daily-income', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDailyIncomeStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching daily income status:', error);
    }
  };

  const handleClaimDailyIncome = async () => {
    if (!dailyIncomeStatus?.canClaim) return;

    setClaimingIncome(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mlm/daily-income', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // Update user data
        if (user && data.data.wallets) {
          const updatedUser = { ...user, wallets: data.data.wallets, totalEarnings: data.data.totalEarnings };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        // Refresh daily income status
        fetchDailyIncomeStatus(token!);
        // Refresh earnings
        fetchEarnings(token!);
      } else {
        alert(data.message || 'Failed to claim daily income');
      }
    } catch (error) {
      console.error('Error claiming daily income:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setClaimingIncome(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }



  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Earn Play Grow
          </h2>
          <p className="text-gray-600 text-lg">
            Welcome back, {user.username}! Ready to earn more today?
          </p>
        </div>

        {/* Earnings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings Card */}
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold">₹{user.totalEarnings || 0}</p>
                <p className="text-purple-200 text-xs mt-1">All time earnings</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <CurrencyRupeeIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Today's Earnings Card */}
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Today</p>
                <p className="text-3xl font-bold">₹{earnings?.todayEarnings || 0}</p>
                <p className="text-green-200 text-xs mt-1">Daily progress</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Referrals Card */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Referrals</p>
                <p className="text-3xl font-bold">{user.totalReferrals || 0}</p>
                <p className="text-blue-200 text-xs mt-1">Active members</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Wallet</p>
                <p className="text-3xl font-bold">₹{(user.wallets?.withdrawal || 0) + (user.wallets?.upgrade || 0)}</p>
                <p className="text-orange-200 text-xs mt-1">Available balance</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <GiftIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Section */}
        {!user.currentPackage && (
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl mb-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">🚀 Start Your Investment Journey!</h3>
              <p className="text-lg text-indigo-100 mb-6">
                Choose from our premium investment packages and start earning daily income with guaranteed returns!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">₹500 - ₹100K</div>
                  <div className="text-indigo-200 text-sm">Investment Range</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">Daily Income</div>
                  <div className="text-indigo-200 text-sm">Guaranteed Returns</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">MLM Benefits</div>
                  <div className="text-indigo-200 text-sm">Level Income</div>
                </div>
              </div>
              <button
                onClick={() => router.push('/user/packages')}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
              >
                View Investment Packages →
              </button>
            </div>
          </div>
        )}

        {/* Current Package Section */}
        {user.currentPackage && dailyIncomeStatus && (
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">🎉 Active Investment Package</h3>
                <p className="text-green-100 mb-2">{dailyIncomeStatus.packageName}</p>
                <p className="text-green-200 text-sm mb-4">
                  Daily Income: ₹{dailyIncomeStatus.dailyAmount} | Days Remaining: {dailyIncomeStatus.daysRemaining}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClaimDailyIncome}
                    disabled={!dailyIncomeStatus.canClaim || claimingIncome}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      dailyIncomeStatus.canClaim && !claimingIncome
                        ? 'bg-white text-green-600 hover:bg-gray-100'
                        : 'bg-white bg-opacity-20 text-white text-opacity-70 cursor-not-allowed'
                    }`}
                  >
                    {claimingIncome ? 'Claiming...' : dailyIncomeStatus.canClaim ? 'Claim Daily Income' : 'Already Claimed'}
                  </button>
                  <button
                    onClick={() => router.push('/user/packages')}
                    className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Upgrade Package
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{user.totalEarnings || 0}</div>
                <div className="text-green-200 text-sm">Total Earned</div>
                <div className="text-lg font-semibold mt-2">₹{dailyIncomeStatus.totalEarned}</div>
                <div className="text-green-200 text-xs">From Current Package</div>
                <button
                  onClick={() => router.push('/user/earnings')}
                  className="mt-2 bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white px-4 py-1 rounded text-sm transition-all duration-200"
                >
                  View Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Welcome Video Card */}
          <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Welcome Video</h3>
                <p className="text-orange-100 text-sm">Complete and earn ₹100</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <VideoCameraIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            {!showWelcomeVideo ? (
              <div className="bg-black bg-opacity-20 rounded-xl p-4 flex items-center justify-center min-h-[200px]">
                <button
                  onClick={() => setShowWelcomeVideo(true)}
                  className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
                >
                  <PlayIcon className="w-6 h-6" />
                  <span className="font-medium">Start Welcome Video</span>
                </button>
              </div>
            ) : (
              <div className="bg-black bg-opacity-20 rounded-xl overflow-hidden">
                <VideoPlayer
                  videoId="welcome-001"
                  videoType="welcome"
                  title="Welcome to EarningApp"
                  description="Learn how to maximize your earnings"
                  reward={100}
                  duration={120}
                  onVideoComplete={handleVideoComplete}
                  onError={handleVideoError}
                />
              </div>
            )}
          </div>

          {/* Referral Code Section */}
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Referral Code</h3>
                <p className="text-pink-100 text-sm">Earn ₹50 per referral</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <GiftIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-bold text-white">
                  {user.referralCode}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(user.referralCode)}
                  className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{user.totalReferrals || 0}</p>
                <p className="text-pink-200 text-sm">Total Referrals</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">₹{(user.totalReferrals || 0) * 50}</p>
                <p className="text-pink-200 text-sm">Referral Earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* Watch Videos */}
            <button
              onClick={() => router.push('/user/videos')}
              className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <PlayIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Watch Videos</h4>
              <p className="text-xs text-cyan-100">Earn daily rewards</p>
            </button>

            {/* Referrals */}
            <button
              onClick={() => router.push('/user/referrals')}
              className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">MLM Network</h4>
              <p className="text-xs text-emerald-100">Team & referrals</p>
            </button>

            {/* Games */}
            <button
              onClick={() => router.push('/user/games')}
              className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Games</h4>
              <p className="text-xs text-violet-100">Play & earn</p>
            </button>

            {/* Invest */}
            <button
              onClick={() => router.push('/user/packages')}
              className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CurrencyRupeeIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Invest Now</h4>
              <p className="text-xs text-indigo-100">MLM packages</p>
            </button>

            {/* Earnings Report */}
            <button
              onClick={() => router.push('/user/earnings')}
              className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Earnings</h4>
              <p className="text-xs text-pink-100">View reports</p>
            </button>

            {/* Withdrawal */}
            <button
              onClick={() => router.push('/user/withdrawal')}
              className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowDownIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Withdraw</h4>
              <p className="text-xs text-teal-100">Cash out earnings</p>
            </button>

            {/* Shop */}
            <button
              onClick={() => router.push('/user/shop')}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBagIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">Shop</h4>
              <p className="text-xs text-amber-100">Browse products</p>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        {earnings && earnings.transactions && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              {earnings.transactions.slice(0, 5).map((transaction: any, index: number) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'referral_bonus' ? 'bg-green-100' :
                        transaction.type === 'level_income' ? 'bg-blue-100' :
                        transaction.type === 'withdrawal' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {transaction.type === 'referral_bonus' ? (
                          <UserGroupIcon className="w-5 h-5 text-green-600" />
                        ) : transaction.type === 'level_income' ? (
                          <TrophyIcon className="w-5 h-5 text-blue-600" />
                        ) : transaction.type === 'withdrawal' ? (
                          <ArrowDownIcon className="w-5 h-5 text-red-600" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}₹{transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {earnings.transactions.length > 5 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/user/transactions')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                >
                  View All Transactions
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    // </div>
  );
}
