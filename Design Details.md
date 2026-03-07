# **FinanceMe — Design Document & Requirements**

---

## **1\. Vision & Brand Identity**

The product should feel like a private banking portal meets a Bloomberg terminal — authoritative, precise, and premium. Every interaction should communicate that the user is in control of serious money. The aesthetic is **dark luxury**: deep backgrounds, surgical typography, gold or electric-blue accents, and data presented with clarity and confidence.

**Brand Personality:** Disciplined. Intelligent. Exclusive. Trustworthy.

**Tone of Voice:** Sharp, minimal copy. No fluff. Labels are concise. Empty states are motivating, not cute. Error messages are direct, not apologetic.

---

## **2\. Color System**

The palette is built around a near-black base with two accent tiers — a primary action color and a data highlight color.

**Base Palette**

* `--bg-base`: `#0A0A0F` — The deepest background. Near black with a blue-black undertone.  
* `--bg-surface`: `#111118` — Cards, panels, modals.  
* `--bg-elevated`: `#1A1A24` — Hover states, dropdowns, elevated surfaces.  
* `--border-subtle`: `#FFFFFF0F` — Hairline borders between elements.  
* `--border-strong`: `#FFFFFF1A` — Emphasized dividers.

**Typography Colors**

* `--text-primary`: `#F0F0F5` — Headings and primary content.  
* `--text-secondary`: `#8888A0` — Labels, captions, secondary info.  
* `--text-muted`: `#44445A` — Placeholders, disabled states.

**Accent — Gold (Primary Brand)**

* `--accent-gold`: `#C9A84C` — Primary CTA buttons, key highlights, logo mark.  
* `--accent-gold-bright`: `#E8C97A` — Hover state for gold.  
* `--accent-gold-dim`: `#C9A84C22` — Gold tinted backgrounds (badge fills, tag backgrounds).

**Accent — Electric Blue (Data & Interactive)**

* `--accent-blue`: `#4C8EF5` — Charts, links, active states, focus rings.  
* `--accent-blue-bright`: `#7AACFF` — Chart highlights, sparklines.  
* `--accent-blue-dim`: `#4C8EF510` — Tinted backgrounds.

**Semantic Colors**

* `--positive`: `#2ECC8A` — Income, gains, positive delta.  
* `--negative`: `#E05C5C` — Expenses, losses, negative delta.  
* `--warning`: `#E8A83A` — Budget warnings, approaching limits.  
* `--neutral`: `#6B6B85` — Unchanged, pending.

---

## **3\. Typography**

**Font Stack**

* **Display / Headings:** `Instrument Serif` or `Playfair Display` — Used sparingly for large titles only. Brings editorial luxury.  
* **UI / Body:** `Inter` — The workhorse. Clean, legible, and professional at all sizes.  
* **Monospace / Numbers:** `JetBrains Mono` or `IBM Plex Mono` — All financial figures, account numbers, and data tables use mono. This is non-negotiable — it creates alignment and makes numbers scannable.

**Type Scale**

| Role | Font | Size | Weight | Letter Spacing |
| :---- | :---- | :---- | :---- | :---- |
| Hero Title | Instrument Serif | 56px | 400 | \-0.5px |
| Page Title | Inter | 28px | 600 | \-0.3px |
| Section Header | Inter | 18px | 600 | \-0.2px |
| Card Title | Inter | 14px | 500 | 0px |
| Body | Inter | 14px | 400 | 0px |
| Caption / Label | Inter | 12px | 400 | 0.4px uppercase |
| Data Figure (large) | JetBrains Mono | 32px | 500 | \-0.5px |
| Data Figure (small) | JetBrains Mono | 14px | 400 | 0px |

**Rules:**

* Financial amounts always render in monospace.  
* Positive amounts are prefixed with `+` and colored `--positive`.  
* Negative amounts use `−` (minus sign, not a hyphen) and colored `--negative`.  
* Use uppercase tracking labels (`FONT-SIZE: 11px, LETTER-SPACING: 1.2px`) for category tags and section anchors.

---

## **4\. Layout & Grid System**

**Overall Structure**

The app uses a **fixed left sidebar \+ main content area** layout on desktop, collapsing to a **bottom tab bar** on mobile.

* Sidebar width: `240px` (collapsed: `64px`)  
* Content area: fluid, max-width `1400px`, centered  
* Content padding: `32px` desktop, `16px` mobile  
* Section gutter: `24px`  
* Card gap: `16px`

**Grid**

* Dashboard uses a **12-column grid** at full width.  
* Cards are sized in multiples: full (12), two-thirds (8), half (6), third (4), quarter (3).  
* Never use more than 4 columns of cards in a row.

**Spacing Scale (8px base)**

`4, 8, 12, 16, 24, 32, 48, 64, 96`

All margin, padding, and gap values must snap to this scale.

---

## **5\. Component Design Specifications**

### **Navigation Sidebar**

* Background: `--bg-surface` with a `1px` right border in `--border-subtle`.  
* Logo at top — wordmark in `--text-primary` with a gold accent mark.  
* Nav items: `14px Inter Medium`, icon \+ label, `40px` height.  
* Active state: gold left border `3px`, background `--bg-elevated`, text `--text-primary`.  
* Inactive state: text `--text-secondary`, no background.  
* Hover: background `--bg-elevated`, text transitions to `--text-primary` in `150ms`.  
* Section labels above grouped nav items in uppercase tracking style.  
* Bottom of sidebar: avatar, user name, settings icon.

### **Cards**

* Background: `--bg-surface`  
* Border: `1px solid --border-subtle`  
* Border radius: `12px`  
* Padding: `24px`  
* No drop shadows by default. Use border elevation instead.  
* Hover state (for interactive cards): border color transitions to `--border-strong`, subtle `--accent-blue-dim` background shift.  
* Card header: title left, action/link right (always). Divider line below header optional, only when card contains a table.

### **Stat Cards (KPI tiles)**

These are the most important UI element on the dashboard.

* Large monospace figure at center.  
* Label above in uppercase tracking.  
* Delta badge below: small pill with `+2.4%` or `−1.1%` in semantic color.  
* Sparkline (7 or 30 day) running along the bottom edge of the card.  
* Extremely minimal — no extra chrome, no icons unless they add meaning.

### **Data Tables**

* Row height: `52px`  
* Header: uppercase tracking labels, `--text-secondary`, `12px`.  
* Row dividers: `1px solid --border-subtle`.  
* Alternating rows: subtle `--bg-elevated` on even rows — barely perceptible.  
* Hover: row highlights with `--bg-elevated` and a left `2px` gold border flash.  
* Amounts: right-aligned, monospace, semantic color.  
* Category: small colored dot or pill icon to the left of label.  
* Pagination: minimal — prev/next with current page count. No bulky paginator.  
* Sticky header on scroll.

### **Charts**

All charts use **Recharts** or **D3**, styled to match the design system.

* Background: transparent (sits on card background).  
* Grid lines: `--border-subtle`, dashed, very faint.  
* Axis labels: `--text-secondary`, `11px`, uppercase.  
* Primary line/bar: `--accent-blue` or `--accent-gold` depending on context.  
* Area fills: gradient from accent color at `30% opacity` down to `0%`.  
* Tooltips: dark card (`--bg-elevated`), `1px` gold border, monospace figure, sharp corners (radius `6px`).  
* No chart legends inside the chart area — use a clean legend above or to the right.  
* Income vs expense bar charts use `--positive` and `--negative` explicitly.  
* Donut charts for category breakdowns — hole ratio `0.72`, thin rings, label in center.

### **Buttons**

**Primary (Gold)**

* Background: `--accent-gold`  
* Text: `#0A0A0F` (near black — contrast on gold)  
* Height: `40px`, padding `0 20px`, radius `8px`  
* Font: `14px Inter Semibold`  
* Hover: background `--accent-gold-bright`, transition `150ms`  
* Active: scale `0.98`

**Secondary (Outlined)**

* Background: transparent  
* Border: `1px solid --border-strong`  
* Text: `--text-primary`  
* Hover: background `--bg-elevated`

**Ghost**

* No background, no border  
* Text: `--text-secondary`  
* Hover: text `--text-primary`

**Destructive**

* Background: `--negative` at `15%` opacity  
* Border: `1px solid --negative`  
* Text: `--negative`

### **Form Inputs**

* Background: `--bg-elevated`  
* Border: `1px solid --border-subtle`  
* Radius: `8px`  
* Height: `44px`, padding `0 16px`  
* Focus: border color `--accent-blue`, box-shadow `0 0 0 3px --accent-blue-dim`  
* Label: uppercase tracking, `11px`, `--text-secondary`, above the field  
* Error state: border `--negative`, error message below in `12px --negative`  
* Prefix/suffix slots for currency symbols and units

### **Modals & Drawers**

* Backdrop: `rgba(0,0,0,0.7)` with a `4px` blur  
* Modal: `--bg-surface`, `1px` gold border, radius `16px`, max-width `560px`  
* Drawer (mobile/side panels): slides in from right, full height, `480px` wide on desktop  
* Close button: top right, ghost style  
* Always animate: `300ms ease-out` scale from `0.96` to `1.0` with fade

### **Badges & Tags**

* Height: `22px`, padding `0 8px`, radius `4px`  
* Font: `11px Inter Medium`, uppercase  
* Category tags use `--accent-gold-dim` background with `--accent-gold` text  
* Status badges use semantic color at `15%` background with full-color text

---

## **6\. Motion & Interaction Design**

**Philosophy:** Motion should feel precise and intentional — like the system is responding to commands, not performing for you. No bouncy springs. No playful delays. Everything is fast, linear, or ease-out.

**Transition Defaults**

* Micro-interactions (hover, focus): `150ms ease`  
* Panel/drawer slides: `280ms cubic-bezier(0.16, 1, 0.3, 1)`  
* Page transitions: fade `200ms`  
* Chart animations: `600ms ease-out` on mount, no looping

**Key Interactions**

* Number counters on dashboard KPIs animate up/down when data refreshes.  
* Table rows animate in on load with a `20px` upward stagger (`30ms` delay between rows).  
* Sidebar collapse is a smooth width transition, icons remain centered.  
* Tooltip appears after `200ms` hover delay — not instantly.  
* Modals scale in from `0.96`, drawers slide in — never a plain fade alone.

---

## **7\. Iconography**

* **Library:** Lucide Icons — consistent stroke weight, clean geometry.  
* **Size:** `16px` in tables and labels, `20px` in nav, `24px` for feature icons.  
* **Stroke width:** `1.5px` — thinner than default for a more refined feel.  
* **Color:** inherits from text context (`--text-secondary` by default).  
* Never use filled icons and outline icons together in the same view.

---

## **8\. Page-Specific Requirements**

### **Dashboard**

* Top row: 4 KPI stat cards — Net Worth, Monthly Income, Monthly Expenses, Savings Rate.  
* Second row: Large area chart (net worth over time, last 12 months) \+ donut chart (spending by category this month).  
* Third row: Recent transactions table (last 10\) \+ Budget progress cards.  
* Right panel (optional collapsed): upcoming bills in the next 7 days.  
* Real-time clock in the top bar showing the current date. User greeting: `"Good morning, James."` in muted text.

### **Transactions List**

* Full-width table with sticky column headers.  
* Filter bar above: date range picker, category multi-select, account select, amount range slider, search input.  
* Inline category edit on row click (no navigation needed for quick edits).  
* Bulk select with bulk categorize/delete actions.  
* Export button top right.

### **Reports / Analytics**

* Tab navigation between report types at the top.  
* All charts are large, full-width, and given breathing room.  
* The date range selector is always visible and persistent.  
* Comparison mode: toggle to overlay the prior period in a lighter color on the same chart.  
* Print / PDF export for any report.

### **Budgets**

* Card grid, one card per budget category.  
* Each card shows: category icon, category name, amount spent / limit, progress bar, days remaining in period.  
* Progress bar color: `--positive` under 70%, `--warning` 70–90%, `--negative` over 100%.  
* Over-budget cards sort to the top automatically.

### **Goals**

* Card layout with a circular progress ring instead of a bar.  
* Projected completion date shown in muted text.  
* "Contribute" button on each card opens a quick-add modal.

### **Settings**

* Two-column layout: left nav for settings categories, right panel for content.  
* Destructive actions (delete account, revoke access) are always at the bottom, separated by a divider, and require a confirmation step.

---

## **9\. Responsive Behavior**

| Breakpoint | Layout |
| :---- | :---- |
| `< 768px` (Mobile) | Single column, bottom tab bar, cards stack vertically |
| `768–1024px` (Tablet) | Sidebar collapses to icons only, 2-column card grid |
| `1024–1280px` (Desktop S) | Full sidebar, 3-column grid |
| `> 1280px` (Desktop L) | Full sidebar, 4-column grid, optional right panel |

On mobile, all data tables convert to **card-list format** — each transaction becomes its own mini-card rather than a table row.

---

## **10\. Accessibility Requirements**

* All color combinations must meet **WCAG AA** contrast (4.5:1 for text).  
* All interactive elements must have visible focus states (gold ring).  
* Charts must have a text-based data table fallback.  
* All form inputs must have associated labels (not just placeholders).  
* Modal focus trap — keyboard navigation must be contained within open modals.  
* Screen reader announcements for balance changes and alert notifications.  
* No functionality may be exclusively triggered by hover.

---

## **11\. Performance Requirements**

* **Initial page load:** under `2 seconds` on a standard connection.  
* **Dashboard data load:** skeleton loaders for all cards, data populated within `800ms`.  
* **Charts:** render after data, never block layout.  
* Transactions table must handle `10,000+ rows` via virtual scrolling — never paginate the DOM.  
* All images and icons use `SVG` or `WebP`. No heavy PNGs.  
* Fonts loaded with `font-display: swap`.

---

## **12\. Tech Stack Recommendations (For Fun XD)**

| Layer | Recommendation |
| :---- | :---- |
| Frontend Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS \+ CSS Variables for the design token layer |
| Charts | Recharts (standard) / D3 (custom) |
| State Management | Zustand |
| Data Fetching | TanStack Query (React Query) |
| Authentication | NextAuth.js or Clerk |
| Database | PostgreSQL via Prisma ORM |
| Bank Linking | Plaid API |
| Hosting | Vercel (frontend) \+ Supabase or Railway (database) |

