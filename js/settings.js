/* ============================================================
   FINANCEME - Settings & Configuration Logic
   Shared behavior for all settings pages.
   ============================================================ */

const SETTINGS_SECTIONS = [
  {
    key: "settings",
    label: "Overview",
    caption: "Control center and security posture",
    href: "settings.html",
  },
  {
    key: "profile-settings",
    label: "Profile Settings",
    caption: "Identity, avatar, and contact details",
    href: "profile-settings.html",
  },
  {
    key: "security-settings",
    label: "Security Settings",
    caption: "2FA, sessions, and access controls",
    href: "security-settings.html",
  },
  {
    key: "notification-preferences",
    label: "Notification Preferences",
    caption: "Email, push, and in-app channels",
    href: "notification-preferences.html",
  },
  {
    key: "integrations",
    label: "Connected Integrations",
    caption: "Banks, payment rails, and services",
    href: "integrations.html",
  },
  {
    key: "categories-manager",
    label: "Categories Manager",
    caption: "Organize and normalize spending taxonomies",
    href: "categories-manager.html",
  },
  {
    key: "currency-locale",
    label: "Currency and Locale",
    caption: "Regional formatting and defaults",
    href: "currency-locale.html",
  },
  {
    key: "subscription-billing",
    label: "Subscription and Billing",
    caption: "Plan, invoices, and payment method",
    href: "subscription-billing.html",
  },
  {
    key: "data-export",
    label: "Data Export",
    caption: "Generate compliant account archives",
    href: "data-export.html",
  },
  {
    key: "delete-account",
    label: "Delete Account",
    caption: "Irreversible account closure controls",
    href: "delete-account.html",
  },
];

function getCurrentSettingsKey() {
  if (window.SETTINGS_PAGE) return window.SETTINGS_PAGE;

  const file = window.location.pathname.split("/").pop() || "settings.html";
  return file.replace(".html", "");
}

function isInsidePagesFolder() {
  return window.location.pathname.includes("/pages/");
}

function getSettingsHref(relativeHref) {
  return isInsidePagesFolder() ? relativeHref : `pages/${relativeHref}`;
}

function getSettingsLiveRegion() {
  const existing = document.getElementById("settings-live-region");
  if (existing) return existing;

  const region = document.createElement("div");
  region.id = "settings-live-region";
  region.className = "sr-only";
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  document.body.appendChild(region);
  return region;
}

function announceSettings(message) {
  if (!message) return;

  const region = getSettingsLiveRegion();
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 30);
}

function flashUpdated(element) {
  if (!element) return;
  element.classList.remove("recently-updated");
  element.offsetHeight;
  element.classList.add("recently-updated");

  window.setTimeout(() => {
    element.classList.remove("recently-updated");
  }, 700);
}

function renderSettingsSidebar() {
  const target = document.getElementById("settings-sidebar");
  if (!target) return;

  const activeKey = getCurrentSettingsKey();

  const linksMarkup = SETTINGS_SECTIONS.map((section) => {
    const isActive = section.key === activeKey;
    return `
      <a
        href="${getSettingsHref(section.href)}"
        class="settings-nav-link${isActive ? " active" : ""}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        <span class="title">${section.label}</span>
        <span class="caption">${section.caption}</span>
      </a>
    `;
  }).join("");

  target.innerHTML = `
    <div class="settings-sidebar-title">Settings Navigation</div>
    <p class="settings-sidebar-subtitle">
      Navigate configuration modules and keep your account posture aligned.
    </p>
    <nav class="settings-nav" aria-label="Settings section navigation">
      ${linksMarkup}
    </nav>
  `;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text;
}

function setHtml(id, html) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = html;
}

function setupProfileSettingsPage() {
  const form = document.getElementById("profile-form");
  if (!form) return;

  const fullNameInput = document.getElementById("profile-name");
  const avatar = document.getElementById("profile-avatar-preview");
  const status = document.getElementById("profile-save-status");

  function updateAvatarInitials() {
    if (!fullNameInput || !avatar) return;

    const parts = fullNameInput.value
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) {
      avatar.textContent = "U";
      return;
    }

    avatar.textContent = parts.map((part) => part[0].toUpperCase()).join("");
  }

  if (fullNameInput) {
    fullNameInput.addEventListener("input", updateAvatarInitials);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (status) {
      status.hidden = false;
      status.textContent = "Profile settings saved. Verification updates may take up to 60 seconds.";
      flashUpdated(status);
    }

    announceSettings("Profile settings saved.");
  });

  updateAvatarInitials();
}

function setupSecuritySettingsPage() {
  const sessionsList = document.getElementById("security-sessions-list");
  const revokeAllBtn = document.getElementById("revoke-all-sessions-btn");
  const securityForm = document.getElementById("security-controls-form");
  const status = document.getElementById("security-save-status");

  if (sessionsList) {
    sessionsList.addEventListener("click", (event) => {
      const button = event.target.closest(".session-revoke-btn");
      if (!button) return;

      const row = button.closest(".session-item");
      if (!row) return;

      const device = row.getAttribute("data-device") || "session";
      row.remove();
      announceSettings(`Revoked ${device}.`);
    });
  }

  if (revokeAllBtn && sessionsList) {
    revokeAllBtn.addEventListener("click", () => {
      const rows = Array.from(sessionsList.querySelectorAll(".session-item"));
      const removable = rows.filter((row) => row.getAttribute("data-current") !== "true");

      removable.forEach((row) => row.remove());
      announceSettings(`Revoked ${removable.length} active session${removable.length === 1 ? "" : "s"}.`);
    });
  }

  if (securityForm) {
    securityForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (status) {
        status.hidden = false;
        status.textContent = "Security controls updated. New policies apply to upcoming sign-ins.";
        flashUpdated(status);
      }

      announceSettings("Security settings updated.");
    });
  }
}

function setupNotificationPreferencesPage() {
  const master = document.getElementById("notif-master-toggle");
  const channelToggles = Array.from(document.querySelectorAll(".notif-channel-toggle"));
  const status = document.getElementById("notif-save-status");
  const form = document.getElementById("notification-preferences-form");
  const enabledCount = document.getElementById("notification-enabled-count");

  if (channelToggles.length === 0) return;

  function updateEnabledCount() {
    const count = channelToggles.filter((input) => input.checked).length;
    if (enabledCount) {
      enabledCount.textContent = `${count} channel${count === 1 ? "" : "s"} enabled`;
    }

    if (master) {
      const allChecked = channelToggles.every((input) => input.checked);
      const noneChecked = channelToggles.every((input) => !input.checked);
      master.checked = allChecked;
      master.indeterminate = !allChecked && !noneChecked;
    }
  }

  if (master) {
    master.addEventListener("change", () => {
      channelToggles.forEach((input) => {
        input.checked = master.checked;
      });
      updateEnabledCount();
      announceSettings(master.checked ? "All notification channels enabled." : "All notification channels disabled.");
    });
  }

  channelToggles.forEach((input) => {
    input.addEventListener("change", updateEnabledCount);
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (status) {
        status.hidden = false;
        status.textContent = "Notification preferences saved.";
        flashUpdated(status);
      }
      announceSettings("Notification preferences updated.");
    });
  }

  updateEnabledCount();
}

function setupIntegrationsPage() {
  const grid = document.getElementById("integration-grid");
  const status = document.getElementById("integration-update-status");

  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".integration-action");
    if (!button) return;

    const card = button.closest(".integration-card");
    if (!card) return;

    const title = card.querySelector(".integration-title")?.textContent?.trim() || "integration";
    const badge = card.querySelector(".status-pill");

    const connected = card.getAttribute("data-connected") === "true";
    const nextConnected = !connected;

    card.setAttribute("data-connected", String(nextConnected));

    if (badge) {
      badge.classList.remove("online", "offline");
      badge.classList.add(nextConnected ? "online" : "offline");
      badge.textContent = nextConnected ? "Connected" : "Disconnected";
    }

    button.textContent = nextConnected ? "Disconnect" : "Connect";
    button.classList.remove("btn-secondary", "btn-ghost");
    button.classList.add(nextConnected ? "btn-ghost" : "btn-secondary");

    if (status) {
      status.hidden = false;
      status.textContent = `${title} is now ${nextConnected ? "connected" : "disconnected"}.`;
      flashUpdated(status);
    }

    announceSettings(`${title} ${nextConnected ? "connected" : "disconnected"}.`);
  });
}

function buildCategoryRow(name, type, color) {
  const safeName = name.replace(/[<>]/g, "");
  const safeType = type.replace(/[<>]/g, "");
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#4c8ef5";

  return `
    <div class="category-item" data-category-name="${safeName}">
      <div class="category-left">
        <span class="category-dot" style="background:${safeColor};"></span>
        <div>
          <div class="category-name">${safeName}</div>
          <div class="category-meta">${safeType}</div>
        </div>
      </div>
      <div class="category-actions">
        <button type="button" class="btn btn-ghost btn-sm category-action category-rename">Rename</button>
        <button type="button" class="btn btn-ghost btn-sm category-action category-delete">Delete</button>
      </div>
    </div>
  `;
}

function setupCategoriesManagerPage() {
  const form = document.getElementById("category-form");
  const list = document.getElementById("category-list");
  const count = document.getElementById("category-count");
  const status = document.getElementById("category-status");

  if (!form || !list) return;

  function refreshCount() {
    const total = list.querySelectorAll(".category-item").length;
    if (count) {
      count.textContent = `${total} custom categor${total === 1 ? "y" : "ies"}`;
    }
  }

  list.addEventListener("click", (event) => {
    const row = event.target.closest(".category-item");
    if (!row) return;

    const nameNode = row.querySelector(".category-name");
    const categoryName = nameNode?.textContent?.trim() || "Category";

    if (event.target.closest(".category-delete")) {
      row.remove();
      refreshCount();
      announceSettings(`Deleted category ${categoryName}.`);
      return;
    }

    if (event.target.closest(".category-rename") && nameNode) {
      const next = window.prompt("Rename category", categoryName);
      if (!next) return;
      nameNode.textContent = next.trim() || categoryName;
      flashUpdated(row);
      announceSettings(`Renamed category to ${nameNode.textContent}.`);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = document.getElementById("category-name");
    const typeInput = document.getElementById("category-type");
    const colorInput = document.getElementById("category-color");

    if (!nameInput || !typeInput || !colorInput) return;

    const name = nameInput.value.trim();
    const type = typeInput.value;
    const color = colorInput.value;

    if (!name) {
      nameInput.focus();
      return;
    }

    list.insertAdjacentHTML("afterbegin", buildCategoryRow(name, type, color));
    const firstRow = list.querySelector(".category-item");
    flashUpdated(firstRow);

    if (status) {
      status.hidden = false;
      status.textContent = `Added category ${name}.`;
    }

    announceSettings(`Category ${name} added.`);
    form.reset();
    refreshCount();
  });

  refreshCount();
}

function setupCurrencyLocalePage() {
  const currency = document.getElementById("currency-select");
  const locale = document.getElementById("locale-select");
  const dateFormat = document.getElementById("date-format-select");
  const status = document.getElementById("locale-save-status");
  const form = document.getElementById("locale-form");

  if (!currency || !locale || !dateFormat) return;

  function updatePreview() {
    const localeCode = locale.value;
    const currencyCode = currency.value;

    const sampleValue = 48325.42;
    const sampleDate = new Date("2026-03-18T10:30:00");

    const currencyText = new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(sampleValue);

    const dateOptionMap = {
      compact: { month: "short", day: "2-digit", year: "numeric" },
      long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
      iso: { year: "numeric", month: "2-digit", day: "2-digit" },
    };

    const dateText = new Intl.DateTimeFormat(localeCode, dateOptionMap[dateFormat.value]).format(sampleDate);

    setText("preview-currency", currencyText);
    setText("preview-date", dateText);
  }

  [currency, locale, dateFormat].forEach((element) => {
    element.addEventListener("change", updatePreview);
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (status) {
        status.hidden = false;
        status.textContent = "Locale preferences saved.";
        flashUpdated(status);
      }
      announceSettings("Currency and locale settings saved.");
    });
  }

  updatePreview();
}

function setupSubscriptionBillingPage() {
  const buttons = Array.from(document.querySelectorAll(".billing-cycle-btn"));
  const status = document.getElementById("billing-status");
  const paymentBtn = document.getElementById("billing-update-payment-btn");

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const cycle = button.getAttribute("data-cycle") || "monthly";

        buttons.forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });

        const pricingNodes = document.querySelectorAll("[data-monthly-price]");
        pricingNodes.forEach((node) => {
          const monthly = Number(node.getAttribute("data-monthly-price") || "0");
          const annual = Number(node.getAttribute("data-annual-price") || "0");
          const value = cycle === "annual" ? annual : monthly;
          node.textContent = `$${value.toFixed(2)}`;
        });

        announceSettings(`Billing cycle set to ${cycle}.`);
      });
    });
  }

  if (paymentBtn) {
    paymentBtn.addEventListener("click", () => {
      if (status) {
        status.hidden = false;
        status.textContent = "Payment method updated. Card ending in 8451 is now default.";
        flashUpdated(status);
      }
      announceSettings("Payment method updated.");
    });
  }
}

function setupDataExportPage() {
  const form = document.getElementById("data-export-form");
  const status = document.getElementById("data-export-status");
  const summary = document.getElementById("data-export-summary");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedFormats = Array.from(form.querySelectorAll("input[name='export-format']:checked"))
      .map((input) => input.value)
      .join(", ");

    const selectedRange = form.querySelector("input[name='export-range']:checked")?.value || "all history";
    const encrypted = document.getElementById("export-encrypted")?.checked ? "encrypted" : "unencrypted";

    if (status) {
      status.hidden = false;
      status.textContent = `Export package created: ${selectedFormats || "no format selected"}.`;
      flashUpdated(status);
    }

    if (summary) {
      summary.hidden = false;
      summary.textContent = `Scope: ${selectedRange}. Security: ${encrypted}. Generated at ${new Date().toLocaleTimeString()}.`;
    }

    announceSettings("Data export package generated.");
  });
}

function setupDeleteAccountPage() {
  const phraseInput = document.getElementById("delete-confirm-input");
  const ackInput = document.getElementById("delete-ack-input");
  const submitBtn = document.getElementById("delete-account-btn");
  const status = document.getElementById("delete-status");

  if (!phraseInput || !ackInput || !submitBtn) return;

  function refreshState() {
    const hasPhrase = phraseInput.value.trim() === "DELETE";
    const isAcked = ackInput.checked;
    submitBtn.disabled = !(hasPhrase && isAcked);
  }

  phraseInput.addEventListener("input", refreshState);
  ackInput.addEventListener("change", refreshState);

  submitBtn.addEventListener("click", () => {
    if (submitBtn.disabled) return;

    if (status) {
      status.hidden = false;
      status.textContent = "Delete request submitted. A final verification email has been sent.";
      flashUpdated(status);
    }

    announceSettings("Delete account request submitted.");
  });

  refreshState();
}

function setupSettingsOverviewPage() {
  const quickLinkGrid = document.getElementById("settings-quick-links");
  if (!quickLinkGrid) return;

  const cardsMarkup = SETTINGS_SECTIONS.filter((section) => section.key !== "settings")
    .map((section) => {
      return `
        <a href="${getSettingsHref(section.href)}" class="settings-nav-link">
          <span class="title">${section.label}</span>
          <span class="caption">${section.caption}</span>
        </a>
      `;
    })
    .join("");

  quickLinkGrid.innerHTML = cardsMarkup;
}

function initSettingsPage() {
  renderSettingsSidebar();

  const key = getCurrentSettingsKey();

  if (key === "settings") setupSettingsOverviewPage();
  if (key === "profile-settings") setupProfileSettingsPage();
  if (key === "security-settings") setupSecuritySettingsPage();
  if (key === "notification-preferences") setupNotificationPreferencesPage();
  if (key === "integrations") setupIntegrationsPage();
  if (key === "categories-manager") setupCategoriesManagerPage();
  if (key === "currency-locale") setupCurrencyLocalePage();
  if (key === "subscription-billing") setupSubscriptionBillingPage();
  if (key === "data-export") setupDataExportPage();
  if (key === "delete-account") setupDeleteAccountPage();
}

document.addEventListener("DOMContentLoaded", initSettingsPage);
