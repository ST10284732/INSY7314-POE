const Beneficiary = require('../models/beneficiaryModel');
const mongoose = require('mongoose');
const mongoSanitize = require('mongo-sanitize');

/**
 * Get all beneficiaries for the current user
 * GET /v1/beneficiaries
 * @access Customer
 */
const getBeneficiaries = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const sortBy = mongoSanitize(req.query.sortBy) || 'name';
        const sortOrder = mongoSanitize(req.query.sortOrder) || 'asc';
        const favorites = req.query.favorites === 'true';
        const search = mongoSanitize(req.query.search);
        
        const skip = (page - 1) * limit;
        
        // Build query
        const query = {
            userId: req.user.userId,
            isActive: true
        };
        
        if (favorites) {
            query.isFavorite = true;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nickname: { $regex: search, $options: 'i' } },
                { bankName: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Get beneficiaries
        const beneficiaries = await Beneficiary.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Get total count
        const totalCount = await Beneficiary.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        
        console.log(`[BENEFICIARY] User ${req.user.username} retrieved ${beneficiaries.length} beneficiaries`);
        
        res.status(200).json({
            success: true,
            data: {
                beneficiaries: beneficiaries,
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
        console.error('[BENEFICIARY] Get beneficiaries error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving beneficiaries'
        });
    }
};

/**
 * Get a single beneficiary by ID
 * GET /v1/beneficiaries/:id
 * @access Customer
 */
const getBeneficiary = async (req, res) => {
    try {
        const beneficiaryId = mongoSanitize(req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid beneficiary ID format'
            });
        }
        
        const beneficiary = await Beneficiary.findOne({
            _id: beneficiaryId,
            userId: req.user.userId
        });
        
        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: beneficiary
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Get beneficiary error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving beneficiary'
        });
    }
};

/**
 * Create a new beneficiary
 * POST /v1/beneficiaries
 * @access Customer
 */
const createBeneficiary = async (req, res) => {
    try {
        const sanitizedData = mongoSanitize(req.body);
        
        // Check if beneficiary with same account number already exists
        const existingBeneficiary = await Beneficiary.findOne({
            userId: req.user.userId,
            accountNumber: sanitizedData.accountNumber,
            isActive: true
        });
        
        if (existingBeneficiary) {
            return res.status(400).json({
                success: false,
                message: 'Beneficiary with this account number already exists'
            });
        }
        
        // Create beneficiary
        const beneficiary = new Beneficiary({
            userId: req.user.userId,
            name: sanitizedData.name,
            nickname: sanitizedData.nickname,
            bankName: sanitizedData.bankName,
            accountNumber: sanitizedData.accountNumber,
            swiftCode: sanitizedData.swiftCode.toUpperCase(),
            provider: sanitizedData.provider.toUpperCase(),
            currency: sanitizedData.currency?.toUpperCase() || 'ZAR',
            defaultReference: sanitizedData.defaultReference,
            isFavorite: sanitizedData.isFavorite || false
        });
        
        await beneficiary.save();
        
        console.log(`[BENEFICIARY] User ${req.user.username} created beneficiary: ${beneficiary.name}`);
        
        res.status(201).json({
            success: true,
            message: 'Beneficiary created successfully',
            data: beneficiary
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Create beneficiary error:', error.message);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Beneficiary with this account number already exists'
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating beneficiary'
        });
    }
};

/**
 * Update a beneficiary
 * PATCH /v1/beneficiaries/:id
 * @access Customer
 */
const updateBeneficiary = async (req, res) => {
    try {
        const beneficiaryId = mongoSanitize(req.params.id);
        const sanitizedData = mongoSanitize(req.body);
        
        if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid beneficiary ID format'
            });
        }
        
        const beneficiary = await Beneficiary.findOne({
            _id: beneficiaryId,
            userId: req.user.userId
        });
        
        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found'
            });
        }
        
        // Update fields
        const allowedUpdates = ['name', 'nickname', 'bankName', 'accountNumber', 'swiftCode', 'provider', 'currency', 'defaultReference', 'isFavorite'];
        
        Object.keys(sanitizedData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key === 'swiftCode' || key === 'provider' || key === 'currency') {
                    beneficiary[key] = sanitizedData[key].toUpperCase();
                } else {
                    beneficiary[key] = sanitizedData[key];
                }
            }
        });
        
        await beneficiary.save();
        
        console.log(`[BENEFICIARY] User ${req.user.username} updated beneficiary: ${beneficiary.name}`);
        
        res.status(200).json({
            success: true,
            message: 'Beneficiary updated successfully',
            data: beneficiary
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Update beneficiary error:', error.message);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating beneficiary'
        });
    }
};

/**
 * Delete a beneficiary (soft delete)
 * DELETE /v1/beneficiaries/:id
 * @access Customer
 */
const deleteBeneficiary = async (req, res) => {
    try {
        const beneficiaryId = mongoSanitize(req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid beneficiary ID format'
            });
        }
        
        const beneficiary = await Beneficiary.findOne({
            _id: beneficiaryId,
            userId: req.user.userId
        });
        
        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found'
            });
        }
        
        // Soft delete
        beneficiary.isActive = false;
        await beneficiary.save();
        
        console.log(`[BENEFICIARY] User ${req.user.username} deleted beneficiary: ${beneficiary.name}`);
        
        res.status(200).json({
            success: true,
            message: 'Beneficiary deleted successfully'
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Delete beneficiary error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting beneficiary'
        });
    }
};

/**
 * Get frequently used beneficiaries
 * GET /v1/beneficiaries/frequent
 * @access Customer
 */
const getFrequentBeneficiaries = async (req, res) => {
    try {
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));
        
        const beneficiaries = await Beneficiary.getFrequentlyUsed(req.user.userId, limit);
        
        res.status(200).json({
            success: true,
            data: beneficiaries
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Get frequent beneficiaries error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving frequent beneficiaries'
        });
    }
};

/**
 * Toggle favorite status
 * PATCH /v1/beneficiaries/:id/favorite
 * @access Customer
 */
const toggleFavorite = async (req, res) => {
    try {
        const beneficiaryId = mongoSanitize(req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid beneficiary ID format'
            });
        }
        
        const beneficiary = await Beneficiary.findOne({
            _id: beneficiaryId,
            userId: req.user.userId
        });
        
        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found'
            });
        }
        
        beneficiary.isFavorite = !beneficiary.isFavorite;
        await beneficiary.save();
        
        console.log(`[BENEFICIARY] User ${req.user.username} toggled favorite for beneficiary: ${beneficiary.name}`);
        
        res.status(200).json({
            success: true,
            message: `Beneficiary ${beneficiary.isFavorite ? 'added to' : 'removed from'} favorites`,
            data: {
                isFavorite: beneficiary.isFavorite
            }
        });
        
    } catch (error) {
        console.error('[BENEFICIARY] Toggle favorite error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while toggling favorite'
        });
    }
};

module.exports = {
    getBeneficiaries,
    getBeneficiary,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    getFrequentBeneficiaries,
    toggleFavorite
};
