# HRFlow — Cursor Agent Rules
# This file controls how Cursor's Agent mode behaves.
# Agent reads this automatically on every Ctrl+Shift+L session.

## Project Identity
You are working on HRFlow — an HR SaaS platform by ASK Tech.
Working directory: hrflow-app/
All code changes must stay inside hrflow-app/src/

## Agent Behavior Rules

### Before writing any code:
1. Read CLAUDE.md for full project context and design system
2. Check existing files — do not duplicate components that already exist
3. Confirm the task scope before making file changes
4. If a library is needed that is not in package.json, ask before installing

### Code generation rules:
- TypeScript strict — no `any`, no `ts-ignore`
- Server Components by default — add `'use client'` only when needed
- Every new page/component must handle: loading state, error state, empty state
- All Supabase queries must include `company_id` filter — no exceptions
- All forms: React Hook Form + Zod validation
- All API routes: authenticate → verify company_id → validate (Zod) → execute
- Use `cn()` from `@/lib/utils` for all conditional classNames
- File names: kebab-case | Component names: PascalCase

### Design rules (never deviate):
- Background color: #F7F6F3 (not white, not gray — warm off-white)
- Primary blue: #2558D9
- Headings: font-family Fraunces
- Body: font-family Plus Jakarta Sans
- All interactive elements: min-height 44px (mobile touch)
- Status chips: green=success, orange=warning, red=danger, purple=premium
- Tables: dark header (#181714), alternating rows (#FFF / #F0EEE9)
- Cards: white bg, border #E2DED6, border-radius 14px, no heavy shadows

### Face Recognition rules:
- face-api.js is BROWSER ONLY — always `'use client'`
- Never import face-api.js in any server component or API route
- Models must be in /public/models/
- Lazy load: only import when component mounts, not at module level

### Multi-tenancy rules:
- Never write a Supabase query without .eq('company_id', companyId)
- Never expose SUPABASE_SERVICE_ROLE_KEY in client code
- Always check subscription plan before enabling premium features

## File Creation Checklist
When creating a new page, always create these together:
  ✓ page.tsx (the route)
  ✓ loading.tsx (skeleton UI)
  ✓ error.tsx (error boundary)
  ✓ related components in /components/[module]/

When creating a new API route:
  ✓ Authenticate with Supabase server client
  ✓ Get company_id from session
  ✓ Validate request body with Zod
  ✓ Filter all DB queries by company_id
  ✓ Return consistent { data, error } shape

## What NOT to Do
- Do NOT use `pages/` directory — this is App Router only
- Do NOT use `getServerSideProps` or `getStaticProps`
- Do NOT use `axios` — use native `fetch` or Supabase client
- Do NOT hardcode company_id or user_id
- Do NOT use `useEffect` to fetch data — use TanStack Query
- Do NOT install new libraries without checking if one already exists
- Do NOT write raw SQL strings in components — use Supabase query builder or RPC
- Do NOT skip loading/error states

## Build Order (follow this sequence)
When asked to "build the next module", follow this order:
1. Supabase schema SQL (if not done)
2. Auth + layout shell
3. Employee CRUD
4. Attendance (manual)
5. Leave management
6. Payroll engine + export modal
7. Dashboard
8. Face recognition (Premium)
9. SaaS billing

## Terminal Commands
Dev server : cd hrflow-app && npm run dev
Build check: cd hrflow-app && npm run build
Type check : cd hrflow-app && npx tsc --noEmit
Lint       : cd hrflow-app && npm run lint
Supabase   : use Supabase MCP tools directly (connected)