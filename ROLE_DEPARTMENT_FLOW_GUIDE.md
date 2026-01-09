# Department User Add aur Role Department Change Guide (Roman Hindi)

Ye guide admin panel ke User section me user add karne aur Role and Department change karne ka end to end flow batata hai. Isme frontend UI steps aur backend logic dono cover hain.

## Important data model (simple view)
- User fields: role, departmentId, managerId, managedManagerIds, managedMemberIds, status/isActive
- Department fields: headId, managerIds, memberIds, employeeCount

Note: Backend me HOD ke liye role value "department_head" use hoti hai. Auth ke kuch rules me "hod" bhi allow kiya gaya hai, lekin create/update validation me "department_head" hi accepted hai.

## Role list (backend allowlist)
- super_admin
- admin
- department_head
- manager
- member
- hr
- hr_manager
- person

## User add ka flow (UI + backend)

### UI steps
1) User Management -> Add User.
2) Role select karo.
3) Role ke hisab se Department/HOD/Manager fields aate hain:
   - manager/member: department select hota hai (sirf wo departments jisme HOD assigned ho).
   - member: manager optional hai. Agar manager select nahi kiya to member direct HOD ko report karega.
   - hr/hr_manager/person/admin/super_admin: department optional hai.
4) Submit.

### Frontend payload behavior
- departmentId ya managerId agar "none" ho to payload se hata diya jata hai.
- manager role ke liye frontend hodId/headId attach karta hai.

### Backend create user logic (POST /api/users)
- role validation: allowed roles list.
- departmentId/managerId/phone/mobile validation.
- company restriction: admin sirf apni company me create kar sakta hai.
- department_head:
  - agar department me pehle se headId set hai to error.
  - user create ke baad Department.headId = userId set hota hai.
- manager:
  - hodId required hai, warna created user rollback ho jata hai.
  - Department.managerIds me add hota hai.
  - HOD.managedManagerIds me add hota hai.
- member:
  - Department.memberIds me add hota hai.
  - Agar managerId diya hai to Manager.managedMemberIds me add hota hai aur HOD.managedMemberIds me bhi add hota hai.
  - Agar managerId nahi diya to sirf HOD.managedMemberIds me add hota hai.
- hr/hr_manager/person/admin/super_admin:
  - user create hota hai, lekin Department.memberIds/managerIds/headId me change nahi hota.
- Email notifications HOD/manager ko role ke hisab se jati hain.

## Role and Department change (Edit User)

### UI behavior
- Role change par departmentId, hodId, managerId reset ho jate hain.
- Role = member/manager aur department select hone par HOD dropdown aata hai.
- Manager dropdown sirf member ke liye aata hai.
- HR/HR Manager/Person ke liye department field hide hai.

### Backend update logic (PUT /api/users/:id)
- Permission: super_admin/admin ya self update.
- Role/department validations.
- Transaction ke andar role change logic chalti hai.

#### A) Promote to Department Head (role: department_head)
- User ko previous relationships se clean kiya jata hai:
  - Old department memberIds/managerIds se remove.
  - Old HOD/manager ki managedMemberIds se remove.
- Existing HOD mile to usko demote karke uski managed lists new HOD ko transfer hoti hain.
- New HOD ka managerId null set hota hai.
- Department.headId new user par set hota hai.
- Agar user member list me tha to memberIds se bhi remove hota hai.

#### B) HOD to HOD change (existing HOD replace)
- Old HOD ki managed lists new HOD ko transfer hoti hain.
- Old HOD member ban jata hai, departmentId/managerId clear ho jata hai.
- Department.headId update hota hai.
- New HOD ka managerId null hota hai.

#### C) HOD demotion (department_head -> manager/member)
- Same department me demotion allowed nahi hai; user ko different department me move karna padta hai.
- Old department headId null ho jata hai.
- Demote to manager:
  - New dept managerIds me add hota hai.
  - New dept HOD.managedManagerIds me add hota hai.
  - managerId null.
- Demote to member:
  - New dept memberIds me add hota hai.
  - New dept HOD.managedMemberIds me add hota hai.
  - managerId null.

#### D) Any role -> Manager
- Old role relationships cleanup:
  - member: old dept memberIds se remove, old manager/HOD managedMemberIds se remove.
  - department_head: old dept headId clear.
  - hr/person: managed lists clear.
- New dept managerIds me add hota hai.
- New dept HOD.managedManagerIds me add hota hai.
- managerId null.

#### E) Any role -> Member
- Old role relationships cleanup:
  - manager: old dept managerIds se remove, old HOD.managedManagerIds se remove.
  - department_head: old dept headId clear.
  - hr/person: managed lists clear.
- New dept memberIds me add hota hai.
- New dept HOD.managedMemberIds me add hota hai.
- Agar managerId diya hai to manager.managedMemberIds me add hota hai, warna managerId null set hota hai.

#### F) Manager department change (role manager hi rahe)
- Old dept managerIds se remove.
- New dept managerIds me add.
- Old HOD.managedManagerIds se remove, new HOD.managedManagerIds me add.
- managerId null.
- New dept me HOD hona zaruri hai, warna error.

#### G) Member department change (role member hi rahe)
- Old dept memberIds se remove.
- Old HOD.managedMemberIds se remove.
- Old manager.managedMemberIds se remove.
- New dept memberIds me add.
- New HOD.managedMemberIds me add.
- Agar new managerId diya hai to new manager.managedMemberIds me add hota hai.
- New dept me HOD hona zaruri hai, warna error.

#### H) HR, HR Manager, Person, Admin, Super Admin
- Backend in roles ke liye Department.memberIds/managerIds/headId update nahi karta.
- departmentId/managerId store ho sakta hai, lekin organization hierarchy me use nahi hota.

## Example payloads

### Create member
```json
{
  "firstName": "Ali",
  "lastName": "Khan",
  "email": "ali@example.com",
  "password": "secret123",
  "role": "member",
  "departmentId": "<deptId>",
  "managerId": "<managerId-or-null>",
  "status": "active"
}
```

### Create manager (hodId required)
```json
{
  "firstName": "Sara",
  "lastName": "Iqbal",
  "email": "sara@example.com",
  "password": "secret123",
  "role": "manager",
  "departmentId": "<deptId>",
  "hodId": "<hodUserId>",
  "status": "active"
}
```

### Update role and department
```json
{
  "role": "member",
  "departmentId": "<newDeptId>",
  "managerId": "<managerId-or-null>"
}
```

## Source references (code)
- backend/routes/users.js
- tiny-typer-tool-09/src/components/Users/AddUserDialog.tsx
- tiny-typer-tool-09/src/components/Users/EditUserDialog.tsx
- tiny-typer-tool-09/src/components/Users/UserManagement.tsx
