# Feature Filtering Test Guide

## Expected Behavior

### If Company Features are:
```json
{
  "attendance": false,
  "leaveManagement": false, 
  "taskManagement": false,
  "meetingScheduler": false,
  "deviceTracking": false,
  "reports": false,
  "notifications": false,
  "analytics": false,
  "meetings": false,
  "apiAccess": false,
  "customBranding": false
}
```

### Then Admin Panel Should Show:
- ✅ **Dashboard** (always available)
- ✅ **Departments** (always available)
- ✅ **Users** (always available)
- ✅ **Settings** (always available)
- ❌ **Tasks** (requires taskManagement = true)
- ❌ **Meetings** (requires meetings OR meetingScheduler = true)
- ❌ **Leave Management** (requires leaveManagement = true)
- ❌ **Attendance** (requires attendance = true)
- ❌ **Analytics** (requires analytics = true)
- ❌ **Reports** (requires reports = true)

## Debug Console Logs to Check:

1. **API Response**: Look for "🔍 Full API Response" logs
2. **Features Set**: Look for "✅ Setting features from API" logs
3. **Sidebar Filtering**: Look for "🔍 Checking section" logs
4. **Visible Items**: Look for "🔍 Visible menu items" logs

## Test Steps:

1. Open browser console
2. Navigate to admin panel
3. Check console logs for feature data
4. Verify sidebar only shows allowed sections
5. Try clicking on hidden sections (should show "Feature Not Available")

## Manual Test:

1. Set all features to `false` in backend
2. Refresh frontend
3. Check if only Dashboard, Departments, Users, Settings are visible
4. Set specific features to `true` (e.g., taskManagement)
5. Refresh and verify Tasks section appears
