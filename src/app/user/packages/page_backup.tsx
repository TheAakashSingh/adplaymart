'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  TrophyIcon,
  VideoCameraIcon,
  PlayIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  dailyIncome: number;
  validity: number;
  features: string[];
  isActive: boolean;
  gameReward: number;
  adReward: number;
  videoReward: number;
  levelIncomePercentage: number[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  currentPackage?: string;
  wallets?: {
    upgrade: number;
    income: number;
    shopping: number;
  };
}

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'wallet' | 'online'>('wallet');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

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
      fetchPackages(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchPackages = async (token: string) => {
    try {
      const response = await fetch('/api/mlm/purchase-package', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data.packages || []);
      } else {
        // If API fails, use default packages
        setPackages(getDefaultPackages());
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Use default packages as fallback
      setPackages(getDefaultPackages());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPackages = (): Package[] => {
    return [
      {
        _id: 'starter',
        name: 'Starter Package',
        description: 'Perfect for beginners to start their MLM journey',
        price: 500,
        dailyIncome: 25,
        validity: 30,
        features: ['Daily Income: ₹25', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards'],
        isActive: true,
        gameReward: 5,
        adReward: 2,
        videoReward: 10,
        levelIncomePercentage: [10, 5, 3, 2, 1]
      },
      {
        _id: 'basic',
        name: 'Basic Package',
        description: 'Most popular choice for steady income',
        price: 1000,
        dailyIncome: 55,
        validity: 30,
        features: ['Daily Income: ₹55', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards', 'Shopping Benefits'],
        isActive: true,
        gameReward: 10,
        adReward: 5,
        videoReward: 20,
        levelIncomePercentage: [12, 6, 4, 3, 2]
      },
      {
        _id: 'premium',
        name: 'Premium Package',
        description: 'Enhanced benefits for serious investors',
        price: 5000,
        dailyIncome: 300,
        validity: 30,
        features: ['Daily Income: ₹300', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards', 'Shopping Benefits', 'Priority Support'],
        isActive: true,
        gameReward: 25,
        adReward: 15,
        videoReward: 50,
        levelIncomePercentage: [15, 8, 5, 4, 3]
      },
      {
        _id: 'vip',
        name: 'VIP Package',
        description: 'Premium experience with maximum returns',
        price: 10000,
        dailyIncome: 650,
        validity: 30,
        features: ['Daily Income: ₹650', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards', 'Shopping Benefits', 'Priority Support', 'VIP Status'],
        isActive: true,
        gameReward: 50,
        adReward: 30,
        videoReward: 100,
        levelIncomePercentage: [18, 10, 6, 5, 4]
      },
      {
        _id: 'diamond',
        name: 'Diamond Package',
        description: 'Elite package for high-value investors',
        price: 25000,
        dailyIncome: 1750,
        validity: 30,
        features: ['Daily Income: ₹1,750', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards', 'Shopping Benefits', 'Priority Support', 'Diamond Status', 'Exclusive Events'],
        isActive: true,
        gameReward: 100,
        adReward: 75,
        videoReward: 250,
        levelIncomePercentage: [20, 12, 8, 6, 5]
      },
      {
        _id: 'platinum',
        name: 'Platinum Package',
        description: 'Ultimate package for maximum earnings',
        price: 50000,
        dailyIncome: 3750,
        validity: 30,
        features: ['Daily Income: ₹3,750', '30 Days Validity', 'Level Income', 'Gaming Access', 'Video Rewards', 'Shopping Benefits', 'Priority Support', 'Platinum Status', 'Exclusive Events', 'Personal Manager'],
        isActive: true,
        gameReward: 200,
        adReward: 150,
        videoReward: 500,
        levelIncomePercentage: [25, 15, 10, 8, 6]
      }
    ];
  };

  const handlePurchaseClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mlm/purchase-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPackage._id,
          paymentMethod: selectedPayment
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Package purchased successfully! 🎉');
        setShowPurchaseModal(false);
        setSelectedPackage(null);
        // Update user data
        const updatedUser = { ...user!, currentPackage: selectedPackage._id };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        router.push('/user');
      } else {
        alert(data.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const calculateROI = (dailyIncome: number, validity: number, price: number) => {
    const totalEarnings = dailyIncome * validity;
    const roi = ((totalEarnings - price) / price) * 100;
    return Math.round(roi);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Choose Your Investment Plan
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Start your MLM journey with guaranteed daily income and exciting rewards
        </p>
        
        {/* Wallet Balance */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full">
                <BanknotesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900">₹{user?.wallets?.upgrade?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/user/wallet')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-2 shadow-lg border border-white/20">
            <button
              onClick={() => setSelectedPayment('wallet')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedPayment === 'wallet' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BanknotesIcon className="w-5 h-5" />
              <span>Wallet Payment</span>
            </button>
            <button
              onClick={() => setSelectedPayment('online')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedPayment === 'online' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CurrencyRupeeIcon className="w-5 h-5" />
              <span>Online Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg, index) => {
          const roi = calculateROI(pkg.dailyIncome, pkg.validity, pkg.price);
          const totalEarnings = pkg.dailyIncome * pkg.validity;
          const isPopular = index === 1; // Make middle package popular
          const isCurrentPackage = user?.currentPackage === pkg._id;
          
          return (
            <div 
              key={pkg._id} 
              className={`relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border transition-all duration-300 hover:scale-105 ${
                isPopular ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-white/20'
              } ${isCurrentPackage ? 'ring-2 ring-green-500/50' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                    <StarIcon className="w-4 h-4" />
                    <span>POPULAR</span>
                  </div>
                </div>
              )}
              
              {isCurrentPackage && (
                <div className="absolute -top-4 right-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>ACTIVE</span>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    ₹{pkg.price.toLocaleString()}
                  </div>
                  <p className="text-gray-600 text-sm">{pkg.description}</p>
                </div>

                {/* ROI Badge */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                    roi > 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    <TrophyIcon className="w-4 h-4 mr-1" />
                    {roi}% ROI
                  </div>
                </div>

                {/* Earnings Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">₹{pkg.dailyIncome}</div>
                    <div className="text-xs text-green-700">Daily Income</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">₹{totalEarnings.toLocaleString()}</div>
                    <div className="text-xs text-blue-700">Total Earnings</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                    <span>{pkg.validity} days validity</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <PlayIcon className="w-4 h-4 text-purple-500" />
                    <span>₹{pkg.gameReward} game rewards</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <VideoCameraIcon className="w-4 h-4 text-orange-500" />
                    <span>₹{pkg.videoReward} video rewards</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                    <span>MLM Level Income</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  {pkg.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchaseClick(pkg)}
                  disabled={purchasing || isCurrentPackage}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isCurrentPackage
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : purchasing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg'
                  }`}
                >
                  {purchasing ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Processing...</span>
                    </>
                  ) : isCurrentPackage ? (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Current Package</span>
                    </>
                  ) : (
                    <>
                      <span>Invest Now</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyRupeeIcon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Purchase</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to purchase the <strong>{selectedPackage.name}</strong> package?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Package Price:</span>
                  <span className="font-bold text-lg">₹{selectedPackage.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Daily Income:</span>
                  <span className="font-bold text-green-600">₹{selectedPackage.dailyIncome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-bold">{selectedPayment === 'wallet' ? 'Wallet' : 'Online'}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchaseConfirm}
                  disabled={purchasing}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                >
                  {purchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
