---
date: 2026-03-31
topic: shiphours-rebrand
---

# ShipHours Rebrand: Study App → Time Tracking for Software Engineers

## Problem Frame

The app "Horas Liquidas" is a fully functional time tracking tool with heatmap, analytics, goals, and session logging — but all branding, copy, and terminology targets students preparing for public exams (concursos). This makes it embarrassing to show as a portfolio piece to other software engineers. The core functionality is already a great fit for engineering time tracking; only the surface layer needs to change.

## Requirements

- R1. Rename app from "Horas Liquidas" to **ShipHours** everywhere (package.json, UI, page titles, meta tags, Astro pages, landing page)
- R2. Translate all user-facing text from Portuguese to **English**
- R3. Remap study terminology to engineering time tracking:
  - Subjects (Topicos) → **Tasks** (e.g., Bug fix, Code review, Feature dev)
  - Disciplines (Disciplinas) → **Projects** (e.g., Backend API, Frontend App)
  - Study Sessions → **Work Sessions** or **Focus Sessions**
  - Study Cycles → **Focus Rotations** (keep feature, rename)
  - Exam Profiles → **Sprint Goals** (keep feature, rename)
  - Weekly Goals → **Weekly Goals** (same concept, keep)
  - Scratchpad/Notas → **Notes** (keep)
- R4. **Remove the Allocation feature** entirely (route, nav item, page, components, store, API calls)
- R5. Rewrite the **landing page** copy for software engineers:
  - Hero: focus on tracking real productive time, not just hours at desk
  - Social proof: "Used by engineers at..." instead of "medicine, law, concursos"
  - Features: same 4 features reframed for engineering context
  - Pricing: translate to English, keep structure
  - FAQ: rewrite for engineering audience
- R6. **Remove existing blog posts** (study-specific content)
- R7. **Create one new blog post** in English about maintaining focus as a software engineer in an increasingly distracted, AI-accelerated world — the value of tracking your deep work time
- R8. Update **navigation labels** in AppLayout.tsx to English (Calendar, Notes, Dashboard, Content → Projects & Tasks, Settings)
- R9. Update **onboarding/tour** text if present to reflect new terminology
- R10. Create work on a **new git branch** (`feat/shiphours-rebrand`)

## Success Criteria

- All user-facing text is in English with engineering terminology
- No references to "estudo", "concurso", "disciplina" (in study context), or "Horas Liquidas" remain in UI
- Allocation page/route is fully removed
- Landing page reads as a professional SaaS for engineers
- Blog has one relevant English post
- App builds and runs without errors

## Scope Boundaries

- **No backend changes** — API endpoints, database schema, Prisma models stay as-is (frontend-only rename)
- **No functionality changes** — features work the same, only labels/copy change
- **No design/visual changes** — colors, layout, components stay the same
- **No i18n system** — hardcoded English strings are fine for now
- Blog post is a single MDX file, not a content strategy

## Key Decisions

- **ShipHours** as the name: references "shipping code" + tracking hours
- **Tasks/Projects** mapping: Tasks = what you work on (granular), Projects = grouping (like disciplines grouped subjects)
- **Keep Study Cycles as Focus Rotations**: the rotation concept is useful for engineers switching between tasks
- **Keep Sprint Goals (ex Exam Profiles)**: useful for sprint-based goal setting, just rename
- **Remove Allocation only**: too exam-specific (weight, currentLevel, goalLevel don't map well)
- **English only**: portfolio target is international engineering audience

## Outstanding Questions

### Deferred to Planning
- [Affects R3][Needs research] How deep does the "Subject → Task" rename go in store names, API types, and internal variable names? Decide whether to rename only UI labels or also refactor store/type names for consistency.
- [Affects R5][Technical] Should the landing page social proof reference real companies or use generic placeholders?
- [Affects R9][Needs research] Identify all onboarding/tour strings that need updating.

## Next Steps

→ `/ce:plan` for structured implementation planning
