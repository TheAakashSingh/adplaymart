'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  VideoCameraIcon,
  TrophyIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  WalletIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  VideoCameraIcon as VideoSolidIcon,
  TrophyIcon as TrophySolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  ShoppingBagIcon as ShoppingSolidIcon,
  WalletIcon as WalletSolidIcon,
  CurrencyRupeeIcon as CurrencySolidIcon,
  BanknotesIcon as BankSolidIcon,
  ChartBarIcon as ChartSolidIcon
} from '@heroicons/react/24/solid';

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
}

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

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

  const bottomNavItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/user',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon,
      color: 'text-purple-600'
    },
    {
      id: 'videos',
      label: 'Videos',
      path: '/user/videos',
      icon: VideoCameraIcon,
      activeIcon: VideoSolidIcon,
      color: 'text-blue-600'
    },
    {
      id: 'games',
      label: 'Games',
      path: '/user/games',
      icon: TrophyIcon,
      activeIcon: TrophySolidIcon,
      color: 'text-green-600'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      path: '/user/wallet',
      icon: WalletIcon,
      activeIcon: WalletSolidIcon,
      color: 'text-orange-600'
    },
    {
      id: 'more',
      label: 'More',
      path: '/user/more',
      icon: Bars3Icon,
      activeIcon: Bars3Icon,
      color: 'text-gray-600'
    }
  ];

  const sidebarItems = [
    {
      id: 'packages',
      label: 'Investment Packages',
      path: '/user/packages',
      icon: CurrencyRupeeIcon,
      color: 'text-purple-600'
    },
    {
      id: 'referrals',
      label: 'MLM Network',
      path: '/user/referrals',
      icon: UserGroupIcon,
      color: 'text-blue-600'
    },
    {
      id: 'shop',
      label: 'Shopping',
      path: '/user/shop',
      icon: ShoppingBagIcon,
      color: 'text-green-600'
    },
    {
      id: 'withdrawal',
      label: 'Withdrawal',
      path: '/user/withdrawal',
      icon: BanknotesIcon,
      color: 'text-red-600'
    },
    {
      id: 'earnings',
      label: 'Earnings Report',
      path: '/user/earnings',
      icon: ChartBarIcon,
      color: 'text-indigo-600'
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowSidebar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/user') {
      return pathname === '/user';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ADPLAY-MART
              </h1>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-3">
              {/* Wallet Balance */}
              {user?.wallets && (
                <div className="hidden sm:flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <WalletIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    ₹{((user.wallets.upgrade || 0) + (user.wallets.withdrawal || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile */}
              <button 
                onClick={() => setShowSidebar(true)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900"
              >
                <UserCircleIcon className="w-6 h-6" />
                <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            const IconComponent = active ? item.activeIcon : item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  active ? item.color : 'text-gray-500'
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div className="absolute bottom-0 w-8 h-1 bg-current rounded-t-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          {/* Sidebar */}
          <div className="bg-white w-80 h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user?.username}</h3>
                    <p className="text-purple-100 text-sm">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* User Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">₹{user?.totalEarnings.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs">Total Earned</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{user?.referralCode}</p>
                  <p className="text-purple-200 text-xs">Referral Code</p>
                </div>
              </div>
            </div>

            {/* Sidebar Menu */}
            <div className="p-4">
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Overlay to close sidebar */}
          <div 
            className="flex-1"
            onClick={() => setShowSidebar(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
