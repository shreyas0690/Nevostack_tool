# SaaS Audit Logs Design - Complete System Architecture

## Overview
The SaaS Audit Logs system provides comprehensive activity tracking, security monitoring, and compliance reporting across all companies in the NevoStack platform. This document outlines the complete design, implementation, and enhancement strategy.

## 🏗️ System Architecture

### 1. Database Schema (Enhanced)

```javascript
// Enhanced AuditLog Model
const auditLogSchema = new mongoose.Schema({
  // Core Identification
  timestamp: { type: Date, default: Date.now, required: true, index: true },
  logId: { type: String, unique: true, required: true }, // Custom log ID for tracking
  
  // User Information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail: { type: String, required: true, trim: true, index: true },
  userName: { type: String, required: true, trim: true },
  userRole: { 
    type: String, 
    required: true, 
    enum: ['super_admin', 'admin', 'department_head', 'manager', 'member', 'system', 'api'],
    default: 'member' 
  },
  
  // Company Context
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  companyName: { type: String, trim: true, default: '' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  departmentName: { type: String, trim: true, default: '' },
  
  // Action Details
  action: { 
    type: String, 
    required: true, 
    trim: true,
    enum: [
      // User Management
      'user_created', 'user_updated', 'user_deleted', 'user_status_changed',
      'user_role_changed', 'user_login', 'user_logout', 'user_password_reset',
      'user_profile_updated', 'user_permissions_changed',
      
      // Company Management
      'company_created', 'company_updated', 'company_deleted', 'company_suspended',
      'company_activated', 'company_subscription_changed', 'company_settings_updated',
      
      // Department Management
      'department_created', 'department_updated', 'department_deleted',
      'department_member_added', 'department_member_removed',
      
      // Task Management
      'task_created', 'task_updated', 'task_deleted', 'task_assigned', 
      'task_status_changed', 'task_priority_changed', 'task_due_date_changed',
      
      // Meeting Management
      'meeting_created', 'meeting_updated', 'meeting_deleted', 'meeting_scheduled',
      'meeting_attended', 'meeting_cancelled', 'meeting_rescheduled',
      
      // Leave Management
      'leave_requested', 'leave_approved', 'leave_rejected', 'leave_cancelled',
      'leave_updated', 'leave_bulk_approved',
      
      // Billing & Subscription
      'subscription_created', 'subscription_updated', 'subscription_cancelled',
      'payment_processed', 'payment_failed', 'payment_refunded',
      'plan_upgraded', 'plan_downgraded', 'billing_info_updated',
      
      // System & Security
      'login_success', 'login_failed', 'logout', 'password_changed',
      'profile_updated', 'settings_changed', 'brute_force_attempt',
      'suspicious_activity', 'system_backup', 'system_maintenance',
      'api_key_created', 'api_key_revoked', 'two_factor_enabled',
      
      // Admin Actions
      'admin_login', 'admin_action', 'bulk_operation', 'data_export',
      'system_config_changed', 'security_alert', 'audit_log_exported',
      'user_bulk_import', 'data_migration', 'system_update'
    ]
  },
  
  // Classification
  category: { 
    type: String, 
    required: true, 
    enum: ['system', 'user', 'admin', 'security', 'billing', 'api'],
    default: 'user' 
  },
  severity: { 
    type: String, 
    required: true, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low' 
  },
  priority: { 
    type: String, 
    enum: ['normal', 'high', 'urgent'],
    default: 'normal' 
  },
  
  // Description and Context
  description: { type: String, required: true, trim: true },
  summary: { type: String, trim: true }, // Short summary for quick reference
  
  // Technical Details
  ipAddress: { type: String, trim: true, default: '', index: true },
  userAgent: { type: String, trim: true, default: '' },
  device: { type: String, trim: true, default: '' },
  browser: { type: String, trim: true, default: '' },
  os: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  
  // Request Context
  sessionId: { type: String, trim: true, default: null, index: true },
  requestId: { type: String, trim: true, default: null, index: true },
  apiEndpoint: { type: String, trim: true, default: null },
  httpMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: null },
  responseCode: { type: Number, default: null },
  
  // Resource Information
  metadata: {
    resourceId: { type: mongoose.Schema.Types.Mixed, default: null },
    resourceType: { 
      type: String, 
      enum: ['user', 'company', 'department', 'task', 'meeting', 'leave', 
             'subscription', 'payment', 'system', 'api_key', 'report'],
      default: null 
    },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true, default: null },
    additionalData: { type: mongoose.Schema.Types.Mixed, default: null },
    tags: [{ type: String, trim: true }], // For categorization and filtering
    relatedLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AuditLog' }] // Related audit logs
  },
  
  // Status and Results
  status: { 
    type: String, 
    required: true, 
    enum: ['success', 'failed', 'pending', 'warning', 'cancelled'],
    default: 'success' 
  },
  errorCode: { type: String, trim: true, default: null },
  errorMessage: { type: String, trim: true, default: null },
  
  // Compliance and Retention
  retentionPeriod: { type: Number, default: 90 }, // Days to keep this log
  isComplianceRelevant: { type: Boolean, default: false },
  complianceCategory: { 
    type: String, 
    enum: ['gdpr', 'sox', 'hipaa', 'pci', 'iso27001', 'none'],
    default: 'none' 
  },
  
  // Performance Metrics
  executionTime: { type: Number, default: null }, // Milliseconds
  dataSize: { type: Number, default: null }, // Bytes processed
  
  // Audit Trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastModified: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  indexes: [
    // Performance indexes
    { timestamp: -1 },
    { logId: 1 },
    { userId: 1 },
    { companyId: 1 },
    { action: 1 },
    { category: 1 },
    { severity: 1 },
    { status: 1 },
    { ipAddress: 1 },
    { sessionId: 1 },
    { requestId: 1 },
    
    // Compound indexes for common queries
    { companyId: 1, timestamp: -1 },
    { userId: 1, timestamp: -1 },
    { category: 1, severity: 1, timestamp: -1 },
    { action: 1, timestamp: -1 },
    { status: 1, timestamp: -1 },
    
    // Text search index
    { 
      userName: 'text', 
      userEmail: 'text', 
      action: 'text', 
      description: 'text',
      companyName: 'text' 
    },
    
    // Metadata indexes
    { 'metadata.resourceType': 1 },
    { 'metadata.resourceId': 1 },
    { 'metadata.tags': 1 },
    
    // Compliance indexes
    { isComplianceRelevant: 1, timestamp: -1 },
    { complianceCategory: 1, timestamp: -1 }
  ]
});
```

### 2. Enhanced Audit Service

```javascript
class EnhancedAuditService {
  // Create audit log with enhanced features
  static async createAuditLog(logData) {
    try {
      // Generate unique log ID
      const logId = `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Enrich log data
      const enrichedLogData = {
        ...logData,
        logId,
        timestamp: logData.timestamp || new Date(),
        // Auto-detect browser and OS from user agent
        browser: this.detectBrowser(logData.userAgent),
        os: this.detectOS(logData.userAgent),
        // Set retention period based on severity
        retentionPeriod: this.getRetentionPeriod(logData.severity),
        // Determine compliance relevance
        isComplianceRelevant: this.isComplianceRelevant(logData.action, logData.category),
        complianceCategory: this.getComplianceCategory(logData.action)
      };
      
      const auditLog = new AuditLog(enrichedLogData);
      await auditLog.save();
      
      // Trigger real-time notifications for critical events
      if (logData.severity === 'critical') {
        await this.triggerCriticalAlert(auditLog);
      }
      
      console.log(`✅ Enhanced audit log created: ${logData.action} by ${logData.userName}`);
      return auditLog;
    } catch (error) {
      console.error('❌ Error creating enhanced audit log:', error);
      return null;
    }
  }
  
  // Advanced filtering and search
  static async getAuditLogs(filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = -1
      } = pagination;

      const {
        userId, companyId, action, category, severity, status,
        startDate, endDate, searchTerm, tags, complianceRelevant,
        ipAddress, sessionId, resourceType, resourceId
      } = filters;

      // Build advanced query
      const query = this.buildAdvancedQuery({
        userId, companyId, action, category, severity, status,
        startDate, endDate, searchTerm, tags, complianceRelevant,
        ipAddress, sessionId, resourceType, resourceId
      });

      // Execute query with aggregation for better performance
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            // Add computed fields
            timeAgo: { $subtract: [new Date(), '$timestamp'] },
            isRecent: { $lt: [{ $subtract: [new Date(), '$timestamp'] }, 24 * 60 * 60 * 1000] }
          }
        },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ];

      const [logs, total] = await Promise.all([
        AuditLog.aggregate(pipeline),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs: logs.map(log => this.formatLogForResponse(log)),
        pagination: {
          page, limit, total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: this.getAppliedFilters(filters)
      };
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      throw error;
    }
  }
  
  // Real-time audit log streaming
  static async streamAuditLogs(companyId, filters = {}) {
    // Implementation for real-time log streaming
    // Using WebSocket or Server-Sent Events
  }
  
  // Audit log analytics and insights
  static async getAuditAnalytics(filters = {}) {
    try {
      const matchConditions = this.buildMatchConditions(filters);
      
      const analytics = await AuditLog.aggregate([
        { $match: matchConditions },
        {
          $facet: {
            // Activity trends
            activityTrends: [
              {
                $group: {
                  _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    category: '$category'
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.date': 1 } }
            ],
            
            // Top actions
            topActions: [
              { $group: { _id: '$action', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            
            // Security insights
            securityInsights: [
              {
                $match: { category: 'security' }
              },
              {
                $group: {
                  _id: '$severity',
                  count: { $sum: 1 },
                  failedAttempts: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                  }
                }
              }
            ],
            
            // User activity patterns
            userActivity: [
              {
                $group: {
                  _id: '$userId',
                  userName: { $first: '$userName' },
                  userEmail: { $first: '$userEmail' },
                  totalActions: { $sum: 1 },
                  lastActivity: { $max: '$timestamp' },
                  categories: { $addToSet: '$category' }
                }
              },
              { $sort: { totalActions: -1 } },
              { $limit: 20 }
            ],
            
            // Company activity
            companyActivity: [
              {
                $group: {
                  _id: '$companyId',
                  companyName: { $first: '$companyName' },
                  totalActions: { $sum: 1 },
                  uniqueUsers: { $addToSet: '$userId' },
                  lastActivity: { $max: '$timestamp' }
                }
              },
              {
                $addFields: {
                  uniqueUserCount: { $size: '$uniqueUsers' }
                }
              },
              { $sort: { totalActions: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]);

      return analytics[0];
    } catch (error) {
      console.error('❌ Error fetching audit analytics:', error);
      throw error;
    }
  }
}
```

### 3. Frontend Component Architecture

```typescript
// Enhanced Audit Logs Component Structure
interface AuditLogsComponent {
  // Main Dashboard
  - Statistics Cards (Real-time metrics)
  - Activity Timeline (Visual timeline of events)
  - Security Alerts (Critical events)
  - Quick Filters (Common filter presets)
  
  // Advanced Filtering
  - Multi-dimensional filters
  - Saved filter presets
  - Date range picker with presets
  - Search with autocomplete
  
  // Data Visualization
  - Activity heatmap
  - Category distribution charts
  - Severity trend graphs
  - User activity patterns
  
  // Real-time Features
  - Live log streaming
  - Real-time notifications
  - Auto-refresh options
  - WebSocket integration
  
  // Export and Reporting
  - Multiple export formats (CSV, PDF, JSON)
  - Scheduled reports
  - Custom report builder
  - Compliance reports
}
```

### 4. API Endpoints (Enhanced)

```javascript
// Enhanced API Routes
router.get('/audit-logs', requireSaaSSuperAdmin, getAuditLogs);
router.get('/audit-logs/analytics', requireSaaSSuperAdmin, getAuditAnalytics);
router.get('/audit-logs/stream', requireSaaSSuperAdmin, streamAuditLogs);
router.get('/audit-logs/export', requireSaaSSuperAdmin, exportAuditLogs);
router.get('/audit-logs/reports', requireSaaSSuperAdmin, generateReports);
router.post('/audit-logs/search', requireSaaSSuperAdmin, advancedSearch);
router.get('/audit-logs/dashboard', requireSaaSSuperAdmin, getDashboardData);
router.get('/audit-logs/alerts', requireSaaSSuperAdmin, getSecurityAlerts);
```

## 🎨 UI/UX Design Features

### 1. Dashboard Layout
- **Header Section**: Title, quick actions, refresh button
- **Statistics Cards**: Key metrics with trend indicators
- **Activity Timeline**: Visual representation of recent events
- **Security Alerts**: Critical events requiring attention
- **Quick Filters**: Common filter combinations

### 2. Advanced Filtering System
- **Multi-level Filters**: Category → Severity → Status → Date
- **Smart Search**: Autocomplete with suggestions
- **Saved Presets**: Custom filter combinations
- **Date Range Picker**: Preset ranges (Today, Week, Month, Custom)
- **Tag-based Filtering**: Custom tags for categorization

### 3. Data Visualization
- **Activity Heatmap**: Visual activity patterns
- **Trend Charts**: Activity trends over time
- **Distribution Charts**: Category and severity distributions
- **User Activity Map**: Geographic activity visualization
- **Real-time Metrics**: Live updating counters

### 4. Interactive Features
- **Drill-down Capability**: Click to see related logs
- **Bulk Operations**: Select multiple logs for actions
- **Export Options**: Multiple formats and custom ranges
- **Real-time Updates**: Live log streaming
- **Mobile Responsive**: Optimized for all devices

## 🔒 Security and Compliance Features

### 1. Data Protection
- **Encryption**: Sensitive data encryption at rest
- **Access Control**: Role-based access to audit logs
- **Data Retention**: Configurable retention policies
- **Anonymization**: Option to anonymize sensitive data

### 2. Compliance Support
- **GDPR Compliance**: Data subject rights support
- **SOX Compliance**: Financial audit trail
- **HIPAA Compliance**: Healthcare data protection
- **ISO 27001**: Information security management

### 3. Audit Trail Integrity
- **Immutable Logs**: Tamper-proof log storage
- **Digital Signatures**: Log integrity verification
- **Chain of Custody**: Complete audit trail
- **Backup and Recovery**: Secure log backup

## 📊 Analytics and Reporting

### 1. Real-time Analytics
- **Activity Metrics**: Live activity monitoring
- **Security Metrics**: Real-time security monitoring
- **Performance Metrics**: System performance tracking
- **User Behavior**: User activity patterns

### 2. Historical Analysis
- **Trend Analysis**: Long-term activity trends
- **Pattern Recognition**: Anomaly detection
- **Comparative Analysis**: Period-over-period comparisons
- **Predictive Analytics**: Future activity predictions

### 3. Custom Reports
- **Report Builder**: Drag-and-drop report creation
- **Scheduled Reports**: Automated report generation
- **Dashboard Widgets**: Customizable dashboard components
- **Export Options**: Multiple export formats

## 🚀 Performance Optimizations

### 1. Database Optimizations
- **Indexing Strategy**: Optimized database indexes
- **Query Optimization**: Efficient query patterns
- **Data Partitioning**: Time-based data partitioning
- **Caching Strategy**: Redis caching for frequent queries

### 2. Frontend Optimizations
- **Virtual Scrolling**: Handle large datasets efficiently
- **Lazy Loading**: Load data on demand
- **Caching**: Client-side caching for better performance
- **Compression**: Data compression for faster loading

### 3. Real-time Features
- **WebSocket Integration**: Real-time log streaming
- **Server-Sent Events**: Efficient real-time updates
- **Connection Management**: Optimized connection handling
- **Message Queuing**: Reliable message delivery

## 🔧 Implementation Roadmap

### Phase 1: Core Enhancement (Week 1-2)
- [ ] Enhanced database schema implementation
- [ ] Improved audit service with advanced features
- [ ] Enhanced API endpoints
- [ ] Basic UI improvements

### Phase 2: Advanced Features (Week 3-4)
- [ ] Real-time log streaming
- [ ] Advanced analytics and insights
- [ ] Enhanced filtering and search
- [ ] Data visualization components

### Phase 3: Compliance and Security (Week 5-6)
- [ ] Compliance features implementation
- [ ] Security enhancements
- [ ] Data protection measures
- [ ] Audit trail integrity

### Phase 4: Performance and Scale (Week 7-8)
- [ ] Performance optimizations
- [ ] Scalability improvements
- [ ] Monitoring and alerting
- [ ] Documentation and testing

## 📈 Success Metrics

### 1. Performance Metrics
- **Query Response Time**: < 200ms for standard queries
- **Real-time Latency**: < 100ms for live updates
- **Export Speed**: < 30 seconds for large exports
- **UI Responsiveness**: < 50ms for user interactions

### 2. User Experience Metrics
- **Search Accuracy**: > 95% relevant results
- **Filter Effectiveness**: > 90% user satisfaction
- **Mobile Usability**: Full feature parity on mobile
- **Accessibility**: WCAG 2.1 AA compliance

### 3. Business Metrics
- **Compliance Coverage**: 100% audit trail coverage
- **Security Detection**: Real-time threat detection
- **Data Integrity**: 99.99% log integrity
- **User Adoption**: > 80% admin user adoption

This comprehensive audit logs design provides a robust, scalable, and user-friendly system for tracking and monitoring all activities across the SaaS platform while ensuring compliance and security requirements are met.











