import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Package } from '@/models';
import { ApiResponse } from '@/types';

const packages = [
  {
    name: 'Starter Package',
    description: 'Perfect for beginners to start their earning journey',
    price: 500,
    dailyIncome: 25,
    validity: 30,
    gameReward: 50,
    adReward: 25,
    videoReward: 25,
    features: [
      'Daily income for 30 days',
      'Video & Ad rewards',
      'Basic gaming rewards',
      'Level 1-3 MLM income',
      'E-commerce access',
      'Basic support'
    ],
    levelIncomePercentage: [10, 8, 6, 0, 0, 0, 0, 0, 0, 0],
    isActive: true
  },
  {
    name: 'Growth Package',
    description: 'Enhanced earning opportunities for serious users',
    price: 2000,
    dailyIncome: 120,
    validity: 60,
    gameReward: 200,
    adReward: 100,
    videoReward: 100,
    features: [
      'Daily income for 60 days',
      'Enhanced video & ad rewards',
      'Advanced gaming rewards',
      'Level 1-5 MLM income',
      'Premium support',
      'Vendor registration'
    ],
    levelIncomePercentage: [10, 8, 6, 4, 3, 0, 0, 0, 0, 0],
    isActive: true
  },
  {
    name: 'Premium Package',
    description: 'Maximum earning potential for business builders',
    price: 5000,
    dailyIncome: 350,
    validity: 90,
    gameReward: 500,
    adReward: 250,
    videoReward: 250,
    features: [
      'Daily income for 90 days',
      'Premium video & ad rewards',
      'Premium gaming rewards',
      'Level 1-7 MLM income',
      'Priority support',
      'Advanced analytics',
      'Exclusive bonuses'
    ],
    levelIncomePercentage: [15, 10, 8, 6, 4, 3, 2, 0, 0, 0],
    isActive: true
  },
  {
    name: 'Elite Package',
    description: 'Ultimate package for top earners and leaders',
    price: 10000,
    dailyIncome: 750,
    validity: 120,
    gameReward: 1000,
    adReward: 500,
    videoReward: 500,
    features: [
      'Daily income for 120 days',
      'Elite video & ad rewards',
      'Exclusive gaming rewards',
      'Level 1-10 MLM income',
      'Dedicated support manager',
      'Leadership bonuses',
      'Custom branding',
      'VIP treatment'
    ],
    levelIncomePercentage: [18, 12, 10, 8, 6, 4, 3, 2, 1, 1],
    isActive: true
  },
  {
    name: 'Diamond Package',
    description: 'Ultimate luxury package for diamond members',
    price: 25000,
    dailyIncome: 2000,
    validity: 180,
    gameReward: 2500,
    adReward: 1000,
    videoReward: 1000,
    features: [
      'Daily income for 180 days',
      'Diamond video & ad rewards',
      'Ultimate gaming rewards',
      'Maximum MLM income',
      'Personal account manager',
      'Exclusive diamond benefits',
      'Premium analytics',
      'Special recognition',
      'Luxury rewards'
    ],
    levelIncomePercentage: [20, 15, 12, 10, 8, 6, 5, 4, 3, 2],
    isActive: true
  }
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Clear existing packages
    await Package.deleteMany({});
    
    // Insert new packages
    const createdPackages = await Package.insertMany(packages);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Successfully created ${createdPackages.length} packages`,
      data: { packages: createdPackages }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error seeding packages:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Failed to seed packages',
      error: error.message
    }, { status: 500 });
  }
}
