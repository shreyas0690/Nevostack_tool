# Feature-Based Access Control System

## Overview

This system implements feature-based access control for the admin panel, where different sections are shown or hidden based on the company's enabled features. For example, if a company doesn't have the "leave management" feature enabled, the leave management section won't be visible in their admin panel.

## Architecture

### Frontend Components

#### 1. Feature Access Hook (`useFeatureAccess.ts`)
- **Location**: `tiny-typer-tool-09/src/hooks/useFeatureAccess.ts`
- **Purpose**: Provides React hook to check company features
- **Features**:
  - Fetches company features from API
  - Provides utility functions: `hasFeature()`, `hasAnyFeature()`, `hasAllFeatures()`
  - Handles loading states and errors
  - Maps admin sections to required features

#### 2. Updated Sidebar Component
- **Location**: `tiny-typer-tool-09/src/components/Layout/Sidebar.tsx`
- **Changes**:
  - Uses `useFeatureAccess` hook to check features
  - Filters menu items based on feature access
  - Shows loading skeleton while fetching features
  - Hides sections that require disabled features

#### 3. Updated Admin Panel Routing
- **Location**: `tiny-typer-tool-09/src/pages/Index.tsx`
- **Changes**:
  - Checks feature access for each section
  - Shows "Feature Not Available" message for disabled features
  - Prevents access to restricted sections

#### 4. Feature Access Status Component
- **Location**: `tiny-typer-tool-09/src/components/FeatureAccess/FeatureAccessStatus.tsx`
- **Purpose**: Displays current company features in settings
- **Features**:
  - Shows enabled/disabled features
  - Provides feature descriptions
  - Displays feature summary statistics

### Backend Components

#### 1. API Endpoints
- **Location**: `backend/routes/saas.js`
- **Endpoints**:
  - `GET /api/company/features` - Get current user's company features
  - `PUT /api/company/:companyId/features` - Update company features (Super Admin only)

#### 2. Feature Access Middleware
- **Location**: `backend/middleware/featureAccess.js`
- **Purpose**: Protects backend routes based on company features
- **Functions**:
  - `requireFeatureAccess(feature)` - Requires single feature
  - `requireAnyFeature(features)` - Requires any of multiple features
  - `requireAllFeatures(features)` - Requires all specified features

## Feature Mapping

### Admin Panel Sections
```typescript
const FEATURE_SECTION_MAP = {
  dashboard: [], // Always available
  tasks: ['taskManagement'],
  departments: [], // Always available for basic management
  users: [], // Always available for basic management
  meetings: ['meetings', 'meetingScheduler'],
  leave: ['leaveManagement'],
  attendance: ['attendance'],
  analytics: ['analytics'],
  reports: ['reports'],
  settings: [], // Always available
};
```

### Available Features
- `attendance` - Attendance Management
- `leaveManagement` - Leave Management
- `taskManagement` - Task Management
- `meetingScheduler` - Meeting Scheduler
- `deviceTracking` - Device Tracking
- `reports` - Reports
- `notifications` - Notifications
- `analytics` - Analytics
- `meetings` - Meetings
- `apiAccess` - API Access
- `customBranding` - Custom Branding

## Usage Examples

### Frontend Usage

#### 1. Using the Hook
```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const MyComponent = () => {
  const { hasFeature, hasAnyFeature, isLoading } = useFeatureAccess();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!hasFeature('leaveManagement')) {
    return <div>Leave Management not available</div>;
  }
  
  return <LeaveManagementComponent />;
};
```

#### 2. Conditional Rendering
```typescript
const { hasFeature } = useFeatureAccess();

return (
  <div>
    {hasFeature('taskManagement') && <TaskManagement />}
    {hasFeature('leaveManagement') && <LeaveManagement />}
    {hasFeature('attendance') && <AttendanceManagement />}
  </div>
);
```

### Backend Usage

#### 1. Single Feature Requirement
```javascript
const { requireFeatureAccess } = require('../middleware/featureAccess');

router.get('/tasks', authenticateToken, requireFeatureAccess('taskManagement'), (req, res) => {
  // Route only accessible if company has taskManagement feature
  res.json({ message: 'Tasks endpoint' });
});
```

#### 2. Multiple Features (Any)
```javascript
router.get('/meetings', authenticateToken, requireAnyFeature(['meetings', 'meetingScheduler']), (req, res) => {
  // Route accessible if company has either 'meetings' OR 'meetingScheduler'
  res.json({ message: 'Meetings endpoint' });
});
```

#### 3. Multiple Features (All)
```javascript
router.get('/advanced-analytics', authenticateToken, requireAllFeatures(['analytics', 'reports']), (req, res) => {
  // Route requires BOTH 'analytics' AND 'reports' features
  res.json({ message: 'Advanced analytics endpoint' });
});
```

## Database Schema

### Company Model Features
```javascript
// In Company model
features: {
  taskManagement: { type: Boolean, default: false },
  leaveManagement: { type: Boolean, default: false },
  meetings: { type: Boolean, default: false },
  analytics: { type: Boolean, default: false },
  reports: { type: Boolean, default: false },
  attendance: { type: Boolean, default: false },
  apiAccess: { type: Boolean, default: false },
  customBranding: { type: Boolean, default: false }
},

settings: {
  features: {
    attendance: { type: Boolean, default: true },
    leaveManagement: { type: Boolean, default: true },
    taskManagement: { type: Boolean, default: true },
    meetingScheduler: { type: Boolean, default: true },
    deviceTracking: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  }
}
```

## Error Handling

### Frontend Errors
- **Loading State**: Shows skeleton while fetching features
- **API Errors**: Displays error message if feature fetch fails
- **Feature Unavailable**: Shows "Feature Not Available" message

### Backend Errors
- **403 Forbidden**: When required features are not enabled
- **404 Not Found**: When company is not found
- **500 Server Error**: When feature check fails

## Security Considerations

1. **Authentication Required**: All feature checks require user authentication
2. **Company Association**: Users must be associated with a company
3. **Feature Validation**: Backend validates feature access on every request
4. **Super Admin Override**: Super admins can update company features

## Testing

### Frontend Testing
```typescript
// Test feature access hook
const { result } = renderHook(() => useFeatureAccess());
expect(result.current.hasFeature('taskManagement')).toBe(true);
```

### Backend Testing
```javascript
// Test feature middleware
const req = { user: { companyId: 'company123' } };
const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
const next = jest.fn();

await requireFeatureAccess('taskManagement')(req, res, next);
expect(next).toHaveBeenCalled();
```

## Migration Guide

### For Existing Routes
1. Add feature middleware to protected routes
2. Update frontend components to check features
3. Test with different feature combinations

### For New Features
1. Add feature to Company model
2. Update FEATURE_SECTION_MAP
3. Add feature checks to relevant routes
4. Update frontend components

## Troubleshooting

### Common Issues
1. **Features not loading**: Check API endpoint and authentication
2. **Sections not hiding**: Verify feature mapping and hook usage
3. **Backend errors**: Check middleware order and feature names
4. **TypeScript errors**: Verify feature types and mappings

### Debug Steps
1. Check browser console for API errors
2. Verify company features in database
3. Test API endpoints directly
4. Check middleware execution order

