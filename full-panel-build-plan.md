# Full Panel Implementation Plan

This document captures the minimum scope we need to align on **before** we continue with front-end or backend coding. Once you confirm this checklist, we can execute the build in the defined order.

---

## 1. Goals & Success Criteria

1. Deliver production-ready experiences for every role (Super Admin, Admin, HOD, Manager, HR, HR Manager, Member, SaaS Admin/Super Admin).
2. Replace placeholder/mock data with secured API-backed flows.
3. Ensure all panels share a consistent design system, notification layer, and audit trail.

---

## 2. Environment Readiness

| Area | Tasks |
| --- | --- |
| **Repo Hygiene** | Clean feature branches, confirm linting/formatting, document env vars (.env). |
| **Backend** | Decide the canonical backend (`/server` vs `/backend`). Align on stack (Express/Nest/Fastify) and DB (Mongo/Postgres). |
| **Dev Infrastructure** | Configure auth secrets, storage (attachments), background workers (notifications). |
| **Testing** | Choose testing strategy (unit + integration + smoke E2E). |

**Action:** confirm final backend stack + hosting targets so front-end services can point to stable URLs.

---

## 3. Feature Breakdown per Panel

### 3.1 Super Admin Panel
- Global overview dashboard (companies, departments, task backlog, billing status).
- Cross-company task management with comments, attachments, Kanban toggle (once reinstated).
- Feature access controls (enable/disable modules per company).
- SaaS billing, coupon management, subscription status display.

### 3.2 Admin Panel
- Company-wide configuration (departments, user management).
- Task assignment, approvals, and escalations.
- Reports + analytics scoped to company.
- Notification routing and audit log view.

### 3.3 HOD Panel
- Department-level dashboard (team performance, task workload, attendance insights).
- Approve/assign departmental tasks.
- Leave/attendance approval workflow.

### 3.4 Manager Panel
- Team roster, task assignment and tracking.
- Meeting scheduling and follow-ups.
- Direct access to task comments, attachments, status changes.

### 3.5 HR / HR Manager Panel
- Employee onboarding/offboarding, leave tracking, attendance overrides.
- Policy management (working hours, approvals).
- HR-specific reports and escalations.

### 3.6 Member Panel
- My tasks, leave requests, attendance, self-service profile updates.
- Lightweight notification center.

### 3.7 SaaS Admin / Super Admin
- Tenant onboarding, plan management, feature toggles per tenant.
- Audit, subscription, and payment flows.

**Action:** validate modules per role, confirm any missing flows or customizations.

---

## 4. Backend Work Items

1. **Authentication & Authorization**
   - JWT/session handling, refresh tokens.
   - RBAC middleware aligned with role matrix.
2. **Task Domain**
   - CRUD with status transitions, comments, attachments, meetings.
   - WebSocket or polling for live updates (optional).
3. **Departments & Users**
   - Hierarchy (company → department → team), manager/member relationships.
4. **Attendance/Leave**
   - Timings, approvals, policy enforcement per department/company.
5. **Notifications**
   - Central notification service (in-app + email/SMS hooks).
6. **SaaS/Billing**
   - Tenant provisioning, plan enforcement, payment gateway integration (Razorpay already referenced).
7. **Audit & Analytics**
   - Event logging, aggregated metrics endpoints.

**Action:** pick DB schema & migration strategy; confirm API surface for each module.

---

## 5. Front-end Integration Tasks

1. Replace mock services with real API calls (taskService, managerService, notificationService, etc.).
2. Add React Query hooks per module, with consistent loading/error handling.
3. Restore Kanban board only after backend statuses ready.
4. Reuse `TaskComments` component across Manager/HOD/Member task views.
5. Wiring for attendance, leave, reports, SaaS panels once endpoints exist.

### 5.1 Team Discussion Everywhere

- **Component reuse:** Embed the Team Discussion (TaskComments) block in every task view (Super Admin, Admin, HOD, Manager, HR, Member). Each panel already consumes `taskService`, so expose the `comments` relation via API and pass task IDs to the shared component.
- **State management:** Leverage React Query caches keyed by `['task-comments', taskId]` so switching panels or tabs reuses the same data.
- **Permissions:** Ensure front-end respects backend decisions (e.g., only comment owners can edit/delete once API enforces the same rule).
- **Empty states:** Provide consistent UX when a panel or user lacks permission (e.g., read-only banner, disabled input).

**Action:** confirm prioritized panels for integration order (e.g., Admin + Super Admin → HOD/Manager → Member → SaaS).

---

## 6. Deployment & QA

| Step | Description |
| --- | --- |
| **CI/CD** | Set up lint/test/build pipelines (frontend + backend). |
| **Staging Environment** | Deploy backend + frontend for UAT, seed data per role. |
| **QA Checklist** | Verify login per role, task comments, notifications, payroll/billing, attachments. |
| **Monitoring** | Logging + metrics (errors per module, slow queries). |

---

## 7. Next Steps (Awaiting Confirmation)

1. Approve this scope and specify any additional roles/features.
2. Confirm backend stack, hosting, and deployment targets.
3. Lock order of panel delivery (which roles first).
4. Provide any API contracts or data models already finalized.
5. Confirm real-time infrastructure choice for Team Discussion (Socket.IO, Pusher, SSE). Once confirmed:
   - Implement `/tasks/:taskId/comments` REST endpoints for CRUD.
   - Add WebSocket channel `task-comments:<taskId>` broadcasting create/update/delete events.
   - Update front-end `TaskComments` to subscribe/unsubscribe on dialog open/close so every panel sees live updates.

Once you approve or adjust this plan, we can begin implementation following the agreed sequence. Let me know the updates you’d like, and I’ll refine the plan before coding. 💪
