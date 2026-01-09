# Manager Panel Dashboard Integration Plan

## Overview

The project has both frontend and backend components for a manager panel dashboard, but they are not fully integrated. The frontend is currently using mock data for calculations, while the backend provides comprehensive APIs that return the same statistics. This plan outlines the steps to integrate the backend APIs with the frontend dashboard.

## Current State Analysis

### Backend Implementation ✅
The backend (`backend/routes/manager.js`) provides the following manager APIs:

1. **GET /api/manager/dashboard** - Main dashboard data
   - Team members count
   - Team tasks count
   - Completion rate
   - Urgent tasks (count + details)
   - Overdue tasks (count + details)
   - Recent tasks

2. **GET /api/manager/team-members** - Detailed team member list with task statistics

3. **GET /api/manager/urgent-tasks** - Paginated urgent tasks

4. **GET /api/manager/overdue-tasks** - Paginated overdue tasks

5. **GET /api/manager/team-performance** - Team performance metrics

6. **GET /api/manager/member-tasks/:memberId** - Tasks for specific team member

### Frontend Implementation ✅
The frontend (`tiny-typer-tool-09/src/pages/ManagerIndex.tsx` and `ManagerDashboardOverview.tsx`) is fully built but uses:

- Mock data from `mockData.ts`
- Local calculations for statistics
- `useHODManagement` hook for department data (fallback to mock)

## Integration Plan

### Phase 1: Create Manager Service
**File: `tiny-typer-tool-09/src/services/managerService.ts`**

Create a new service following the existing pattern (like `taskService.ts`) that calls the backend manager APIs.

```typescript
export interface ManagerDashboardData {
  teamMembers: number;
  teamTasks: number;
  completionRate: number;
  urgent: {
    count: number;
    tasks: Task[];
  };
  overdue: {
    count: number;
    tasks: Task[];
  };
  recentTasks: Task[];
}

export interface TeamMemberStats {
  // Define based on backend response
}

class ManagerService {
  async getDashboard(): Promise<ApiResponse<ManagerDashboardData>> {
    return apiService.get<ManagerDashboardData>('manager/dashboard');
  }

  async getTeamMembers(): Promise<ApiResponse<TeamMemberStats[]>> {
    return apiService.get<TeamMemberStats[]>('manager/team-members');
  }

  // Other methods for urgent/overdue tasks, performance, etc.
}
```

### Phase 2: Update API Config
**File: `tiny-typer-tool-09/src/config/api.ts`**

Add manager endpoints to the API_CONFIG:

```typescript
MANAGER: {
  DASHBOARD: '/manager/dashboard',
  TEAM_MEMBERS: '/manager/team-members',
  URGENT_TASKS: '/manager/urgent-tasks',
  OVERDUE_TASKS: '/manager/overdue-tasks',
  TEAM_PERFORMANCE: '/manager/team-performance',
  MEMBER_TASKS: (memberId: string) => `/manager/member-tasks/${memberId}`
}
```

### Phase 3: Create Manager Hook
**File: `tiny-typer-tool-09/src/hooks/useManager.ts`**

Create a custom hook similar to `useHODManagement.ts` that fetches manager data:

```typescript
import { useState, useEffect } from 'react';
import { managerService, ManagerDashboardData, TeamMemberStats } from '@/services/managerService';

export const useManager = () => {
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await managerService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await managerService.getTeamMembers();
      if (response.success) {
        setTeamMembers(response.data);
      }
    } catch (err) {
      setError('Failed to load team members');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchTeamMembers()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    dashboardData,
    teamMembers,
    loading,
    error,
    refetch: () => {
      fetchDashboardData();
      fetchTeamMembers();
    }
  };
};
```

### Phase 4: Update Dashboard Component
**File: `tiny-typer-tool-09/src/components/Dashboard/ManagerDashboardOverview.tsx`**

Replace mock data calculations with backend data:

1. Import the new `useManager` hook
2. Replace local state with hook data
3. Update component logic to use real data instead of calculating from mocks
4. Handle loading and error states appropriately

Key changes:
- Remove local task/user state management
- Use `useManager()` instead of `useHODManagement()`
- Update stat calculations to use backend response directly
- Add loading spinners and error handling

### Phase 5: Update Task Status Updates
The current component has `updateTaskStatus` function that updates local state. Update it to call the backend API:

```typescript
const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
  try {
    await taskService.updateTaskStatus(taskId, newStatus);
    // Refetch dashboard data or update locally
    refetchDashboard();
  } catch (error) {
    console.error('Failed to update task status:', error);
  }
};
```

### Phase 6: Testing and Validation

1. Test all dashboard statistics match backend calculations
2. Verify team member data loads correctly
3. Test task status updates work properly
4. Check loading states and error handling
5. Validate performance with real data vs mock data

## Implementation Steps

1. **Create Manager Service** - Add `managerService.ts`
2. **Update API Config** - Add manager endpoints to `api.ts`
3. **Create Manager Hook** - Add `useManager.ts`
4. **Update Dashboard Component** - Modify `ManagerDashboardOverview.tsx`
5. **Test Integration** - Verify all functionality works
6. **Remove Mock Dependencies** - Clean up unused mock data imports

## Benefits of Integration

- **Real-time Data**: Dashboard shows actual team performance data
- **Consistency**: Statistics match backend calculations
- **Scalability**: No need to recalculate on frontend as data grows
- **Maintainability**: Single source of truth in backend
- **Reliability**: Proper error handling and loading states

## Potential Challenges

- **Data Structure Mismatch**: Backend response format may differ from frontend expectations
- **Loading Performance**: Initial load may be slower with real API calls
- **Error Handling**: Need proper fallback when backend is unavailable
- **Real-time Updates**: May need WebSocket integration for live updates

## Next Steps

1. Implement the manager service and hook
2. Gradually replace mock data with real API calls
3. Add proper error boundaries and loading states
4. Test thoroughly with different user roles and data sizes
5. Consider adding caching for better performance

This integration will transform the manager dashboard from a static mock-based interface to a fully functional, data-driven management tool.