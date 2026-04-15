# FinanceME Front-End: AI Codebase Knowledge File

## 1) Project Identity

- Project name: FinanceME
- Repository type: Static front-end web application (multi-page app)
- Runtime model: Browser-only UI with component injection and page-specific scripts
- Current maturity: UI-first prototype with rich mocked data and interactions
- Primary goal: Personal finance platform UX including dashboard, accounts, budgets, goals, reports, planning, notifications, and settings

## 2) Tech Stack and Runtime Dependencies

### Core stack
- HTML5 pages (landing + authenticated area pages)
- CSS design system with shared tokens and reusable components
- Vanilla JavaScript (no framework)

### External libraries used
- Chart.js (charts on analytics/reporting and dashboard pages)
- Anime.js (motion-heavy interactions, especially landing and page transitions)
- Font Awesome kit (used on some pages like Accounts Overview)
- Google Fonts: Instrument Serif, Inter, JetBrains Mono

### Hosting expectation
- Must be served from an HTTP server (not opened via file://) because shared UI components are loaded with fetch().

## 3) Architecture at a Glance

FinanceME uses a modular MPA pattern:

1. Shared shell + components:
- Shared sidebar, header, footer HTML are stored in components/.
- They are injected into each page at runtime by JS helpers.

2. Shared style foundation:
- variables.css defines design tokens.
- base.css defines global resets and typography.
- components.css defines reusable UI primitives.
- layout.css defines app shell, grid system, responsive behavior, and shared page banner utility.

3. Domain page layers:
- Each domain (dashboard, budgets, goals, reports, planning, settings, etc.) has dedicated CSS and JS.
- Pages inside pages/ are mostly tied to one domain script.

4. Data model style:
- Current implementation is mock-data driven in client JS.
- No real backend APIs wired in this repo yet.

## 4) Directory-Level Map

- index.html
  - Marketing/landing page with animated sections and CTA links into auth flow.

- components/
  - sidebar.html: Global navigation for authenticated app pages.
  - header.html: Top bar with greeting, date/time, search, notifications.
  - footer.html: Global footer with legal/help links.

- css/
  - variables.css: Global design tokens (colors, spacing, typography, transitions).
  - base.css: Reset + baseline element styles.
  - components.css: Reusable UI classes (cards, buttons, forms, badges, tables, modals).
  - layout.css: App shell, sidebar/topbar/content/footer, responsive grid, page banner utility.
  - landing.css: Landing page specific visual system and animations.
  - dashboard.css: Dashboard-only visual styles.
  - AccOver.css: Accounts overview page styles.
  - transactions.css: Transactions pages styles.
  - budgets.css: Budgets pages styles.
  - goals.css: Goals pages styles.
  - reports.css: Reports/analytics pages styles.
  - planning.css: Planning/forecasting pages styles.
  - notifications.css: Notifications and alert rules styles.
  - settings.css: Settings area styles.
  - auth.css: Auth pages styles (login, signup, reset, 2FA).

- js/
  - utils.js: Shared helpers (component loader, money/date formatting, greeting, animation helpers, debounce, ID generation).
  - sidebar.js: Sidebar load/init, active-page highlight, collapse persistence, mobile open/close, transition navigation.
  - header.js: Header load/init, live datetime, greeting, footer init, notification placeholder behavior.
  - landing.js: Landing animations, scroll reveals, hero orchestration.
  - dashboard.js: Dashboard data model + chart/table/card rendering.
  - accounts-overview.js: Account card generation, filtering tabs, modal flow, KPI updates.
  - transactions.js: Transactions domain behavior.
  - budgets.js: Budgets domain behavior.
  - goals.js: Goals/savings domain behavior.
  - reports.js: Reports/analytics chart initialization and interactions.
  - planning.js: Planning pages logic (bills, forecast, debt, investment projector).
  - notifications.js: Notifications/alert management interactions.
  - settings.js: Settings page interactions and section state.
  - auth.js: Shared auth page interactions (validation/toggles/flow behaviors).

- pages/
  - Main authenticated app pages + feature/detail pages for each finance domain.

- Logo/
  - Brand logo assets.

- pictures/
  - Additional media assets (appears to include AccountsOverview visuals).

- README.md, CONTRIBUTING.md, Design Details.md, Pages and Website details.md
  - Human documentation with coding conventions, design system expectations, and collaboration workflow.

## 5) Page Routing Inventory

### Core
- index.html (landing)
- pages/dashboard.html

### Auth
- pages/login.html
- pages/signup.html
- pages/forgot-password.html
- pages/reset-password.html
- pages/two-factor-auth.html

### Accounts and transactions
- pages/AccountsOverview.html
- pages/transactions.html
- pages/add-transaction.html
- pages/transaction-detail.html
- pages/import-transactions.html
- pages/recurring-transactions.html
- pages/auto-categorization.html

### Budgets
- pages/budgets.html
- pages/add-budget.html
- pages/budget-detail.html

### Goals
- pages/goals.html
- pages/add-goal.html
- pages/goal-detail.html
- pages/savings-goals.html

### Reports and analytics
- pages/reports.html
- pages/spending-analysis.html
- pages/income-vs-expenses.html
- pages/net-worth-trends.html
- pages/category-trends.html
- pages/cash-flow-report.html
- pages/tax-summary.html

### Planning
- pages/bills.html
- pages/forecast.html
- pages/debt-payoff.html
- pages/investment-projector.html

### Notifications
- pages/notifications.html
- pages/manage-alert-rules.html
- pages/notification-preferences.html
- pages/subscriptions.html

### Settings and account administration
- pages/settings.html
- pages/profile-settings.html
- pages/security-settings.html
- pages/integrations.html
- pages/categories-manager.html
- pages/currency-locale.html
- pages/subscription-billing.html
- pages/data-export.html
- pages/delete-account.html

## 6) Shared Runtime Lifecycle

For most authenticated pages, execution order is:

1. Load shared CSS stack:
- variables.css
- base.css
- components.css
- layout.css
- page-specific css

2. Build shell placeholders in page HTML:
- sidebar-container
- header-container
- footer-container

3. Load JS in this order:
- utils.js (must be first)
- sidebar.js
- header.js
- optional libs (Chart.js / Anime.js / others)
- page-specific script

4. Optional globals set before script init:
- window.ACTIVE_PAGE
- window.USER_NAME

## 7) Data and State Model

### Current data source strategy
- Data is mocked in page scripts (arrays/objects in JS).
- No centralized API client or persistence layer in this codebase.

### State patterns
- Local UI state variables in each domain script (example: active filters, selected tabs).
- localStorage used for persistent UI preference in sidebar collapse state.
- DOM-driven rendering (create elements / set innerHTML / update text and classes).

## 8) Design System Rules (High Importance)

These are core constraints documented in project files and reflected in code:

- Never hardcode styling values when a design token exists.
- Use variables.css as the single source of color/spacing/typography/motion tokens.
- Financial numbers should use mono font classes for alignment/readability.
- Reuse common component classes from components.css rather than page-local duplication.
- Use shared page banner pattern from layout.css instead of redefining hero gradients repeatedly.
- Keep spacing on the 8px rhythm scale.

## 9) Domain Responsibilities by Script

- auth.js: Form UX and auth flow interactions across login/signup/recovery/2FA pages.
- dashboard.js: Daily command layer, KPI rendering, runway chart, risk/bills/transactions/account summaries.
- accounts-overview.js: Account cards, category filtering, account-link modal, KPI updates from account data.
- transactions.js: Transaction listing/add/edit/import related interactions.
- budgets.js: Budget summaries, usage states, and budget detail interactions.
- goals.js: Goal overview/detail/create flows and progress behavior.
- reports.js: Chart.js analytics dashboards and report switching interactions.
- planning.js: Bill calendar, projections, debt payoff, investment scenario interactions.
- notifications.js: Alerts listing and rule interaction behavior.
- settings.js: Settings section navigation and per-setting UX behavior.

## 10) Known Structural Strengths

- Clear separation between shared shell and feature pages.
- Strong design-token-first approach with reusable UI classes.
- Predictable script/file naming by domain.
- Good onboarding docs for contributors.

## 11) Known Gaps / Risks (for future AI work)

- No backend integration yet: all financial data appears mocked.
- Multiple pages exist, but behavior depth likely varies by page (some are richer than others).
- Potential path/case-sensitivity risk in mixed filename casing (for non-Windows deployments).
- Footer links reference pages (terms/privacy/help) that may not yet exist in pages/.
- Accessibility and testing automation are not clearly centralized yet.

## 12) How an AI Should Work Safely in This Repo

### Before editing
1. Identify target domain (auth, dashboard, budgets, etc.).
2. Read the corresponding page HTML + domain CSS + domain JS.
3. Preserve shared load order and token usage.
4. Check if the change belongs in shared files or domain files.

### While editing
1. Reuse existing classes/components before adding new ones.
2. Keep money formatting through shared helpers where possible.
3. Do not break shared component injection IDs.
4. Keep ACTIVE_PAGE values consistent with sidebar data-page.

### After editing
1. Verify links/path correctness from pages/ context (../ prefix usage).
2. Verify mobile behavior (sidebar, tab bar, responsive grids).
3. Verify no style-token regressions and no duplicated global styles.
4. Verify chart pages still load required CDN scripts.

## 13) Practical AI Task Playbook

### If asked to add a new finance feature page
- Copy existing page scaffold from a similar domain page.
- Include standard shared CSS stack and JS bootstrap order.
- Set window.ACTIVE_PAGE correctly.
- Add route entry in sidebar.html and mobile tab bar if relevant.
- Create matching css/<feature>.css and js/<feature>.js if behavior is non-trivial.

### If asked to redesign visuals
- Start in variables.css and components.css where possible.
- Avoid page-by-page drift unless intentional.
- Preserve typography roles (Inter/Instrument Serif/JetBrains Mono semantics).

### If asked to wire real APIs
- Introduce a shared data access module (new js/api.js + config strategy).
- Replace mock datasets incrementally per domain script.
- Keep formatters in utils.js as final presentation layer.

## 14) Quick File Entry Points for AI Context Loading

Read these first for fastest understanding:

1. README.md
2. Design Details.md
3. index.html
4. js/utils.js
5. js/sidebar.js
6. js/header.js
7. pages/dashboard.html + js/dashboard.js + css/dashboard.css
8. pages/AccountsOverview.html + js/accounts-overview.js + css/AccOver.css
9. pages/reports.html + js/reports.js + css/reports.css

## 15) One-Paragraph Mental Model

FinanceME is a static, design-system-driven multi-page finance UI where each page mounts a shared sidebar/header/footer shell and then runs domain-specific vanilla JS against mocked data. The architecture emphasizes reusable CSS tokens/components, clear domain file boundaries, and rich interaction polish (charts + animations). The project is ready for incremental backend wiring and production hardening without needing a front-end framework migration.