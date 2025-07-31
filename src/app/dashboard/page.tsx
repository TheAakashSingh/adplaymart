'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  username: string;
  email: string;
  wallets: {
    upgrade: number;
    withdrawal: number;
  };
  currentPackage: {
    name: string;
    price: number;
    dailyIncome: number;
  } | null;
  gaming: {
    totalEarnings: number;
    gamesPlayed: number;
    highScore: number;
  };
  referralCode: string;
  totalReferrals: number;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  progress: number;
  target: number;
}

export default function UserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchDailyTasks();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.data);
      } else {
        setError('Failed to load user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    }
  };

  const fetchDailyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/gaming/daily-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDailyTasks(data.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimLoginBonus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/gaming/daily-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: 'login' })
      });

      if (response.ok) {
        fetchUserData();
        fetchDailyTasks();
      }
    } catch (error) {
      console.error('Error claiming login bonus:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User data not found'}</p>
          <button 
            onClick={fetchUserData}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const loginTask = dailyTasks.find(task => task.id === 'login');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userData.username}!</h1>
              <p className="text-gray-600">Track your earnings and complete daily tasks</p>
            </div>
            {!userData.currentPackage && (
              <button 
                onClick={() => router.push('/packages')}
                className="btn btn-primary"
              >
                Choose Package
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Upgrade Wallet</p>
                  <p className="text-2xl font-bold">₹{userData.wallets.upgrade.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-4 4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Withdrawal Wallet</p>
                  <p className="text-2xl font-bold">₹{userData.wallets.withdrawal.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Gaming Earnings</p>
                  <p className="text-2xl font-bold">₹{userData.gaming.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Tasks */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Daily Tasks</h3>
                <p className="text-sm text-gray-600">Complete tasks to earn rewards</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dailyTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full mr-3 ${
                            task.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <div className="flex items-center mt-1">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${(task.progress / task.target) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {task.progress}/{task.target}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">+₹{task.reward}</p>
                        {task.id === 'login' && !task.completed && (
                          <button 
                            onClick={claimLoginBonus}
                            className="btn btn-sm btn-primary mt-2"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Package Info */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Package</h3>
                {userData.currentPackage ? (
                  <div>
                    <div className="bg-primary-light rounded-lg p-4">
                      <h4 className="font-medium text-primary">{userData.currentPackage.name}</h4>
                      <p className="text-sm text-gray-600">₹{userData.currentPackage.price}</p>
                      <p className="text-sm text-green-600">Daily Income: ₹{userData.currentPackage.dailyIncome}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">No active package</p>
                    <button 
                      onClick={() => router.push('/packages')}
                      className="btn btn-primary w-full"
                    >
                      Choose Package
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/gaming')}
                    className="w-full btn btn-outline"
                  >
                    Play Games
                  </button>
                  <button 
                    onClick={() => router.push('/shop')}
                    className="w-full btn btn-outline"
                  >
                    Shop Products
                  </button>
                  <button 
                    onClick={() => router.push('/wallet')}
                    className="w-full btn btn-outline"
                  >
                    Manage Wallet
                  </button>
                  <button 
                    onClick={() => router.push('/referrals')}
                    className="w-full btn btn-outline"
                  >
                    Refer Friends
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Info */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Program</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{userData.totalReferrals}</p>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Your Referral Code</p>
                    <p className="font-mono font-medium">{userData.referralCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
