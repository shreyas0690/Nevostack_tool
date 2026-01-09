# SaaS Companies Section - Complete Requirements & Implementation Guide

## 📋 Overview
This document outlines the complete requirements for the SaaS Companies management section, including backend API design, frontend components, and data integration.

## 🎯 Core Features Required

### 1. **Companies Dashboard Overview**
- **Total Companies Count** - Real-time count of all registered companies
- **Active Companies** - Companies with active subscriptions
- **Pending Approval** - Companies awaiting admin approval
- **Suspended Companies** - Companies with suspended access
- **Trial Companies** - Companies in trial period
- **Revenue Metrics** - Monthly/Yearly revenue from all companies

### 2. **Company Management Features**

#### **Company Listing & Search**
- **Advanced Search** - Search by company name, email, domain, industry
- **Multi-Filter System** - Filter by status, subscription plan, industry, date range
- **Sorting Options** - Sort by name, creation date, last activity, revenue
- **Pagination** - Handle large datasets efficiently
- **Bulk Actions** - Select multiple companies for bulk operations

#### **Company Profile Management**
- **Company Information** - Name, domain, email, phone, address
- **Subscription Details** - Plan type, billing cycle, status, renewal date
- **User Management** - View and manage company users
- **Activity Tracking** - Last login, recent activities, usage statistics
- **Billing History** - Payment records, invoices, subscription changes

#### **Company Actions**
- **Approve/Reject** - For pending company applications
- **Suspend/Activate** - Control company access
- **Plan Changes** - Upgrade/downgrade subscription plans
- **User Limits** - Set maximum users per company
- **Data Export** - Export company data and reports

### 3. **Subscription Management**

#### **Plan Management**
- **Basic Plan** - $99/month - Up to 50 users
- **Professional Plan** - $299/month - Up to 200 users  
- **Enterprise Plan** - $599/month - Unlimited users
- **Custom Plans** - Tailored solutions for large enterprises

#### **Billing Features**
- **Trial Management** - 14-day free trial for new companies
- **Auto-renewal** - Automatic subscription renewal
- **Payment Methods** - Credit card, bank transfer, invoice
- **Billing Cycles** - Monthly, quarterly, yearly options
- **Proration** - Handle plan changes mid-cycle

### 4. **Analytics & Reporting**

#### **Company Analytics**
- **Growth Metrics** - New signups, churn rate, retention
- **Usage Analytics** - Feature usage, user activity, engagement
- **Revenue Analytics** - MRR, ARR, revenue per company
- **Geographic Distribution** - Company locations worldwide

#### **Platform Health**
- **System Performance** - Server load, response times
- **Storage Usage** - Total storage consumed by all companies
- **API Usage** - API calls, rate limits, usage patterns
- **Security Metrics** - Login attempts, security incidents

## 🏗️ Backend API Requirements

### **Core Endpoints**

#### **Companies Management**
```
GET    /api/saas/companies              - List all companies with filters
GET    /api/saas/companies/:id          - Get company details
POST   /api/saas/companies              - Create new company
PUT    /api/saas/companies/:id          - Update company details
DELETE /api/saas/companies/:id          - Delete company
PATCH  /api/saas/companies/:id/status  - Update company status
```

#### **Subscription Management**
```
GET    /api/saas/companies/:id/subscription     - Get subscription details
PATCH  /api/saas/companies/:id/subscription   - Update subscription
POST   /api/saas/companies/:id/upgrade         - Upgrade plan
POST   /api/saas/companies/:id/downgrade       - Downgrade plan
POST   /api/saas/companies/:id/cancel          - Cancel subscription
```

#### **User Management**
```
GET    /api/saas/companies/:id/users           - Get company users
POST   /api/saas/companies/:id/users           - Add user to company
DELETE /api/saas/companies/:id/users/:userId   - Remove user from company
PATCH  /api/saas/companies/:id/users/:userId  - Update user role
```

#### **Analytics & Reports**
```
GET    /api/saas/analytics/companies          - Company analytics
GET    /api/saas/analytics/revenue           - Revenue analytics
GET    /api/saas/analytics/usage             - Usage analytics
GET    /api/saas/reports/companies            - Company reports
GET    /api/saas/reports/export               - Export data
```

### **Data Models**

#### **Company Model**
```javascript
{
  _id: ObjectId,
  name: String,
  domain: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  industry: String,
  companySize: String,
  status: 'active' | 'suspended' | 'pending' | 'inactive',
  subscription: {
    plan: 'basic' | 'pro' | 'enterprise',
    status: 'active' | 'trial' | 'expired' | 'cancelled',
    startDate: Date,
    endDate: Date,
    billingCycle: 'monthly' | 'quarterly' | 'yearly',
    amount: Number,
    autoRenewal: Boolean
  },
  limits: {
    maxUsers: Number,
    maxStorage: Number,
    maxDepartments: Number
  },
  stats: {
    totalUsers: Number,
    activeUsers: Number,
    totalDepartments: Number,
    totalTasks: Number,
    totalMeetings: Number,
    storageUsed: Number,
    lastActivity: Date
  },
  owner: {
    name: String,
    email: String,
    phone: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### **User Model (Company-specific)**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  role: 'admin' | 'manager' | 'member',
  department: String,
  status: 'active' | 'inactive' | 'suspended',
  lastLogin: Date,
  createdAt: Date
}
```

## 🎨 Frontend Components Required

### **1. Companies Dashboard**
- **SaaSCompaniesManagement.tsx** - Main companies management component
- **CompanyStatsCards.tsx** - Statistics overview cards
- **CompanyFilters.tsx** - Advanced filtering component
- **CompanyTable.tsx** - Companies listing table
- **CompanyPagination.tsx** - Pagination component

### **2. Company Profile**
- **CompanyProfile.tsx** - Detailed company view
- **CompanyInfo.tsx** - Basic company information
- **CompanySubscription.tsx** - Subscription management
- **CompanyUsers.tsx** - Company users management
- **CompanyActivity.tsx** - Activity timeline

### **3. Company Actions**
- **CompanyActions.tsx** - Action buttons and dropdowns
- **ApproveCompanyDialog.tsx** - Company approval dialog
- **SuspendCompanyDialog.tsx** - Company suspension dialog
- **EditCompanyDialog.tsx** - Company editing dialog
- **DeleteCompanyDialog.tsx** - Company deletion confirmation

### **4. Subscription Management**
- **SubscriptionPlans.tsx** - Available plans display
- **PlanUpgrade.tsx** - Plan upgrade component
- **BillingHistory.tsx** - Payment history
- **InvoiceManagement.tsx** - Invoice management

### **5. Analytics & Reports**
- **CompanyAnalytics.tsx** - Company-specific analytics
- **RevenueAnalytics.tsx** - Revenue tracking
- **UsageAnalytics.tsx** - Usage statistics
- **ExportReports.tsx** - Data export functionality

## 📊 Data Display Requirements

### **Companies Table Columns**
1. **Company Info** - Name, domain, industry
2. **Contact Details** - Email, phone, address
3. **Subscription** - Plan, status, billing cycle, amount
4. **Status** - Active, pending, suspended, inactive
5. **Users** - Total users, active users, user limits
6. **Departments** - Number of departments
7. **Activity** - Last login, creation date, activity level
8. **Actions** - View, edit, manage, delete options

### **Company Profile Sections**
1. **Overview** - Basic company information
2. **Subscription** - Plan details, billing, payment history
3. **Users** - User management, roles, permissions
4. **Departments** - Department structure and management
5. **Activity** - Recent activities, login history
6. **Settings** - Company settings, preferences
7. **Billing** - Payment methods, invoices, billing history

### **Analytics Dashboard**
1. **Growth Metrics** - New signups, churn, retention
2. **Revenue Metrics** - MRR, ARR, revenue per company
3. **Usage Metrics** - Feature usage, user engagement
4. **Geographic Data** - Company locations, regional analysis
5. **Performance Metrics** - System health, response times

## 🔧 Implementation Priority

### **Phase 1: Core Backend (Week 1)**
- [ ] Company CRUD operations
- [ ] Subscription management
- [ ] User management within companies
- [ ] Basic analytics endpoints

### **Phase 2: Frontend Components (Week 2)**
- [ ] Companies listing and search
- [ ] Company profile views
- [ ] Basic company actions
- [ ] Subscription management UI

### **Phase 3: Advanced Features (Week 3)**
- [ ] Advanced analytics
- [ ] Reporting and export
- [ ] Bulk operations
- [ ] Real-time updates

### **Phase 4: Polish & Optimization (Week 4)**
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Error handling
- [ ] Testing and validation

## 🚀 Success Metrics

### **Technical Metrics**
- **API Response Time** - < 200ms for company listing
- **Database Performance** - < 100ms for complex queries
- **Frontend Load Time** - < 2 seconds for initial load
- **Search Performance** - < 500ms for search results

### **Business Metrics**
- **Company Onboarding** - < 5 minutes for new company setup
- **User Experience** - Intuitive navigation and actions
- **Data Accuracy** - 100% accurate company information
- **System Reliability** - 99.9% uptime for company management

## 📝 Notes

### **Security Considerations**
- Role-based access control for company management
- Data encryption for sensitive company information
- Audit logging for all company actions
- Secure API endpoints with proper authentication

### **Scalability Requirements**
- Support for 10,000+ companies
- Efficient pagination and search
- Caching for frequently accessed data
- Database optimization for large datasets

### **Integration Points**
- Payment gateway integration for subscriptions
- Email service for notifications
- Analytics service for tracking
- Export functionality for data portability

---

**This comprehensive guide ensures the SaaS Companies section will be robust, scalable, and user-friendly while meeting all business requirements.**



