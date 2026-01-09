# 🔄 HOD Change Complete Implementation Guide

## 📋 Overview
यह guide बताता है कि जब कोई HOD change होता है तो system में क्या-क्या changes करने होंगे। सभी scenarios को cover किया गया है।

## 🎯 HOD Change Scenarios

### **Scenario 1: नया HOD आता है, पुराना HOD को Member बनाना**

#### **Business Logic:**
```
पहले: Rajesh (HOD - Development Department)
बाद में: Priya (HOD - Development Department)
        Rajesh (Member - No Department)
```

#### **Backend Implementation:**
```javascript
// Case 1: New HOD Assignment, Old HOD becomes Member
if (newUser.role === 'department_head' && previousUser.role === 'department_head' && 
    newUser._id !== previousUser._id) {
  
  console.log('🔄 HOD Change: New HOD assigned, Old HOD becomes Member');
  
  const departmentId = newUser.departmentId;
  const oldHodId = previousUser._id;
  const newHodId = newUser._id;
  
  // Step 1: Transfer all relationships from old HOD to new HOD
  const oldHod = await User.findById(oldHodId).session(session);
  
  if (oldHod) {
    // Transfer managed managers
    const managersToTransfer = oldHod.managedManagerIds || [];
    const membersToTransfer = oldHod.managedMemberIds || [];
    
    // Initialize new HOD's arrays
    if (!newUser.managedManagerIds) newUser.managedManagerIds = [];
    if (!newUser.managedMemberIds) newUser.managedMemberIds = [];
    
    // Transfer managers
    for (const managerId of managersToTransfer) {
      if (!newUser.managedManagerIds.includes(managerId)) {
        newUser.managedManagerIds.push(managerId);
      }
    }
    
    // Transfer members
    for (const memberId of membersToTransfer) {
      if (!newUser.managedMemberIds.includes(memberId)) {
        newUser.managedMemberIds.push(memberId);
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
  
  // Step 3: Update Department head reference
  await Department.updateOne(
    { _id: departmentId },
    { headId: newHodId },
    { session }
  );
  
  console.log(`🏢 Department ${departmentId} head updated to ${newHodId}`);
}
```

#### **Database Changes:**
```javascript
// Old HOD (Rajesh) becomes:
{
  _id: "rajesh123",
  role: "member",              // Changed from department_head
  departmentId: null,          // No department
  managerId: null,             // No manager
  managedManagerIds: [],       // Cleared
  managedMemberIds: [],        // Cleared
  isActive: true
}

// New HOD (Priya) gets:
{
  _id: "priya456",
  role: "department_head",     // New role
  departmentId: "dept123",     // Same department
  managedManagerIds: ["manager1", "manager2"], // Transferred from old HOD
  managedMemberIds: ["member1", "member2", "member3"] // Transferred from old HOD
}

// Department record:
{
  _id: "dept123",
  headId: "priya456",          // Updated to new HOD
  managerIds: ["manager1", "manager2"],
  memberIds: ["member1", "member2", "member3"]
}
```

---

### **Scenario 2: Manager को HOD बनाना**

#### **Business Logic:**
```
पहले: Priya (Manager - Development Department)
बाद में: Priya (HOD - Development Department)
```

#### **Backend Implementation:**
```javascript
// Case 2: Manager promoted to HOD
if (newUser.role === 'department_head' && previousUser.role === 'manager') {
  
  console.log('⬆️ Manager promoted to HOD');
  
  const departmentId = newUser.departmentId;
  const managerId = newUser._id;
  
  // Step 1: Find existing HOD for this department
  const existingHod = await User.findOne({
    role: 'department_head',
    departmentId: departmentId,
    _id: { $ne: managerId }
  }).session(session);
  
  if (existingHod) {
    // Transfer all relationships from existing HOD
    const managersToTransfer = existingHod.managedManagerIds || [];
    const membersToTransfer = existingHod.managedMemberIds || [];
    
    // Initialize new HOD's arrays
    if (!newUser.managedManagerIds) newUser.managedManagerIds = [];
    if (!newUser.managedMemberIds) newUser.managedMemberIds = [];
    
    // Add existing HOD to managed managers (if not already there)
    if (!newUser.managedManagerIds.includes(existingHod._id)) {
      newUser.managedManagerIds.push(existingHod._id);
    }
    
    // Transfer all other managers
    for (const mgrId of managersToTransfer) {
      if (!newUser.managedManagerIds.includes(mgrId)) {
        newUser.managedManagerIds.push(mgrId);
      }
    }
    
    // Transfer all members
    for (const memberId of membersToTransfer) {
      if (!newUser.managedMemberIds.includes(memberId)) {
        newUser.managedMemberIds.push(memberId);
      }
    }
    
    // Step 2: Demote existing HOD to Member
    await User.updateOne(
      { _id: existingHod._id },
      {
        role: 'member',
        department: null,
        departmentId: null,
        managerId: null,
        managedManagerIds: [],       // Clear managed managers
        managedMemberIds: []         // Clear managed members
      },
      { session }
    );

    console.log(`👤 Existing HOD ${existingHod._id} demoted to Member`);
  }
  
  // Step 3: Update Department head reference
  await Department.updateOne(
    { _id: departmentId },
    { headId: managerId },
    { session }
  );
  
  console.log(`🏢 Department ${departmentId} head updated to ${managerId}`);
}
```

---

### **Scenario 3: Member को HOD बनाना**

#### **Business Logic:**
```
पहले: Amit (Member - Development Department)
बाद में: Amit (HOD - Development Department)
```

#### **Backend Implementation:**
```javascript
// Case 3: Member promoted to HOD
if (newUser.role === 'department_head' && previousUser.role === 'member') {
  
  console.log('⬆️ Member promoted to HOD');
  
  const departmentId = newUser.departmentId;
  const memberId = newUser._id;
  
  // Step 1: Find existing HOD for this department
  const existingHod = await User.findOne({
    role: 'department_head',
    departmentId: departmentId,
    _id: { $ne: memberId }
  }).session(session);
  
  if (existingHod) {
    // Transfer all relationships from existing HOD
    const managersToTransfer = existingHod.managedManagerIds || [];
    const membersToTransfer = existingHod.managedMemberIds || [];
    
    // Initialize new HOD's arrays
    if (!newUser.managedManagerIds) newUser.managedManagerIds = [];
    if (!newUser.managedMemberIds) newUser.managedMemberIds = [];
    
    // Transfer all managers
    for (const mgrId of managersToTransfer) {
      if (!newUser.managedManagerIds.includes(mgrId)) {
        newUser.managedManagerIds.push(mgrId);
      }
    }
    
    // Transfer all members
    for (const memberId of membersToTransfer) {
      if (!newUser.managedMemberIds.includes(memberId)) {
        newUser.managedMemberIds.push(memberId);
      }
    }
    
    // Step 2: Demote existing HOD to Member
    await User.updateOne(
      { _id: existingHod._id },
      {
        role: 'member',
        managerId: memberId,         // New HOD becomes his manager
        managedManagerIds: [],       // Clear managed managers
        managedMemberIds: []         // Clear managed members
      },
      { session }
    );
    
    console.log(`👤 Existing HOD ${existingHod._id} demoted to Member`);
  }
  
  // Step 3: Update Department head reference
  await Department.updateOne(
    { _id: departmentId },
    { headId: memberId },
    { session }
  );
  
  console.log(`🏢 Department ${departmentId} head updated to ${memberId}`);
}
```

---

## 🔄 Complete HOD Change Function

### **Main Function:**
```javascript
async function handleHodChange(previousUser, newUser, session) {
  try {
    console.log('🔄 Starting HOD Change Process');
    
    // Case 1: New HOD assigned, Old HOD becomes Member
    if (newUser.role === 'department_head' && previousUser.role === 'department_head' && 
        newUser._id !== previousUser._id) {
      await handleNewHodAssignment(previousUser, newUser, session);
    }
    
    // Case 2: Manager promoted to HOD
    else if (newUser.role === 'department_head' && previousUser.role === 'manager') {
      await handleManagerToHodPromotion(previousUser, newUser, session);
    }
    
    // Case 3: Member promoted to HOD
    else if (newUser.role === 'department_head' && previousUser.role === 'member') {
      await handleMemberToHodPromotion(previousUser, newUser, session);
    }
    
    // Case 4: HOD demoted to Manager
    else if (previousUser.role === 'department_head' && newUser.role === 'manager') {
      await handleHodToManagerDemotion(previousUser, newUser, session);
    }
    
    // Case 5: HOD demoted to Member
    else if (previousUser.role === 'department_head' && newUser.role === 'member') {
      await handleHodToMemberDemotion(previousUser, newUser, session);
    }
    
    console.log('✅ HOD Change Process Completed');
    
  } catch (error) {
    console.error('❌ Error in HOD Change Process:', error);
    throw error;
  }
}
```

---

## 📊 Database Schema Requirements

### **User Model:**
```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'department_head', 'manager', 'member', 'hr', 'hr_manager', 'person'],
    required: true
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managedManagerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  managedMemberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true }
});
```

### **Department Model:**
```javascript
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  headId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
});
```

---

## 🧪 Testing Scenarios

### **Test Case 1: New HOD Assignment**
```javascript
// Input:
previousUser = { _id: "hod1", role: "department_head", departmentId: "dept1" }
newUser = { _id: "hod2", role: "department_head", departmentId: "dept1" }

// Expected Output:
// hod1 becomes member with no department
// hod2 becomes HOD with all hod1's relationships
// Department headId updated to hod2
```

### **Test Case 2: Manager to HOD Promotion**
```javascript
// Input:
previousUser = { _id: "manager1", role: "manager", departmentId: "dept1" }
newUser = { _id: "manager1", role: "department_head", departmentId: "dept1" }

// Expected Output:
// manager1 becomes HOD
// Existing HOD becomes Manager under manager1
// All relationships transferred
```

### **Test Case 3: Member to HOD Promotion**
```javascript
// Input:
previousUser = { _id: "member1", role: "member", departmentId: "dept1" }
newUser = { _id: "member1", role: "department_head", departmentId: "dept1" }

// Expected Output:
// member1 becomes HOD
// Existing HOD becomes Member under member1
// All relationships transferred
```

---

## ⚠️ Important Points

### **1. Data Integrity:**
- सभी changes atomic transaction में होने चाहिए
- अगर कोई step fail हो तो सब rollback हो जाना चाहिए
- Relationships हमेशा consistent रहने चाहिए

### **2. Permission Checks:**
- सिर्फ Super Admin या Admin ही HOD change कर सकते हैं
- User अपना role खुद नहीं change कर सकता

### **3. Validation:**
- Department ID valid होना चाहिए
- New HOD active user होना चाहिए
- Circular relationships avoid करने चाहिए

### **4. Audit Trail:**
- सभी HOD changes log होने चाहिए
- Who, when, what changes का record रखना चाहिए

---

## 🔍 Verification Queries

### **Check HOD Change Success:**
```javascript
// Verify new HOD
const newHod = await User.findOne({ 
  role: 'department_head', 
  departmentId: departmentId 
});

// Verify old HOD demotion
const oldHod = await User.findById(oldHodId);

// Verify department head update
const department = await Department.findById(departmentId);

// Verify relationships transfer
const managers = await User.find({ 
  _id: { $in: newHod.managedManagerIds } 
});

const members = await User.find({ 
  _id: { $in: newHod.managedMemberIds } 
});
```

---

## 📝 Summary

यह guide HOD change की सभी scenarios को cover करता है:

1. **New HOD Assignment** - पुराना HOD Member बन जाता है
2. **Manager to HOD Promotion** - Manager HOD बन जाता है
3. **Member to HOD Promotion** - Member HOD बन जाता है
4. **HOD Demotion** - HOD Manager या Member बन जाता है

सभी cases में relationships properly transfer होते हैं और data integrity maintain रहती है।
