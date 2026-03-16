/**
 * FinanceME – Landing Page Interactions
 * Handles Anime.js scroll reveals, navbar state, pricing toggle,
 * mobile menu, hero title animation, and section orchestrations.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ═══════════════════════════════════════════
     UTILITY: one-shot IntersectionObserver
     ═══════════════════════════════════════════ */
  function onReveal(selector, callback, options = {}) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { callback(el); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          callback(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options });
    obs.observe(el);
  }

  function onRevealAll(selector, callback, options = {}) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => callback(el));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          callback(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options });
    els.forEach(el => obs.observe(el));
  }


  /* ═══════════════════════════════════════════
     1. SPLIT-TEXT HERO TITLE
     ═══════════════════════════════════════════ */
  const heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    const wrapTextNodes = (node) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          const words = child.textContent.split(/(\s+)/);
          const fragment = document.createDocumentFragment();
          words.forEach(w => {
            if (/^\s+$/.test(w) || w === '') {
              fragment.appendChild(document.createTextNode(w));
            } else {
              const span = document.createElement('span');
              span.className = 'word';
              span.textContent = w;
              fragment.appendChild(span);
            }
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapTextNodes(child);
        }
      });
    };
    wrapTextNodes(heroTitle);
  }


  /* ═══════════════════════════════════════════
     2. HERO ENTRANCE TIMELINE (plays on load)
     ═══════════════════════════════════════════ */
  const heroTL = anime.timeline({
    easing: 'easeOutExpo',
    duration: 900,
  });

  // Badge drops in
  if (document.querySelector('.hero__badge')) {
    heroTL.add({
      targets: '.hero__badge',
      opacity: [0, 1],
      translateY: [-20, 0],
      scale: [0.85, 1],
      duration: 600,
    });
  }

  // Words stagger reveal
  if (document.querySelectorAll('.hero__title .word').length) {
    heroTL.add({
      targets: '.hero__title .word',
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 700,
      delay: anime.stagger(70),
      easing: 'easeOutCubic',
    }, '-=400');
  }

  // Subtitle fades up
  if (document.querySelector('.hero__subtitle')) {
    heroTL.add({
      targets: '.hero__subtitle',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
    }, '-=400');
  }

  // CTA buttons slide up
  if (document.querySelector('.hero__ctas')) {
    heroTL.add({
      targets: '.hero__ctas',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 700,
    }, '-=450');
  }

  // Trust line
  if (document.querySelector('.hero__trust')) {
    heroTL.add({
      targets: '.hero__trust',
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600,
    }, '-=400');
  }


  /* ═══════════════════════════════════════════
     3. HERO MOCKUP ENTRANCE
     ═══════════════════════════════════════════ */
  const mockup = document.querySelector('.hero__mockup');
  if (mockup) {
    const mockTL = anime.timeline({
      easing: 'easeOutExpo',
      duration: 800,
    });

    // Main mockup scales in
    mockTL.add({
      targets: '.hero__mockup',
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [40, 0],
      duration: 1000,
      delay: 400,
    });

    // Floating stat badges
    const mockStats = document.querySelectorAll('.mock-stat');
    if (mockStats.length) {
      mockTL.add({
        targets: '.mock-stat',
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.8, 1],
        duration: 600,
        delay: anime.stagger(120),
        easing: 'spring(1, 80, 10, 0)',
      }, '-=500');
    }

    // Transaction rows
    const mockTx = document.querySelectorAll('.mock-tx');
    if (mockTx.length) {
      mockTL.add({
        targets: '.mock-tx',
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 500,
        delay: anime.stagger(80),
      }, '-=300');
    }

    // SVG chart line draw
    const chartPath = document.querySelector('.mock-chart path:last-child');
    if (chartPath) {
      const length = chartPath.getTotalLength ? chartPath.getTotalLength() : 300;
      chartPath.style.strokeDasharray = length;
      chartPath.style.strokeDashoffset = length;
      mockTL.add({
        targets: chartPath,
        strokeDashoffset: [length, 0],
        duration: 1200,
        easing: 'easeInOutQuad',
      }, '-=600');
    }
  }


  /* ═══════════════════════════════════════════
     4. FEATURE CARDS – staggered grid
     ═══════════════════════════════════════════ */
  onReveal('.features', (section) => {
    // Section heading
    const heading = section.querySelector('.section-heading');
    if (heading) {
      anime({
        targets: heading.children,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        easing: 'easeOutCubic',
        delay: anime.stagger(100),
      });
    }
    // Cards
    anime({
      targets: section.querySelectorAll('.feature-card'),
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.95, 1],
      duration: 800,
      delay: anime.stagger(100, { start: 200 }),
      easing: 'spring(1, 80, 10, 0)',
    });
  });


  /* ═══════════════════════════════════════════
     5. STEPS SECTION – sequential
     ═══════════════════════════════════════════ */
  onReveal('.steps', (section) => {
    const heading = section.querySelector('.section-heading');
    if (heading) {
      anime({
        targets: heading.children,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        easing: 'easeOutCubic',
        delay: anime.stagger(100),
      });
    }

    const stepTL = anime.timeline({
      easing: 'easeOutExpo',
    });

    const cards = section.querySelectorAll('.step-card');
    cards.forEach((card, i) => {
      stepTL.add({
        targets: card,
        opacity: [0, 1],
        translateY: [40, 0],
        translateX: [i % 2 === 0 ? -20 : 20, 0],
        duration: 700,
      }, i === 0 ? '+=200' : '-=400');

      // Connector after each card (except last)
      const connector = card.nextElementSibling;
      if (connector && connector.classList.contains('step-connector')) {
        stepTL.add({
          targets: connector,
          opacity: [0, 1],
          scaleY: [0, 1],
          duration: 400,
          easing: 'easeOutCubic',
        }, '-=300');
      }
    });
  });


  /* ═══════════════════════════════════════════
     6. STATS – counter animation
     ═══════════════════════════════════════════ */
  onReveal('.stats-section', (section) => {
    // Animate bar items into view
    anime({
      targets: section.querySelectorAll('.stat-item'),
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 700,
      delay: anime.stagger(120),
      easing: 'easeOutCubic',
      begin: () => {
        section.querySelectorAll('.stat-item').forEach(el => el.classList.add('visible'));
      },
    });

    // Animate numbers using data-count-target and data-count-suffix
    section.querySelectorAll('.stat-item__number').forEach(numEl => {
      const target = parseFloat(numEl.getAttribute('data-count-target'));
      const suffix = numEl.getAttribute('data-count-suffix') || '';
      if (isNaN(target)) return;
      const isDecimal = target % 1 !== 0;
      const obj = { val: 0 };

      anime({
        targets: obj,
        val: target,
        duration: 1200,
        easing: 'easeOutExpo',
        delay: 200,
        update: () => {
          numEl.textContent = (isDecimal ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix;
        },
      });
    });
  });


  /* ═══════════════════════════════════════════
     7. PRICING CARDS – scale up
     ═══════════════════════════════════════════ */
  onReveal('.pricing', (section) => {
    const heading = section.querySelector('.section-heading');
    if (heading) {
      anime({
        targets: heading.children,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        easing: 'easeOutCubic',
        delay: anime.stagger(100),
      });
    }

    // Toggle
    const toggle = section.querySelector('.pricing-toggle');
    if (toggle) {
      anime({
        targets: toggle,
        opacity: [0, 1],
        duration: 500,
        delay: 200,
        easing: 'easeOutCubic',
      });
    }

    // Cards
    anime({
      targets: section.querySelectorAll('.pricing-card'),
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [40, 0],
      duration: 800,
      delay: anime.stagger(120, { start: 300 }),
      easing: 'spring(1, 80, 10, 0)',
    });
  });


  /* ═══════════════════════════════════════════
     8. TESTIMONIALS – slide from sides
     ═══════════════════════════════════════════ */
  onReveal('.testimonials', (section) => {
    const heading = section.querySelector('.section-heading');
    if (heading) {
      anime({
        targets: heading.children,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        easing: 'easeOutCubic',
        delay: anime.stagger(100),
      });
    }

    const cards = section.querySelectorAll('.testimonial-card');
    anime({
      targets: cards,
      opacity: [0, 1],
      translateX: (el, i) => [i % 2 === 0 ? -40 : 40, 0],
      duration: 800,
      delay: anime.stagger(120, { start: 200 }),
      easing: 'easeOutCubic',
    });
  });


  /* ═══════════════════════════════════════════
     9. FINAL CTA – spring entrance
     ═══════════════════════════════════════════ */
  onReveal('.cta-section', (section) => {
    const inner = section.querySelector('.cta-section__inner');
    if (!inner) return;

    const ctaTL = anime.timeline({
      easing: 'easeOutExpo',
    });

    ctaTL.add({
      targets: inner,
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 700,
    });

    // Children stagger
    const kids = inner.children;
    if (kids.length) {
      ctaTL.add({
        targets: Array.from(kids),
        opacity: [0, 1],
        translateY: [25, 0],
        duration: 600,
        delay: anime.stagger(90),
        easing: 'spring(1, 80, 10, 0)',
      }, '-=500');
    }
  });


  /* ═══════════════════════════════════════════
     10. FOOTER – staggered columns
     ═══════════════════════════════════════════ */
  onReveal('.landing-footer', (section) => {
    const cols = section.querySelectorAll('.landing-footer__col, .landing-footer__brand');
    if (cols.length) {
      anime({
        targets: cols,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        delay: anime.stagger(80),
        easing: 'easeOutCubic',
      });
    }
  });


  /* ═══════════════════════════════════════════
     11. GENERIC .reveal FALLBACK
     Catch any remaining .reveal elements not
     handled by section-specific animations
     ═══════════════════════════════════════════ */
  onRevealAll('.reveal', (el) => {
    if (el.classList.contains('visible')) return; // already animated
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 700,
      easing: 'easeOutCubic',
      complete: () => el.classList.add('visible'),
    });
  });


  /* ═══════════════════════════════════════════
     NAVBAR SCROLL STATE
     ═══════════════════════════════════════════ */
  const nav = document.querySelector('.landing-nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* ═══════════════════════════════════════════
     MOBILE HAMBURGER
     ═══════════════════════════════════════════ */
  const hamburger = document.querySelector('.landing-nav__hamburger');
  const mobileMenu = document.querySelector('.landing-nav__links');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.innerHTML = isOpen
        ? '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/></svg>'
        : '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></svg>';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></svg>';
      });
    });
  }


  /* ═══════════════════════════════════════════
     PRICING TOGGLE
     ═══════════════════════════════════════════ */
  const toggleSwitch = document.querySelector('.pricing-toggle__switch');
  if (toggleSwitch) {
    const monthlyLabel = document.querySelector('[data-toggle="monthly"]');
    const yearlyLabel  = document.querySelector('[data-toggle="yearly"]');
    const amountEls = document.querySelectorAll('.amount[data-price-monthly]');

    const setPricing = (isYearly) => {
      toggleSwitch.setAttribute('aria-pressed', isYearly);
      if (monthlyLabel) monthlyLabel.classList.toggle('active', !isYearly);
      if (yearlyLabel) yearlyLabel.classList.toggle('active', isYearly);

      amountEls.forEach(amount => {
        // Animate price change with Anime.js
        anime({
          targets: amount,
          opacity: [1, 0],
          translateY: [0, -8],
          duration: 200,
          easing: 'easeInQuad',
          complete: () => {
            amount.textContent = isYearly
              ? amount.getAttribute('data-price-yearly')
              : amount.getAttribute('data-price-monthly');
            anime({
              targets: amount,
              opacity: [0, 1],
              translateY: [8, 0],
              duration: 300,
              easing: 'easeOutCubic',
            });
          },
        });
      });
    };

    toggleSwitch.addEventListener('click', () => {
      const isCurrentlyYearly = toggleSwitch.getAttribute('aria-pressed') === 'true';
      setPricing(!isCurrentlyYearly);
    });

    if (monthlyLabel) monthlyLabel.addEventListener('click', () => setPricing(false));
    if (yearlyLabel)  yearlyLabel.addEventListener('click', () => setPricing(true));
  }


  /* ═══════════════════════════════════════════
     SMOOTH SCROLL FOR ANCHOR LINKS
     ═══════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
