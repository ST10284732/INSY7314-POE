const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Beneficiary = require('../models/beneficiaryModel');
const mongoose = require('mongoose');
const mongoSanitize = require('mongo-sanitize');

/**
 * Get all pending payments
 * GET /v1/employee/payments/pending
 * @access Employee only
 */
const getPendingPayments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        
        const skip = (page - 1) * limit;
        
        // Fetch pending payments with user information
        const payments = await Payment.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'firstname lastname username accountNumber')
            .select('-createdIP -userAgent');
        
        const totalPending = await Payment.countDocuments({ status: 'pending' });
        const totalPages = Math.ceil(totalPending / limit);
        
        console.log(`[EMPLOYEE] User ${req.user.username} retrieved ${payments.length} pending payments`);
        
        res.status(200).json({
            success: true,
            message: 'Pending payments retrieved successfully',
            data: {
                payments: payments,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalPayments: totalPending,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('[EMPLOYEE] Get pending payments error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving pending payments'
        });
    }
};

/**
 * Update payment status (approve or deny)
 * PATCH /v1/employee/payments/:id/status
 * @access Employee only
 */
const updatePaymentStatus = async (req, res) => {
    try {
        const paymentId = mongoSanitize(req.params.id);
        const sanitizedData = mongoSanitize(req.body);
        const { status, reason } = sanitizedData;
        
        console.log('[EMPLOYEE] Update payment request:', { paymentId, status, reason, user: req.user });
        
        // Validate payment ID
        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            console.log('[EMPLOYEE] Invalid payment ID format:', paymentId);
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID format'
            });
        }
        
        // Validate status
        const validStatuses = ['completed', 'failed', 'cancelled'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: completed, failed, cancelled'
            });
        }
        
        // Find payment
        const payment = await Payment.findById(paymentId);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        // Only allow updating pending or processing payments
        if (!['pending', 'processing'].includes(payment.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update payment with status: ${payment.status}`
            });
        }
        
        // Update payment status
        const oldStatus = payment.status;
        payment.status = status.toLowerCase();
        payment.updatedAt = new Date();
        
        // Add metadata about who updated it
        if (!payment.statusHistory) {
            payment.statusHistory = [];
        }
        payment.statusHistory.push({
            from: oldStatus,
            to: payment.status,
            updatedBy: req.user.userId,
            updatedByUsername: req.user.username,
            reason: reason || 'No reason provided',
            timestamp: new Date()
        });
        
        // If payment is approved (completed), deduct from customer balance and create transaction
        if (payment.status === 'completed') {
            const customer = await User.findById(payment.userId);
            
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
            
            // Check if customer has sufficient balance
            if (customer.balance < payment.amount) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance. Customer has ${customer.balance}, payment requires ${payment.amount}`
                });
            }
            
            // Deduct amount from customer balance
            customer.balance -= payment.amount;
            const balanceAfter = customer.balance;
            await customer.save();
            
            // Create transaction record
            const transaction = new Transaction({
                userId: payment.userId,
                type: 'payment',
                amount: -payment.amount, // Negative for debit
                currency: payment.currency,
                balanceAfter: balanceAfter,
                description: `Payment to ${payment.recipientName} - ${payment.paymentReference}`,
                category: 'other', // Use 'other' instead of 'transfer'
                status: 'completed',
                metadata: {
                    paymentId: payment.paymentId,
                    recipientName: payment.recipientName,
                    recipientAccount: payment.recipientAccount,
                    recipientBank: payment.recipientBank,
                    swiftCode: payment.swiftCode,
                    approvedBy: req.user.username,
                    approvedAt: new Date()
                }
            });
            
            await transaction.save();
            
            // Update beneficiary usage if matching beneficiary exists
            try {
                const beneficiary = await Beneficiary.findOne({
                    userId: payment.userId,
                    accountNumber: payment.recipientAccount,
                    isActive: true
                });
                
                if (beneficiary) {
                    await beneficiary.markAsUsed();
                    console.log(`[EMPLOYEE] Updated beneficiary usage: ${beneficiary.name}`);
                }
            } catch (err) {
                console.error('[EMPLOYEE] Failed to update beneficiary usage:', err.message);
                // Don't fail the payment if beneficiary update fails
            }
            
            console.log(`[EMPLOYEE] Payment ${payment.paymentId} approved - deducted ${payment.amount} from customer balance, new balance: ${balanceAfter}`);
        }
        
        await payment.save();
        
        console.log(`[EMPLOYEE] User ${req.user.username} updated payment ${payment.paymentId} from ${oldStatus} to ${payment.status}`);
        
        res.status(200).json({
            success: true,
            message: `Payment status updated to ${payment.status}`,
            payment: {
                id: payment._id,
                paymentId: payment.paymentId,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                recipientName: payment.recipientName,
                updatedAt: payment.updatedAt
            }
        });
        
    } catch (error) {
        console.error('[EMPLOYEE] Update payment status error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating payment status'
        });
    }
};

/**
 * Get payment history (approved/denied)
 * GET /v1/employee/payments/history
 * @access Employee only
 */
const getPaymentHistory = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const statusFilter = mongoSanitize(req.query.status);
        
        const skip = (page - 1) * limit;
        
        // Build query for non-pending payments
        const query = {
            status: { $in: ['completed', 'failed', 'cancelled'] }
        };
        
        // Filter by specific status if provided
        if (statusFilter && ['completed', 'failed', 'cancelled'].includes(statusFilter.toLowerCase())) {
            query.status = statusFilter.toLowerCase();
        }
        
        // Fetch payment history with user information
        const payments = await Payment.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'firstname lastname username accountNumber')
            .select('-createdIP -userAgent');
        
        const totalHistory = await Payment.countDocuments(query);
        const totalPages = Math.ceil(totalHistory / limit);
        
        console.log(`[EMPLOYEE] User ${req.user.username} retrieved ${payments.length} payment history records`);
        
        res.status(200).json({
            success: true,
            message: 'Payment history retrieved successfully',
            data: {
                payments: payments,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalPayments: totalHistory,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('[EMPLOYEE] Get payment history error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving payment history'
        });
    }
};

/**
 * Get payment statistics for employee dashboard
 * GET /v1/employee/stats
 * @access Employee only
 */
const getPaymentStatistics = async (req, res) => {
    try {
        // Get overall payment statistics
        const stats = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    processingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                    },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    failedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    cancelledCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    pendingAmount: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
                    },
                    completedAmount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalPayments: 0,
            totalAmount: 0,
            pendingCount: 0,
            processingCount: 0,
            completedCount: 0,
            failedCount: 0,
            cancelledCount: 0,
            pendingAmount: 0,
            completedAmount: 0
        };
        
        console.log(`[EMPLOYEE] User ${req.user.username} retrieved payment statistics`);
        
        res.status(200).json({
            success: true,
            message: 'Payment statistics retrieved successfully',
            stats: result
        });
        
    } catch (error) {
        console.error('[EMPLOYEE] Get payment statistics error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving statistics'
        });
    }
};

/**
 * Get single payment details with full history
 * GET /v1/employee/payments/:id
 * @access Employee only
 */
const getPaymentDetails = async (req, res) => {
    try {
        const paymentId = mongoSanitize(req.params.id);
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID format'
            });
        }
        
        // Find payment with user information
        const payment = await Payment.findById(paymentId)
            .populate('userId', 'firstname lastname username accountNumber idNumber');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        console.log(`[EMPLOYEE] User ${req.user.username} retrieved payment ${payment.paymentId} details`);
        
        res.status(200).json({
            success: true,
            message: 'Payment details retrieved successfully',
            payment: payment
        });
        
    } catch (error) {
        console.error('[EMPLOYEE] Get payment details error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving payment details'
        });
    }
};

module.exports = {
    getPendingPayments,
    updatePaymentStatus,
    getPaymentHistory,
    getPaymentStatistics,
    getPaymentDetails
};
