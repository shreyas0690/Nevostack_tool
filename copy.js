router.put('/:id', [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    // Role validation (case-insensitive) - allow any case from frontend
    // Skip validation for empty string (checkFalsy) so blank values won't trigger "Invalid role"
    body('role').optional({ checkFalsy: true }).custom((value) => {
      const allowed = ['super_admin', 'admin', 'hr_manager', 'hr', 'department_head', 'manager', 'member', 'person'];
      if (!allowed.includes(String(value).toLowerCase())) {
        throw new Error('Invalid role');
      }
      return true;
    }),
    body('companyId').optional().isMongoId().withMessage('Invalid company ID'),
    body('departmentId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid department ID'),
    body('phone').optional().custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return require('validator').isMobilePhone(value);
    }).withMessage('Invalid phone number'),
    body('mobileNumber').optional().custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return require('validator').isMobilePhone(value);
    }).withMessage('Invalid mobile number'),
    body('managerId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid manager ID'),
    body('hodId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid HOD ID'),
    body('role').optional().isIn(['super_admin', 'admin', 'hr_manager', 'hr', 'department_head', 'manager', 'member', 'person']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
  ], async (req, res) => {
    try {
      console.log('PUT /api/users/:id - Request received:', {
        userId: req.params.id,
        body: req.body,
        user: req.user?.id
      });
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('User update validation errors:', errors.array());
        console.error('Request body:', req.body);
        return res.status(400).json({
          error: 'Validation failed',
          message: errors.array()[0].msg,
          details: errors.array()
        });
      }
  
      const userId = req.params.id;
      const requestingUser = req.user;
      const updateData = req.body;
  
      // Check if user can update this profile
      if (requestingUser.role !== 'super_admin' && 
          requestingUser.role !== 'admin' && 
          requestingUser.id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }
  
      // For company admins, ensure user belongs to their company
      if (requestingUser.role === 'admin' && requestingUser.id !== userId) {
        const user = await User.findById(userId);
        if (!user || user.companyId.toString() !== requestingUser.companyId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'User not found in your company'
          });
        }
      }
  
      // Check if email already exists (if updating email)
      if (updateData.email) {
        const existingUser = await User.findOne({ 
          email: updateData.email, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          return res.status(400).json({
            error: 'Email already exists',
            message: 'A user with this email already exists'
          });
        }
      }
  
      // HOD Change Validation
      if (updateData.role === 'department_head') {
        if (!updateData.departmentId) {
          return res.status(400).json({
            error: 'Department required for HOD',
            message: 'Department ID is required when assigning department head role'
          });
        }
  
        // Check if department exists
        const Department = require('../models/Department');
        const department = await Department.findById(updateData.departmentId);
        if (!department) {
          return res.status(400).json({
            error: 'Department not found',
            message: 'The specified department does not exist'
          });
        }
      }
  
      // For company admins, ensure they can only update users in their company
      if (requestingUser.role === 'admin' && updateData.companyId) {
        if (updateData.companyId !== requestingUser.companyId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only update users in your company'
          });
        }
      }
  
      // ============================================
      // IMPROVED USER UPDATE WITH ROLE CHANGE LOGIC
      // ============================================
      
      // Get the current user before update
      const previousUser = await User.findById(userId);
      if (!previousUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User does not exist'
        });
      }
  
      console.log(`🔄 Updating user ${userId}:`, {
        previous: {
          role: previousUser.role,
          departmentId: previousUser.departmentId,
          managerId: previousUser.managerId
        },
        updated: {
          role: updateData.role,
          departmentId: updateData.departmentId,
          managerId: updateData.managerId,
          hodId: updateData.hodId
        }
      });
  
      // Start database transaction for atomicity
      const session = await User.startSession();
      session.startTransaction();
      let roleChangeProcessed = false;
  
      try {
        // ============================================
        // CASE 1: Change HOD (Department Head) - Complete Implementation
        // ============================================
        if (updateData.role === 'department_head' && previousUser.role !== 'department_head') {
          console.log('🎯 Case 1: Promoting user to Department Head');
          roleChangeProcessed = true;
  
          const deptId = updateData.departmentId;
          if (!deptId) {
            throw new Error('Department ID required when assigning department head role');
          }
  
          // Find existing HOD for this department
          const prevHead = await User.findOne({
            role: 'department_head',
            departmentId: deptId,
            _id: { $ne: userId }
          }).session(session);
  
          if (prevHead) {
            console.log(`👑 Found previous HOD: ${prevHead._id}`);
  
            // Transfer all managed relationships from previous HOD to new HOD
            const managersToTransfer = prevHead.managedManagerIds || [];
            const membersToTransfer = prevHead.managedMemberIds || [];
  
            // Initialize arrays if not exist
            if (!updateData.managedManagerIds) updateData.managedManagerIds = [];
            if (!updateData.managedMemberIds) updateData.managedMemberIds = [];
  
            // Transfer managers
            for (const managerId of managersToTransfer) {
              if (!updateData.managedManagerIds.includes(managerId)) {
                updateData.managedManagerIds.push(managerId);
              }
            }
  
            // Transfer members
            for (const memberId of membersToTransfer) {
              if (!updateData.managedMemberIds.includes(memberId)) {
                updateData.managedMemberIds.push(memberId);
              }
            }
  
            console.log(`📋 Transferred ${managersToTransfer.length} managers and ${membersToTransfer.length} members`);
  
            // Demote previous HOD to member and clear all relationships
            await User.updateOne(
              { _id: prevHead._id },
              {
                role: 'member',
                department: null,
                departmentId: null,
                managerId: null,
                managedManagerIds: [],
                managedMemberIds: []
              },
              { session }
            );
  
            console.log(`⬇️ Demoted previous HOD ${prevHead._id} to member`);
          }
  
          // Update department head reference
          const Department = require('../models/Department');
          const checkalreadymember = await Department.findOne({
            _id:deptId,
            memberIds:{$in:[userId]}
        });
          const deptUpdateResult = await Department.updateOne(
            { _id: deptId },
            { headId: userId },
            { session }
          );
          if (checkalreadymember) {
            await Department.updateOne(
              { _id: deptId },
              {
                $set: { headId: userId },   // safes update
                $pull: { memberIds: userId } // members array se hatao
              },
              { session }
            );
          }
  
          if (deptUpdateResult.matchedCount === 0) {
            throw new Error(`Department ${deptId} not found`);
          }
  
          console.log(`🏢 Updated department ${deptId} head to ${userId}`);
        }
  
        // ============================================
        // CASE 1B: HOD to HOD Change (New HOD Assignment)
        // ============================================
        else if (updateData.role === 'department_head' && previousUser.role === 'department_head' && 
                 previousUser._id.toString() !== userId) {
          console.log('🔄 Case 1B: HOD to HOD Change - New HOD Assignment');
          roleChangeProcessed = true;
  
          const departmentId = updateData.departmentId;
          const oldHodId = previousUser._id;
          const newHodId = userId;
  
          // Step 1: Transfer all relationships from old HOD to new HOD
          const oldHod = await User.findById(oldHodId).session(session);
          
          if (oldHod) {
            // Transfer managed managers
            const managersToTransfer = oldHod.managedManagerIds || [];
            const membersToTransfer = oldHod.managedMemberIds || [];
            
            // Initialize new HOD's arrays
            if (!updateData.managedManagerIds) updateData.managedManagerIds = [];
            if (!updateData.managedMemberIds) updateData.managedMemberIds = [];
            
            // Transfer managers
            for (const managerId of managersToTransfer) {
              if (!updateData.managedManagerIds.includes(managerId)) {
                updateData.managedManagerIds.push(managerId);
              }
            }
            
            // Transfer members
            for (const memberId of membersToTransfer) {
              if (!updateData.managedMemberIds.includes(memberId)) {
                updateData.managedMemberIds.push(memberId);
              }
            }
            
            console.log(`📋 Transferred ${managersToTransfer.length} managers and ${membersToTransfer.length} members to new HOD`);
            
            // Step 2: Clear old HOD's relationships and make him Member
            await User.updateOne(
              { _id: oldHodId },
              {
                role: 'member',
                departmentId: null,           // No department
                managerId: null,              // No manager
                managedManagerIds: [],        // Clear all managed managers
                managedMemberIds: [],         // Clear all managed members
                isActive: true
              },
              { session }
            );
            
            console.log(`👤 Old HOD ${oldHodId} converted to Member with no department`);
          }
          //already have data manager and hod cleart from hod and member 
          const clearmemberdataoldhod = await User.findOne({
            _id:newHodId,
            role:'department_head',
            managedMemberIds:{$in:[oldHodId]},
          })
          if(clearmemberdataoldhod){
            await User.updateDataOne({
              _id:newHodId,
              $pull:{managedMemberIds:oldHodId},
            },
            { session }
          );
          }
          const clearmemberdata = await User.findOne({

          // Step 3: Update Department head reference
          const Department = require('../models/Department');
          await Department.updateOne(
            { _id: departmentId },
            { headId: newHodId },
            { session }
          );
          
          console.log(`🏢 Department ${departmentId} head updated to ${newHodId}`);
        }
  
        // ============================================
        // CASE 1C: HOD Demotion (HOD to Manager/Member)
        // ============================================
        else if (previousUser.role === 'department_head' && updateData.role !== 'department_head') {
          console.log('⬇️ Case 1C: HOD Demotion');
          roleChangeProcessed = true;
  
          const departmentId = previousUser.departmentId;
          const hodId = previousUser._id;
  
          // Step 1: Clear all HOD relationships
          updateData.managedManagerIds = [];
          updateData.managedMemberIds = [];
  
          // Step 2: Update Department head reference to null
          const Department = require('../models/Department');
          await Department.updateOne(
            { _id: departmentId },
            { headId: null },
            { session }
          );
  
          console.log(`🏢 Department ${departmentId} head cleared (HOD demoted)`);
  
          // Step 3: If demoting to manager, assign a new HOD or keep as member
          if (updateData.role === 'manager') {
            // Find a suitable HOD for this department or keep as member
            const existingHod = await User.findOne({
              role: 'department_head',
              departmentId: departmentId,
              _id: { $ne: hodId }
            }).session(session);
  
            if (existingHod) {
              // Assign this manager to existing HOD
              updateData.managerId = existingHod._id;
              console.log(`👤 Assigned demoted HOD to existing HOD ${existingHod._id}`);
            }
          }
  
          console.log(`⬇️ HOD ${hodId} demoted to ${updateData.role}`);
        }
  
        // ============================================
        // CASE 2: Manager Department Change
        // ============================================
        else if (previousUser.role === 'manager' && updateData.role === 'manager' &&
                 previousUser.departmentId !== updateData.departmentId) {
          console.log('👨‍💼 Case 2: Manager changing departments');
          roleChangeProcessed = true;
  
          const oldDeptId = previousUser.departmentId;
          const newDeptId = updateData.departmentId;
  
          if (!oldDeptId || !newDeptId) {
            throw new Error('Both old and new department IDs required for manager department change');
          }
  
          // Find old and new HODs
          const [oldHod, newHod] = await Promise.all([
            User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
            User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
          ]);
  
          if (!newHod) {
            throw new Error(`No department head found for new department ${newDeptId}`);
          }
  
          // Remove from old HOD's managedManagerIds
          if (oldHod) {
            const oldHodUpdated = await User.findById(oldHod._id).session(session);
            if (oldHodUpdated && oldHodUpdated.managedManagerIds) {
              oldHodUpdated.managedManagerIds = oldHodUpdated.managedManagerIds.filter(
                managerId => managerId.toString() !== userId
              );
              await oldHodUpdated.save({ session });
              console.log(`❌ Removed manager from old HOD ${oldHod._id}`);
            }
          }
  
          // Add to new HOD's managedManagerIds
          const newHodUpdated = await User.findById(newHod._id).session(session);
          if (newHodUpdated) {
            if (!newHodUpdated.managedManagerIds) newHodUpdated.managedManagerIds = [];
            if (!newHodUpdated.managedManagerIds.includes(userId)) {
              newHodUpdated.managedManagerIds.push(userId);
              await newHodUpdated.save({ session });
              console.log(`➕ Added manager to new HOD ${newHod._id}`);
            }
          }
        }
  
        // ============================================
        // CASE 3: Member Department Change (MOST IMPORTANT)
        // ============================================
        else if (previousUser.role === 'member' && updateData.role === 'member' &&
                 previousUser.departmentId !== updateData.departmentId) {
          console.log('👤 Case 3: Member changing departments (MOST CRITICAL)');
          roleChangeProcessed = true;
  
          const oldDeptId = previousUser.departmentId;
          const newDeptId = updateData.departmentId;
  
          if (!oldDeptId || !newDeptId) {
            throw new Error('Both old and new department IDs required for member department change');
          }
  
          console.log(`📍 Moving from department ${oldDeptId} to ${newDeptId}`);
  
          // 1. Find old and new HODs
          const [oldHod, newHod] = await Promise.all([
            User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
            User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
          ]);
  
          if (!newHod) {
            throw new Error(`No department head found for new department ${newDeptId}`);
          }
  
          // 🗑️ STEP 1: CLEANUP - Remove from OLD department relationships
  
          // 1a. Remove from old HOD's managedMemberIds
          if (oldHod) {
            const oldHodUpdated = await User.findById(oldHod._id).session(session);
            if (oldHodUpdated && oldHodUpdated.managedMemberIds) {
              oldHodUpdated.managedMemberIds = oldHodUpdated.managedMemberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await oldHodUpdated.save({ session });
              console.log(`❌ Removed from old HOD ${oldHod._id} managedMemberIds`);
            }
          } else {
            console.warn(`⚠️ No HOD found for old department ${oldDeptId}`);
          }
  
          // 1b. Remove from previous manager's managedMemberIds (if had a manager)
          if (previousUser.managerId) {
            const prevManager = await User.findById(previousUser.managerId).session(session);
            if (prevManager && prevManager.managedMemberIds) {
              prevManager.managedMemberIds = prevManager.managedMemberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await prevManager.save({ session });
              console.log(`❌ Removed from old manager ${prevManager._id} managedMemberIds`);
            }
          }
  
          // ➕ STEP 2: SETUP - Add to NEW department relationships
  
          // 2a. Add to new HOD's managedMemberIds
          const newHodUpdated = await User.findById(newHod._id).session(session);
          if (newHodUpdated) {
            if (!newHodUpdated.managedMemberIds) newHodUpdated.managedMemberIds = [];
            if (!newHodUpdated.managedMemberIds.includes(userId)) {
              newHodUpdated.managedMemberIds.push(userId);
              await newHodUpdated.save({ session });
              console.log(`➕ Added to new HOD ${newHod._id} managedMemberIds`);
            }
          }
  
          // 2b. Add to new manager's managedMemberIds (if new manager assigned)
          if (updateData.managerId) {
            const newManager = await User.findById(updateData.managerId).session(session);
            if (newManager) {
              if (!newManager.managedMemberIds) newManager.managedMemberIds = [];
              if (!newManager.managedMemberIds.includes(userId)) {
                newManager.managedMemberIds.push(userId);
                await newManager.save({ session });
                console.log(`➕ Added to new manager ${newManager._id} managedMemberIds`);
              }
            } else {
              console.warn(`⚠️ New manager ${updateData.managerId} not found`);
            }
          } else {
            console.log(`ℹ️ No new manager assigned - member reports directly to HOD`);
          }
  
          console.log(`✅ Member department change completed for user ${userId}`);
          console.log(`📊 Summary: Removed from old dept ${oldDeptId}, added to new dept ${newDeptId}`);
        }
  
        // ============================================
        // UPDATE THE MAIN USER RECORD
        // ============================================
        console.log(`💾 Updating main user record for ${userId}`);
  
        // Ensure the stored `name` field stays in sync when firstName/lastName are updated
        if (updateData.firstName || updateData.lastName) {
          const newFirst = updateData.firstName || previousUser.firstName || '';
          const newLast = updateData.lastName || previousUser.lastName || '';
          updateData.name = `${newFirst} ${newLast}`.trim();
        }
  
        // Keep department ObjectId in sync when departmentId provided
        if (updateData.departmentId) {
          updateData.department = updateData.departmentId;
        }
  
        const user = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true, session }
        )
        .populate('companyId', 'name domain')
        .populate('department', 'name')
        .select('-password -failedLoginAttempts -lockedUntil');
  
        if (!user) {
          throw new Error('Failed to update user record');
        }
  
        // Commit the transaction
        await session.commitTransaction();
  
        console.log(`✅ User ${userId} updated successfully`);
        if (roleChangeProcessed) {
          console.log(`🔄 Role change logic executed for user ${userId}`);
        }
  
      } catch (error) {
        // Abort transaction on error
        console.error('❌ Transaction failed:', error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
  
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          mobileNumber: user.mobileNumber,
          department: user.department ? user.department : user.departmentId,
          departmentId: user.departmentId,
          managerId: user.managerId,
          company: user.companyId,
          lastLogin: user.lastLogin,
          lastActive: user.lastActive,
          updatedAt: user.updatedAt,
          managedManagerIds: user.managedManagerIds || [],
          managedMemberIds: user.managedMemberIds || []
        },
        roleChangeProcessed: roleChangeProcessed
      });
  
    } catch (error) {
      console.error('💥 Update user error:', error);
      
      // Determine appropriate error status
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('Validation') || error.message.includes('required')) {
        statusCode = 400;
      }
  
      res.status(statusCode).json({
        success: false,
        error: 'Failed to update user',
        message: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  });






  ///2nd part

  router.put('/:id', [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    // Role validation (case-insensitive) - allow any case from frontend
    // Skip validation for empty string (checkFalsy) so blank values won't trigger "Invalid role"
    body('role').optional({ checkFalsy: true }).custom((value) => {
      const allowed = ['super_admin', 'admin', 'hr_manager', 'hr', 'department_head', 'manager', 'member', 'person'];
      if (!allowed.includes(String(value).toLowerCase())) {
        throw new Error('Invalid role');
      }
      return true;
    }),
    body('companyId').optional().isMongoId().withMessage('Invalid company ID'),
    body('departmentId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid department ID'),
    body('phone').optional().custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return require('validator').isMobilePhone(value);
    }).withMessage('Invalid phone number'),
    body('mobileNumber').optional().custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return require('validator').isMobilePhone(value);
    }).withMessage('Invalid mobile number'),
    body('managerId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid manager ID'),
    body('hodId').optional().custom((value) => {
      if (value === 'none' || value === null || value === undefined || value === '') {
        return true; // Allow 'none' as valid value
      }
      return require('mongoose').Types.ObjectId.isValid(value);
    }).withMessage('Invalid HOD ID'),
    body('role').optional().isIn(['super_admin', 'admin', 'hr_manager', 'hr', 'department_head', 'manager', 'member', 'person']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
  ], async (req, res) => {
    try {
      console.log('PUT /api/users/:id - Request received:', {
        userId: req.params.id,
        body: req.body,
        user: req.user?.id
      });
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('User update validation errors:', errors.array());
        console.error('Request body:', req.body);
        return res.status(400).json({
          error: 'Validation failed',
          message: errors.array()[0].msg,
          details: errors.array()
        });
      }
  
      const userId = req.params.id;
      const requestingUser = req.user;
      const updateData = req.body;
  
      // Check if user can update this profile
      if (requestingUser.role !== 'super_admin' && 
          requestingUser.role !== 'admin' && 
          requestingUser.id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }
  
      // For company admins, ensure user belongs to their company
      if (requestingUser.role === 'admin' && requestingUser.id !== userId) {
        const user = await User.findById(userId);
        if (!user || user.companyId.toString() !== requestingUser.companyId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'User not found in your company'
          });
        }
      }
  
      // Check if email already exists (if updating email)
      if (updateData.email) {
        const existingUser = await User.findOne({ 
          email: updateData.email, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          return res.status(400).json({
            error: 'Email already exists',
            message: 'A user with this email already exists'
          });
        }
      }
  
      // HOD Change Validation
      if (updateData.role === 'department_head') {
        if (!updateData.departmentId) {
          return res.status(400).json({
            error: 'Department required for HOD',
            message: 'Department ID is required when assigning department head role'
          });
        }
  
        // Check if department exists
        const Department = require('../models/Department');
        const department = await Department.findById(updateData.departmentId);
        if (!department) {
          return res.status(400).json({
            error: 'Department not found',
            message: 'The specified department does not exist'
          });
        }
      }
  
      // For company admins, ensure they can only update users in their company
      if (requestingUser.role === 'admin' && updateData.companyId) {
        if (updateData.companyId !== requestingUser.companyId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only update users in your company'
          });
        }
      }
  
      // ============================================
      // IMPROVED USER UPDATE WITH ROLE CHANGE LOGIC
      // ============================================
      
      // Get the current user before update
      const previousUser = await User.findById(userId);
      if (!previousUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User does not exist'
        });
      }
  
      console.log(`🔄 Updating user ${userId}:`, {
        previous: {
          role: previousUser.role,
          departmentId: previousUser.departmentId,
          managerId: previousUser.managerId
        },
        updated: {
          role: updateData.role,
          departmentId: updateData.departmentId,
          managerId: updateData.managerId,
          hodId: updateData.hodId
        }
      });
  
      // Start database transaction for atomicity
      const session = await User.startSession();
      session.startTransaction();
      let roleChangeProcessed = false;
  
      try {
        // ============================================
        // CASE 1: Change HOD (Department Head) - Complete Implementation
        // ============================================
        if (updateData.role === 'department_head' && previousUser.role !== 'department_head') {
          console.log('🎯 Case 1: Promoting user to Department Head');
          roleChangeProcessed = true;
  
          const deptId = updateData.departmentId;
          if (!deptId) {
            throw new Error('Department ID required when assigning department head role');
          }
  
          // ============================================
          // STEP 1: CLEANUP - Remove user from current relationships
          // ============================================
          console.log(`🧹 Step 1: Cleaning up current relationships for user ${userId}`);
  
          // 1a. Remove from Department memberIds/managerIds
          const Department = require('../models/Department');
          const currentDept = await Department.findById(previousUser.departmentId).session(session);
          
          if (currentDept) {
            // Remove from memberIds if user is member
            if (previousUser.role === 'member' && currentDept.memberIds) {
              currentDept.memberIds = currentDept.memberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await currentDept.save({ session });
              console.log(`❌ Removed from department ${currentDept._id} memberIds`);
            }
            
            // Remove from managerIds if user is manager
            if (previousUser.role === 'manager' && currentDept.managerIds) {
              currentDept.managerIds = currentDept.managerIds.filter(
                managerId => managerId.toString() !== userId
              );
              await currentDept.save({ session });
              console.log(`❌ Removed from department ${currentDept._id} managerIds`);
            }
          }
  
          // 1b. Remove from current HOD's managedMemberIds
          if (previousUser.role === 'member' || previousUser.role === 'manager') {
            const currentHod = await User.findOne({
              role: 'department_head',
              departmentId: previousUser.departmentId
            }).session(session);
  
            if (currentHod) {
              if (currentHod.managedMemberIds) {
                currentHod.managedMemberIds = currentHod.managedMemberIds.filter(
                  memberId => memberId.toString() !== userId
                );
                await currentHod.save({ session });
                console.log(`❌ Removed from current HOD ${currentHod._id} managedMemberIds`);
              }
            }
          }
  
          // 1c. Remove from current manager's managedMemberIds (if user is member)
          if (previousUser.role === 'member' && previousUser.managerId) {
            const currentManager = await User.findById(previousUser.managerId).session(session);
            if (currentManager && currentManager.managedMemberIds) {
              currentManager.managedMemberIds = currentManager.managedMemberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await currentManager.save({ session });
              console.log(`❌ Removed from current manager ${currentManager._id} managedMemberIds`);
            }
          }
  
          // ============================================
          // STEP 2: TRANSFER - Handle existing HOD relationships
          // ============================================
          console.log(`🔄 Step 2: Transferring relationships from existing HOD`);
  
          // Find existing HOD for this department
          const prevHead = await User.findOne({
            role: 'department_head',
            departmentId: deptId,
            _id: { $ne: userId }
          }).session(session);
  
          if (prevHead) {
            console.log(`👑 Found previous HOD: ${prevHead._id}`);
  
            // Transfer all managed relationships from previous HOD to new HOD
            const managersToTransfer = prevHead.managedManagerIds || [];
            const membersToTransfer = prevHead.managedMemberIds || [];
  
            // Initialize arrays if not exist
            if (!updateData.managedManagerIds) updateData.managedManagerIds = [];
            if (!updateData.managedMemberIds) updateData.managedMemberIds = [];
  
            // Transfer managers (exclude the user becoming HOD)
            for (const managerId of managersToTransfer) {
              if (managerId.toString() !== userId && !updateData.managedManagerIds.includes(managerId)) {
                updateData.managedManagerIds.push(managerId);
              }
            }
  
            // Transfer members (exclude the user becoming HOD)
            for (const memberId of membersToTransfer) {
              if (memberId.toString() !== userId && !updateData.managedMemberIds.includes(memberId)) {
                updateData.managedMemberIds.push(memberId);
              }
            }
  
            console.log(`📋 Transferred ${managersToTransfer.length} managers and ${membersToTransfer.length} members`);
  
            // ============================================
            // STEP 3: CLEAR MANAGER RELATIONSHIPS - If Manager becoming HOD
            // ============================================
            if (previousUser.role === 'manager') {
              console.log(`🧹 Step 3: Clearing manager relationships for new HOD ${userId}`);
              
              // Clear managerId for all members who were managed by this manager
              const membersToClearManager = previousUser.managedMemberIds || [];
              if (membersToClearManager.length > 0) {
                await User.updateMany(
                  { _id: { $in: membersToClearManager } },
                  { managerId: null },
                  { session }
                );
                console.log(`❌ Cleared managerId for ${membersToClearManager.length} members`);
              }
            }
  
            // Demote previous HOD to member and clear all relationships
            await User.updateOne(
              { _id: prevHead._id },
              {
                role: 'member',
                department: null,
                departmentId: null,
                managerId: null,
                managedManagerIds: [],
                managedMemberIds: []
              },
              { session }
            );
  
            console.log(`⬇️ Demoted previous HOD ${prevHead._id} to member`);
          }
  
          // ============================================
          // STEP 4: CLEAR NEW HOD'S MANAGER ID - Any role becoming HOD
          // ============================================
          console.log(`🧹 Step 4: Clearing managerId for new HOD ${userId}`);
          
          // Clear managerId for the user becoming HOD (HOD should not have a manager)
          updateData.managerId = null;
          console.log(`❌ Cleared managerId for new HOD ${userId}`);
  
          // Update department head reference
          const checkalreadymember = await Department.findOne({
            _id:deptId,
            memberIds:{$in:[userId]}
        });
          const deptUpdateResult = await Department.updateOne(
            { _id: deptId },
            { headId: userId },
            { session }
          );
          if (checkalreadymember) {
            await Department.updateOne(
              { _id: deptId },
              {
                $set: { headId: userId },   // safes update
                $pull: { memberIds: userId } // members array se hatao
              },
              { session }
            );
          }
  
          if (deptUpdateResult.matchedCount === 0) {
            throw new Error(`Department ${deptId} not found`);
          }
  
          console.log(`🏢 Updated department ${deptId} head to ${userId}`);
        }
  
        // ============================================
        // CASE 1B: HOD to HOD Change (New HOD Assignment)
        // ============================================
        else if (updateData.role === 'department_head' && previousUser.role === 'department_head' && 
                 previousUser._id.toString() !== userId) {
          console.log('🔄 Case 1B: HOD to HOD Change - New HOD Assignment');
          roleChangeProcessed = true;
  
          const departmentId = updateData.departmentId;
          const oldHodId = previousUser._id;
          const newHodId = userId;
  
          // ============================================
          // STEP 1: CLEANUP - Remove new HOD from current relationships
          // ============================================
          console.log(`🧹 Step 1: Cleaning up current relationships for new HOD ${newHodId}`);
  
          // 1a. Remove from Department memberIds/managerIds
          const Department = require('../models/Department');
          const currentDept = await Department.findById(previousUser.departmentId).session(session);
          
          if (currentDept) {
            // Remove from memberIds if user is member
            if (previousUser.role === 'member' && currentDept.memberIds) {
              currentDept.memberIds = currentDept.memberIds.filter(
                memberId => memberId.toString() !== newHodId
              );
              await currentDept.save({ session });
              console.log(`❌ Removed from department ${currentDept._id} memberIds`);
            }
            
            // Remove from managerIds if user is manager
            if (previousUser.role === 'manager' && currentDept.managerIds) {
              currentDept.managerIds = currentDept.managerIds.filter(
                managerId => managerId.toString() !== newHodId
              );
              await currentDept.save({ session });
              console.log(`❌ Removed from department ${currentDept._id} managerIds`);
            }
          }
  
          // 1b. Remove from current HOD's managedMemberIds
          if (previousUser.role === 'member' || previousUser.role === 'manager') {
            const currentHod = await User.findOne({
              role: 'department_head',
              departmentId: previousUser.departmentId
            }).session(session);
  
            if (currentHod) {
              if (currentHod.managedMemberIds) {
                currentHod.managedMemberIds = currentHod.managedMemberIds.filter(
                  memberId => memberId.toString() !== newHodId
                );
                await currentHod.save({ session });
                console.log(`❌ Removed from current HOD ${currentHod._id} managedMemberIds`);
              }
            }
          }
  
          // 1c. Remove from current manager's managedMemberIds (if user is member)
          if (previousUser.role === 'member' && previousUser.managerId) {
            const currentManager = await User.findById(previousUser.managerId).session(session);
            if (currentManager && currentManager.managedMemberIds) {
              currentManager.managedMemberIds = currentManager.managedMemberIds.filter(
                memberId => memberId.toString() !== newHodId
              );
              await currentManager.save({ session });
              console.log(`❌ Removed from current manager ${currentManager._id} managedMemberIds`);
            }
          }
  
          // ============================================
          // STEP 2: TRANSFER - Transfer all relationships from old HOD to new HOD
          // ============================================
          console.log(`🔄 Step 2: Transferring relationships from old HOD to new HOD`);
  
          // Step 1: Transfer all relationships from old HOD to new HOD
          const oldHod = await User.findById(oldHodId).session(session);
          
          if (oldHod) {
            // Transfer managed managers
            const managersToTransfer = oldHod.managedManagerIds || [];
            const membersToTransfer = oldHod.managedMemberIds || [];
            
            // Initialize new HOD's arrays
            if (!updateData.managedManagerIds) updateData.managedManagerIds = [];
            if (!updateData.managedMemberIds) updateData.managedMemberIds = [];
            
            // Transfer managers (exclude the user becoming HOD)
            for (const managerId of managersToTransfer) {
              if (managerId.toString() !== newHodId && !updateData.managedManagerIds.includes(managerId)) {
                updateData.managedManagerIds.push(managerId);
              }
            }
            
            // Transfer members (exclude the user becoming HOD)
            for (const memberId of membersToTransfer) {
              if (memberId.toString() !== newHodId && !updateData.managedMemberIds.includes(memberId)) {
                updateData.managedMemberIds.push(memberId);
              }
            }
            
            console.log(`📋 Transferred ${managersToTransfer.length} managers and ${membersToTransfer.length} members to new HOD`);
            
            // ============================================
            // STEP 3: CLEAR MANAGER RELATIONSHIPS - If Manager becoming HOD
            // ============================================
            if (previousUser.role === 'manager') {
              console.log(`🧹 Step 3: Clearing manager relationships for new HOD ${newHodId}`);
              
              // Clear managerId for all members who were managed by this manager
              const membersToClearManager = previousUser.managedMemberIds || [];
              if (membersToClearManager.length > 0) {
                await User.updateMany(
                  { _id: { $in: membersToClearManager } },
                  { managerId: null },
                  { session }
                );
                console.log(`❌ Cleared managerId for ${membersToClearManager.length} members`);
              }
            }
            
            // Step 2: Clear old HOD's relationships and make him Member
            await User.updateOne(
              { _id: oldHodId },
              {
                role: 'member',
                departmentId: null,           // No department
                managerId: null,              // No manager
                managedManagerIds: [],        // Clear all managed managers
                managedMemberIds: [],         // Clear all managed members
                isActive: true
              },
              { session }
            );
            
            console.log(`👤 Old HOD ${oldHodId} converted to Member with no department`);
          }
          
          // ============================================
          // STEP 4: CLEAR NEW HOD'S MANAGER ID - Any role becoming HOD
          // ============================================
          console.log(`🧹 Step 4: Clearing managerId for new HOD ${newHodId}`);
          
          // Clear managerId for the user becoming HOD (HOD should not have a manager)
          updateData.managerId = null;
          console.log(`❌ Cleared managerId for new HOD ${newHodId}`);
          
          // Step 3: Update Department head reference
          await Department.updateOne(
            { _id: departmentId },
            { headId: newHodId },
            { session }
          );
          
          console.log(`🏢 Department ${departmentId} head updated to ${newHodId}`);
        }
  
        // ============================================
        // CASE 1C: HOD Demotion (HOD to Manager/Member)
        // ============================================
        else if (previousUser.role === 'department_head' && updateData.role !== 'department_head') {
          console.log('⬇️ Case 1C: HOD Demotion');
          roleChangeProcessed = true;
  
          const departmentId = previousUser.departmentId;
          const hodId = previousUser._id;
  
          // Step 1: Clear all HOD relationships
          updateData.managedManagerIds = [];
          updateData.managedMemberIds = [];
  
          // Step 2: Update Department head reference to null
          await Department.updateOne(
            { _id: departmentId },
            { headId: null },
            { session }
          );
  
          console.log(`🏢 Department ${departmentId} head cleared (HOD demoted)`);
  
          // Step 3: If demoting to manager, assign a new HOD or keep as member
          if (updateData.role === 'manager') {
            // Find a suitable HOD for this department or keep as member
            const existingHod = await User.findOne({
              role: 'department_head',
              departmentId: departmentId,
              _id: { $ne: hodId }
            }).session(session);
  
            if (existingHod) {
              // Assign this manager to existing HOD
              updateData.managerId = existingHod._id;
              console.log(`👤 Assigned demoted HOD to existing HOD ${existingHod._id}`);
            }
          }
  
          console.log(`⬇️ HOD ${hodId} demoted to ${updateData.role}`);
        }
  
        // ============================================
        // CASE 2: Manager Department Change
        // ============================================
        else if (previousUser.role === 'manager' && updateData.role === 'manager' &&
                 previousUser.departmentId !== updateData.departmentId) {
          console.log('👨‍💼 Case 2: Manager changing departments');
          roleChangeProcessed = true;
  
          const oldDeptId = previousUser.departmentId;
          const newDeptId = updateData.departmentId;
  
          if (!oldDeptId || !newDeptId) {
            throw new Error('Both old and new department IDs required for manager department change');
          }
  
          // Find old and new HODs
          const [oldHod, newHod] = await Promise.all([
            User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
            User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
          ]);
  
          if (!newHod) {
            throw new Error(`No department head found for new department ${newDeptId}`);
          }
  
          // Remove from old HOD's managedManagerIds
          if (oldHod) {
            const oldHodUpdated = await User.findById(oldHod._id).session(session);
            if (oldHodUpdated && oldHodUpdated.managedManagerIds) {
              oldHodUpdated.managedManagerIds = oldHodUpdated.managedManagerIds.filter(
                managerId => managerId.toString() !== userId
              );
              await oldHodUpdated.save({ session });
              console.log(`❌ Removed manager from old HOD ${oldHod._id}`);
            }
          }
  
          // Add to new HOD's managedManagerIds
          const newHodUpdated = await User.findById(newHod._id).session(session);
          if (newHodUpdated) {
            if (!newHodUpdated.managedManagerIds) newHodUpdated.managedManagerIds = [];
            if (!newHodUpdated.managedManagerIds.includes(userId)) {
              newHodUpdated.managedManagerIds.push(userId);
              await newHodUpdated.save({ session });
              console.log(`➕ Added manager to new HOD ${newHod._id}`);
            }
          }
        }
  
        // ============================================
        // CASE 3: Member Department Change (MOST IMPORTANT)
        // ============================================
        else if (previousUser.role === 'member' && updateData.role === 'member' &&
                 previousUser.departmentId !== updateData.departmentId) {
          console.log('👤 Case 3: Member changing departments (MOST CRITICAL)');
          roleChangeProcessed = true;
  
          const oldDeptId = previousUser.departmentId;
          const newDeptId = updateData.departmentId;
  
          if (!oldDeptId || !newDeptId) {
            throw new Error('Both old and new department IDs required for member department change');
          }
  
          console.log(`📍 Moving from department ${oldDeptId} to ${newDeptId}`);
  
          // 1. Find old and new HODs
          const [oldHod, newHod] = await Promise.all([
            User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
            User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
          ]);
  
          if (!newHod) {
            throw new Error(`No department head found for new department ${newDeptId}`);
          }
  
          // 🗑️ STEP 1: CLEANUP - Remove from OLD department relationships
  
          // 1a. Remove from old HOD's managedMemberIds
          if (oldHod) {
            const oldHodUpdated = await User.findById(oldHod._id).session(session);
            if (oldHodUpdated && oldHodUpdated.managedMemberIds) {
              oldHodUpdated.managedMemberIds = oldHodUpdated.managedMemberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await oldHodUpdated.save({ session });
              console.log(`❌ Removed from old HOD ${oldHod._id} managedMemberIds`);
            }
          } else {
            console.warn(`⚠️ No HOD found for old department ${oldDeptId}`);
          }
  
          // 1b. Remove from previous manager's managedMemberIds (if had a manager)
          if (previousUser.managerId) {
            const prevManager = await User.findById(previousUser.managerId).session(session);
            if (prevManager && prevManager.managedMemberIds) {
              prevManager.managedMemberIds = prevManager.managedMemberIds.filter(
                memberId => memberId.toString() !== userId
              );
              await prevManager.save({ session });
              console.log(`❌ Removed from old manager ${prevManager._id} managedMemberIds`);
            }
          }
  
          // ➕ STEP 2: SETUP - Add to NEW department relationships
  
          // 2a. Add to new HOD's managedMemberIds
          const newHodUpdated = await User.findById(newHod._id).session(session);
          if (newHodUpdated) {
            if (!newHodUpdated.managedMemberIds) newHodUpdated.managedMemberIds = [];
            if (!newHodUpdated.managedMemberIds.includes(userId)) {
              newHodUpdated.managedMemberIds.push(userId);
              await newHodUpdated.save({ session });
              console.log(`➕ Added to new HOD ${newHod._id} managedMemberIds`);
            }
          }
  
          // 2b. Add to new manager's managedMemberIds (if new manager assigned)
          if (updateData.managerId) {
            const newManager = await User.findById(updateData.managerId).session(session);
            if (newManager) {
              if (!newManager.managedMemberIds) newManager.managedMemberIds = [];
              if (!newManager.managedMemberIds.includes(userId)) {
                newManager.managedMemberIds.push(userId);
                await newManager.save({ session });
                console.log(`➕ Added to new manager ${newManager._id} managedMemberIds`);
              }
            } else {
              console.warn(`⚠️ New manager ${updateData.managerId} not found`);
            }
          } else {
            console.log(`ℹ️ No new manager assigned - member reports directly to HOD`);
          }
  
          console.log(`✅ Member department change completed for user ${userId}`);
          console.log(`📊 Summary: Removed from old dept ${oldDeptId}, added to new dept ${newDeptId}`);
        }
  
        // ============================================
        // UPDATE THE MAIN USER RECORD
        // ============================================
        console.log(`💾 Updating main user record for ${userId}`);
  
        // Ensure the stored `name` field stays in sync when firstName/lastName are updated
        if (updateData.firstName || updateData.lastName) {
          const newFirst = updateData.firstName || previousUser.firstName || '';
          const newLast = updateData.lastName || previousUser.lastName || '';
          updateData.name = `${newFirst} ${newLast}`.trim();
        }
  
        // Keep department ObjectId in sync when departmentId provided
        if (updateData.departmentId) {
          updateData.department = updateData.departmentId;
        }
  
        const user = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true, session }
        )
        .populate('companyId', 'name domain')
        .populate('department', 'name')
        .select('-password -failedLoginAttempts -lockedUntil');
  
        if (!user) {
          throw new Error('Failed to update user record');
        }
  
        // Commit the transaction
        await session.commitTransaction();
  
        console.log(`✅ User ${userId} updated successfully`);
        if (roleChangeProcessed) {
          console.log(`🔄 Role change logic executed for user ${userId}`);
        }
  
      } catch (error) {
        // Abort transaction on error
        console.error('❌ Transaction failed:', error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
  
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          mobileNumber: user.mobileNumber,
          department: user.department ? user.department : user.departmentId,
          departmentId: user.departmentId,
          managerId: user.managerId,
          company: user.companyId,
          lastLogin: user.lastLogin,
          lastActive: user.lastActive,
          updatedAt: user.updatedAt,
          managedManagerIds: user.managedManagerIds || [],
          managedMemberIds: user.managedMemberIds || []
        },
        roleChangeProcessed: roleChangeProcessed
      });
  
    } catch (error) {
      console.error('💥 Update user error:', error);
      
      // Determine appropriate error status
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('Validation') || error.message.includes('required')) {
        statusCode = 400;
      }
  
      res.status(statusCode).json({
        success: false,
        error: 'Failed to update user',
        message: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  });