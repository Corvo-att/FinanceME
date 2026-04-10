/**
 * FinanceME - Notifications & Alert Rules logic
 */

function getLiveRegion() {
  const existing = document.getElementById("interaction-live-region");
  if (existing) return existing;

  const fallback = document.createElement("div");
  fallback.id = "interaction-live-region";
  fallback.className = "sr-only";
  fallback.setAttribute("role", "status");
  fallback.setAttribute("aria-live", "polite");
  fallback.setAttribute("aria-atomic", "true");
  document.body.appendChild(fallback);

  return fallback;
}

function announce(message) {
  if (!message) return;

  const region = getLiveRegion();
  region.textContent = "";

  window.setTimeout(() => {
    region.textContent = message;
  }, 30);
}

function setPressedButtonState(buttons, activeBtn) {
  buttons.forEach((btn) => {
    const isActive = btn === activeBtn;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function flashUpdated(element) {
  if (!element) return;

  element.classList.remove("is-updated");
  // Force reflow so repeated updates retrigger the animation.
  element.offsetHeight;
  element.classList.add("is-updated");

  window.setTimeout(() => {
    element.classList.remove("is-updated");
  }, 700);
}

function initNotificationsPage() {
  const alertsList = document.getElementById("alerts-list");
  if (!alertsList) return;

  const emptyState = document.getElementById("alerts-empty-state");
  const visibleCount = document.getElementById("alerts-visible-count");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  const typeButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const statusButtons = Array.from(document.querySelectorAll("[data-status]"));
  const getCards = () => Array.from(document.querySelectorAll(".alert-card"));

  let currentType = "all";
  let currentStatus = "all";

  function getAlertTitle(card) {
    return card.querySelector(".alert-title-row h3")?.textContent?.trim() || "Alert";
  }

  function syncAlertButtonLabels(card) {
    const title = getAlertTitle(card);
    const markBtn = card.querySelector(".mark-read-btn");
    const dismissBtn = card.querySelector(".dismiss-alert-btn");
    const isUnread = card.getAttribute("data-status") === "unread";

    if (markBtn) {
      markBtn.textContent = isUnread ? "Mark read" : "Mark unread";
      markBtn.setAttribute(
        "aria-label",
        `${isUnread ? "Mark alert as read" : "Mark alert as unread"}: ${title}`
      );
    }

    if (dismissBtn) {
      dismissBtn.setAttribute("aria-label", `Dismiss alert: ${title}`);
    }
  }

  function updateCardVisibility() {
    let visible = 0;

    getCards().forEach((card) => {
      const type = card.getAttribute("data-type");
      const status = card.getAttribute("data-status");

      const typeMatch = currentType === "all" || currentType === type;
      const statusMatch = currentStatus === "all" || currentStatus === status;

      const shouldShow = typeMatch && statusMatch;
      card.hidden = !shouldShow;

      if (shouldShow) visible += 1;
    });

    if (visibleCount) {
      visibleCount.textContent = `${visible} visible`;
    }

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }

    return visible;
  }

  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.getAttribute("data-filter") || "all";
      setPressedButtonState(typeButtons, btn);
      const visible = updateCardVisibility();
      announce(`${btn.textContent.trim()} alert filter applied. ${visible} alerts shown.`);
    });
  });

  statusButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentStatus = btn.getAttribute("data-status") || "all";
      setPressedButtonState(statusButtons, btn);
      const visible = updateCardVisibility();
      announce(`${btn.textContent.trim()} status filter applied. ${visible} alerts shown.`);
    });
  });

  alertsList.addEventListener("click", (event) => {
    const card = event.target.closest(".alert-card");
    if (!card) return;

    if (event.target.closest(".dismiss-alert-btn")) {
      const title = getAlertTitle(card);
      card.remove();
      updateCardVisibility();
      announce(`Dismissed alert: ${title}.`);
      return;
    }

    const markBtn = event.target.closest(".mark-read-btn");
    if (!markBtn) return;

    const title = getAlertTitle(card);
    const isUnread = card.getAttribute("data-status") === "unread";
    if (isUnread) {
      card.setAttribute("data-status", "read");
      card.classList.remove("unread");
    } else {
      card.setAttribute("data-status", "unread");
      card.classList.add("unread");
    }

    syncAlertButtonLabels(card);
    flashUpdated(card);
    announce(`${isUnread ? "Marked as read" : "Marked as unread"}: ${title}.`);

    updateCardVisibility();
  });

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      let updatedCount = 0;

      getCards().forEach((card) => {
        if (card.getAttribute("data-status") === "unread") {
          card.setAttribute("data-status", "read");
          card.classList.remove("unread");
          syncAlertButtonLabels(card);
          flashUpdated(card);
          updatedCount += 1;
        }
      });

      updateCardVisibility();

      if (updatedCount === 0) {
        announce("No unread alerts to mark as read.");
      } else {
        announce(`Marked ${updatedCount} alert${updatedCount === 1 ? "" : "s"} as read.`);
      }
    });
  }

  getCards().forEach((card) => syncAlertButtonLabels(card));
  updateCardVisibility();
}

function priorityBadgeClass(priority) {
  if (priority === "critical") return "badge-negative";
  if (priority === "warning") return "badge-warning";
  return "badge-positive";
}

function formatScopeLabel(scope, threshold, type) {
  const scopeMap = {
    "all-accounts": "All accounts",
    chequing: "Chequing",
    "credit-card": "Credit card",
    groceries: "Groceries",
    dining: "Dining",
  };

  const scopeLabel = scopeMap[scope] || scope;

  if (type === "subscription-inactivity") {
    return `Inactivity above ${threshold} days`;
  }

  return `${scopeLabel} above EGP ${threshold}`;
}

function applyRowHandlers(row, formElements) {
  const editBtn = row.querySelector(".edit-rule-btn");
  const toggleBtn = row.querySelector(".toggle-rule-btn");
  const deleteBtn = row.querySelector(".delete-rule-btn");
  const statusBadge = row.querySelector(".rule-status-badge");
  const ruleName = row.dataset.ruleName || "Rule";

  if (editBtn) editBtn.setAttribute("aria-label", `Edit rule: ${ruleName}`);
  if (toggleBtn) toggleBtn.setAttribute("aria-label", `Toggle status for rule: ${ruleName}`);
  if (deleteBtn) deleteBtn.setAttribute("aria-label", `Delete rule: ${ruleName}`);

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      formElements.name.value = row.dataset.ruleName || "";
      formElements.type.value = row.dataset.ruleType || "";
      formElements.scope.value = row.dataset.ruleScope || "";
      formElements.threshold.value = row.dataset.ruleThreshold || "";
      formElements.priority.value = row.dataset.rulePriority || "warning";

      const channels = (row.dataset.ruleChannels || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      formElements.channels.forEach((checkbox) => {
        checkbox.checked = channels.includes(checkbox.value);
      });

      formElements.enabled.checked = row.dataset.ruleEnabled === "true";
      formElements.name.focus();
      formElements.name.classList.remove("form-input-error");
      formElements.name.setAttribute("aria-invalid", "false");
      if (formElements.nameError) formElements.nameError.hidden = true;

      announce(`Loaded rule for editing: ${ruleName}.`);
      flashUpdated(row);
    });
  }

  if (toggleBtn && statusBadge) {
    toggleBtn.addEventListener("click", () => {
      const currentlyEnabled = row.dataset.ruleEnabled === "true";
      const nextEnabled = !currentlyEnabled;

      row.dataset.ruleEnabled = String(nextEnabled);
      statusBadge.textContent = nextEnabled ? "Enabled" : "Disabled";
      statusBadge.classList.remove("badge-positive", "badge-neutral");
      statusBadge.classList.add(nextEnabled ? "badge-positive" : "badge-neutral");

      toggleBtn.textContent = nextEnabled ? "Disable" : "Enable";
      announce(`Rule ${ruleName} ${nextEnabled ? "enabled" : "disabled"}.`);
      flashUpdated(row);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      row.remove();
      announce(`Deleted rule: ${ruleName}.`);
    });
  }
}

function initManageRulesPage() {
  const form = document.getElementById("alert-rule-form");
  const tableBody = document.getElementById("rules-tbody");
  if (!form || !tableBody) return;

  const formElements = {
    name: document.getElementById("rule-name"),
    type: document.getElementById("rule-type"),
    scope: document.getElementById("rule-scope"),
    threshold: document.getElementById("rule-threshold"),
    priority: document.getElementById("rule-priority"),
    channels: Array.from(document.querySelectorAll("input[name='rule-channel']")),
    enabled: document.getElementById("rule-enabled"),
    nameError: document.getElementById("rule-name-error"),
  };

  Array.from(tableBody.querySelectorAll("tr")).forEach((row) => {
    applyRowHandlers(row, formElements);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = formElements.name.value.trim();
    if (!name) {
      if (formElements.nameError) formElements.nameError.hidden = false;
      formElements.name.classList.add("form-input-error");
      formElements.name.setAttribute("aria-invalid", "true");
      formElements.name.focus();
      return;
    }

    if (formElements.nameError) formElements.nameError.hidden = true;
    formElements.name.classList.remove("form-input-error");
    formElements.name.setAttribute("aria-invalid", "false");

    const selectedChannels = formElements.channels
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const safeChannels = selectedChannels.length ? selectedChannels : ["In-app"];

    const type = formElements.type.value;
    const scope = formElements.scope.value;
    const threshold = formElements.threshold.value;
    const priority = formElements.priority.value;
    const enabled = formElements.enabled.checked;

    const row = document.createElement("tr");

    row.dataset.ruleName = name;
    row.dataset.ruleType = type;
    row.dataset.ruleScope = scope;
    row.dataset.ruleThreshold = threshold;
    row.dataset.rulePriority = priority;
    row.dataset.ruleChannels = safeChannels.join(",");
    row.dataset.ruleEnabled = String(enabled);

    row.innerHTML = `
      <td>${name}</td>
      <td>${formatScopeLabel(scope, threshold, type)}</td>
      <td>${safeChannels.join(", ")}</td>
      <td><span class="badge ${priorityBadgeClass(priority)}">${priority}</span></td>
      <td><span class="badge ${enabled ? "badge-positive" : "badge-neutral"} rule-status-badge">${enabled ? "Enabled" : "Disabled"}</span></td>
      <td class="rule-actions-cell">
        <button type="button" class="btn btn-ghost btn-sm edit-rule-btn">Edit</button>
        <button type="button" class="btn btn-ghost btn-sm toggle-rule-btn">${enabled ? "Disable" : "Enable"}</button>
        <button type="button" class="btn btn-ghost btn-sm delete-rule-btn">Delete</button>
      </td>
    `;

    tableBody.prepend(row);
    applyRowHandlers(row, formElements);
    flashUpdated(row);
    announce(`Rule saved: ${name}.`);

    form.reset();
    formElements.priority.value = "warning";
    formElements.enabled.checked = true;
    formElements.channels.forEach((checkbox) => {
      checkbox.checked = checkbox.value === "In-app" || checkbox.value === "Email";
    });
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      formElements.name.classList.remove("form-input-error");
      formElements.name.setAttribute("aria-invalid", "false");
      if (formElements.nameError) formElements.nameError.hidden = true;
    }, 0);
  });
}

function initSubscriptionsPage() {
  const list = document.getElementById("subscriptions-list");
  if (!list) return;

  const filterButtons = Array.from(
    document.querySelectorAll("[data-sub-filter]")
  );
  const visibleCount = document.getElementById("sub-visible-count");
  const emptyState = document.getElementById("subscriptions-empty-state");
  const totalCountEl = document.getElementById("sub-total-count");
  const monthlyTotalEl = document.getElementById("sub-monthly-total");
  const unusedCountEl = document.getElementById("sub-unused-count");

  const getCards = () => Array.from(list.querySelectorAll(".subscription-card"));
  let currentFilter = "all";

  function getSubscriptionName(card) {
    return card.querySelector(".subscription-main h3")?.textContent?.trim() || "Subscription";
  }

  function syncSubscriptionActionLabels(card) {
    const name = getSubscriptionName(card);
    const keepBtn = card.querySelector(".keep-sub-btn");
    const cancelBtn = card.querySelector(".cancel-sub-btn");
    const status = card.getAttribute("data-sub-status");

    if (keepBtn) {
      keepBtn.setAttribute(
        "aria-label",
        status === "cancelled"
          ? `Reactivate subscription: ${name}`
          : `Keep subscription active: ${name}`
      );
    }

    if (cancelBtn) {
      cancelBtn.setAttribute("aria-label", `Cancel subscription: ${name}`);
    }
  }

  function isVisibleByFilter(card) {
    const status = card.getAttribute("data-sub-status");
    const monthly = Number(card.getAttribute("data-monthly") || 0);

    if (currentFilter === "all") return true;
    if (currentFilter === "high-cost") return monthly >= 20;
    return status === currentFilter;
  }

  function updateSummary() {
    const cards = getCards();
    const activeOrUnused = cards.filter((card) => {
      const status = card.getAttribute("data-sub-status");
      return status === "active" || status === "unused";
    });

    const monthlyTotal = activeOrUnused.reduce(
      (sum, card) => sum + Number(card.getAttribute("data-monthly") || 0),
      0
    );

    const unusedCount = cards.filter(
      (card) => card.getAttribute("data-sub-status") === "unused"
    ).length;

    if (totalCountEl) totalCountEl.textContent = String(cards.length);
    if (unusedCountEl) unusedCountEl.textContent = String(unusedCount);
    if (monthlyTotalEl) {
      monthlyTotalEl.textContent = `$${monthlyTotal.toFixed(2)}`;
    }
  }

  function updateListVisibility() {
    let visible = 0;

    getCards().forEach((card) => {
      const show = isVisibleByFilter(card);
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (visibleCount) visibleCount.textContent = `${visible} visible`;
    if (emptyState) emptyState.hidden = visible !== 0;

    return visible;
  }

  function setStatus(card, nextStatus) {
    card.setAttribute("data-sub-status", nextStatus);

    const statusBadge = card.querySelector(".sub-status-badge");
    if (statusBadge) {
      statusBadge.classList.remove(
        "badge-positive",
        "badge-warning",
        "badge-neutral"
      );

      if (nextStatus === "active") {
        statusBadge.classList.add("badge-positive");
        statusBadge.textContent = "Active";
      } else if (nextStatus === "unused") {
        statusBadge.classList.add("badge-warning");
        statusBadge.textContent = "Unused";
      } else {
        statusBadge.classList.add("badge-neutral");
        statusBadge.textContent = "Cancelled";
      }
    }

    const keepBtn = card.querySelector(".keep-sub-btn");
    const cancelBtn = card.querySelector(".cancel-sub-btn");

    if (nextStatus === "cancelled") {
      if (keepBtn) keepBtn.textContent = "Reactivate";
      if (cancelBtn) {
        cancelBtn.textContent = "Cancelled";
        cancelBtn.disabled = true;
      }
    } else {
      if (keepBtn) keepBtn.textContent = "Keep";
      if (cancelBtn) {
        cancelBtn.textContent = "Cancel";
        cancelBtn.disabled = false;
      }
    }

    syncSubscriptionActionLabels(card);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.getAttribute("data-sub-filter") || "all";
      setPressedButtonState(filterButtons, button);
      const visible = updateListVisibility();
      announce(
        `${button.textContent.trim()} filter applied. ${visible} subscription${visible === 1 ? "" : "s"} shown.`
      );
    });
  });

  list.addEventListener("click", (event) => {
    const card = event.target.closest(".subscription-card");
    if (!card) return;

    const name = getSubscriptionName(card);
    const previousStatus = card.getAttribute("data-sub-status");

    if (event.target.closest(".keep-sub-btn")) {
      setStatus(card, "active");
      updateSummary();
      updateListVisibility();

      flashUpdated(card);
      if (previousStatus === "cancelled") {
        announce(`Reactivated subscription: ${name}.`);
      } else if (previousStatus === "unused") {
        announce(`Marked as active: ${name}.`);
      } else {
        announce(`${name} is already active.`);
      }
      return;
    }

    if (event.target.closest(".cancel-sub-btn")) {
      if (event.target.disabled) return;
      setStatus(card, "cancelled");
      updateSummary();
      updateListVisibility();
      flashUpdated(card);
      announce(`Cancelled subscription: ${name}.`);
    }
  });

  getCards().forEach((card) => syncSubscriptionActionLabels(card));
  updateSummary();
  updateListVisibility();
}

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("notifications.html")) {
    initNotificationsPage();
  }

  if (path.includes("manage-alert-rules.html")) {
    initManageRulesPage();
  }

  if (path.includes("subscriptions.html")) {
    initSubscriptionsPage();
  }
});
