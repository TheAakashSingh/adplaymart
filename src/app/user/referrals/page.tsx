'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  CurrencyRupeeIcon,
  ShareIcon,
  TrophyIcon,
  ChartBarIcon,
  UsersIcon,
  GiftIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface MLMStats {
  tree: {
    _id: string;
    username: string;
    email: string;
    level: number;
    totalEarnings: number;
    joinedAt: string;
    children: any[];
  };
  stats: {
    totalTeamMembers: number;
    directReferrals: number;
    totalTeamEarnings: number;
    levelWiseCount: { [key: string]: number };
    monthlyGrowth: number;
  };
}

interface User {
  _id: string;
  username: string;
  email: string;
  referralCode: string;
  totalReferrals: number;
  directReferrals: string[];
  totalEarnings: number;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mlmStats, setMLMStats] = useState<MLMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');

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
      setReferralLink(`${window.location.origin}/auth/register?ref=${parsedUser.referralCode}`);
      fetchMLMStats(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchMLMStats = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/tree?depth=5&includeStats=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMLMStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching MLM stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `🚀 Join ADPLAY-MART and start earning daily! 

💰 Daily Income from Investment Packages
🎮 Gaming Rewards
🎥 Video Watching Rewards  
👥 MLM Network Benefits

Use my referral code: ${user?.referralCode}

Register now: ${referralLink}

#EarnDaily #MLM #Investment #Gaming`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const renderMLMTree = (node: any, level: number = 0) => {
    if (level > 3) return null; // Limit depth for UI
    
    return (
      <div key={node._id} className={`${level > 0 ? 'ml-6 mt-4' : ''}`}>
        <div className={`bg-white/90 backdrop-blur-md rounded-lg p-4 border-l-4 ${
          level === 0 ? 'border-purple-500' :
          level === 1 ? 'border-blue-500' :
          level === 2 ? 'border-green-500' :
          'border-orange-500'
        } shadow-md`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                level === 0 ? 'bg-purple-500' :
                level === 1 ? 'bg-blue-500' :
                level === 2 ? 'bg-green-500' :
                'bg-orange-500'
              }`}>
                {node.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{node.username}</p>
                <p className="text-sm text-gray-600">Level {node.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">₹{node.totalEarnings}</p>
              <p className="text-xs text-gray-500">Total Earnings</p>
            </div>
          </div>
          
          {node.children && node.children.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Team Members: {node.children.length}</p>
              {node.children.slice(0, 3).map((child: any) => renderMLMTree(child, level + 1))}
              {node.children.length > 3 && (
                <div className="ml-6 mt-2 text-sm text-gray-500">
                  +{node.children.length - 3} more members...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
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
                MLM Network & Referrals
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {mlmStats && mlmStats.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Team</p>
                  <p className="text-3xl font-bold">{mlmStats.stats.totalTeamMembers || 0}</p>
                </div>
                <UserGroupIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Direct Referrals</p>
                  <p className="text-3xl font-bold">{mlmStats.stats.directReferrals || 0}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Team Earnings</p>
                  <p className="text-3xl font-bold">₹{mlmStats.stats.totalTeamEarnings || 0}</p>
                </div>
                <CurrencyRupeeIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Monthly Growth</p>
                  <p className="text-3xl font-bold">{mlmStats.stats.monthlyGrowth || 0}%</p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </div>
        )}

        {/* Referral Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Referral Code Section */}
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Your Referral Code</h3>
                <p className="text-pink-100 text-sm">Share and earn ₹50 per referral</p>
              </div>
              <GiftIcon className="w-8 h-8 text-white/80" />
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-bold text-white">
                  {user?.referralCode}
                </span>
                <button 
                  onClick={handleCopyReferralCode}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  {copied ? <CheckCircleIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{user?.totalReferrals || 0}</p>
                <p className="text-pink-200 text-sm">Total Referrals</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">₹{(user?.totalReferrals || 0) * 50}</p>
                <p className="text-pink-200 text-sm">Referral Earnings</p>
              </div>
            </div>
          </div>

          {/* Sharing Tools */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Share & Earn</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyReferralLink}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleShareWhatsApp}
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                
                <button
                  onClick={() => {
                    const text = `Join ADPLAY-MART with my referral code: ${user?.referralCode}. Register at: ${referralLink}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Join ADPLAY-MART', text, url: referralLink });
                    } else {
                      navigator.clipboard.writeText(text);
                      alert('Referral text copied to clipboard!');
                    }
                  }}
                  className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Level-wise Statistics */}
        {mlmStats && mlmStats.stats && mlmStats.stats.levelWiseCount && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Level-wise Team Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(mlmStats.stats.levelWiseCount).slice(0, 10).map(([level, count]) => (
                <div key={level} className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    parseInt(level) <= 3 ? 'bg-green-100 text-green-600' :
                    parseInt(level) <= 6 ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <span className="font-bold">{count}</span>
                  </div>
                  <p className="text-sm text-gray-600">Level {level}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MLM Tree Visualization */}
        {mlmStats && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Your MLM Network Tree</h3>
              <TrophyIcon className="w-6 h-6 text-yellow-500" />
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {renderMLMTree(mlmStats.tree)}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Showing top 3 members per level. Total team: {mlmStats.stats?.totalTeamMembers || 0} members
              </p>
            </div>
          </div>
        )}

        {/* Referral Benefits */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mt-8">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-6">Referral Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h4 className="font-bold text-gray-800 mb-2">Direct Referral Bonus</h4>
              <p className="text-gray-600 text-sm">Earn ₹50 for each person who joins with your referral code</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h4 className="font-bold text-gray-800 mb-2">Level Income</h4>
              <p className="text-gray-600 text-sm">Earn percentage from your team's package purchases up to 10 levels</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h4 className="font-bold text-gray-800 mb-2">Team Growth Bonus</h4>
              <p className="text-gray-600 text-sm">Additional bonuses based on your team's performance and growth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
