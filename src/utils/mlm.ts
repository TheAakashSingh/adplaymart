import { User, Package, Transaction } from '@/models';
import connectDB from '@/lib/mongodb';

// MLM Configuration
export const MLM_CONFIG = {
  MAX_LEVELS: 10,
  MATRIX_SIZE: 5, // 5x5 matrix
  DEFAULT_LEVEL_PERCENTAGES: [10, 8, 6, 4, 3, 2, 2, 1, 1, 1], // Level 1-10 percentages
  MIN_INVESTMENT: 500,
  MAX_INVESTMENT: 100000,
  TDS_PERCENTAGE: 10,
  WITHDRAWAL_PERCENTAGE: 10
};

// Calculate level income for a user's investment
export const calculateLevelIncome = async (
  userId: string,
  investmentAmount: number,
  packageId: string
) => {
  try {
    await connectDB();

    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userObjectId);
    const package_ = await Package.findById(packageId);
    
    if (!user || !package_) {
      throw new Error('User or package not found');
    }
    
    const levelIncomes = [];
    let currentUser = user;
    
    // Traverse up the MLM tree
    for (let level = 1; level <= MLM_CONFIG.MAX_LEVELS; level++) {
      if (!currentUser.sponsorId) break;
      
      const sponsor = await User.findById(currentUser.sponsorId);
      if (!sponsor) break;
      
      // Check if sponsor has an active package
      if (!sponsor.currentPackage) {
        currentUser = sponsor;
        continue;
      }
      
      const sponsorPackage = await Package.findById(sponsor.currentPackage);
      if (!sponsorPackage || !sponsorPackage.isActive) {
        currentUser = sponsor;
        continue;
      }
      
      // Calculate level income percentage
      const levelPercentage = sponsorPackage.getLevelIncomePercentage(level) || 
                             package_.getLevelIncomePercentage(level) ||
                             MLM_CONFIG.DEFAULT_LEVEL_PERCENTAGES[level - 1] || 0;
      
      if (levelPercentage > 0) {
        const incomeAmount = (investmentAmount * levelPercentage) / 100;
        
        levelIncomes.push({
          sponsorId: sponsor._id,
          sponsorUsername: sponsor.username,
          level,
          percentage: levelPercentage,
          amount: incomeAmount,
          investorId: userId,
          investorUsername: user.username
        });
      }
      
      currentUser = sponsor;
    }
    
    return levelIncomes;
  } catch (error) {
    console.error('Error calculating level income:', error);
    throw error;
  }
};

// Process level income distribution
export const distributeLevelIncome = async (levelIncomes: any[]) => {
  try {
    await connectDB();
    
    const transactions = [];
    
    for (const income of levelIncomes) {
      // Create transaction record
      const transaction = new Transaction({
        userId: income.sponsorId,
        type: 'level_income',
        amount: income.amount,
        status: 'completed',
        description: `Level ${income.level} income from ${income.investorUsername}'s investment`,
        netAmount: income.amount
      });
      
      await transaction.save();
      transactions.push(transaction);
      
      // Update sponsor's wallet
      const sponsor = await User.findById(income.sponsorId);
      if (sponsor) {
        if (!sponsor.wallets) {
          sponsor.wallets = { upgrade: 0, withdrawal: 0 };
        }
        sponsor.wallets.upgrade += income.amount;
        sponsor.totalEarnings += income.amount;
        await sponsor.save();
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Error distributing level income:', error);
    throw error;
  }
};

// Get MLM tree structure for a user
export const getMLMTree = async (userId: string, depth: number = 3) => {
  try {
    await connectDB();
    
    const buildTree = async (currentUserId: string, currentDepth: number): Promise<any> => {
      if (currentDepth > depth) return null;

      // Convert string to ObjectId if needed
      const mongoose = require('mongoose');
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(currentUserId);
      } catch (error) {
        return null; // Invalid ID format, skip this user
      }

      const user = await User.findById(userObjectId)
        .select('username email level totalEarnings currentPackage createdAt directReferrals')
        .populate('currentPackage', 'name price');
      
      if (!user) return null;
      
      const children = [];
      
      if (currentDepth < depth && user.directReferrals.length > 0) {
        for (const referralId of user.directReferrals) {
          const child = await buildTree(referralId, currentDepth + 1);
          if (child) children.push(child);
        }
      }
      
      return {
        userId: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        totalEarnings: user.totalEarnings,
        package: user.currentPackage,
        joinDate: user.createdAt,
        directReferrals: user.directReferrals.length,
        children
      };
    };
    
    return await buildTree(userId, 0);
  } catch (error) {
    console.error('Error getting MLM tree:', error);
    throw error;
  }
};

// Calculate team statistics
export const getTeamStats = async (userId: string) => {
  try {
    await connectDB();

    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userObjectId);
    if (!user) throw new Error('User not found');
    
    // Get all team members recursively
    const getAllTeamMembers = async (currentUserId: string, visited = new Set()): Promise<string[]> => {
      if (visited.has(currentUserId)) return [];
      visited.add(currentUserId);

      // Convert string to ObjectId if needed
      const mongoose = require('mongoose');
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(currentUserId);
      } catch (error) {
        return []; // Invalid ID format, skip this user
      }

      const currentUser = await User.findById(userObjectId).select('directReferrals');
      if (!currentUser) return [];
      
      let teamMembers = [...currentUser.directReferrals];
      
      for (const referralId of currentUser.directReferrals) {
        const subTeam = await getAllTeamMembers(referralId, visited);
        teamMembers = [...teamMembers, ...subTeam];
      }
      
      return teamMembers;
    };
    
    const allTeamMembers = await getAllTeamMembers(userId);
    const uniqueTeamMembers = [...new Set(allTeamMembers)];
    
    // Get team statistics
    const teamUsers = await User.find({ _id: { $in: uniqueTeamMembers } })
      .select('totalEarnings currentPackage investmentAmount createdAt');
    
    // Calculate level-wise distribution
    const levelWiseCount: { [key: string]: number } = {};

    // Get level-wise team members
    const getLevelWiseMembers = async (currentUserId: string, level: number = 1, visited = new Set()): Promise<void> => {
      if (visited.has(currentUserId) || level > 10) return; // Limit to 10 levels
      visited.add(currentUserId);

      const mongoose = require('mongoose');
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(currentUserId);
      } catch (error) {
        return;
      }

      const currentUser = await User.findById(userObjectId).select('directReferrals');
      if (!currentUser) return;

      if (currentUser.directReferrals.length > 0) {
        levelWiseCount[level] = (levelWiseCount[level] || 0) + currentUser.directReferrals.length;

        for (const referralId of currentUser.directReferrals) {
          await getLevelWiseMembers(referralId, level + 1, visited);
        }
      }
    };

    await getLevelWiseMembers(userId);

    const stats = {
      totalTeamMembers: uniqueTeamMembers.length,
      directReferrals: user.directReferrals.length,
      totalTeamEarnings: teamUsers.reduce((sum, member) => sum + member.totalEarnings, 0),
      totalTeamInvestment: teamUsers.reduce((sum, member) => sum + member.investmentAmount, 0),
      activeMembers: teamUsers.filter(member => member.currentPackage).length,
      thisMonthJoins: teamUsers.filter(member => {
        const joinDate = new Date(member.createdAt);
        const now = new Date();
        return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
      }).length,
      monthlyGrowth: uniqueTeamMembers.length > 0 ? Math.round((teamUsers.filter(member => {
        const joinDate = new Date(member.createdAt);
        const now = new Date();
        return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
      }).length / uniqueTeamMembers.length) * 100) : 0,
      levelWiseCount
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting team stats:', error);
    throw error;
  }
};

// Check if user can make withdrawal
export const canWithdraw = async (userId: string, amount: number) => {
  try {
    await connectDB();

    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userObjectId);
    if (!user) throw new Error('User not found');
    
    // Check minimum withdrawal amount
    if (amount < 100) {
      return { canWithdraw: false, reason: 'Minimum withdrawal amount is ₹100' };
    }
    
    // Check if user has sufficient balance
    if ((user.wallets?.withdrawal || 0) < amount) {
      return { canWithdraw: false, reason: 'Insufficient balance in withdrawal wallet' };
    }
    
    // Check if user has active package
    if (!user.currentPackage) {
      return { canWithdraw: false, reason: 'Active package required for withdrawal' };
    }
    
    // Check daily withdrawal limit (example: 10% of total earnings)
    const dailyLimit = user.totalEarnings * (MLM_CONFIG.WITHDRAWAL_PERCENTAGE / 100);
    
    // Get today's withdrawals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayWithdrawals = await Transaction.find({
      userId,
      type: 'withdrawal',
      status: { $in: ['completed', 'pending'] },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const todayWithdrawalAmount = todayWithdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    
    if (todayWithdrawalAmount + amount > dailyLimit) {
      return { 
        canWithdraw: false, 
        reason: `Daily withdrawal limit exceeded. Limit: ₹${dailyLimit}, Used: ₹${todayWithdrawalAmount}` 
      };
    }
    
    return { canWithdraw: true };
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error);
    throw error;
  }
};

// Calculate TDS for withdrawal
export const calculateTDS = (amount: number, tdsPercentage: number = MLM_CONFIG.TDS_PERCENTAGE) => {
  const tdsAmount = (amount * tdsPercentage) / 100;
  const netAmount = amount - tdsAmount;
  
  return {
    grossAmount: amount,
    tdsAmount,
    netAmount,
    tdsPercentage
  };
};

// Get user's earning summary
export const getEarningSummary = async (userId: string) => {
  try {
    await connectDB();

    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      console.log('User not found with ID:', userId);
      throw new Error('User not found');
    }
    
    // Get transaction summary
    const transactions = await Transaction.aggregate([
      { $match: { userId: userObjectId, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const summary = {
      totalEarnings: user.totalEarnings,
      wallets: user.wallets || { upgrade: 0, withdrawal: 0 },
      totalWithdrawals: user.totalWithdrawals,
      investmentAmount: user.investmentAmount,
      earningBreakdown: transactions.reduce((acc, tx) => {
        acc[tx._id] = {
          amount: tx.totalAmount,
          count: tx.count
        };
        return acc;
      }, {} as Record<string, any>)
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting earning summary:', error);
    throw error;
  }
};
