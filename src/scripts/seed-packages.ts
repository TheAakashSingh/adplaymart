import connectDB from '../lib/mongodb';
import { Package } from '../models';

const packages = [
  {
    name: 'Starter Package',
    description: 'Perfect for beginners to start their earning journey',
    price: 500,
    dailyIncome: 50,
    validity: 30,
    features: [
      'Video Rewards',
      'Ad Watching',
      'Basic Gaming',
      'Level 1-3 Income',
      'E-commerce Access'
    ],
    levelIncomePercentages: [10, 8, 6, 0, 0, 0, 0, 0, 0, 0],
    isActive: true,
    category: 'basic'
  },
  {
    name: 'Professional Package',
    description: 'Enhanced earning opportunities for serious users',
    price: 2000,
    dailyIncome: 200,
    validity: 60,
    features: [
      'All Starter Features',
      'Advanced Gaming',
      'Level 1-5 Income',
      'Premium Support',
      'Vendor Registration'
    ],
    levelIncomePercentages: [10, 8, 6, 4, 3, 0, 0, 0, 0, 0],
    isActive: true,
    category: 'professional'
  },
  {
    name: 'Business Package',
    description: 'Maximum earning potential for business builders',
    price: 5000,
    dailyIncome: 400,
    validity: 90,
    features: [
      'All Professional Features',
      'Premium Gaming',
      'Level 1-7 Income',
      'Priority Support',
      'Advanced Analytics'
    ],
    levelIncomePercentages: [10, 8, 6, 4, 3, 2, 2, 0, 0, 0],
    isActive: true,
    category: 'business'
  },
  {
    name: 'Enterprise Package',
    description: 'Ultimate package for top earners and leaders',
    price: 10000,
    dailyIncome: 600,
    validity: 120,
    features: [
      'All Business Features',
      'Exclusive Gaming',
      'Level 1-10 Income',
      'Dedicated Support',
      'Leadership Bonuses',
      'Custom Branding'
    ],
    levelIncomePercentages: [10, 8, 6, 4, 3, 2, 2, 1, 1, 1],
    isActive: true,
    category: 'enterprise'
  }
];

async function seedPackages() {
  try {
    await connectDB();
    
    // Clear existing packages
    await Package.deleteMany({});
    console.log('Cleared existing packages');
    
    // Insert new packages
    const createdPackages = await Package.insertMany(packages);
    console.log(`Created ${createdPackages.length} packages:`);
    
    createdPackages.forEach(pkg => {
      console.log(`- ${pkg.name}: ₹${pkg.price} (Daily: ₹${pkg.dailyIncome})`);
    });
    
    console.log('Package seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding packages:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedPackages();
