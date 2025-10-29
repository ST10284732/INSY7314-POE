const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');
const mongoSanitize = require('mongo-sanitize');

/**
 * Get account balance and summary
 * GET /v1/account/balance
 * @access Customer
 */
const getAccountBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('balance currency accountNumber accountType monthlySalary firstname lastname');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get recent transactions count
        const transactionCount = await Transaction.countDocuments({ 
            userId: user._id,
            status: 'completed'
        });
        
        // Get this month's spending
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlySpending = await Transaction.aggregate([
            {
                $match: {
                    userId: user._id,
                    transactionDate: { $gte: startOfMonth },
                    amount: { $lt: 0 }, // Only debits
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $abs: '$amount' } }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                balance: user.balance,
                currency: user.currency,
                accountNumber: user.accountNumber,
                accountType: user.accountType,
                accountHolder: `${user.firstname} ${user.lastname}`,
                monthlySalary: user.monthlySalary || 0,
                monthlySpending: monthlySpending.length > 0 ? monthlySpending[0].total : 0,
                transactionCount: transactionCount
            }
        });
        
    } catch (error) {
        console.error('[ACCOUNT] Get balance error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving balance'
        });
    }
};

/**
 * Get transaction history
 * GET /v1/account/transactions
 * @access Customer
 */
const getTransactions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const type = mongoSanitize(req.query.type);
        const category = mongoSanitize(req.query.category);
        const skip = (page - 1) * limit;
        
        // Build query
        const query = {
            userId: req.user.userId,
            status: 'completed'
        };
        
        if (type) query.type = type;
        if (category) query.category = category;
        
        // Get transactions
        const transactions = await Transaction.find(query)
            .sort({ transactionDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Get total count
        const totalCount = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            data: {
                transactions: transactions,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalCount: totalCount,
                    limit: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('[ACCOUNT] Get transactions error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving transactions'
        });
    }
};

/**
 * Add funds to account (deposit)
 * POST /v1/account/deposit
 * @access Customer
 */
const depositFunds = async (req, res) => {
    try {
        const sanitizedData = mongoSanitize(req.body);
        const { amount, description } = sanitizedData;
        
        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }
        
        // Get user
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update balance
        user.balance += amount;
        await user.save();
        
        // Create transaction record
        const transaction = await Transaction.create({
            userId: user._id,
            type: 'deposit',
            amount: amount,
            currency: user.currency,
            category: 'salary',
            description: description || 'Deposit to account',
            balanceAfter: user.balance,
            status: 'completed',
            metadata: {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent') || 'Unknown'
            }
        });
        
        console.log(`[ACCOUNT] User ${req.user.username} deposited ${amount} ${user.currency}`);
        
        res.status(200).json({
            success: true,
            message: 'Deposit successful',
            data: {
                transaction: transaction,
                newBalance: user.balance
            }
        });
        
    } catch (error) {
        console.error('[ACCOUNT] Deposit error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while processing deposit'
        });
    }
};

/**
 * Update monthly salary
 * PATCH /v1/account/salary
 * @access Customer
 */
const updateMonthlySalary = async (req, res) => {
    try {
        const sanitizedData = mongoSanitize(req.body);
        const { monthlySalary } = sanitizedData;
        
        if (!monthlySalary || monthlySalary < 0) {
            return res.status(400).json({
                success: false,
                message: 'Monthly salary must be 0 or greater'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { monthlySalary: monthlySalary },
            { new: true }
        ).select('monthlySalary');
        
        console.log(`[ACCOUNT] User ${req.user.username} set monthly salary to ${monthlySalary}`);
        
        res.status(200).json({
            success: true,
            message: 'Monthly salary updated successfully',
            data: {
                monthlySalary: user.monthlySalary
            }
        });
        
    } catch (error) {
        console.error('[ACCOUNT] Update salary error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating salary'
        });
    }
};

/**
 * Get spending by category for current month
 * GET /v1/account/spending
 * @access Customer
 */
const getSpendingByCategory = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const year = parseInt(req.query.year) || now.getFullYear();
        
        const spending = await Transaction.getSpendingByCategory(req.user.userId, month, year);
        
        res.status(200).json({
            success: true,
            data: {
                month: month,
                year: year,
                spending: spending
            }
        });
        
    } catch (error) {
        console.error('[ACCOUNT] Get spending error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving spending data'
        });
    }
};

/**
 * Recalculate account balance based on all transactions
 * POST /v1/account/recalculate-balance
 * @access Customer
 */
const recalculateBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all completed transactions in chronological order
        const transactions = await Transaction.find({
            userId: user._id,
            status: 'completed'
        }).sort({ transactionDate: 1 }); // Oldest first

        // Recalculate balance from scratch
        let calculatedBalance = 0;
        const updates = [];

        for (const transaction of transactions) {
            calculatedBalance += transaction.amount; // Amount is already signed (+ for credits, - for debits)
            
            // Update balanceAfter if it's incorrect
            if (transaction.balanceAfter !== calculatedBalance) {
                updates.push({
                    transactionId: transaction._id,
                    oldBalanceAfter: transaction.balanceAfter,
                    newBalanceAfter: calculatedBalance
                });
                
                transaction.balanceAfter = calculatedBalance;
                await transaction.save();
            }
        }

        // Update user's actual balance
        const oldUserBalance = user.balance;
        user.balance = calculatedBalance;
        await user.save();

        console.log(`[ACCOUNT] Balance recalculated for user ${req.user.username}: ${oldUserBalance} -> ${calculatedBalance}`);

        res.status(200).json({
            success: true,
            message: 'Balance recalculated successfully',
            data: {
                oldBalance: oldUserBalance,
                newBalance: calculatedBalance,
                transactionsProcessed: transactions.length,
                transactionsUpdated: updates.length,
                updates: updates
            }
        });

    } catch (error) {
        console.error('[ACCOUNT] Recalculate balance error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while recalculating balance'
        });
    }
};

module.exports = {
    getAccountBalance,
    getTransactions,
    depositFunds,
    updateMonthlySalary,
    getSpendingByCategory,
    recalculateBalance
};
