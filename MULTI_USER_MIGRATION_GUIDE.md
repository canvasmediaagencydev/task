# Multi-User Selection Migration Guide

This guide explains all changes needed to support multiple user selection for assignees, reviewers, sales persons, and account executives.

## Completed ✅

1. **Database Schema**
   - Created `task_assignees` junction table
   - Created `task_reviewers` junction table
   - Created `project_sales_persons` junction table
   - Created `project_account_executives` junction table
   - Migrated existing data from old single-user fields

2. **Type Definitions** (`lib/types.ts`)
   - Changed `assignee?: User` → `assignees?: User[]`
   - Changed `reviewer?: User` → `reviewers?: User[]`
   - Changed `sales_person?: User` → `sales_persons?: User[]`
   - Changed `ae?: User` → `account_executives?: User[]`

3. **Data Fetching**
   - Updated `lib/task-mapper.ts` to map junction table data
   - Updated `lib/api.ts` fetchTasks() to join junction tables
   - Updated `lib/projects-data.ts` to join junction tables

4. **UI Components**
   - Created `components/ui/user-multi-select.tsx` for multi-user selection

## TODO - Files That Need Updates

### 1. Task Actions (`app/actions/tasks.ts`)

**createTask function:**
```typescript
// After creating the task, insert assignees and reviewers
if (result.task) {
  // Insert assignees
  if (assigneeIds && assigneeIds.length > 0) {
    await supabase
      .from('task_assignees')
      .insert(assigneeIds.map(userId => ({
        task_id: result.task.id,
        user_id: userId
      })));
  }

  // Insert reviewers
  if (reviewerIds && reviewerIds.length > 0) {
    await supabase
      .from('task_reviewers')
      .insert(reviewerIds.map(userId => ({
        task_id: result.task.id,
        user_id: userId
      })));
  }
}
```

**updateTask function:**
```typescript
// Delete existing assignees/reviewers and insert new ones
await supabase
  .from('task_assignees')
  .delete()
  .eq('task_id', taskId);

await supabase
  .from('task_reviewers')
  .delete()
  .eq('task_id', taskId);

// Insert new assignees/reviewers
if (assigneeIds && assigneeIds.length > 0) {
  await supabase
    .from('task_assignees')
    .insert(assigneeIds.map(userId => ({
      task_id: taskId,
      user_id: userId
    })));
}

if (reviewerIds && reviewerIds.length > 0) {
  await supabase
    .from('task_reviewers')
    .insert(reviewerIds.map(userId => ({
      task_id: taskId,
      user_id: userId
    })));
}
```

### 2. Project Actions (`app/actions/projects.ts`)

**createProject function:**
```typescript
// After creating the project, insert sales persons and AEs
if (result.project) {
  if (salesPersonIds && salesPersonIds.length > 0) {
    await supabase
      .from('project_sales_persons')
      .insert(salesPersonIds.map(userId => ({
        project_id: result.project.id,
        user_id: userId
      })));
  }

  if (aeIds && aeIds.length > 0) {
    await supabase
      .from('project_account_executives')
      .insert(aeIds.map(userId => ({
        project_id: result.project.id,
        user_id: userId
      })));
  }
}
```

**updateProject function:**
```typescript
// Similar to task update - delete and re-insert
await supabase
  .from('project_sales_persons')
  .delete()
  .eq('project_id', projectId);

await supabase
  .from('project_account_executives')
  .delete()
  .eq('project_id', projectId);

// Insert new data...
```

### 3. Task Forms

**Files to update:**
- `components/new-task-form.tsx`
- `components/edit-task-form.tsx`

**Changes:**
```tsx
// Import UserMultiSelect
import { UserMultiSelect } from '@/components/ui/user-multi-select';

// Change state from single ID to array
const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
const [reviewerIds, setReviewerIds] = useState<string[]>([]);

// Replace Select with UserMultiSelect
<UserMultiSelect
  users={users}
  selectedUserIds={assigneeIds}
  onSelectionChange={setAssigneeIds}
  placeholder="Select assignees..."
/>

<UserMultiSelect
  users={users}
  selectedUserIds={reviewerIds}
  onSelectionChange={setReviewerIds}
  placeholder="Select reviewers..."
/>
```

### 4. Project Forms

**Files to update:**
- `components/new-project-form.tsx`
- Update similar to task forms for sales_person_id → salesPersonIds and ae_id → aeIds

### 5. Display Components

**Files to update:**
- `components/task-card.tsx`
- `components/task-detail-client.tsx`
- `components/tasks-table.tsx`
- `components/projects-page-client.tsx`

**Changes:**
```tsx
// Instead of single assignee
{task.assignee && <div>{task.assignee.full_name}</div>}

// Show multiple assignees
{task.assignees && task.assignees.length > 0 && (
  <div className="flex gap-1">
    {task.assignees.map(user => (
      <Badge key={user.id} variant="secondary">
        {user.full_name}
      </Badge>
    ))}
  </div>
)}
```

## Testing Checklist

- [ ] Create new task with multiple assignees
- [ ] Create new task with multiple reviewers
- [ ] Edit existing task - add/remove assignees
- [ ] Create new project with multiple sales persons
- [ ] Create new project with multiple AEs
- [ ] Edit existing project - add/remove users
- [ ] Verify old data (migrated from single fields) displays correctly
- [ ] Verify filtering/searching still works with new data structure

## Notes

- Old single-user fields (`assignee_id`, `reviewer_id`, `sales_person_id`, `ae_id`) are kept for backward compatibility
- Junction tables are prioritized when both exist
- Remove old fields in a future migration after confirming everything works
