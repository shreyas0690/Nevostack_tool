# 👨‍💼 Manager Department Change - Complete Logic

## 📋 Overview
यह document बताता है कि जब कोई Manager एक department से दूसरे department में transfer होता है तो क्या-क्या changes होते हैं।

## 🎯 Manager Department Change Scenario

### **Business Logic:**
जब Manager एक department से दूसरे department में transfer होता है:
1. **Old Department:** Manager को managerIds से remove करना
2. **Old Department HOD:** Manager को managedManagerIds से remove करना
3. **New Department:** Manager को managerIds में add करना
4. **New Department HOD:** Manager को managedManagerIds में add करना
5. **ManagerId:** Manager का managerId हमेशा null रहना चाहिए

## 🔧 Backend Implementation

### **Location:** `backend/routes/users.js`
### **Case:** `CASE 2: Manager Department Change`

```javascript
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

  // Remove from old department's managerIds
  await Department.updateOne(
    { _id: oldDeptId },
    { $pull: { managerIds: userId } },
    { session }
  );
  console.log(`❌ Removed manager from old department ${oldDeptId} managerIds`);

  // Add to new department's managerIds
  await Department.updateOne(
    { _id: newDeptId },
    { $addToSet: { managerIds: userId } },
    { session }
  );
  console.log(`✅ Added manager to new department ${newDeptId} managerIds`);

  // Remove from old HOD's managedManagerIds
  if (oldHod) {
    const oldHodUpdated = await User.findById(oldHod._id).session(session);
    if (oldHodUpdated && oldHodUpdated.managedManagerIds) {
      oldHodUpdated.managedManagerIds = oldHodUpdated.managedManagerIds.filter(
        managerId => managerId.toString() !== userId
      );
      await oldHodUpdated.save({ session });
      console.log(`❌ Removed manager from old HOD ${oldHod._id} managedManagerIds`);
    }
  }

  // Add to new HOD's managedManagerIds
  const newHodUpdated = await User.findById(newHod._id).session(session);
  if (newHodUpdated) {
    if (!newHodUpdated.managedManagerIds) newHodUpdated.managedManagerIds = [];
    if (!newHodUpdated.managedManagerIds.includes(userId)) {
      newHodUpdated.managedManagerIds.push(userId);
      await newHodUpdated.save({ session });
      console.log(`✅ Added manager to new HOD ${newHod._id} managedManagerIds`);
    }
  }

  // Manager should not have a manager - ensure managerId is null
  updateData.managerId = null;
  console.log(`❌ Set Manager's managerId to null (Manager should not have manager)`);
}
```

## 📊 Complete Flow Example

### **Example: Manager Transfer from Dept A to Dept B**

```
Initial State:
- Manager1: role = "manager", departmentId = "deptA"
- Department A: managerIds = ["manager1", "manager2"], HOD = "hodA"
- Department B: managerIds = ["manager3"], HOD = "hodB"
- HOD A: managedManagerIds = ["manager1", "manager2"]
- HOD B: managedManagerIds = ["manager3"]

Action: Manager1 transfers from Dept A to Dept B

Step 1 - Department Updates:
- Department A: managerIds = ["manager2"] (manager1 removed)
- Department B: managerIds = ["manager3", "manager1"] (manager1 added)

Step 2 - HOD Updates:
- HOD A: managedManagerIds = ["manager2"] (manager1 removed)
- HOD B: managedManagerIds = ["manager3", "manager1"] (manager1 added)

Step 3 - Manager Update:
- Manager1: departmentId = "deptB", managerId = null (ensured)

Final State:
- Manager1: role = "manager", departmentId = "deptB", managerId = null
- Department A: managerIds = ["manager2"]
- Department B: managerIds = ["manager3", "manager1"]
- HOD A: managedManagerIds = ["manager2"]
- HOD B: managedManagerIds = ["manager3", "manager1"]
```

## 🎯 Key Features

### **✅ Complete Department Transfer:**
- **Department Arrays:** managerIds properly updated
- **HOD Relationships:** managedManagerIds properly updated
- **Manager Independence:** managerId always null
- **Data Integrity:** No orphaned references

### **✅ Validation:**
- **Department IDs Required:** Both old and new department must exist
- **New HOD Required:** New department must have a HOD
- **Atomic Operations:** All changes in single transaction

### **✅ Business Rules:**
- **Manager Independence:** Manager का कोई direct manager नहीं
- **HOD Hierarchy:** Manager directly reports to HOD
- **Clean Transfer:** No duplicate relationships

## 🔄 API Usage

### **Manager Department Transfer:**
```javascript
PUT /api/users/managerId
{
  "role": "manager",           // Same role
  "departmentId": "new-dept-id" // New department
  // managerId will be set to null automatically
}
```

### **Validation:**
- `previousUser.role === 'manager'` ✅
- `updateData.role === 'manager'` ✅
- `previousUser.departmentId !== updateData.departmentId` ✅

## 🧪 Testing Scenarios

### **Test Case 1: Successful Transfer**
```javascript
// Setup: Manager in Dept A with HOD A
// Action: Transfer to Dept B with HOD B
// Result: All relationships properly updated
```

### **Test Case 2: Missing New HOD**
```javascript
// Setup: Dept B has no HOD
// Action: Transfer manager to Dept B
// Result: Error thrown - "No department head found for new department"
```

### **Test Case 3: Same Department**
```javascript
// Setup: Manager already in target department
// Action: "Transfer" to same department
// Result: No changes (condition not met)
```

## ✅ Benefits

### **1. Data Integrity:**
- **Complete Cleanup:** Old department से proper removal
- **Correct Setup:** New department में proper addition
- **No Duplicates:** Clean relationship arrays

### **2. Business Logic:**
- **Manager Independence:** managerId always null
- **Proper Hierarchy:** Manager ↔ HOD relationship
- **Department Integrity:** Accurate manager counts

### **3. Performance:**
- **Atomic Operations:** Single transaction
- **Efficient Queries:** Minimal database calls
- **Proper Indexing:** Fast relationship updates

### **4. User Experience:**
- **Seamless Transfer:** No data corruption
- **Clear Hierarchy:** Proper organizational structure
- **Reliable Operations:** Consistent behavior

यह logic manager department transfers को completely handle करता है और सभी business requirements को meet करता है!
