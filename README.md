# FinanceME — Front-End Developer Guide

Welcome to the FinanceME front-end! This guide explains how the shared files work so everyone can build their pages consistently.

---

## Folder Structure

```
Front_End/
├── css/
│   ├── variables.css     ← design tokens (colors, fonts, spacing) — DON'T CHANGE  
│   ├── base.css          ← reset, typography, global defaults — DON'T CHANGE  
│   ├── components.css    ← reusable UI components (cards, buttons, etc.)  
│   └── layout.css        ← sidebar, grid, responsive breakpoints  
├── js/
│   ├── utils.js          ← shared helper functions — load this FIRST  
│   ├── sidebar.js        ← sidebar loading & behavior  
│   └── header.js         ← header/footer loading, clock, greeting  
├── components/
│   ├── sidebar.html      ← navigation sidebar (shared — DON'T DUPLICATE)  
│   ├── header.html       ← top bar (shared)  
│   └── footer.html       ← footer (shared)  
├── pages/                ← YOUR PAGES GO HERE  
├── index.html            ← dashboard template — copy this to start a new page  
└── README.md             ← you're reading it  
```

---

## How to Create a New Page

1. **Copy the template below** into `pages/your-page-name.html`
2. **Change** `ACTIVE_PAGE` to match your page's `data-page` attribute in the sidebar
3. **Adjust the CSS/JS paths** — from `pages/`, everything goes up one level (`../`)
4. **Replace the content** inside `.content-wrapper` with your page content

### Starter Template for Pages

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Page — FinanceME</title>

  <!-- CSS (note the ../ since we're in pages/) -->
  <link rel="stylesheet" href="../css/variables.css" />
  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/layout.css" />

  <!-- Add your page-specific CSS here if needed -->
  <!-- <link rel="stylesheet" href="../css/your-page.css" /> -->
</head>
<body>

  <div class="app-container">
    <div id="sidebar-container"></div>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <div class="main-content">
      <div id="header-container"></div>

      <div class="content-wrapper">
        <!-- ============================
             YOUR PAGE CONTENT GOES HERE
             ============================ -->

        <h1>Page Title</h1>
        <p>Your content here...</p>

      </div>

      <div id="footer-container"></div>
    </div>
  </div>

  <!-- Mobile tab bar (copy from index.html, fix paths) -->

  <!-- JS (note the ../) -->
  <script src="../js/utils.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/header.js"></script>
  <script>
    // Set which nav link to highlight
    window.ACTIVE_PAGE = 'your-page-name';
    window.USER_NAME = 'User';
  </script>

</body>
</html>
```

---

## CSS Classes Quick Reference

### Layout
| Class | What it does |
|-------|-------------|
| `.app-container` | Flex container for sidebar + content |
| `.main-content` | Everything to the right of sidebar |
| `.content-wrapper` | Padded, centered content area |
| `.grid` | CSS Grid container |
| `.grid-cols-4` | 4-column grid (also: 1, 2, 3, 12) |
| `.col-span-6` | Span 6 of 12 columns (also: 1–12) |
| `.page-section` | Bottom margin between page sections |

### Cards
| Class | What it does |
|-------|-------------|
| `.card` | Standard card (surface bg, border, radius) |
| `.card-interactive` | Card with hover effect |
| `.card-header` | Flexbox header row (title left, action right) |
| `.stat-card` | KPI tile with label, value, delta |

### Buttons
| Class | What it does |
|-------|-------------|
| `.btn` | Base button (always include this) |
| `.btn-primary` | Gold CTA button |
| `.btn-secondary` | Outlined button |
| `.btn-ghost` | Invisible until hovered |
| `.btn-destructive` | Red delete/remove button |
| `.btn-sm` | Smaller size |
| `.btn-icon` | Square icon-only button |

### Forms
| Class | What it does |
|-------|-------------|
| `.form-label` | Uppercase label above input |
| `.form-input` | Text input / select |
| `.form-group` | Wraps label + input pair |
| `.input-group` | Prefix/suffix wrapper |

### Typography
| Class | What it does |
|-------|-------------|
| `.text-hero` | 56px serif display title |
| `.text-page-title` | 28px page heading |
| `.text-section` | 18px section heading |
| `.text-caption` | 12px small text |
| `.text-label` | 11px uppercase tracking |
| `.data-figure-lg` | 32px monospace (KPI numbers) |
| `.data-figure-sm` | 14px monospace (table amounts) |
| `.amount-positive` | Green color |
| `.amount-negative` | Red color |

### Other
| Class | What it does |
|-------|-------------|
| `.badge` | Base badge + one of: badge-category, badge-positive, badge-negative, badge-warning, badge-neutral |
| `.data-table` | Styled table with sticky header |
| `.progress-bar` | Container for a progress bar |
| `.progress-bar__fill` | The fill element + one of: --ok, --warning, --danger |
| `.divider` | Horizontal line |
| `.skeleton` | Loading shimmer placeholder |

---

## JS Functions Quick Reference

### utils.js (load first!)
```js
// Load a component HTML file into a target element
loadComponent('components/sidebar.html', 'sidebar-container', callback);

// Format money — always outputs monospace-friendly text
formatCurrency(1500);              // "$1,500.00"
formatCurrency(-320, 'USD', true); // "−$320.00"

// Format dates
formatDate(new Date(), 'full');     // "Friday, March 7, 2026"
formatDate(new Date(), 'short');    // "Mar 7, 2026"
formatDate(new Date(), 'relative'); // "2 hours ago"

// Get time-based greeting
getGreeting('James');  // "Good morning, James."

// Animate a number counting up (for stat cards)
animateCounter(element, 48750.82, 800, '$', 2);

// Get CSS class for an amount
getAmountClass(-50);  // 'amount-negative'

// Get progress bar class
getProgressClass(85);  // 'progress-bar__fill--warning'

// Debounce a function (for search inputs)
input.addEventListener('input', debounce(handleSearch, 300));
```

---

## Rules for Everyone

1. **Never hard-code colors** — always use `var(--color-name)` from variables.css
2. **Money = monospace** — always use `.data-figure-lg` or `.data-figure-sm` for amounts
3. **Spacing = 8px scale** — use `var(--space-xs)` through `var(--space-4xl)`, never random values
4. **Don't edit shared files** without telling the team (sidebar.html, header.html, footer.html, variables.css)
5. **Test mobile** — resize your browser to under 768px, make sure your page doesn't break
6. **Use Live Server** — components load via `fetch()`, so you need a local server (not `file://`)

---

## Running Locally

Components are loaded via `fetch()`, which requires a local server. **Don't just double-click** the HTML file.

**Option 1: VS Code Live Server** (recommended)
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

**Option 2: Python**
```bash
cd Front_End
python -m http.server 8080
# then open http://localhost:8080
```

**Option 3: Node.js**
```bash
npx serve .
```
