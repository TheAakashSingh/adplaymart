import { connectDB } from '@/lib/mongodb';
import Package from '@/models/Package';

const packages = [
  {
    name: 'Starter Package',
    price: 500,
    description: 'Perfect for beginners to start their MLM journey with guaranteed daily income',
    features: [
      'Daily Income: ₹25',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Basic Support'
    ],
    dailyIncome: 25,
    validity: 30,
    gameReward: 5,
    adReward: 2,
    videoReward: 10,
    levelIncomePercentage: [10, 5, 3, 2, 1],
    isActive: true
  },
  {
    name: 'Basic Package',
    price: 1000,
    description: 'Most popular choice for steady income and enhanced benefits',
    features: [
      'Daily Income: ₹55',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Shopping Benefits',
      'Priority Support'
    ],
    dailyIncome: 55,
    validity: 30,
    gameReward: 10,
    adReward: 5,
    videoReward: 20,
    levelIncomePercentage: [12, 6, 4, 3, 2],
    isActive: true
  },
  {
    name: 'Premium Package',
    price: 5000,
    description: 'Enhanced benefits for serious investors with higher returns',
    features: [
      'Daily Income: ₹300',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Shopping Benefits',
      'Priority Support',
      'Exclusive Features'
    ],
    dailyIncome: 300,
    validity: 30,
    gameReward: 25,
    adReward: 15,
    videoReward: 50,
    levelIncomePercentage: [15, 8, 5, 4, 3],
    isActive: true
  },
  {
    name: 'VIP Package',
    price: 10000,
    description: 'Premium experience with maximum returns and VIP status',
    features: [
      'Daily Income: ₹650',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Shopping Benefits',
      'Priority Support',
      'VIP Status',
      'Exclusive Events'
    ],
    dailyIncome: 650,
    validity: 30,
    gameReward: 50,
    adReward: 30,
    videoReward: 100,
    levelIncomePercentage: [18, 10, 6, 5, 4],
    isActive: true
  },
  {
    name: 'Diamond Package',
    price: 25000,
    description: 'Elite package for high-value investors with diamond status',
    features: [
      'Daily Income: ₹1,750',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Shopping Benefits',
      'Priority Support',
      'Diamond Status',
      'Exclusive Events',
      'Personal Account Manager'
    ],
    dailyIncome: 1750,
    validity: 30,
    gameReward: 100,
    adReward: 75,
    videoReward: 250,
    levelIncomePercentage: [20, 12, 8, 6, 5],
    isActive: true
  },
  {
    name: 'Platinum Package',
    price: 50000,
    description: 'Ultimate package for maximum earnings with platinum status',
    features: [
      'Daily Income: ₹3,750',
      '30 Days Validity',
      'Level Income up to 5 levels',
      'Gaming Access with rewards',
      'Video Rewards',
      'Shopping Benefits',
      'Priority Support',
      'Platinum Status',
      'Exclusive Events',
      'Personal Account Manager',
      'VIP Customer Support'
    ],
    dailyIncome: 3750,
    validity: 30,
    gameReward: 200,
    adReward: 150,
    videoReward: 500,
    levelIncomePercentage: [25, 15, 10, 8, 6],
    isActive: true
  }
];

export async function seedPackages() {
  try {
    await connectDB();
    
    console.log('🌱 Starting package seeding...');
    
    // Clear existing packages
    await Package.deleteMany({});
    console.log('🗑️  Cleared existing packages');
    
    // Insert new packages
    const createdPackages = await Package.insertMany(packages);
    console.log(`✅ Successfully seeded ${createdPackages.length} packages`);
    
    // Display created packages
    createdPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name} - ₹${pkg.price} (₹${pkg.dailyIncome}/day)`);
    });
    
    return {
      success: true,
      message: `Successfully seeded ${createdPackages.length} packages`,
      packages: createdPackages
    };
    
  } catch (error) {
    console.error('❌ Error seeding packages:', error);
    return {
      success: false,
      message: 'Failed to seed packages',
      error: error
    };
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedPackages()
    .then((result) => {
      console.log('🎉 Seeding completed:', result.message);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
