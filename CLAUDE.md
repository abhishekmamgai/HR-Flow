# HRFlow SaaS — Project Context for Claude
# This file is auto-read by Claude in every session.
# Keep this updated as the project grows.

## Project Overview
HRFlow is a production-grade, multi-tenant HR SaaS platform built by ASK Tech (New Delhi & Gurgaon).
It manages employees, attendance (manual + face recognition), leave, and payroll for startups and SMBs.

## Tech Stack
- Framework  : Next.js 14 (App Router) — /app directory, Server Components default
- Database   : Supabase (Postgres) with RLS on every table
- Auth       : Supabase Auth (email + Google OAuth + invite links)
- Styling    : Tailwind CSS v3 + shadcn/ui
- State      : Zustand + TanStack Query v5
- Forms      : React Hook Form + Zod
- PDF        : @react-pdf/renderer
- Excel      : SheetJS (xlsx)
- Face AI    : face-api.js (browser-only, lazy-loaded)
- Animations : Framer Motion
- Icons      : Lucide React
- Email      : Resend + React Email
- Payments   : Stripe + Razorpay
- Deployment : Vercel

## Design System — ALWAYS use these
Colors:
--bg           : #F7F6F3   (warm off-white page bg)
--surface      : #FFFFFF   (cards)
--surface-2    : #F0EEE9   (alt rows, hover)
--border       : #E2DED6   (warm beige borders)
--ink-1        : #181714   (headings)
--ink-2        : #3E3C38   (body text)
--ink-3        : #6B6860   (muted text)
--blue         : #2558D9   (primary CTA)
--blue-bg      : #EBF0FD
--green        : #158A46   (present/approved)
--green-bg     : #E5F7ED
--orange       : #C25308   (late/pending)
--orange-bg    : #FEF3EA
--red          : #C42B2B   (absent/rejected)
--red-bg       : #FEEEEE
--purple       : #6835B0   (face recognition/premium)
--purple-bg    : #F0EAFC

Typography:
- Headings : Fraunces (serif display) from Google Fonts
- Body     : Plus Jakarta Sans from Google Fonts
- Mono     : JetBrains Mono (salary formulas, code)

Radii: inputs/buttons=8px | cards=14px | modals=14px | chips=20px
Touch targets: min-height 44px on ALL interactive elements
Currency: always ₹ Indian format (Intl.NumberFormat 'en-IN')

## Multi-Tenancy Rules (NEVER break these)
1. Every DB table has company_id
2. Every Supabase query filters by company_id
3. RLS enabled on ALL tables
4. Never expose service_role key to client
5. Plan limits enforced server-side

## Status Badge Colors (semantic — always use these)
- PRESENT / APPROVED / ACTIVE    → green  (#E5F7ED bg, #158A46 text)
- LATE / PENDING / NOTICE_PERIOD → orange (#FEF3EA bg, #C25308 text)
- ABSENT / REJECTED / TERMINATED → red    (#FEEEEE bg, #C42B2B text)
- ON_LEAVE / PROBATION           → blue   (#EBF0FD bg, #2558D9 text)
- PREMIUM / FACE_RECOGNITION     → purple (#F0EAFC bg, #6835B0 text)
- WEEKEND / HOLIDAY / LOCKED     → gray   (#F0EEE9 bg, #6B6860 text)

## Payroll Salary Logic (7 steps)
File: /lib/salary-calculator.ts (pure function)
1. working_days = calendar_days - weekends - company_holidays
2. lop_days = absent_days not covered by paid leave
3. lop_deduction = (monthly_gross / working_days) × lop_days
4. gross = basic + hra + special_allow + conveyance + medical + bonus + ot + arrears
5. pf = MIN(basic × 0.12, 1800) | esi = gross > 21000 ? 0 : gross × 0.0075
   prof_tax = state_slab | tds = annual_projected / 12
6. total_deductions = pf + esi + prof_tax + tds + lop + advance_emi
7. net_salary = gross - total_deductions

## Face Recognition Rules
- ALWAYS 'use client' — face-api.js is browser-only
- Models in /public/models/ (ssdMobilenetv1 + faceRecognitionNet + faceLandmark68Net)
- Lazy load models only when user visits /face-attendance
- Store: Float32Array → JSON.stringify → employees.face_embedding (jsonb)
- Registration: capture 3 frames, average descriptors, store mean
- Match threshold: 0.5 (euclidean distance)
- Mobile: facingMode 'user', full-screen camera UI
- face_consent_given must be true before registration

## Payroll Export Modal
After finalize → modal with 2 options side by side:
- PDF  : @react-pdf/renderer, red accent, individual payslip + "Download All" ZIP
- Excel: SheetJS, green accent, 4 sheets (Summary/Earnings/Deductions/LOP)
Mobile: stack vertically, full-width buttons

## Current Build State
# UPDATE THIS SECTION as you build each module:
- [x] Next.js 14 project initialized (hrflow-app/)
- [ ] Dependencies installed (run Prompt 00)
- [ ] Supabase schema + RLS
- [ ] Auth system
- [ ] App layout (sidebar + mobile nav)
- [ ] Employee management
- [ ] Attendance system
- [ ] Leave management
- [ ] Payroll engine
- [ ] Face recognition
- [ ] SaaS billing

## Folder Structure
hrflow-app/
  src/app/
    (auth)/login, signup, invite/[token]
    (dashboard)/layout.tsx ← sidebar + auth guard
    (dashboard)/dashboard
    (dashboard)/employees
    (dashboard)/attendance
    (dashboard)/leave
    (dashboard)/payroll
    (dashboard)/face-attendance ← 'use client', Premium
    (dashboard)/settings
    api/...
  src/components/
    ui/           ← shadcn
    shared/       ← Sidebar, TopBar, MobileNav, DataTable, StatusBadge, KpiCard
    employees/
    attendance/
    leave/
    payroll/
    face/
  src/lib/
    supabase/client.ts, server.ts
    validations/
    hooks/useAuth.ts, useCompany.ts
    utils.ts
    salary-calculator.ts
  src/types/index.ts
  src/store/authStore.ts