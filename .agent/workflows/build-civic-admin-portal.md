---
description: Build the Civic Intelligence OS Admin Portal - A comprehensive government-grade admin dashboard
---

# Civic Intelligence OS Admin Portal - Build Workflow

This workflow documents the complete process for building the "Institutional Modern" admin portal.

## Prerequisites
- Node.js 18+ installed
- npm or pnpm available

## Phase 1: Project Setup

// turbo
1. Initialize Next.js project with TypeScript and Tailwind
```bash
cd /home/sherwin/projects/civic-intel-admin
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install
```

// turbo
2. Install dependencies
```bash
npm install
```

// turbo
3. Install ShadCN UI
```bash
npx -y shadcn@latest init -d
```

// turbo
4. Install ShadCN components (bulk)
```bash
npx -y shadcn@latest add button card input label select dropdown-menu table tabs avatar badge separator sheet dialog tooltip progress slider switch textarea command popover calendar scroll-area skeleton checkbox radio-group form alert alert-dialog aspect-ratio breadcrumb collapsible hover-card menubar navigation-menu resizable sonner toggle toggle-group
```

// turbo
5. Install additional dependencies
```bash
npm install lucide-react recharts leaflet react-leaflet @types/leaflet date-fns clsx
```

## Phase 2: Design System Setup

6. Configure the theme colors in `globals.css`:
   - Background: Slate/Cool Grey (Dark mode primary)
   - Accents: Signal Red, Amber, Emerald, Govt Blue
   - Typography: Inter font family

7. Create design tokens and utility classes

## Phase 3: Core Layout

8. Build the master sidebar navigation with all 7 sections:
   - Dashboard, Ticket Grid, Dispatch Map, Workforce, Analytics, Audit Logs, Admin

9. Create the app shell with header and main content area

## Phase 4: Page Development

10. **Login Page** - Security gate with split-screen design
11. **Dashboard** - Command Center with KPI cards, heatmap, action stream
12. **Ticket Grid** - Work bench with filters and smart table
13. **Ticket Detail** - Case file with 3-column layout
14. **Dispatch** - Workforce management with map + rosters
15. **Analytics** - Reports and charts
16. **Audit Logs** - Compliance table
17. **Admin** - User management

## Phase 5: Testing & Verification

18. Run development server
```bash
npm run dev
```

19. Verify all pages render correctly
20. Test dark mode theme
21. Verify responsive design
22. Test navigation between pages

## Notes

- Use ShadCN UI components for consistent design
- Lucide React for icons
- Leaflet for maps
- Recharts for charts
- Mock data for demonstration
