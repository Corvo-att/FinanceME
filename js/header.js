/* ============================================================
   FINANCEME — Header Logic (header.js)
   
   Handles:
   - Loading the header component
   - Real-time clock that updates every second
   - Time-based greeting ("Good morning, James.")
   - Notification bell dropdown (placeholder)
   
   REQUIRES: utils.js must be loaded first!
   ============================================================ */


/**
 * Initialize the header / top bar.
 * Call this on every page — it loads the header HTML and starts the clock.
 * 
 * @param {string} [userName='User'] - the logged-in user's name
 */
function initHeader(userName) {

  // Figure out the correct path (same logic as sidebar)
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const headerPath = isInSubfolder ? '../components/header.html' : 'components/header.html';

  loadComponent(headerPath, 'header-container', function () {

    // --- 1. Set the greeting ---
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) {
      greetingEl.textContent = getGreeting(userName || window.USER_NAME || 'User');
    }

    // --- 2. Start the live clock ---
    updateDateTime();
    setInterval(updateDateTime, 1000); // update every second

    // --- 3. Set up notification dropdown ---
    setupNotifications();
  });
}


/**
 * Update the date/time display in the top bar.
 * Shows: "Friday, March 7, 2026 · 7:27 PM"
 */
function updateDateTime() {
  const dateEl = document.getElementById('current-date');
  if (!dateEl) return;

  const now = new Date();
  const dateStr = formatDate(now, 'full');
  const timeStr = formatDate(now, 'time');

  dateEl.textContent = `${dateStr} · ${timeStr}`;
}


/**
 * Set up the notification bell.
 * For now it's just a toggle — you'll wire this up to real data later.
 */
function setupNotifications() {
  const btn = document.getElementById('notification-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    // TODO: Replace with a real notification dropdown panel
    // For now, just log a message so you know it's wired up
    console.log('Notification bell clicked — wire up your dropdown here!');

    // Hide the red dot when clicked (user has "seen" notifications)
    const dot = document.getElementById('notification-dot');
    if (dot) {
      dot.style.display = 'none';
    }
  });
}


/**
 * Initialize the footer.
 * Loads the footer component and sets the current year.
 */
function initFooter() {
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const footerPath = isInSubfolder ? '../components/footer.html' : 'components/footer.html';

  loadComponent(footerPath, 'footer-container', function () {
    // Update the copyright year
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // Fix footer links if we're in a subfolder
    if (isInSubfolder) {
      const footerLinks = document.querySelectorAll('#footer a');
      footerLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href && href.startsWith('pages/')) {
          link.setAttribute('href', href.replace('pages/', ''));
        }
      });
    }
  });
}


// ---- Auto-initialize when the DOM is ready ----
// Pages can set the user's name: window.USER_NAME = 'James';
document.addEventListener('DOMContentLoaded', function () {
  initHeader(window.USER_NAME || null);
  initFooter();
});
