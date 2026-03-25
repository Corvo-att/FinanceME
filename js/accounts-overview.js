/* ============================================================
   FINANCEME - Accounts Overview (accounts-overview.js)
   Interaction layer for modal flow, tab filtering, KPI updates,
   and lightweight in-page account creation.
   ============================================================ */

(function () {
  "use strict";

  const STATE = {
    activeFilter: "all",
  };

  function initAccountsOverview() {
    setupModalControls();
    setupAccountTabs();
    setupLinkFormSubmission();
    refreshKpis(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccountsOverview);
  } else {
    initAccountsOverview();
  }

  function setupModalControls() {
    const toggleBtn = document.getElementById("payment-toggle-btn");
    const modal = document.getElementById("paymentprompt");
    const backdrop = document.getElementById("link-account-backdrop");
    const closeBtn = document.getElementById("payment-close-btn");
    const cancelBtn = document.getElementById("payment-cancel-btn");

    if (!modal || !backdrop) return;

    function openModal() {
      modal.style.display = "block";
      backdrop.style.display = "block";
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.style.display = "none";
      backdrop.style.display = "none";
      document.body.style.overflow = "";
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function (event) {
        event.preventDefault();
        openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeModal);
    }

    backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.style.display === "block") {
        closeModal();
      }
    });

    // Expose modal close for form submission flow.
    window.closeAccountsLinkModal = closeModal;
  }

  function setupAccountTabs() {
    const tabInputs = document.querySelectorAll('input[name="dashboard-account-tabs"]');
    if (!tabInputs.length) return;

    tabInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        const nextFilter = normalizeFilterFromId(input.id);
        STATE.activeFilter = nextFilter;
        applyAccountFilter(nextFilter);
        refreshKpis(false);
      });
    });

    applyAccountFilter("all");
  }

  function normalizeFilterFromId(tabId) {
    if (!tabId || tabId.indexOf("tab-") !== 0) return "all";

    if (tabId === "tab-all-accounts") return "all";
    if (tabId === "tab-bank-accounts") return "bank";
    if (tabId === "tab-credit-accounts") return "credit";
    if (tabId === "tab-investment-accounts") return "investment";
    if (tabId === "tab-crypto-accounts") return "crypto";
    if (tabId === "tab-cash-accounts") return "cash";

    return "all";
  }

  function applyAccountFilter(filterValue) {
    const body = document.querySelector(".accounts-table tbody");
    if (!body) return;

    const rows = Array.from(body.querySelectorAll("tr.account-details"));
    let visibleCount = 0;

    rows.forEach(function (row) {
      const type = inferRowType(row);
      const shouldShow = filterValue === "all" || type === filterValue;
      row.style.display = shouldShow ? "table-row" : "none";
      if (shouldShow) visibleCount += 1;
    });

    let emptyRow = body.querySelector("tr.accounts-empty-row");
    if (!emptyRow) {
      emptyRow = document.createElement("tr");
      emptyRow.className = "accounts-empty-row";
      emptyRow.innerHTML =
        '<td colspan="6" class="text-secondary" style="padding: 18px 0; text-align: center;">No accounts in this category yet.</td>';
      body.appendChild(emptyRow);
    }

    emptyRow.style.display = visibleCount === 0 ? "table-row" : "none";
  }

  function inferRowType(row) {
    const explicitType = row.dataset.accountType;
    if (explicitType) return explicitType;

    const badge = row.querySelector(".account-type .badge");
    const typeLabel = badge ? badge.textContent.trim().toLowerCase() : "";

    if (typeLabel.indexOf("bank") >= 0) return "bank";
    if (typeLabel.indexOf("credit") >= 0) return "credit";
    if (typeLabel.indexOf("invest") >= 0) return "investment";
    if (typeLabel.indexOf("crypto") >= 0) return "crypto";
    if (typeLabel.indexOf("cash") >= 0) return "cash";

    return "other";
  }

  function setupLinkFormSubmission() {
    const form = document.getElementById("formcard");
    const tableBody = document.querySelector(".accounts-table tbody");
    if (!form || !tableBody) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const institution = valueOf("institution-name") || "New Institution";
      const accountType = valueOf("account-type") || "bank";
      const nickname = valueOf("account-nickname") || accountType.toUpperCase();
      const last4 = valueOf("account-last4") || "0000";
      const rawBalance = Number(valueOf("opening-balance") || 0);

      const row = buildAccountRow({
        institution: institution,
        accountType: accountType,
        nickname: nickname,
        last4: last4,
        balance: rawBalance,
      });

      tableBody.prepend(row);
      applyAccountFilter(STATE.activeFilter);
      refreshKpis(false);

      if (typeof window.closeAccountsLinkModal === "function") {
        window.closeAccountsLinkModal();
      }
      form.reset();
    });
  }

  function buildAccountRow(payload) {
    const row = document.createElement("tr");
    row.className = "account-details";
    row.dataset.accountType = payload.accountType;

    const typeLabel = payload.accountType.toUpperCase();
    const formattedBalance = formatCurrencyFromNumber(payload.balance);
    const trend = payload.balance >= 0 ? "+0.0%" : "-0.0%";

    row.innerHTML = [
      '<td class="account-pic">',
      '  <img src="../pictures/AccountsOverview/bd-visa-platinum-card-498x280.webp" class="account-card-img" alt="Account" />',
      "</td>",
      '<td class="account-type"><span class="badge badge-neutral badge-investment">' + escapeHtml(typeLabel) + "</span></td>",
      '<td class="institution institution-text">' + escapeHtml(payload.institution) + "</td>",
      '<td class="balance balance-container"><span class="balance-amount">' + formattedBalance + "</span></td>",
      '<td class="account-trend">' + trend + "</td>",
      '<td class="status"><span class="badge badge-positive badge-linked">LINKED</span></td>',
    ].join("");

    return row;
  }

  function refreshKpis(animate) {
    const allRows = Array.from(document.querySelectorAll(".accounts-table tbody tr.account-details"));
    const visibleRows = allRows.filter(function (row) {
      return row.style.display !== "none";
    });

    const sourceRows = STATE.activeFilter === "all" ? allRows : visibleRows;

    const totalAssets = sumRowsByPredicate(sourceRows, function (amount) {
      return amount > 0;
    });

    const totalLiabilities = sumRowsByPredicate(sourceRows, function (amount) {
      return amount < 0;
    });

    const linkedCount = sourceRows.filter(function (row) {
      const badge = row.querySelector(".status .badge");
      return badge && badge.textContent.trim().toUpperCase() === "LINKED";
    }).length;

    updateKpiValue("kpi-total-assets", totalAssets, animate, true);
    updateKpiValue("liabilities", Math.abs(totalLiabilities), animate, true, true);
    updateKpiValue("kpi-net-position", totalAssets + totalLiabilities, animate, true);
    updateKpiInteger("kpi-linked-accounts", linkedCount, animate);
  }

  function updateKpiValue(id, value, animate, currency, forceNegative) {
    const element = document.getElementById(id);
    if (!element) return;

    const finalValue = forceNegative ? -Math.abs(value) : value;

    if (animate && typeof animateCounter === "function") {
      animateCounter(element, finalValue, 700, "$", 2);
      return;
    }

    if (currency) {
      element.textContent = formatCurrencyFromNumber(finalValue);
    } else {
      element.textContent = String(finalValue);
    }
  }

  function updateKpiInteger(id, value, animate) {
    const element = document.getElementById(id);
    if (!element) return;

    if (animate && typeof animateCounter === "function") {
      animateCounter(element, value, 650, "", 0);
      return;
    }

    element.textContent = String(value);
  }

  function sumRowsByPredicate(rows, predicate) {
    return rows.reduce(function (sum, row) {
      const amount = parseBalanceFromRow(row);
      return predicate(amount) ? sum + amount : sum;
    }, 0);
  }

  function parseBalanceFromRow(row) {
    const balanceEl = row.querySelector(".balance-amount");
    if (!balanceEl) return 0;

    const raw = balanceEl.textContent.trim();
    const normalized = raw
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .replace(/−/g, "-")
      .replace(/\s+/g, "");

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatCurrencyFromNumber(value) {
    const abs = Math.abs(value);
    const formatted = "$" + abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return value < 0 ? "-" + formatted : formatted;
  }

  function valueOf(id) {
    const element = document.getElementById(id);
    if (!element) return "";
    return String(element.value || "").trim();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
