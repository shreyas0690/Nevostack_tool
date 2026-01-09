# 👨‍💼 Manager Assignment Complete Guide

## 📋 Overview
यह guide बताता है कि जब कोई HR, Member, Person या HOD को Manager बनाया जाता है तो क्या-क्या changes होते हैं।

## 🎯 Manager Assignment Scenarios

### **Scenario 1: HR to Manager**
### **Scenario 2: Member to Manager**
### **Scenario 3: Person to Manager**
### **Scenario 4: HOD to Manager**

---

## 🔄 HR to Manager Assignment

### **Business Logic:**
जब HR को Manager बनाया जाता है:
1. HR का role `manager` हो जाता है
2. Department assign होता है
3. HOD assign होता है
4. HR के सभी previous relationships clear होते हैं

### **Backend Implementation:**
```javascript
// Case: HR to Manager
if (updateData.role === 'manager' && previousUser.role === 'hr') {
  console.log('🔄 HR to Manager Assignment');
  
  // Step 1: Clear HR relationships
  updateData.managedManagerIds = [];
  updateData.managedMemberIds = [];
  
  // Step 2: Assign to department
  if (updateData.departmentId) {
    // Add to department
    await Department.updateOne(
      { _id: updateData.departmentId },
      { $addToSet: { managerIds: userId } },
      { session }
    );
  }
  
  // Step 3: Assign HOD as manager
  if (updateData.managerId) {
    const hod = await User.findById(updateData.managerId).session(session);
    if (hod && hod.managedManagerIds) {
      hod.managedManagerIds.push(userId);
      await hod.save({ session });
    }
  }
}
```

### **Database Changes:**
```javascript
// Before HR to Manager:
{
  _id: "hr1",
  role: "hr",
  departmentId: null,
  managerId: null,
  managedManagerIds: [],
  managedMemberIds: []
}

// After HR to Manager:
{
  _id: "hr1",
  role: "manager",
  departmentId: "dept123",
  managerId: "hod1",
  managedManagerIds: [],
  managedMemberIds: []
}

// Department updated:
{
  _id: "dept123",
  managerIds: ["manager1", "manager2", "hr1"]  // hr1 added
}

// HOD updated:
{
  _id: "hod1",
  managedManagerIds: ["manager1", "manager2", "hr1"]  // hr1 added
}
```

---

## 🔄 Member to Manager Assignment

### **Business Logic:**
जब Member को Manager बनाया जाता है:
1. Member का role `manager` हो जाता है
2. Member को department के `managerIds` में add करना
3. Member को HOD के `managedManagerIds` में add करना
4. Member के previous manager से remove करना

### **Backend Implementation:**
```javascript
// Case: Member to Manager
if (updateData.role === 'manager' && previousUser.role === 'member') {
  console.log('🔄 Member to Manager Assignment');
  
  // Step 1: Remove from department memberIds
  if (previousUser.departmentId) {
    await Department.updateOne(
      { _id: previousUser.departmentId },
      { $pull: { memberIds: userId } },
      { session }
    );
  }
  
  // Step 2: Remove from previous manager's managedMemberIds
  if (previousUser.managerId) {
    const prevManager = await User.findById(previousUser.managerId).session(session);
    if (prevManager && prevManager.managedMemberIds) {
      prevManager.managedMemberIds = prevManager.managedMemberIds.filter(
        id => id.toString() !== userId
      );
      await prevManager.save({ session });
    }
  }
  
  // Step 3: Add to department managerIds
  if (updateData.departmentId) {
    await Department.updateOne(
      { _id: updateData.departmentId },
      { $addToSet: { managerIds: userId } },
      { session }
    );
  }
  
  // Step 4: Add to HOD's managedManagerIds
  if (updateData.managerId) {
    const hod = await User.findById(updateData.managerId).session(session);
    if (hod && hod.managedManagerIds) {
      hod.managedManagerIds.push(userId);
      await hod.save({ session });
    }
  }
}
```

### **Database Changes:**
```javascript
// Before Member to Manager:
{
  _id: "member1",
  role: "member",
  departmentId: "dept123",
  managerId: "manager1",
  managedManagerIds: [],
  managedMemberIds: []
}

// After Member to Manager:
{
  _id: "member1",
  role: "manager",
  departmentId: "dept123",
  managerId: "hod1",
  managedManagerIds: [],
  managedMemberIds: []
}

// Department updated:
{
  _id: "dept123",
  memberIds: ["member2", "member3"],  // member1 removed
  managerIds: ["manager1", "manager2", "member1"]  // member1 added
}

// Previous Manager updated:
{
  _id: "manager1",
  managedMemberIds: ["member2", "member3"]  // member1 removed
}

// HOD updated:
{
  _id: "hod1",
  managedManagerIds: ["manager1", "manager2", "member1"]  // member1 added
}
```

---

## 🔄 Person to Manager Assignment

### **Business Logic:**
जब Person को Manager बनाया जाता है:
1. Person का role `manager` हो जाता है
2. Department assign होता है
3. HOD assign होता है
4. Person के सभी previous relationships clear होते हैं

### **Backend Implementation:**
```javascript
// Case: Person to Manager
if (updateData.role === 'manager' && previousUser.role === 'person') {
  console.log('🔄 Person to Manager Assignment');
  
  // Step 1: Clear person relationships
  updateData.managedManagerIds = [];
  updateData.managedMemberIds = [];
  
  // Step 2: Assign to department
  if (updateData.departmentId) {
    await Department.updateOne(
      { _id: updateData.departmentId },
      { $addToSet: { managerIds: userId } },
      { session }
    );
  }
  
  // Step 3: Assign HOD as manager
  if (updateData.managerId) {
    const hod = await User.findById(updateData.managerId).session(session);
    if (hod && hod.managedManagerIds) {
      hod.managedManagerIds.push(userId);
      await hod.save({ session });
    }
  }
}
```

### **Database Changes:**
```javascript
// Before Person to Manager:
{
  _id: "person1",
  role: "person",
  departmentId: null,
  managerId: null,
  managedManagerIds: [],
  managedMemberIds: []
}

// After Person to Manager:
{
  _id: "person1",
  role: "manager",
  departmentId: "dept123",
  managerId: "hod1",
  managedManagerIds: [],
  managedMemberIds: []
}

// Department updated:
{
  _id: "dept123",
  managerIds: ["manager1", "manager2", "person1"]  // person1 added
}

// HOD updated:
{
  _id: "hod1",
  managedManagerIds: ["manager1", "manager2", "person1"]  // person1 added
}
```

---

## 🔄 HOD to Manager Assignment

### **Business Logic:**
जब HOD को Manager बनाया जाता है:
1. HOD का role `manager` हो जाता है
2. HOD के सभी managed relationships clear होते हैं
3. Department head reference clear होता है
4. HOD को new HOD assign होता है

### **Backend Implementation:**
```javascript
// Case: HOD to Manager
if (updateData.role === 'manager' && previousUser.role === 'department_head') {
  console.log('🔄 HOD to Manager Assignment');
  
  // Step 1: Clear HOD relationships
  updateData.managedManagerIds = [];
  updateData.managedMemberIds = [];
  
  // Step 2: Clear department head reference
  if (previousUser.departmentId) {
    await Department.updateOne(
      { _id: previousUser.departmentId },
      { headId: null },
      { session }
    );
  }
  
  // Step 3: Add to department managerIds
  if (updateData.departmentId) {
    await Department.updateOne(
      { _id: updateData.departmentId },
      { $addToSet: { managerIds: userId } },
      { session }
    );
  }
  
  // Step 4: Assign new HOD as manager
  if (updateData.managerId) {
    const newHod = await User.findById(updateData.managerId).session(session);
    if (newHod && newHod.managedManagerIds) {
      newHod.managedManagerIds.push(userId);
      await newHod.save({ session });
    }
  }
}
```

### **Database Changes:**
```javascript
// Before HOD to Manager:
{
  _id: "hod1",
  role: "department_head",
  departmentId: "dept123",
  managerId: null,
  managedManagerIds: ["manager1", "manager2"],
  managedMemberIds: ["member1", "member2", "member3"]
}

// After HOD to Manager:
{
  _id: "hod1",
  role: "manager",
  departmentId: "dept123",
  managerId: "newHod1",
  managedManagerIds: [],
  managedMemberIds: []
}

// Department updated:
{
  _id: "dept123",
  headId: null,  // cleared
  managerIds: ["manager1", "manager2", "hod1"]  // hod1 added
}

// New HOD updated:
{
  _id: "newHod1",
  managedManagerIds: ["manager1", "manager2", "hod1"]  // hod1 added
}
```

---

## 📊 Complete Flow Examples

### **Example 1: Member to Manager**
```
Initial State:
- Member1: role = "member", departmentId = "dept123", managerId = "manager1"
- Department: memberIds = ["member1", "member2", "member3"]
- Manager1: managedMemberIds = ["member1", "member2", "member3"]
- HOD1: managedManagerIds = ["manager1", "manager2"]

Action: Promote Member1 to Manager

Step 1 - Remove from Member relationships:
- Department: memberIds = ["member2", "member3"] (member1 removed)
- Manager1: managedMemberIds = ["member2", "member3"] (member1 removed)

Step 2 - Add to Manager relationships:
- Department: managerIds = ["manager1", "manager2", "member1"] (member1 added)
- HOD1: managedManagerIds = ["manager1", "manager2", "member1"] (member1 added)

Final State:
- Member1: role = "manager", departmentId = "dept123", managerId = "hod1"
- Department: memberIds = ["member2", "member3"], managerIds = ["manager1", "manager2", "member1"]
- Manager1: managedMemberIds = ["member2", "member3"]
- HOD1: managedManagerIds = ["manager1", "manager2", "member1"]
```

### **Example 2: HOD to Manager**
```
Initial State:
- HOD1: role = "department_head", departmentId = "dept123", managedManagerIds = ["manager1", "manager2"]
- Department: headId = "hod1", managerIds = ["manager1", "manager2"]
- NewHOD1: role = "department_head", departmentId = "dept123"

Action: Demote HOD1 to Manager

Step 1 - Clear HOD relationships:
- HOD1: managedManagerIds = [], managedMemberIds = []

Step 2 - Clear department head:
- Department: headId = null

Step 3 - Add to Manager relationships:
- Department: managerIds = ["manager1", "manager2", "hod1"] (hod1 added)
- NewHOD1: managedManagerIds = ["manager1", "manager2", "hod1"] (hod1 added)

Final State:
- HOD1: role = "manager", departmentId = "dept123", managerId = "newHod1"
- Department: headId = null, managerIds = ["manager1", "manager2", "hod1"]
- NewHOD1: managedManagerIds = ["manager1", "manager2", "hod1"]
```

---

## ✅ Benefits of Manager Assignment Logic

### **1. Data Integrity:**
- सभी relationships properly updated
- कोई orphaned data नहीं रहता
- Department structure maintained

### **2. Business Logic:**
- Proper role transitions
- Clear hierarchy maintained
- Logical organizational structure

### **3. Performance:**
- Efficient relationship updates
- Clean database structure
- Optimized queries

### **4. User Experience:**
- Clear role changes
- Proper permissions
- Consistent hierarchy

---

## 🧪 Testing Scenarios

### **Test Cases:**
1. **HR to Manager:** Verify HR relationships cleared, Manager relationships added
2. **Member to Manager:** Verify Member removed from memberIds, added to managerIds
3. **Person to Manager:** Verify Person relationships cleared, Manager relationships added
4. **HOD to Manager:** Verify HOD relationships cleared, Manager relationships added

### **Verification Points:**
- Role updated correctly
- Department relationships updated
- HOD relationships updated
- Previous relationships cleared
- No orphaned data

---

## 📝 Implementation Summary

Manager Assignment logic ensure करता है कि:

1. **Before Assignment:** Previous relationships properly cleared
2. **During Assignment:** New relationships properly established
3. **After Assignment:** All references consistent और clean

यह approach proper role transitions maintain करता है और business logic को correctly implement करता है!

---

## 🔍 Key Points

### **Common Steps for All Manager Assignments:**
1. Clear previous role relationships
2. Update user role to manager
3. Add to department managerIds
4. Add to HOD managedManagerIds
5. Assign HOD as manager

### **Special Cases:**
- **Member to Manager:** Remove from memberIds, remove from previous manager
- **HOD to Manager:** Clear department head, clear all managed relationships
- **HR/Person to Manager:** Simple role change with new relationships

### **What gets updated:**
- User role and relationships
- Department managerIds/memberIds
- HOD managedManagerIds
- Previous manager relationships (if applicable)
