# 👑 HOD to Member - New Department Logic

## 📋 Overview
यह document बताता है कि जब कोई HOD नया department select करके Member बनता है तो क्या-क्या changes होते हैं।

## 🎯 HOD to Member - New Department Scenario

### **Business Logic:**
जब HOD नया department select करके Member बनता है:
1. **Old Department:** HOD का headId clear होता है
2. **New Department:** Member को memberIds में add किया जाता है
3. **New Department HOD:** Member को managedMemberIds में add किया जाता है
4. **Manager (Optional):** अगर managerId provided है तो उस manager के managedMemberIds में भी add होता है

## 🔧 Backend Implementation

### **Location:** `backend/routes/users.js`
### **Case:** `CASE 1C: HOD Demotion (HOD to Manager/Member)`

```javascript
// ============================================
// CASE 1C: HOD Demotion (HOD to Manager/Member)
// ============================================
else if (previousUser.role === 'department_head' && updateData.role !== 'department_head') {
  console.log('🎯 CASE 1C TRIGGERED: HOD Demotion');

  const oldDepartmentId = previousUser.departmentId;
  const newDepartmentId = updateData.departmentId || oldDepartmentId; // Use new department if provided
  const hodId = previousUser._id;

  // Step 1: Clear HOD relationships
  updateData.managedManagerIds = [];
  updateData.managedMemberIds = [];

  // Step 2: Clear OLD Department head reference
  await Department.updateOne(
    { _id: oldDepartmentId },
    { headId: null },
    { session }
  );

  // Step 3: Create new relationships in NEW department
  if (updateData.role === 'member') {
    // Add to NEW department memberIds
    await Department.updateOne(
      { _id: newDepartmentId },
      { $addToSet: { memberIds: hodId } },
      { session }
    );

    // Find HOD for the NEW department
    const existingHod = await User.findOne({
      role: 'department_head',
      departmentId: newDepartmentId,
      _id: { $ne: hodId }
    }).session(session);

    // Check if user provided a specific managerId
    if (updateData.managerId) {
      // User specified a specific manager - add to that manager's managedMemberIds
      const specifiedManager = await User.findById(updateData.managerId).session(session);
      if (specifiedManager) {
        if (!specifiedManager.managedMemberIds) specifiedManager.managedMemberIds = [];
        if (!specifiedManager.managedMemberIds.includes(hodId)) {
          specifiedManager.managedMemberIds.push(hodId);
          await specifiedManager.save({ session });
        }
        // managerId already set in updateData
      } else {
        updateData.managerId = null;
      }

      // ALSO add to existing HOD's managedMemberIds (if exists and different from specified manager)
      if (existingHod && existingHod._id.toString() !== updateData.managerId) {
        if (!existingHod.managedMemberIds) existingHod.managedMemberIds = [];
        if (!existingHod.managedMemberIds.includes(hodId)) {
          existingHod.managedMemberIds.push(hodId);
          await existingHod.save({ session });
        }
      }
    } else {
      // No specific manager provided - assign to existing HOD
      if (existingHod) {
        // Add to existing HOD's managedMemberIds
        if (!existingHod.managedMemberIds) existingHod.managedMemberIds = [];
        if (!existingHod.managedMemberIds.includes(hodId)) {
          existingHod.managedMemberIds.push(hodId);
          await existingHod.save({ session });
        }

        updateData.managerId = existingHod._id;
      } else {
        updateData.managerId = null;
      }
    }
  }

  // Update the user with new department
  await User.updateOne(
    { _id: hodId },
    {
      role: updateData.role,
      departmentId: newDepartmentId,  // NEW DEPARTMENT
      managerId: updateData.managerId,
      managedManagerIds: updateData.managedManagerIds,
      managedMemberIds: updateData.managedMemberIds
    },
    { session }
  );
}
```

## 📊 Complete Flow Example

### **Example: HOD Changes Department and Becomes Member**

```
Initial State:
- HOD1: role = "department_head", departmentId = "dept1", managedManagerIds = ["m1", "m2"]
- Department1: headId = "hod1", memberIds = ["mem1", "mem2"]
- Department2: headId = "hod2", memberIds = ["mem3", "mem4"]

Action: HOD1 → Member in Department2

Step 1 - Cleanup:
- HOD1: managedManagerIds = [], managedMemberIds = []
- Department1: headId = null (cleared)

Step 2 - Setup in New Department:
- Department2: memberIds = ["mem3", "mem4", "hod1"] (hod1 added)
- HOD2: managedMemberIds = ["mem3", "mem4", "hod1"] (hod1 added)
- HOD1: managerId = "hod2" (assigned to HOD2)

Final State:
- HOD1 (now Member): role = "member", departmentId = "dept2", managerId = "hod2"
- Department1: headId = null, memberIds = ["mem1", "mem2"]
- Department2: headId = "hod2", memberIds = ["mem3", "mem4", "hod1"]
- HOD2: managedMemberIds = ["mem3", "mem4", "hod1"]
```

## 🎯 Key Features

### **✅ Dynamic Department Handling:**
- **Old Department:** `previousUser.departmentId`
- **New Department:** `updateData.departmentId` (if provided)

### **✅ Relationships Created:**
1. **New Department memberIds** - Member add किया जाता है
2. **New Department HOD managedMemberIds** - Member को HOD के नीचे add किया जाता है
3. **Manager managedMemberIds** - अगर managerId provided है तो manager के नीचे भी add होता है

### **✅ Business Rules:**
- **Old Department:** HOD reference clear होता है
- **New Department:** Member properly integrated होता है
- **Hierarchy Maintained:** सभी relationships correct होते हैं

## 🔄 API Usage

### **HOD to Member in New Department:**
```javascript
PUT /api/users/:hodId
{
  "role": "member",
  "departmentId": "new-dept-id",  // नया department
  "managerId": "manager-id"       // optional - specific manager
}
```

### **HOD to Member in Same Department:**
```javascript
PUT /api/users/:hodId
{
  "role": "member",
  "departmentId": "same-dept-id", // या omit करें
  "managerId": "manager-id"       // optional
}
```

## 🧪 Testing

### **Test Case 1: HOD to Member (New Department)**
```javascript
// Before:
HOD: dept1, role: department_head
Dept1: headId = hodId
Dept2: headId = hod2Id

// API Call:
PUT /users/hodId
{
  "role": "member",
  "departmentId": "dept2"
}

// After:
HOD: dept2, role: member, managerId = hod2Id
Dept1: headId = null
Dept2: memberIds includes hodId
HOD2: managedMemberIds includes hodId
```

### **Test Case 2: HOD to Member with Specific Manager**
```javascript
PUT /users/hodId
{
  "role": "member",
  "departmentId": "dept2",
  "managerId": "specific-manager-id"
}

// Result:
// - Added to dept2 memberIds
// - Added to specific-manager managedMemberIds
// - managerId = specific-manager-id
```

## ✅ Benefits

### **1. Flexibility:**
- **Department Change:** HOD किसी भी department में जा सकता है
- **Manager Assignment:** Specific manager assign कर सकते हैं
- **Automatic Integration:** नए department में automatically integrate होता है

### **2. Data Integrity:**
- **No Orphaned Data:** सभी old relationships clear होते हैं
- **Proper Relationships:** सभी new relationships create होते हैं
- **Hierarchy Maintained:** organizational structure intact रहती है

### **3. Business Logic:**
- **HOD Independence:** HOD किसी भी department में member बन सकता है
- **Manager Control:** specific manager के नीचे assign किया जा सकता है
- **Clean Transitions:** smooth role transitions

यह logic सभी scenarios को properly handle करता है और complete flexibility provide करता है!
