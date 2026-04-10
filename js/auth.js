/* ============================================================
   FINANCEME - Authentication Interactions (auth.js)
   Shared interactions for all authentication pages.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAuthBackdropSymbols();
  initPasswordToggles();
  initOtpInputs();
  initChannelTabs();
  initResendTimer();
  initPasswordStrength();
  initDemoFormFlow();
});

function initAuthBackdropSymbols() {
  const stage = document.querySelector(".auth-stage");
  if (!stage) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) return;

  let layer = stage.querySelector(".auth-stage-floaters");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "auth-stage-floaters";
    layer.setAttribute("aria-hidden", "true");
    stage.insertBefore(layer, stage.firstChild);
  }

  const count = window.innerWidth < 768 ? 10 : 16;
  const symbols = [];

  for (let i = 0; i < count; i += 1) {
    const symbol = document.createElement("span");
    symbol.className = "auth-floater";
    symbol.textContent = "EGP";
    symbol.style.left = `${8 + Math.random() * 84}%`;
    symbol.style.top = `${6 + Math.random() * 86}%`;
    symbol.style.fontSize = `${10 + Math.random() * 7}px`;
    symbol.style.opacity = (0.08 + Math.random() * 0.18).toFixed(2);
    layer.appendChild(symbol);
    symbols.push(symbol);
  }

  loadAnimeJs()
    .then((anime) => {
      symbols.forEach((symbol, index) => {
        anime({
          targets: symbol,
          translateY: [
            anime.random(-16, 10),
            anime.random(-56, -22),
            anime.random(8, 24),
          ],
          translateX: [
            anime.random(-6, 6),
            anime.random(-16, 16),
            anime.random(-6, 6),
          ],
          rotate: [anime.random(-8, 8), anime.random(-18, 18)],
          opacity: [
            Number(symbol.style.opacity),
            Math.min(Number(symbol.style.opacity) + 0.14, 0.34),
            Number(symbol.style.opacity),
          ],
          easing: "easeInOutSine",
          duration: anime.random(3200, 5200),
          delay: index * 70,
          direction: "alternate",
          loop: true,
        });
      });
    })
    .catch(() => {
      // Keep static decorative symbols if the animation library fails to load.
    });
}

function loadAnimeJs() {
  if (window.anime) {
    return Promise.resolve(window.anime);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-animejs="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.anime));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js";
    script.async = true;
    script.dataset.animejs = "true";

    script.onload = () => {
      if (window.anime) {
        resolve(window.anime);
      } else {
        reject(new Error("anime.js did not initialize"));
      }
    };

    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initPasswordToggles() {
  const toggles = document.querySelectorAll("[data-toggle-password]");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-toggle-password");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", String(isPassword));
    });
  });
}

function initOtpInputs() {
  const inputs = document.querySelectorAll(".otp-input");
  if (!inputs.length) return;

  inputs.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const value = event.target.value.replace(/\D/g, "");
      event.target.value = value.slice(0, 1);

      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      const pasted = (event.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, inputs.length);

      if (!pasted) return;

      event.preventDefault();
      pasted.split("").forEach((char, charIndex) => {
        if (inputs[charIndex]) {
          inputs[charIndex].value = char;
        }
      });

      const focusTarget = inputs[Math.min(pasted.length, inputs.length - 1)];
      if (focusTarget) focusTarget.focus();
    });
  });
}

function initChannelTabs() {
  const tabs = document.querySelectorAll(".auth-channel-tab");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-channel");

      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });

      const panels = document.querySelectorAll(".auth-channel-panel");
      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === target);
      });
    });
  });
}

function initResendTimer() {
  const timerNode = document.querySelector("[data-resend-seconds]");
  const resendButton = document.querySelector("[data-resend-button]");
  if (!timerNode || !resendButton) return;

  const initial = Number(timerNode.getAttribute("data-resend-seconds")) || 30;
  let remaining = initial;

  resendButton.disabled = true;
  timerNode.textContent = String(remaining);

  const tick = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(tick);
      timerNode.textContent = "0";
      resendButton.disabled = false;
      resendButton.textContent = "Resend Code";
      return;
    }

    timerNode.textContent = String(remaining);
  }, 1000);
}

function initPasswordStrength() {
  const passwordInput = document.querySelector("[data-password-strength]");
  const fill = document.querySelector(".auth-strength__fill");
  const text = document.querySelector(".auth-strength__text");
  if (!passwordInput || !fill || !text) return;

  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value;
    const score = getStrengthScore(value);

    const widths = [0, 28, 52, 74, 100];
    const labels = [
      "Add a stronger password",
      "Weak password",
      "Fair password",
      "Good password",
      "Strong password",
    ];

    const colors = [
      "var(--negative)",
      "var(--negative)",
      "var(--warning)",
      "var(--accent-blue)",
      "var(--positive)",
    ];

    fill.style.width = `${widths[score]}%`;
    fill.style.background = colors[score];
    text.textContent = labels[score];
  });
}

function getStrengthScore(password) {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score += 1;

  return Math.max(1, Math.min(score, 4));
}

function initDemoFormFlow() {
  const forms = document.querySelectorAll("[data-auth-form]");
  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const statusId = form.getAttribute("data-status-target");
      const successMessage = form.getAttribute("data-success-message");
      const errorMessage = form.getAttribute("data-error-message");
      const statusNode = statusId ? document.getElementById(statusId) : null;

      if (!statusNode) return;

      const isValid = form.checkValidity();
      statusNode.className = "auth-status";

      if (!isValid) {
        statusNode.classList.add("error");
        statusNode.textContent =
          errorMessage || "Please review the form fields and try again.";
        return;
      }

      statusNode.classList.add("success");
      statusNode.textContent =
        successMessage || "Step complete. Continue with the next action.";

      const redirectUrl = form.getAttribute("data-redirect");
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      }
    });
  });
}
