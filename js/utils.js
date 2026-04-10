/* ============================================================
   FINANCEME — Utility Functions (utils.js)
   
   Shared helper functions used across all pages.
   Import this file on every page BEFORE other JS files.
   ============================================================ */


/**
 * Load an HTML component (sidebar, header, footer) into a target element.
 * 
 * HOW TO USE:
 *   In your HTML, add a placeholder div:
 *     <div id="sidebar-container"></div>
 *   
 *   Then in your JS (or we do it automatically):
 *     loadComponent('components/sidebar.html', 'sidebar-container');
 * 
 * @param {string} url - path to the HTML component file
 * @param {string} targetId - id of the element to inject the HTML into
 * @param {Function} [callback] - optional function to run after loading
 */
async function loadComponent(url, targetId, callback) {
  try {
    const response = await fetch(url);

    // If the fetch fails (e.g. wrong path), show a helpful error
    if (!response.ok) {
      console.error(`Failed to load component: ${url} (${response.status})`);
      return;
    }

    const html = await response.text();
    const target = document.getElementById(targetId);

    if (target) {
      target.innerHTML = html;

      // Run the callback if provided (e.g. to set up event listeners)
      if (typeof callback === 'function') {
        callback();
      }
    } else {
      console.error(`Target element #${targetId} not found in the DOM.`);
    }
  } catch (error) {
    console.error(`Error loading component ${url}:`, error);
  }
}


/**
 * Format a number as currency.
 * Always uses monospace-friendly formatting.
 * 
 * @param {number} amount - the amount to format
 * @param {string} [currency='EGP'] - currency code (EGP, EUR, GBP, etc.)
 * @param {boolean} [showSign=false] - if true, adds + for positive amounts
 * @returns {string} formatted currency string
 * 
 * EXAMPLES:
 *   formatCurrency(1500)           → "E£1,500.00"
 *   formatCurrency(-320.5)         → "−E£320.50"
 *   formatCurrency(1500, 'EGP', true) → "+E£1,500.00"
 */
function formatCurrency(amount, currency = 'EGP', showSign = false) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with locale and currency
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  // Add the proper sign prefix
  if (isNegative) {
    return '−' + formatted;  // use the proper minus sign (−), not a hyphen (-)
  } else if (showSign && amount > 0) {
    return '+' + formatted;
  }

  return formatted;
}


/**
 * Format a date nicely.
 * 
 * @param {Date|string} date - date to format
 * @param {string} [style='full'] - 'full', 'short', 'time', or 'relative'
 * @returns {string} formatted date string
 * 
 * EXAMPLES:
 *   formatDate(new Date())                  → "Friday, March 7, 2026"
 *   formatDate(new Date(), 'short')         → "Mar 7, 2026"
 *   formatDate(new Date(), 'time')          → "7:27 PM"
 *   formatDate(new Date(), 'relative')      → "2 hours ago"
 */
function formatDate(date, style = 'full') {
  const d = new Date(date);

  switch (style) {
    case 'full':
      return d.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

    case 'short':
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      });

    case 'relative':
      return getRelativeTime(d);

    default:
      return d.toLocaleDateString();
  }
}


/**
 * Get a relative time string like "2 hours ago" or "just now".
 * Used internally by formatDate when style='relative'.
 * 
 * @param {Date} date
 * @returns {string}
 */
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24)  return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay < 7)  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return formatDate(date, 'short');
}


/**
 * Get a greeting based on the time of day.
 * 
 * @param {string} [name='User'] - the user's name
 * @returns {string} e.g. "Good morning, James."
 */
function getGreeting(name = 'User') {
  const hour = new Date().getHours();

  let timeOfDay;
  if (hour < 12)      timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else                timeOfDay = 'evening';

  return `Good ${timeOfDay}, ${name}.`;
}


/**
 * Animate a number counting up/down (for KPI stat cards).
 * Makes the dashboard feel alive when data updates.
 * 
 * @param {HTMLElement} element - the element to put the number in
 * @param {number} target - the final number to count to
 * @param {number} [duration=600] - animation duration in ms
 * @param {string} [prefix='EGP '] - prefix (e.g. "EGP " or "€")
 * @param {number} [decimals=2] - decimal places
 * 
 * USAGE:
 *   animateCounter(document.getElementById('net-worth'), 125430.50);
 */
function animateCounter(element, target, duration = 600, prefix = 'EGP ', decimals = 2) {
  // Get the starting value from whatever is currently displayed
  const startText = element.textContent.replace(/[^0-9.\-]/g, '');
  const start = parseFloat(startText) || 0;
  const diff = target - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out curve for a smooth deceleration
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = start + (diff * easeOut);

    // Format the number with commas
    element.textContent = prefix + currentValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    // Keep animating until we hit the target
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


/**
 * Get the semantic CSS class for a financial amount.
 * Use this to color amounts green (positive) or red (negative).
 * 
 * @param {number} amount
 * @returns {string} CSS class name
 * 
 * USAGE:
 *   element.classList.add(getAmountClass(-50));  // adds 'amount-negative'
 */
function getAmountClass(amount) {
  if (amount > 0) return 'amount-positive';
  if (amount < 0) return 'amount-negative';
  return '';
}


/**
 * Get the progress bar fill class based on budget usage percentage.
 * Under 70% = green, 70-90% = warning, over 90% = red.
 * 
 * @param {number} percentage - current usage as a percentage (0-100+)
 * @returns {string} CSS class name
 */
function getProgressClass(percentage) {
  if (percentage >= 90) return 'progress-bar__fill--danger';
  if (percentage >= 70) return 'progress-bar__fill--warning';
  return 'progress-bar__fill--ok';
}


/**
 * Simple debounce function — prevents a function from firing too often.
 * Great for search inputs, window resize handlers, etc.
 * 
 * @param {Function} func - function to debounce
 * @param {number} [wait=300] - delay in ms
 * @returns {Function} debounced function
 * 
 * USAGE:
 *   searchInput.addEventListener('input', debounce(handleSearch, 300));
 */
function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}


/**
 * Generate a unique ID. Useful for creating dynamic elements.
 * 
 * @param {string} [prefix='fm'] - optional prefix
 * @returns {string} something like "fm-a1b2c3d4"
 */
function generateId(prefix = 'fm') {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}
