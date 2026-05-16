---
title: "refactor: ShipHours full-stack rebrand from study app to engineering time tracker"
type: refactor
status: completed
date: 2026-03-31
origin: docs/brainstorms/2026-03-31-shiphours-rebrand-requirements.md
deepened: 2026-03-31
---

# ShipHours Full-Stack Rebrand

## Overview

Rebrand "Horas Líquidas" (a Portuguese study-tracking app) into "ShipHours" (an English time-tracking app for software engineers). This is a full-stack rename: Prisma models, backend modules, frontend stores/types/components, all UI text, landing page, and blog content. The Allocation feature is removed entirely.

## Problem Frame

The app's functionality (session tracking, heatmap, analytics, goals) is already ideal for engineering time tracking, but all branding, copy, and internal naming targets Brazilian exam students. Since the project will be open-sourced as a portfolio piece, both user-facing text and internal code names need to reflect the new engineering-focused identity. (see origin: docs/brainstorms/2026-03-31-shiphours-rebrand-requirements.md — note: origin document scoped this as frontend-only; scope was expanded to full-stack during planning per user decision)

## Requirements Trace

- R1. Rename app "Horas Líquidas" → "ShipHours" everywhere
- R2. Translate all user-facing text PT-BR → English
- R3. Remap terminology: Subject→Task, Discipline→Project, StudySession→WorkSession, StudyCycle→FocusCycle, ExamProfile (removed with Allocation, not renamed)
- R4. Remove the Allocation feature entirely (frontend + backend + Prisma)
- R5. Rewrite landing page for software engineers
- R6. Remove existing blog posts
- R7. Create one new blog post about focus in the AI age
- R8. Update navigation labels to English
- R9. Update onboarding/tour text
- R10. Work on branch `feat/shiphours-rebrand`

## Scope Boundaries

- No functional changes except R4 (Allocation removal) — remaining features work the same, only names/text change
- No design/visual changes — colors, layout, components stay the same
- No i18n system — hardcoded English strings
- Blog post is a single MDX file
- Deployment config URLs (netlify.toml, fly.toml) are updated for name consistency but actual DNS/domain changes are out of scope
- Existing migration files are never modified — only new migrations are created

## Context & Research

### Relevant Code and Patterns

- **Dual routing**: `App.tsx` and `SpaApp.tsx` must stay in sync (CLAUDE.md rule)
- **Feature badges**: `featureBadgesStore.ts` — FeatureKey type + initialSeenFeatures must be updated when removing allocation
- **Prisma schema**: 14 existing migrations under `backend/prisma/migrations/` — never modify these
- **Backend modules**: Standard NestJS pattern — module/controller/service/dto per entity in `backend/src/{entity}/`
- **Store barrel**: `frontend/src/store/index.ts` re-exports all stores
- **API barrel**: `frontend/src/lib/api/index.ts` re-exports all API modules
- **Blog content**: `frontend/src/content/blog/` with MDX files, schema in `frontend/src/content/config.ts`
- **Onboarding**: `OnboardingTour.tsx` (Joyride steps) + `WelcomeOverlay.tsx`

### Institutional Learnings

- No `docs/solutions/` directory exists — first large-scale change
- Cross-domain auth doc (`docs/cross-domain-authentication.md`) references old domain names that should be updated

## Key Technical Decisions

- **Full-stack rename over UI-only**: Since the project will be open-sourced, internal code names matter for credibility. Worth the extra effort and migration risk.
- **Prisma rename via `@@map`**: Use `@@map("old_table_name")` on renamed models to avoid data loss. This maps new model names to existing database tables without requiring destructive migrations.
- **Sequencing: remove before rename**: Delete the Allocation feature first to reduce the rename surface area.
- **File renames via git mv**: Use `git mv` for file renames to preserve git history.
- **Backend API endpoints also renamed**: Since the only API consumer is the React frontend (no external clients, no mobile app), controller paths should match the new module names (`/api/tasks`, `/api/projects`, etc.) to avoid permanent naming incoherence in an open-source codebase.
- **Social proof on landing page**: Use generic placeholders ("Used by engineers worldwide") — no fake company names.
- **Database name stays `study_planner`**: Renaming the database would break existing deployments and adds no user-visible value. Out of scope for this rebrand.

## Open Questions

### Resolved During Planning

- **Depth of rename**: Full stack including backend and Prisma (user decision: project will be open-sourced)
- **Backend API endpoints**: Also renamed (no external consumers — only the React frontend calls these). Controller paths change from `/api/subjects` to `/api/tasks`, etc.
- **Prisma approach**: Use `@@map` to avoid destructive migrations. Rename produces NO migration since @@map keeps table names unchanged. Removal migration (Allocation) is separate.
- **Social proof**: Generic placeholders, not fake company names
- **Missing junction/related models**: `SubjectCategory` → `TaskCategory`, `StudyCycleAdvance` → `FocusCycleAdvance`, `StudyCycleCompletion` → `FocusCycleCompletion` must also be renamed in Prisma schema
- **ExamProfile disposition**: Delete entirely with Allocation (not renamed to SprintGoal). R3 mapping updated to reflect this. Feature can be re-added in the future if needed.
- **FocusCycle over FocusRotation**: "FocusCycle" chosen as more natural engineering term (sprint cycle, dev cycle).
- **Database name**: Stays `study_planner` — renaming would break deployments with no user-visible benefit

### Deferred to Implementation

- **Exact Prisma migration SQL**: The `@@map` approach should produce safe migrations, but the actual migration output needs to be verified at implementation time
- **Test assertion updates**: Many test files have Portuguese string assertions — exact new strings will be determined during implementation
- **pt-BR locale references in date-fns**: Some date formatting uses `pt-BR` locale — need to verify which usages are user-facing (change to `en-US`) vs internal

## Implementation Units

### Phase 1: Foundation

- [ ] **Unit 1: Create branch and remove Allocation feature**

  **Goal:** Create `feat/shiphours-rebrand` branch and cleanly remove the entire Allocation feature to reduce rename surface area.

  **Requirements:** R4, R10

  **Dependencies:** None

  **Files:**
  - Delete: `frontend/src/components/allocation/` (entire directory — 6 files)
  - Delete: `frontend/src/views/AllocationPage.tsx`
  - Delete: `frontend/src/store/allocationStore.ts`
  - Delete: `frontend/src/lib/api/allocation.ts`
  - Delete: `backend/src/exam-profile/` (entire directory)
  - Delete: `backend/src/exam-template/` (entire directory)
  - Delete: `backend/prisma/seed/exam-templates.ts`
  - Modify: `frontend/src/App.tsx` — remove AllocationPage import + route
  - Modify: `frontend/src/components/SpaApp.tsx` — mirror App.tsx changes
  - Modify: `frontend/src/components/layout/AppLayout.tsx` — remove allocation nav item + path mapping
  - Modify: `frontend/src/store/index.ts` — remove allocationStore export
  - Modify: `frontend/src/store/featureBadgesStore.ts` — remove 'allocation' from FeatureKey + initialSeenFeatures
  - Modify: `frontend/src/store/featureBadgesStore.test.ts` — remove allocation test cases
  - Modify: `frontend/src/lib/api/index.ts` — remove allocation export
  - Modify: `frontend/src/types/api.ts` — remove ExamProfile, SubjectProfile, AllocationResult, AllocationResponse, CreateExamProfileDto, CreateSubjectProfileDto, UpdateExamProfileDto types
  - Modify: `frontend/src/components/onboarding/OnboardingTour.tsx` — remove allocation tour step
  - Modify: `backend/src/app.module.ts` — remove ExamProfile + ExamTemplate module imports
  - Modify: `backend/prisma/schema.prisma` — remove ExamProfile, SubjectProfile, ExamTemplate, ExamTemplateItem models; also remove relation fields `examProfiles ExamProfile[]` from Workspace model and `subjectProfiles SubjectProfile[]` from Subject model
  - Test: `frontend/src/store/featureBadgesStore.test.ts`

  **Approach:**
  - Create branch first
  - Delete files/directories, then clean up all imports and references
  - Remove Prisma models and create a migration (`npx prisma migrate dev --name remove-allocation`)
  - Verify build compiles after removal

  **Patterns to follow:**
  - Dual routing sync rule from CLAUDE.md
  - Feature badge removal pattern from CLAUDE.md

  **Test scenarios:**
  - Happy path: App builds successfully with no allocation references remaining
  - Happy path: Feature badge store initializes without 'allocation' key
  - Edge case: No broken imports — grep for 'allocation', 'AllocationPage', 'ExamProfile', 'ExamTemplate' across codebase returns zero UI hits

  **Verification:**
  - `npm run build` succeeds in both frontend and backend
  - No TypeScript errors
  - Grep for allocation-related imports returns nothing

- [ ] **Unit 2: Prisma schema rename with @@map**

  **Goal:** Rename Prisma models to new terminology while preserving existing database tables via `@@map`.

  **Requirements:** R3

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `backend/prisma/schema.prisma`

  **Approach:**
  - Rename models: `Subject` → `Task`, `Discipline` → `Project`, `StudyCycle` → `FocusCycle`, `StudyCycleItem` → `FocusCycleItem`, `StudySession` → `WorkSession`
  - Also rename junction/related models: `SubjectCategory` → `TaskCategory`, `StudyCycleAdvance` → `FocusCycleAdvance`, `StudyCycleCompletion` → `FocusCycleCompletion`
  - The schema already uses `@@map` on every model — just keep existing `@@map` values when renaming model names
  - Update all relation field names: e.g., `subjects Subject[]` → `tasks Task[]` on Workspace model, `subject Subject` → `task Task` on junction models
  - Keep `@map` on scalar fields unchanged (e.g., `subject_id` column stays)
  - Run `npx prisma generate` — this should produce NO migration since table/column names are unchanged via @@map
  - Run `npx tsc --noEmit` in backend — TypeScript will catch every stale `prisma.subject` reference

  **Patterns to follow:**
  - Existing Prisma model structure in `schema.prisma`
  - Never modify existing migration files

  **Test scenarios:**
  - Happy path: `prisma migrate dev` detects no schema changes (since @@map preserves table/column names) — no migration generated
  - Happy path: `prisma generate` succeeds and produces client with new model names
  - Edge case: All relation fields correctly reference renamed models
  - Error path: If `prisma migrate dev` generates a migration with DROP statements, abort — @@map values are incorrect

  **Verification:**
  - `npx prisma generate` succeeds
  - `npx prisma migrate dev` produces no migration (or an empty one)
  - `npx tsc --noEmit` in backend catches all stale Prisma client references
  - Backend compiles with new Prisma client types

### Phase 2: Backend Rename

- [ ] **Unit 3: Rename backend modules and update internal references**

  **Goal:** Rename NestJS modules from study terminology to engineering terminology.

  **Requirements:** R3

  **Dependencies:** Unit 2

  **Files:**
  - Rename: `backend/src/subject/` → `backend/src/task/` (module, controller, service, dto, spec files)
  - Rename: `backend/src/discipline/` → `backend/src/project/` (all files)
  - Rename: `backend/src/study-cycle/` → `backend/src/focus-cycle/` (all files)
  - Rename: `backend/src/study-sessions/` → `backend/src/work-session/` (all files)
  - Modify: `backend/src/app.module.ts` — update all imports
  - Modify: `backend/src/workspace/workspace.service.ts` — update Prisma references (`prisma.subject` → `prisma.task`, `prisma.studySession` → `prisma.workSession`, relation includes)
  - Modify: `backend/src/category/category.service.ts` — update references
  - Modify: `backend/src/subscription/subscription.service.ts` — update `prisma.studyCycle` and `prisma.studySession` references

  **Approach:**
  - Use `git mv` for directory/file renames to preserve history
  - Rename class names inside each file: SubjectModule → TaskModule, SubjectController → TaskController, etc.
  - Update all import paths across backend
  - Update controller route paths: `@Controller('api/subjects')` → `@Controller('api/tasks')`, etc. (no external consumers)
  - Update Prisma client usage: `prisma.subject.findMany()` → `prisma.task.findMany()`, and all `include: { subjects: true }` → `include: { tasks: true }`
  - Check ALL backend services for cross-module Prisma usage (workspace.service.ts, subscription.service.ts, category.service.ts)

  **Patterns to follow:**
  - Existing NestJS module structure (module/controller/service/dto pattern)

  **Test scenarios:**
  - Happy path: Backend compiles with zero TypeScript errors
  - Happy path: All existing backend tests pass with renamed modules
  - Integration: API endpoints respond correctly at new URLs (`/api/tasks`, `/api/projects`, `/api/work-sessions`, etc.)
  - Edge case: Workspace, Category, and Subscription services correctly reference new Prisma model names

  **Verification:**
  - `npm run build` in backend succeeds
  - `npm test` in backend passes
  - API endpoints remain functional

### Phase 3: Frontend Types, API, and Stores

- [ ] **Unit 4: Rename frontend types and API client**

  **Goal:** Update TypeScript type definitions and API client functions to use new terminology.

  **Requirements:** R3

  **Dependencies:** Unit 3

  **Files:**
  - Modify: `frontend/src/types/api.ts` — rename Subject→Task, Discipline→Project, StudyCycle→FocusCycle, StudyCycleItem→FocusCycleItem, StudySession→WorkSession, plus all related DTOs
  - Modify: `frontend/src/types/session.ts` — rename StudySession→WorkSession, `materia`→`taskName`, `minutos`→`minutes`, `totalMinutos`→`totalMinutes`, `materias`→`entries`, `mostStudiedSubject`→`mostWorkedTask`, `subjectBreakdown`→`taskBreakdown`
  - Rename: `frontend/src/lib/api/subjects.ts` → `frontend/src/lib/api/tasks.ts`
  - Rename: `frontend/src/lib/api/disciplines.ts` → `frontend/src/lib/api/projects.ts`
  - Rename: `frontend/src/lib/api/studyCycle.ts` → `frontend/src/lib/api/focusCycle.ts`
  - Rename: `frontend/src/lib/api/sessions.ts` → `frontend/src/lib/api/workSessions.ts`
  - Modify: `frontend/src/lib/api/index.ts` — update barrel exports
  - Rename: `frontend/src/lib/utils/subjectAnalytics.ts` → `frontend/src/lib/utils/taskAnalytics.ts`
  - Modify: `frontend/src/lib/utils/transform.ts` — update Portuguese field names (`materias`, `materia`, `totalMinutos`)

  **Approach:**
  - Update type names in `api.ts` and `session.ts` first (this will surface all downstream breakages via TypeScript)
  - The `session.ts` type has Portuguese field names (`materia`, `minutos`) used in ~22 consumer files — renaming these fields will cascade widely but TypeScript catches all mismatches
  - Rename API client files with `git mv`, then update function names and imports
  - API client functions now hit renamed backend endpoints (`/api/tasks` instead of `/api/subjects`, etc.)
  - Update barrel exports last

  **Patterns to follow:**
  - Existing API client pattern (function names match entity name)

  **Test scenarios:**
  - Happy path: Frontend compiles with no TypeScript errors after type rename
  - Happy path: API client functions reference correct type names
  - Edge case: Barrel exports in index.ts correctly re-export all renamed modules

  **Verification:**
  - `npx tsc --noEmit` passes in frontend
  - No broken imports

- [ ] **Unit 5: Rename frontend stores**

  **Goal:** Rename Zustand stores to match new terminology.

  **Requirements:** R3

  **Dependencies:** Unit 4

  **Files:**
  - Rename: `frontend/src/store/subjectStore.ts` → `frontend/src/store/taskStore.ts`
  - Rename: `frontend/src/store/disciplineStore.ts` → `frontend/src/store/projectStore.ts`
  - Rename: `frontend/src/store/studyCycleStore.ts` → `frontend/src/store/focusCycleStore.ts`
  - Modify: `frontend/src/store/sessionStore.ts` — rename internal "study session" references
  - Modify: `frontend/src/store/sessionStore.test.ts`
  - Modify: `frontend/src/store/index.ts` — update barrel exports (useSubjectStore→useTaskStore, etc.)
  - Rename: `frontend/src/hooks/useSubjectAnalytics.ts` → `frontend/src/hooks/useTaskAnalytics.ts`
  - Rename: `frontend/src/hooks/useRecentSubjects.ts` → `frontend/src/hooks/useRecentTasks.ts` (imported by 7+ files: SessionModal, StudyTimer, CycleEditorModal, QuickAddSession, and tests)

  **Approach:**
  - `git mv` files, rename hook/store names inside, update all imports across frontend
  - Store hook names: `useSubjectStore` → `useTaskStore`, `useDisciplineStore` → `useProjectStore`, `useStudyCycleStore` → `useFocusCycleStore`
  - Update `useRecentTasks` localStorage key from study-related to task-related naming
  - Update all consumer files that import these stores

  **Patterns to follow:**
  - Zustand store naming convention (use{Entity}Store)

  **Test scenarios:**
  - Happy path: All store imports resolve correctly after rename
  - Happy path: Existing store tests pass with updated names
  - Edge case: No stale imports remain — grep for old store names returns zero

  **Verification:**
  - `npx tsc --noEmit` passes
  - Store tests pass

### Phase 4: Frontend Component Renames

- [ ] **Unit 6: Rename Subject/Discipline/StudyCycle components**

  **Goal:** Rename all frontend components from study terminology to engineering terminology.

  **Requirements:** R3

  **Dependencies:** Unit 5

  **Files:**
  - Rename: `frontend/src/components/ui/subject-picker.tsx` → `frontend/src/components/ui/task-picker.tsx`
  - Rename: `frontend/src/components/ui/subject-picker.test.tsx` → `frontend/src/components/ui/task-picker.test.tsx`
  - Rename: `frontend/src/components/ui/discipline-picker.tsx` → `frontend/src/components/ui/project-picker.tsx`
  - Rename: `frontend/src/components/study-cycle/` → `frontend/src/components/focus-cycle/` (entire directory — 7 files)
  - Rename: `frontend/src/components/dashboard/SubjectChart.tsx` → `TaskChart.tsx` (+ test)
  - Rename: `frontend/src/components/dashboard/SubjectTrendChart.tsx` → `TaskTrendChart.tsx`
  - Rename: `frontend/src/components/dashboard/SubjectStatsCards.tsx` → `TaskStatsCards.tsx` (+ test)
  - Rename: `frontend/src/components/dashboard/SubjectSelector.tsx` → `TaskSelector.tsx`
  - Rename: `frontend/src/components/dashboard/SubjectWeeklyChart.tsx` → `TaskWeeklyChart.tsx`
  - Modify: `frontend/src/components/dashboard/index.ts` — update barrel exports
  - Modify: `frontend/src/components/ui/multi-category-select.tsx` — update subject terminology
  - Modify: `frontend/src/components/calendar/SessionListSkeleton.tsx` — update subject references
  - Rename: `frontend/src/views/SubjectsPage.tsx` → `TasksPage.tsx`
  - Rename: `frontend/src/views/DisciplinesPage.tsx` → `ProjectsPage.tsx`
  - Rename: `frontend/src/views/SubjectsAndDisciplinesPage.tsx` → `TasksAndProjectsPage.tsx`
  - Rename: `frontend/src/views/SubjectAnalyticsPage.tsx` → `TaskAnalyticsPage.tsx`

  **Approach:**
  - Rename directories/files with `git mv`
  - Update component names, imports, and exports inside each file
  - Update all consumer imports across the frontend
  - Update route entries in both `App.tsx` and `SpaApp.tsx`

  **Patterns to follow:**
  - Dual routing sync rule from CLAUDE.md

  **Test scenarios:**
  - Happy path: All renamed components render without errors
  - Happy path: Dashboard barrel exports all renamed chart components
  - Edge case: Route entries in both App.tsx and SpaApp.tsx use new component names
  - Edge case: Focus cycle directory has all files renamed with updated internal references

  **Verification:**
  - Frontend builds successfully
  - All renamed component tests pass

### Phase 4b: CLI App Rename

- [ ] **Unit 6b: Rename CLI app terminology**

  **Goal:** Update the CLI app (`cli/`) to use new engineering terminology. The plan's research found 12+ CLI source files referencing study/subject/discipline terminology.

  **Requirements:** R3

  **Dependencies:** Unit 5

  **Files:**
  - Modify: `cli/src/components/Dashboard.tsx`
  - Modify: `cli/src/components/Timer.tsx`
  - Modify: `cli/src/components/SessionLog.tsx`
  - Modify: `cli/src/components/Progress.tsx`
  - Rename: `cli/src/components/CycleManager.tsx` → `CycleManager.tsx`
  - Rename: `cli/src/components/CycleView.tsx` → `CycleView.tsx`
  - Rename: `cli/src/components/widgets/CycleWidget.tsx` → `CycleWidget.tsx`
  - Modify: `cli/src/components/widgets/TimerWidget.tsx`
  - Modify: `cli/src/context/TimerContext.tsx`
  - Rename: `cli/src/api/cycles.ts` → `cli/src/api/focusCycles.ts`
  - Modify: `cli/src/api/sessions.ts`
  - Modify: `cli/src/api/workspaces.ts`

  **Approach:**
  - `git mv` files, rename component/function names inside
  - Update all import paths within the CLI
  - API client calls must hit the renamed backend endpoints (`/api/tasks`, `/api/projects`, etc.)
  - Translate any Portuguese UI text in the CLI to English

  **Test scenarios:**
  - Happy path: CLI builds without TypeScript errors
  - Edge case: No references to "subject", "discipline", "study-cycle" remain in CLI source

  **Verification:**
  - CLI compiles
  - Grep for old terminology in cli/src/ returns zero

### Phase 5: UI Text Translation

- [ ] **Unit 7: Translate all Portuguese UI text to English**

  **Goal:** Replace every Portuguese string in the frontend with English equivalents.

  **Requirements:** R2, R8, R9

  **Dependencies:** Unit 6

  **Files (high-density Portuguese text — ordered by priority):**
  - Modify: `frontend/src/components/layout/AppLayout.tsx` — nav labels, logo text, tooltips
  - Modify: `frontend/src/components/layout/AppLayout.test.tsx`
  - Modify: `frontend/src/components/layout/AuthLayout.tsx`
  - Modify: `frontend/src/components/layout/UserMenu.tsx`
  - Modify: `frontend/src/views/SettingsPage.tsx` — heavy Portuguese (all labels, descriptions, toasts)
  - Modify: `frontend/src/views/CalendarPage.tsx`
  - Modify: `frontend/src/views/DashboardPage.tsx` (+ test)
  - Modify: `frontend/src/views/ScratchpadPage.tsx`
  - Modify: `frontend/src/views/LoginPage.tsx`
  - Rename: `frontend/src/components/calendar/StudyTimer.tsx` → `FocusTimer.tsx` — rename component, update `STORAGE_KEY` from 'studyTimer', translate text
  - Modify: `frontend/src/components/calendar/SessionModal.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/CalendarGrid.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/CalendarCell.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/CalendarHeader.tsx`
  - Modify: `frontend/src/components/calendar/MobileDayView.tsx`
  - Modify: `frontend/src/components/calendar/MobileBottomNav.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/QuickAddSession.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/ConfigPanel.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/WeeklyGoalEditor.tsx`
  - Modify: `frontend/src/components/calendar/TimerOfflineWarning.tsx` (+ test)
  - Modify: `frontend/src/components/calendar/ActivityHeatmap.tsx`
  - Modify: `frontend/src/components/dashboard/StatsCards.tsx` (+ test)
  - Modify: `frontend/src/components/dashboard/DailyChart.tsx` (+ test)
  - Modify: `frontend/src/components/dashboard/DateRangeFilter.tsx` (+ test)
  - Modify: `frontend/src/components/dashboard/AnnualHeatmap.tsx`
  - Modify: `frontend/src/components/keyboard/ShortcutsModal.tsx`
  - Modify: `frontend/src/components/keyboard/ShortcutsHelpFAB.tsx`
  - Modify: `frontend/src/components/subscription/PricingModal.tsx`
  - Modify: `frontend/src/components/subscription/UpgradePrompt.tsx` (+ test)
  - Modify: `frontend/src/components/workspace/WorkspaceManager.tsx` (+ test)
  - Modify: `frontend/src/components/workspace/WorkspaceSelector.tsx`
  - Modify: `frontend/src/components/ui/offline-banner.tsx` (+ test)
  - Modify: `frontend/src/components/ui/empty-state.tsx`
  - Modify: `frontend/src/components/onboarding/OnboardingTour.tsx`
  - Modify: `frontend/src/components/onboarding/WelcomeOverlay.tsx` (+ test)
  - Modify: `frontend/src/hooks/useKeyboardShortcuts.ts`
  - Modify: `frontend/src/hooks/useSessions.ts`
  - Modify: `frontend/src/hooks/useWeeklyGoalToast.ts` (+ test)
  - Modify: `frontend/src/hooks/useAutoSave.ts` (+ test)
  - Modify: `frontend/src/lib/utils/relative-time.ts` (+ test)
  - Modify: `frontend/src/lib/utils/date.ts`
  - Modify: `frontend/src/lib/codemirror/task-checkboxes.ts`
  - Modify: `frontend/src/lib/api/auth.ts`
  - Modify: `frontend/src/store/authStore.ts`

  **Approach:**
  - Work file-by-file, translating every Portuguese string
  - Navigation labels: Calendário→Calendar, Notas→Notes, Dashboard→Dashboard, Conteúdo→Projects & Tasks
  - Change `pt-BR` locale references to `en-US` for user-facing date formatting
  - Update onboarding tour step titles and descriptions to reflect new terminology
  - Update `data-tour` attribute values in AppLayout.tsx (`data-tour="nav-subjects"` → `data-tour="nav-tasks"`, remove `data-tour="nav-allocation"`)
  - Update test assertions to match new English strings

  **Patterns to follow:**
  - Keep natural, professional English — not literal translations
  - Study-specific terms → engineering equivalents per R3 mapping

  **Test scenarios:**
  - Happy path: No Portuguese strings remain in user-facing UI (verified by grep)
  - Happy path: All test files updated with English assertion strings and pass
  - Edge case: Date formatting uses en-US locale
  - Edge case: Onboarding tour references new feature names (Focus Cycles, etc.)

  **Verification:**
  - Grep for common Portuguese words ("Calendário", "Sessão", "Estudo", "Disciplina", "Matéria", "Concurso", etc.) returns zero hits in frontend/src/
  - All tests pass

### Phase 6: Landing Page, Blog, and Config

- [ ] **Unit 8: Rewrite landing page and legal pages**

  **Goal:** Transform the landing page from a study app to a professional SaaS for engineers. Translate legal pages.

  **Requirements:** R1, R2, R5

  **Dependencies:** Unit 7

  **Files:**
  - Modify: `frontend/src/views/LandingPage.tsx` — full rewrite of copy
  - Modify: `frontend/src/pages/index.astro` — full rewrite of copy
  - Modify: `frontend/src/views/TermsPage.tsx` — translate to English, replace "Horas Líquidas" with "ShipHours"
  - Modify: `frontend/src/views/PrivacyPage.tsx` — translate to English, replace brand name
  - Modify: `frontend/src/pages/terms.astro` — translate
  - Modify: `frontend/src/pages/privacy.astro` — translate

  **Approach:**
  - Landing page hero: "Track your real productive time, not just hours at a desk"
  - Social proof: "Used by engineers worldwide" (generic, no fake companies)
  - Features: Heatmap Calendar → "Visualize your effort day by day", Real Focus → "Measure deep work, not seat time", Weekly Goals → "Set targets and track progress", History & Patterns → "Track your evolution week by week"
  - Pricing: translate structure, keep R$ or change to $ based on target audience
  - FAQ: rewrite for engineering audience
  - Footer: "ShipHours" branding
  - Legal pages: translate and rebrand, keep structure

  **Test scenarios:**
  - Happy path: Landing page renders with all English copy, no Portuguese
  - Happy path: All four feature cards display engineering-focused descriptions
  - Edge case: FAQ section renders with new questions/answers
  - Edge case: Terms and Privacy pages reference "ShipHours" throughout

  **Verification:**
  - Visual review of landing page
  - Grep for "Horas Líquidas", "concurso", "estudo" in landing/legal pages returns zero

- [ ] **Unit 9: Replace blog content**

  **Goal:** Remove study-specific blog posts and add one new engineering-focused post.

  **Requirements:** R6, R7

  **Dependencies:** Unit 7 (parallel with Units 8 and 10 — disjoint file sets)

  **Files:**
  - Delete: `frontend/src/content/blog/como-estudar-melhor.mdx`
  - Delete: `frontend/src/content/blog/tecnica-pomodoro-guia-completo.mdx`
  - Delete: `frontend/src/content/blog/modelo-alocacao-estudo-por-disciplina.mdx`
  - Create: `frontend/src/content/blog/deep-work-in-the-age-of-ai.mdx`
  - Modify: `frontend/src/content/config.ts` — update default author
  - Modify: `frontend/src/pages/blog/index.astro` — translate page text
  - Modify: `frontend/src/layouts/BlogLayout.astro` — translate header, footer, CTA
  - Modify: `frontend/src/pages/rss.xml.ts` — update title, description

  **Approach:**
  - New blog post theme: The world is increasingly distracted; AI acceleration demands more focus from engineers; tracking deep work time helps maintain productivity and intentionality
  - Tone: professional, relatable, not preachy
  - Author: "ShipHours Team"
  - Blog layout and index page: translate all Portuguese text, update brand references

  **Test scenarios:**
  - Happy path: Blog index page lists only the new post
  - Happy path: New blog post renders correctly with proper MDX formatting
  - Edge case: RSS feed generates with new title and single post
  - Edge case: Blog layout header/footer shows "ShipHours" branding in English

  **Verification:**
  - Blog page renders with one English post
  - No Portuguese text in blog section

- [ ] **Unit 10: Update config, meta, and infrastructure files**

  **Goal:** Update all config files, HTML meta tags, and infrastructure references with new branding.

  **Requirements:** R1, R2

  **Dependencies:** Unit 7 (parallel with Units 8 and 9 — disjoint file sets)

  **Files:**
  - Modify: `package.json` (root) — name: "shiphours"
  - Modify: `frontend/package.json` — name: "shiphours-frontend"
  - Modify: `cli/package.json` — name: "shiphours-cli", update description
  - Modify: `frontend/index.html` — title "ShipHours", lang="en"
  - Modify: `frontend/src/layouts/BaseLayout.astro` — lang="en", update default description
  - Modify: `frontend/src/pages/index.astro` — meta tags
  - Modify: `frontend/src/pages/app/index.astro` — title "ShipHours"
  - Modify: `frontend/src/pages/app/[...slug].astro` — title "ShipHours"
  - Modify: `frontend/src/pages/login.astro` — title
  - Modify: `backend/fly.toml` — app name reference
  - Modify: `netlify.toml` — update URL references
  - Modify: `frontend/netlify.toml` — update URL references
  - Modify: `docker-compose.yml` — update URL references
  - Modify: `docs/cross-domain-authentication.md` — update domain references

  **Approach:**
  - Update package names for npm consistency
  - Change `lang="pt-BR"` to `lang="en"` in all HTML roots
  - Update meta descriptions to English
  - Update infrastructure config with "shiphours" naming

  **Test scenarios:**
  - Happy path: HTML pages serve with lang="en" and "ShipHours" in title
  - Happy path: Package.json files have consistent "shiphours" naming
  - Edge case: Netlify and Fly config reference updated names

  **Verification:**
  - Grep for "pt-BR", "Horas Liquidas", "study-planner" across entire project returns zero (except git history and migration files)
  - `npm install` works from root with updated package names

### Phase 7: Final Verification

- [ ] **Unit 11: Full build verification and cleanup**

  **Goal:** Verify the entire stack builds, tests pass, and no Portuguese/study references remain.

  **Requirements:** All (R1-R10)

  **Dependencies:** Unit 10

  **Files:**
  - Possibly modify: any files with remaining Portuguese or old terminology found during grep sweep

  **Approach:**
  - Run full grep sweep for Portuguese/study terms across entire codebase
  - Run `npm run build` in frontend and backend
  - Run all tests (`make test` or equivalent)
  - Run Prisma migration check
  - Fix any remaining issues

  **Test scenarios:**
  - Happy path: Full frontend build succeeds
  - Happy path: Full backend build succeeds
  - Happy path: All tests pass (frontend + backend)
  - Happy path: Prisma client generation succeeds
  - Edge case: No stale imports, no TypeScript errors, no runtime console errors

  **Verification:**
  - Frontend: `npm run build` exits 0
  - Backend: `npm run build` exits 0
  - Tests: all pass
  - Grep sweep: zero Portuguese UI text in source (excluding migrations, git history, node_modules)

## System-Wide Impact

- **Interaction graph:** Prisma model renames affect all backend services that query these models — not just the entity's own service but also cross-module consumers: `workspace.service.ts` (uses `prisma.subject`, `prisma.studySession`), `subscription.service.ts` (uses `prisma.studyCycle`, `prisma.studySession`), `category.service.ts` (uses `prisma.subject`). Backend module renames affect `app.module.ts` imports. Frontend type renames cascade through stores → hooks → components → views. The `session.ts` UI type with Portuguese field names (`materia`, `minutos`) propagates to ~22 consumer files.
- **Error propagation:** If Prisma @@map is incorrect, all database queries fail at runtime. Relation field renames (`include: { subjects: true }` → `include: { tasks: true }`) cause runtime errors, NOT compile errors, unless strict Prisma typing is enforced. The primary safety net is `npx tsc --noEmit` after `prisma generate`.
- **State lifecycle risks:** Zustand stores persist state in memory — renaming store hooks has no runtime persistence risk. `StudyTimer`'s localStorage key `studyTimer` and `useRecentSubjects`'s localStorage key need updating — this resets persisted state for existing users (acceptable since the app is being rebranded). Prisma @@map preserves database tables, so no data migration needed.
- **API surface parity:** Backend REST endpoints are renamed to match new terminology. Frontend API clients are the only consumers. No external API consumers. The CLI app also calls these endpoints and must be updated in sync.
- **Integration coverage:** The critical integration seam is Prisma model → backend service → REST endpoint → frontend API client → CLI API client. Each layer should be verified after its rename phase. Run `npx tsc --noEmit` at each boundary as the primary catch-all.

## Risks & Dependencies

- **Prisma relation field renames cause runtime errors**: Unlike model renames (caught by TypeScript), stale `include: { subjects: true }` calls may compile but fail at runtime if Prisma's strict mode isn't enforced. Mitigate by running `npx tsc --noEmit` after `prisma generate` and grepping for old relation names.
- **Cross-module Prisma usage**: `workspace.service.ts` and `subscription.service.ts` use models being renamed outside their own modules — easy to miss. Mitigate by grepping entire `backend/src/` for old model names after rename.
- **session.ts Portuguese field cascade**: Renaming `materia`/`minutos`/`materias` in `frontend/src/types/session.ts` ripples to ~22 consumer files. TypeScript catches all mismatches, but the volume means many small edits. Mitigate by doing this rename early in Unit 4 so the blast radius is contained.
- **CLI app forgotten**: The CLI has 12+ source files with study terminology — easy to overlook since it's a separate package. Now explicitly covered in Unit 6b.
- **File rename git history**: `git mv` preserves history but some tools may not track it perfectly. Low risk, acceptable trade-off.
- **Test brittleness**: Many tests assert on Portuguese strings. All must be updated. Mitigate by running full test suite after each phase.
- **Scope creep**: ~140 files is a large surface area. Mitigate by strict phase sequencing and `tsc --noEmit` verification at each boundary.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-31-shiphours-rebrand-requirements.md](docs/brainstorms/2026-03-31-shiphours-rebrand-requirements.md)
- CLAUDE.md dual-routing and feature badge rules
- Cross-domain auth: `docs/cross-domain-authentication.md`
- Prisma @@map documentation for model renaming without data loss
