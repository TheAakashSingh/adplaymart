'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyRupeeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  PhoneIcon,
  ShareIcon,
  StarIcon,
  ShieldCheckIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
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
  referralCode: string;
  totalReferrals: number;
}

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const menuItems = [
    {
      category: 'Investment & Earnings',
      items: [
        {
          id: 'packages',
          label: 'Investment Packages',
          description: 'Browse and purchase packages',
          icon: CurrencyRupeeIcon,
          path: '/user/packages',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        {
          id: 'earnings',
          label: 'Earnings Report',
          description: 'View detailed earnings analytics',
          icon: ChartBarIcon,
          path: '/user/earnings',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          id: 'withdrawal',
          label: 'Withdrawal',
          description: 'Cash out your earnings',
          icon: BanknotesIcon,
          path: '/user/withdrawal',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      ]
    },
    {
      category: 'Network & Shopping',
      items: [
        {
          id: 'referrals',
          label: 'MLM Network',
          description: 'Manage your team and referrals',
          icon: UserGroupIcon,
          path: '/user/referrals',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        },
        {
          id: 'shop',
          label: 'Shopping',
          description: 'Browse products and shop',
          icon: ShoppingBagIcon,
          path: '/user/shop',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      ]
    },
    {
      category: 'Account & Support',
      items: [
        {
          id: 'profile',
          label: 'Profile Settings',
          description: 'Update your profile information',
          icon: UserCircleIcon,
          path: '/user/profile',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          description: 'Manage notification preferences',
          icon: BellIcon,
          path: '/user/notifications',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        },
        {
          id: 'help',
          label: 'Help & Support',
          description: 'Get help and contact support',
          icon: QuestionMarkCircleIcon,
          path: '/user/help',
          color: 'text-teal-600',
          bgColor: 'bg-teal-100'
        },
        {
          id: 'terms',
          label: 'Terms & Privacy',
          description: 'Read our terms and privacy policy',
          icon: DocumentTextIcon,
          path: '/user/terms',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      ]
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* User Profile Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.username}</h2>
            <p className="text-purple-100">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">₹{user?.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">{user?.totalReferrals} Referrals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{((user?.wallets?.upgrade || 0) + (user?.wallets?.withdrawal || 0)).toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">Total Wallet</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{user?.referralCode}</div>
            <div className="text-gray-600 text-sm">Referral Code</div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-8">
        {menuItems.map((section) => (
          <div key={section.category}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{section.category}</h3>
            <div className="space-y-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className="w-full bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-gray-800">{item.label}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Share App Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl mt-8">
        <div className="text-center">
          <ShareIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Share ADPLAY-MART</h3>
          <p className="text-green-100 mb-4">Invite friends and earn ₹50 per referral</p>
          <button
            onClick={() => {
              const message = `🚀 Join ADPLAY-MART and start earning daily! Use my referral code: ${user?.referralCode}`;
              if (navigator.share) {
                navigator.share({ title: 'Join ADPLAY-MART', text: message });
              } else {
                navigator.clipboard.writeText(message);
                alert('Referral message copied to clipboard!');
              }
            }}
            className="bg-white text-green-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all duration-200"
          >
            Share Now
          </button>
        </div>
      </div>

      {/* Rate App Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 mt-6">
        <div className="text-center">
          <div className="flex justify-center space-x-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Rate Our App</h3>
          <p className="text-gray-600 text-sm mb-4">Help us improve by rating your experience</p>
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200">
            Rate 5 Stars ⭐
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center mt-8 mb-4">
        <p className="text-gray-500 text-sm">ADPLAY-MART v1.0.0</p>
        <p className="text-gray-400 text-xs">© 2024 ADPLAY-MART. All rights reserved.</p>
      </div>

      {/* Logout Button */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
