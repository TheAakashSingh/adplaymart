'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlayIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  VideoCameraIcon,
  GiftIcon,
  TrophyIcon,
  BanknotesIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const heroSlides = [
    {
      title: "Earn ₹100 Instantly",
      subtitle: "Watch Welcome Video & Get Instant Reward",
      icon: VideoCameraIcon,
      gradient: "from-green-400 to-blue-500"
    },
    {
      title: "Play & Earn Daily",
      subtitle: "Gaming + Ads = ₹600 Daily Income",
      icon: PlayIcon,
      gradient: "from-purple-400 to-pink-500"
    },
    {
      title: "Build Your Empire",
      subtitle: "MLM + E-commerce = Unlimited Growth",
      icon: RocketLaunchIcon,
      gradient: "from-orange-400 to-red-500"
    }
  ];

  const features = [
    {
      icon: VideoCameraIcon,
      title: 'Watch & Earn',
      description: 'Watch videos and ads to earn ₹100 daily',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      amount: '₹100/day'
    },
    {
      icon: PlayIcon,
      title: 'Gaming Rewards',
      description: 'Play games and earn up to ₹600 daily',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      amount: '₹600/day'
    },
    {
      icon: UserGroupIcon,
      title: 'MLM Network',
      description: 'Build team and earn from 25 levels',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      amount: 'Unlimited'
    },
    {
      icon: ShoppingBagIcon,
      title: 'E-commerce',
      description: 'Multi-vendor marketplace earnings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      amount: 'Commission'
    }
  ];

  const packages = [
    {
      name: 'Starter',
      price: '₹500',
      dailyIncome: '₹50',
      validity: '30 days',
      features: ['Video Rewards', 'Ad Watching', 'Basic Gaming', 'Level 1-3 Income'],
      icon: GiftIcon,
      color: 'from-green-400 to-green-600'
    },
    {
      name: 'Professional',
      price: '₹2,000',
      dailyIncome: '₹200',
      validity: '60 days',
      features: ['All Starter Features', 'Advanced Gaming', 'Level 1-5 Income', 'E-commerce Access'],
      popular: true,
      icon: TrophyIcon,
      color: 'from-blue-400 to-blue-600'
    },
    {
      name: 'Enterprise',
      price: '₹10,000',
      dailyIncome: '₹600',
      validity: '90 days',
      features: ['All Professional Features', 'Premium Gaming', 'Level 1-10 Income', 'Vendor Access'],
      icon: SparklesIcon,
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Users', icon: UserGroupIcon },
    { number: '₹50L+', label: 'Total Payouts', icon: BanknotesIcon },
    { number: '25', label: 'Income Levels', icon: TrophyIcon },
    { number: '24/7', label: 'Support', icon: SparklesIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ADPLAY-MART
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            {/* Dynamic Hero Content */}
            <div className="mb-8">
              <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${heroSlides[currentSlide].gradient} flex items-center justify-center transform transition-all duration-500 hover:scale-110`}>
                    {(() => {
                      const IconComponent = heroSlides[currentSlide].icon;
                      return <IconComponent className="w-10 h-10 text-white" />;
                    })()}
                  </div>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-2xl md:text-3xl text-gray-600 mb-8 font-light">
                  {heroSlides[currentSlide].subtitle}
                </p>
              </div>
            </div>

            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              🎉 <strong>Welcome Bonus:</strong> Get ₹100 instantly after watching welcome video!
              <br />
              💰 <strong>Daily Earnings:</strong> Watch ads (₹100/day) + Play games (₹600/day) + MLM commissions
              <br />
              🚀 <strong>Growth:</strong> Build your team across 25 levels and earn unlimited income!
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xl px-10 py-4 rounded-full hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold flex items-center justify-center"
              >
                🎁 Start Earning ₹100 Now
                <ArrowRightIcon className="w-6 h-6 ml-2" />
              </Link>
              <Link
                href="#features"
                className="border-2 border-gray-300 text-gray-700 text-xl px-10 py-4 rounded-full hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-semibold"
              >
                Learn How It Works
              </Link>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    {(() => {
                      const IconComponent = stat.icon;
                      return <IconComponent className="w-8 h-8 text-blue-600" />;
                    })()}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              💰 Multiple Ways to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Earn Money</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform offers diverse earning opportunities designed to maximize your daily income potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.bgColor} rounded-2xl p-8 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/50`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {(() => {
                      const IconComponent = feature.icon;
                      return <IconComponent className={`w-8 h-8 ${feature.color}`} />;
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className={`inline-block ${feature.color} font-bold text-lg px-4 py-2 rounded-full bg-white/50`}>
                    {feature.amount}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              🚀 How to Start Earning in 3 Simple Steps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Register & Watch Video</h4>
                <p className="text-gray-600">Sign up and watch the welcome video to earn ₹100 instantly</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Choose Your Package</h4>
                <p className="text-gray-600">Select an investment package to unlock higher earning potential</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Start Earning Daily</h4>
                <p className="text-gray-600">Watch ads, play games, refer friends and earn money every day</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              🎯 Investment <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Packages</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your investment level and start earning daily returns with our proven system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  pkg.popular ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      🔥 MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Package Header */}
                <div className={`bg-gradient-to-r ${pkg.color} p-8 text-white text-center`}>
                  {(() => {
                    const IconComponent = pkg.icon;
                    return <IconComponent className="w-12 h-12 mx-auto mb-4" />;
                  })()}
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-5xl font-bold mb-2">{pkg.price}</div>
                  <div className="text-xl font-semibold opacity-90">{pkg.dailyIncome}/day</div>
                  <div className="text-sm opacity-75">{pkg.validity}</div>
                </div>

                {/* Package Content */}
                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className={`w-full py-4 px-6 rounded-xl font-bold text-center transition-all duration-300 block ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {pkg.popular ? '🚀 Start Now' : 'Get Started'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Package Benefits */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              ✨ Why Choose Our Investment Packages?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Guaranteed Returns</h4>
                <p className="text-gray-600 text-sm">Daily income guaranteed for the entire package validity period</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">MLM Benefits</h4>
                <p className="text-gray-600 text-sm">Earn from your team's investments across multiple levels</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Bonus Features</h4>
                <p className="text-gray-600 text-sm">Access to gaming, shopping, and additional earning features</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-8">
            <SparklesIcon className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              🎉 Ready to Start Your <br />
              <span className="text-yellow-300">Earning Journey?</span>
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Join <strong>10,000+ users</strong> who are already earning daily through our platform. <br />
              Get <strong>₹100 welcome bonus</strong> instantly + unlock unlimited earning potential!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 hover:bg-yellow-50 text-xl px-10 py-4 rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              🎁 Register Now - Get ₹100 Free!
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-xl px-10 py-4 rounded-full font-bold transition-all duration-300"
            >
              Already a Member? Login
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">₹100</div>
              <div className="text-white/80">Instant Welcome Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">₹700</div>
              <div className="text-white/80">Daily Earning Potential</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">25</div>
              <div className="text-white/80">Income Levels</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ADPLAY-MART
                </h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                The ultimate platform combining MLM networking, e-commerce marketplace, and gaming rewards.
                Start your journey to financial freedom today!
              </p>
              <div className="flex space-x-4">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-yellow-400 font-bold">₹100</div>
                  <div className="text-gray-400 text-sm">Welcome Bonus</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-green-400 font-bold">₹700</div>
                  <div className="text-gray-400 text-sm">Daily Potential</div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#packages" className="text-gray-400 hover:text-white transition-colors">Packages</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2024 ADPLAY-MART by <span className="text-blue-400 font-semibold">SinghJi Tech</span>. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">Powered by</span>
                <div className="flex items-center space-x-1">
                  <RocketLaunchIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Next.js</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
