const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const mongoSanitize = require('mongo-sanitize');

/**
 * Get all employees in the system
 * GET /v1/admin/employees
 * @access Admin only
 */
const getAllEmployees = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const roleFilter = mongoSanitize(req.query.role);
        
        const skip = (page - 1) * limit;
        
        // Build query to get all staff (Employee and Admin)
        const query = {
            role: { $in: ['Employee', 'Admin'] }
        };
        
        // Filter by specific role if provided
        if (roleFilter && ['Employee', 'Admin'].includes(roleFilter)) {
            query.role = roleFilter;
        }
        
        // Fetch employees without password
        const employees = await User.find(query)
            .select('-password -mfaSecret -mfaBackupCodes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalEmployees = await User.countDocuments(query);
        const totalPages = Math.ceil(totalEmployees / limit);
        
        console.log(`[ADMIN] User ${req.user.username} retrieved ${employees.length} employees`);
        
        res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully',
            data: {
                employees: employees,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalEmployees: totalEmployees,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Get employees error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving employees'
        });
    }
};

/**
 * Get all users (customers, employees, admins)
 * GET /v1/admin/users
 * @access Admin only
 */
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const roleFilter = mongoSanitize(req.query.role);
        
        const skip = (page - 1) * limit;
        
        // Build query
        const query = {};
        
        // Filter by specific role if provided
        if (roleFilter && ['Customer', 'Employee', 'Admin'].includes(roleFilter)) {
            query.role = roleFilter;
        }
        
        // Fetch users without sensitive data
        const users = await User.find(query)
            .select('-password -mfaSecret -mfaBackupCodes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);
        
        console.log(`[ADMIN] User ${req.user.username} retrieved ${users.length} users`);
        
        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users: users,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalUsers: totalUsers,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Get users error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving users'
        });
    }
};

/**
 * Create a new staff user (Employee or Admin)
 * POST /v1/admin/staff
 * @access Admin only
 */
const createStaff = async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        
        // Sanitize input
        const sanitizedData = mongoSanitize(req.body);
        const { firstname, lastname, idNumber, accountNumber, username, password, role } = sanitizedData;
        
        // Validate role (must be Employee or Admin)
        if (!role || !['Employee', 'Admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either Employee or Admin'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { accountNumber: accountNumber },
                { idNumber: idNumber }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this username, account number, or ID already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new staff user
        const newStaff = await User.create({
            firstname: firstname,
            lastname: lastname,
            idNumber: idNumber,
            accountNumber: accountNumber,
            username: username,
            password: hashedPassword,
            role: role // Employee or Admin
        });
        
        console.log(`[ADMIN] User ${req.user.username} created new ${role}: ${newStaff.username}`);
        
        res.status(201).json({
            success: true,
            message: `${role} created successfully`,
            user: {
                id: newStaff._id,
                username: newStaff.username,
                firstname: newStaff.firstname,
                lastname: newStaff.lastname,
                role: newStaff.role,
                accountNumber: newStaff.accountNumber
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Create staff error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating staff'
        });
    }
};

/**
 * Delete an employee
 * DELETE /v1/admin/employees/:id
 * @access Admin only
 */
const deleteEmployee = async (req, res) => {
    try {
        const employeeId = mongoSanitize(req.params.id);
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }
        
        // Find the employee
        const employee = await User.findById(employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        // Ensure the user being deleted is actually an employee or admin (not customer)
        if (employee.role === 'Customer') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customers through this endpoint'
            });
        }
        
        // Prevent admin from deleting themselves
        if (employee._id.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        
        // Delete the employee
        await User.findByIdAndDelete(employeeId);
        
        console.log(`[ADMIN] User ${req.user.username} deleted ${employee.role}: ${employee.username}`);
        
        res.status(200).json({
            success: true,
            message: `${employee.role} deleted successfully`,
            deletedUser: {
                id: employee._id,
                username: employee.username,
                role: employee.role
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Delete employee error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting employee'
        });
    }
};

/**
 * Update employee role
 * PATCH /v1/admin/employees/:id/role
 * @access Admin only
 */
const updateEmployeeRole = async (req, res) => {
    try {
        const employeeId = mongoSanitize(req.params.id);
        const sanitizedData = mongoSanitize(req.body);
        const { role } = sanitizedData;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }
        
        // Validate role
        if (!role || !['Customer', 'Employee', 'Admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be Customer, Employee, or Admin'
            });
        }
        
        // Find the employee
        const employee = await User.findById(employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        // Prevent admin from changing their own role
        if (employee._id.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }
        
        const oldRole = employee.role;
        employee.role = role;
        await employee.save();
        
        console.log(`[ADMIN] User ${req.user.username} updated ${employee.username} role from ${oldRole} to ${role}`);
        
        res.status(200).json({
            success: true,
            message: `User role updated from ${oldRole} to ${role}`,
            user: {
                id: employee._id,
                username: employee.username,
                role: employee.role
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Update employee role error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating employee role'
        });
    }
};

/**
 * Get admin dashboard statistics
 * GET /v1/admin/stats
 * @access Admin only
 */
const getAdminStats = async (req, res) => {
    try {
        // Get user counts by role
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Format the results
        const stats = {
            totalUsers: 0,
            customers: 0,
            employees: 0,
            admins: 0
        };
        
        userStats.forEach(stat => {
            stats.totalUsers += stat.count;
            if (stat._id === 'Customer') stats.customers = stat.count;
            if (stat._id === 'Employee') stats.employees = stat.count;
            if (stat._id === 'Admin') stats.admins = stat.count;
        });
        
        console.log(`[ADMIN] User ${req.user.username} retrieved admin statistics`);
        
        res.status(200).json({
            success: true,
            message: 'Admin statistics retrieved successfully',
            stats: stats
        });
        
    } catch (error) {
        console.error('[ADMIN] Get admin stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving statistics'
        });
    }
};

module.exports = {
    getAllEmployees,
    getAllUsers,
    createStaff,
    deleteEmployee,
    updateEmployeeRole,
    getAdminStats
};
