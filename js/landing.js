/* ============================================================
   FINANCEME — Landing Page JavaScript (landing.js)
   Handles scroll animations, parallax effects, navbar behavior,
   counter animations, scroll progress bar, and mobile menu.
   ============================================================ */

(function () {
  'use strict';

  // ---- Check if user prefers reduced motion ----
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ---- Scroll Progress Bar ----
  // Creates a thin gradient bar at the top showing scroll position
  var progressBar = document.createElement('div');
  progressBar.classList.add('scroll-progress');
  document.body.appendChild(progressBar);

  function updateScrollProgress() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent + '%';
  }


  // ---- Navbar scroll effect ----
  // Make the navbar opaque + add shadow when scrolled past 60px
  var nav = document.querySelector('.landing-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      updateScrollProgress();
    }, { passive: true });
  }


  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        // Close mobile menu if open
        var mobileMenu = document.querySelector('.landing-nav__links');
        if (mobileMenu) mobileMenu.classList.remove('open');

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  // ---- Mobile hamburger menu toggle ----
  var hamburger = document.getElementById('nav-hamburger');
  var navLinks = document.querySelector('.landing-nav__links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      // Toggle icon between hamburger and X
      var isOpen = navLinks.classList.contains('open');
      hamburger.innerHTML = isOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });
  }


  // ---- Auto-assign animation variants to specific sections ----
  // This adds variety without touching the HTML — elements get different
  // scroll animation styles based on their context and position
  function assignAnimationVariants() {
    // Feature cards alternate slide-left / slide-right by row
    var featureCards = document.querySelectorAll('.feature-card.reveal');
    featureCards.forEach(function (card, i) {
      // First row: left, middle: scale, right: right (then repeat)
      var pattern = i % 3;
      if (pattern === 0)      card.classList.add('reveal--left');
      else if (pattern === 1) card.classList.add('reveal--scale');
      else                    card.classList.add('reveal--right');
    });

    // Step cards use blur entrance for a premium feel
    var stepCards = document.querySelectorAll('.step-card.reveal');
    stepCards.forEach(function (card) {
      card.classList.add('reveal--blur');
    });

    // Pricing cards use scale variant
    var pricingCards = document.querySelectorAll('.pricing-card.reveal');
    pricingCards.forEach(function (card) {
      card.classList.add('reveal--scale');
    });

    // Testimonial cards slide from alternating sides
    var testimonialCards = document.querySelectorAll('.testimonial-card.reveal');
    testimonialCards.forEach(function (card, i) {
      card.classList.add(i % 2 === 0 ? 'reveal--left' : 'reveal--right');
    });

    // CTA section uses blur variant
    var ctaInner = document.querySelector('.cta-section__inner.reveal');
    if (ctaInner) ctaInner.classList.add('reveal--blur');

    // Stat items use a slight rotate entrance
    var statItems = document.querySelectorAll('.stat-item.reveal');
    statItems.forEach(function (item) {
      item.classList.add('reveal--rotate');
    });

    // Section titles use blur
    var sectionTitles = document.querySelectorAll('.section-title.reveal');
    sectionTitles.forEach(function (title) {
      title.classList.add('reveal--blur');
    });
  }


  // ---- Intersection Observer for reveal-on-scroll ----
  // Elements with class "reveal" will animate in when they enter the viewport
  var revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    // Assign animation variants before observing
    assignAnimationVariants();

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // only animate once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: just show everything if IntersectionObserver isn't supported
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }


  // ---- Parallax on scroll ----
  // Elements with the "parallax" class or specific sections will
  // move at a different rate than the scroll for a depth effect
  function setupParallax() {
    if (prefersReducedMotion) return; // respect accessibility

    // Add parallax class to the hero mockup & hero gradient
    var heroVisual = document.querySelector('.hero__visual');
    if (heroVisual) heroVisual.classList.add('parallax');

    var trustedStrip = document.querySelector('.trusted-strip');
    if (trustedStrip) trustedStrip.classList.add('parallax');

    var parallaxElements = document.querySelectorAll('.parallax');
    if (parallaxElements.length === 0) return;

    // Speed multiplier — higher = more parallax movement
    var speeds = {
      'hero__visual': 0.12,
      'trusted-strip': 0.05
    };

    function onScroll() {
      var scrollTop = window.pageYOffset;

      parallaxElements.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var elementCenter = rect.top + rect.height / 2;
        var windowCenter = window.innerHeight / 2;
        var distFromCenter = elementCenter - windowCenter;

        // Determine speed from className or use default
        var speed = 0.08;
        for (var key in speeds) {
          if (el.classList.contains(key)) {
            speed = speeds[key];
            break;
          }
        }

        var yOffset = distFromCenter * speed;
        el.style.transform = 'translateY(' + yOffset + 'px)';
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
  }
  setupParallax();


  // ---- Animated number counters ----
  // Counts up from 0 to the target value when the element enters viewport
  function animateCount(element, target, suffix, duration) {
    suffix = suffix || '';
    duration = duration || 1500;
    var start = 0;
    var startTime = null;

    // Determine if we should use decimals
    var hasDecimal = target % 1 !== 0;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease-out quad
      progress = 1 - (1 - progress) * (1 - progress);

      var current = Math.floor(progress * target);
      if (hasDecimal) {
        current = (progress * target).toFixed(1);
      }

      // Format with commas for thousands
      var formatted = Number(current).toLocaleString('en-US');
      element.textContent = formatted + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Observe stat counters
  var statNumbers = document.querySelectorAll('[data-count-target]');
  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseFloat(el.getAttribute('data-count-target'));
          var suffix = el.getAttribute('data-count-suffix') || '';
          animateCount(el, target, suffix, 2000);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statNumbers.forEach(function (el) {
      countObserver.observe(el);
    });
  }


  // ---- Tilt effect on hero mockup (mouse-driven) ----
  // Adds a subtle 3D tilt when hovering the dashboard preview
  var heroMockup = document.querySelector('.hero__mockup');
  if (heroMockup && !prefersReducedMotion) {
    var heroVisualEl = document.querySelector('.hero__visual');

    heroVisualEl.addEventListener('mousemove', function (e) {
      var rect = heroVisualEl.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      heroMockup.style.transform =
        'rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 6) + 'deg)';
    });

    heroVisualEl.addEventListener('mouseleave', function () {
      heroMockup.style.transform = 'rotateY(-4deg) rotateX(2deg)';
    });
  }

})();
