/* ============================================================
   FINANCEME — Sidebar Logic (sidebar.js)
   
   Handles:
   - Loading the sidebar component
   - Highlighting the active page link
   - Collapse/expand toggle
   - Mobile sidebar open/close
   
   REQUIRES: utils.js must be loaded first!
   ============================================================ */


/**
 * Initialize the sidebar.
 * Call this on every page — it loads the sidebar HTML and sets up behaviors.
 * 
 * @param {string} [activePage] - the data-page value to highlight (e.g. 'dashboard')
 *                                if not provided, it auto-detects from the URL
 */
function initSidebar(activePage) {

  // Figure out the correct path to the sidebar component.
  // If we're on index.html (root), it's 'components/sidebar.html'
  // If we're in 'pages/', it's '../components/sidebar.html'
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const sidebarPath = isInSubfolder ? '../components/sidebar.html' : 'components/sidebar.html';

  loadComponent(sidebarPath, 'sidebar-container', function () {

    // --- 1. Highlight the active page ---
    highlightActivePage(activePage);

    // --- 2. Set up collapse toggle ---
    setupSidebarToggle();

    // --- 3. Set up mobile sidebar ---
    setupMobileSidebar();

    // --- 4. Fix nav link paths if we're in a subfolder ---
    if (isInSubfolder) {
      fixNavPaths();
    }

    // --- 5. Restore collapsed state from localStorage ---
    restoreSidebarState();
  });
}


/**
 * Highlight the currently active nav link.
 * Matches against the data-page attribute on each link.
 */
function highlightActivePage(activePage) {
  // If no activePage was passed, try to figure it out from the URL
  if (!activePage) {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '') || 'index';
    activePage = filename;
  }

  // Find all sidebar links and remove 'active' class
  const links = document.querySelectorAll('.sidebar__link');
  links.forEach(link => {
    link.classList.remove('active');

    // Mark the matching one as active
    if (link.getAttribute('data-page') === activePage) {
      link.classList.add('active');
    }
  });
}


/**
 * Set up the collapse/expand toggle button.
 * Saves state to localStorage so it persists across pages.
 */
function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (!sidebar || !toggleBtn) return;

  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');

    // Rotate the chevron icon when collapsed
    const icon = toggleBtn.querySelector('svg');
    if (sidebar.classList.contains('collapsed')) {
      icon.style.transform = 'rotate(180deg)';
    } else {
      icon.style.transform = 'rotate(0deg)';
    }

    // Remember the state
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });
}


/**
 * Restore sidebar collapsed state from localStorage.
 * So if a user collapses it, it stays collapsed when they navigate.
 */
function restoreSidebarState() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (!sidebar || !toggleBtn) return;

  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    const icon = toggleBtn.querySelector('svg');
    if (icon) icon.style.transform = 'rotate(180deg)';
  }
}


/**
 * Set up mobile sidebar behavior.
 * On mobile, the sidebar slides in as an overlay.
 */
function setupMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  // Open sidebar when hamburger menu is clicked
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
      sidebar.classList.add('mobile-open');
    });
  }

  // Close sidebar when overlay is clicked
  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('mobile-open');
    });
  }

  // Close sidebar when a nav link is clicked (on mobile, navigate away)
  const links = document.querySelectorAll('.sidebar__link');
  links.forEach(link => {
    link.addEventListener('click', function () {
      // Only auto-close on mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });
}


/**
 * Fix navigation link paths when in a subfolder.
 * If we're in /pages/, links to 'pages/accounts.html' need to be 'accounts.html'
 * and 'index.html' needs to be '../index.html'.
 */
function fixNavPaths() {
  const links = document.querySelectorAll('.sidebar__link');

  links.forEach(link => {
    let href = link.getAttribute('href');
    if (!href) return;

    if (href.startsWith('pages/')) {
      // We're already in pages/, so just use the filename
      link.setAttribute('href', href.replace('pages/', ''));
    } else if (href === 'index.html') {
      // Go up one level to get back to root
      link.setAttribute('href', '../index.html');
    }
  });

  // Also fix the user settings links
  const settingsLinks = document.querySelectorAll('.sidebar__user a');
  settingsLinks.forEach(link => {
    let href = link.getAttribute('href');
    if (href && href.startsWith('pages/')) {
      link.setAttribute('href', href.replace('pages/', ''));
    }
  });
}


// ---- Auto-initialize when the DOM is ready ----
// Pages can override the active page by setting: window.ACTIVE_PAGE = 'dashboard';
document.addEventListener('DOMContentLoaded', function () {
  initSidebar(window.ACTIVE_PAGE || null);
});
