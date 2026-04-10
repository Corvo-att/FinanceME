// FinanceME Accounts Overview script
// Handles dynamic card rendering, filtering, and animation logic.

(function () {
  "use strict";

  // Mock data for initial accounts layout and recent transactions
  var ACCOUNTS = [
    { institution: "Fidelity",        type: "investment", cardType: "Brokerage Account",  balance:  63828.98, change: "+4.2%",  status: "linked", transactions: [ { date: "Apr 09, 2026", desc: "AAPL Dividend", amount: 125.50 }, { date: "Apr 01, 2026", desc: "Monthly Contribution", amount: 1000.00 } ] },
    { institution: "Vanguard",         type: "investment", cardType: "Retirement (IRA)",   balance:  41200.00, change: "+1.8%",  status: "linked", transactions: [ { date: "Mar 30, 2026", desc: "VTI Purchase", amount: -400.00 }, { date: "Mar 15, 2026", desc: "Employer Match", amount: 250.00 } ] },
    { institution: "Chase",           type: "bank",       cardType: "Checking Account",   balance:  25920.16, change: "+0.6%",  status: "linked", transactions: [ { date: "Apr 10, 2026", desc: "Payroll Deposit", amount: 4200.00 }, { date: "Apr 05, 2026", desc: "ATM Withdrawal", amount: -200.00 } ] },
    { institution: "Wells Fargo",      type: "bank",       cardType: "Savings Account",    balance:  12450.00, change: "+0.2%",  status: "manual", transactions: [ { date: "Mar 31, 2026", desc: "Interest Paid", amount: 45.12 }, { date: "Mar 01, 2026", desc: "Transfer to Checking", amount: -500.00 } ] },
    { institution: "American Express",type: "credit",     cardType: "Platinum Credit Card",balance:  -2860.47, change: "-2.1%",  status: "manual", transactions: [ { date: "Apr 08, 2026", desc: "Amazon Web Services", amount: -145.20 }, { date: "Apr 02, 2026", desc: "Whole Foods Market", amount: -89.45 } ] },
    { institution: "Coinbase",         type: "crypto",     cardType: "Bitcoin Wallet",     balance:   8342.10, change: "+11.3%", status: "linked", transactions: [ { date: "Apr 07, 2026", desc: "BTC Purchase", amount: 500.00 }, { date: "Mar 20, 2026", desc: "Network Fee", amount: -2.15 } ] },
    { institution: "Kraken",           type: "crypto",     cardType: "Ethereum Wallet",    balance:   3190.55, change: "-3.7%",  status: "linked", transactions: [ { date: "Apr 09, 2026", desc: "ETH Staking Reward", amount: 12.05 } ] },
    { institution: "Personal",         type: "cash",       cardType: "Cash Envelope",      balance:     620.00, change: "0.0%",   status: "manual", transactions: [ { date: "Apr 05, 2026", desc: "Coffee Shop", amount: -4.50 }, { date: "Mar 28, 2026", desc: "Sold old bike", amount: 150.00 } ] },
  ];

  var STATE = { activeFilter: "all" };

  // Setup event listeners and initial render
  function initAccountsOverview() {
    renderAllCards();
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

  // Clears the row and mounts all account cards
  function renderAllCards() {
    var row = document.getElementById("accounts-flip-row");
    if (!row) return;
    row.innerHTML = "";

    ACCOUNTS.forEach(function (account) {
      var card = buildFlipCard(account);
      row.appendChild(card);
    });

    applyCardFilter(STATE.activeFilter, false); // No animation on first load
    animateCardsIn();
  }

  function buildFlipCard(account) {
    var wrapper = document.createElement("div");
    wrapper.className = "flip-card-wrapper";
    wrapper.dataset.accountType = account.type;

    var inner = document.createElement("div");
    inner.className = "flip-card-inner";
    inner.appendChild(buildFront(account));
    inner.appendChild(buildBack(account));
    wrapper.appendChild(inner);

    wrapper._accountData = account;

    // Handle flip interaction with a slight push-down effect
    wrapper.addEventListener("click", function () {
      var isFlipping = wrapper.classList.contains("flipped");

      if (typeof anime !== "undefined") {
        anime({
          targets: wrapper,
          scaleX: [1, 0.96, 1],
          scaleY: [1, 0.97, 1],
          duration: 320,
          easing: "spring(1, 80, 14, 0)",
        });
      }

      wrapper.classList.toggle("flipped");
      
      // Give flip animation a moment before updating dynamic stats
      setTimeout(function() {
        refreshKpis(true);
      }, 50);
    });

    return wrapper;
  }

  function buildFront(account) {
    var front = document.createElement("div");
    front.className = "flip-card-front";

    var typeKey   = account.type.toLowerCase();
    var typeName  = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
    var cardLabel = account.cardType || typeName;

    var svgs = {
      investment: '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-5 5"/></svg>',
      bank:       '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="10" rx="2"/><path d="M12 2v8"/><path d="M8 6h8"/></svg>',
      credit:     '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="12" r="6" fill="rgba(255,255,255,0.7)"/><circle cx="16" cy="12" r="6" fill="rgba(255,255,255,0.4)"/></svg>',
      crypto:     '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8h4.5a3.5 3.5 0 0 1 0 7H9"/><path d="M9 15h5.5a3.5 3.5 0 0 1 0 7H9"/><path d="M9 8v14"/><path d="M12 5v3"/><path d="M12 22v3"/></svg>',
      cash:       '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>'
    };
    var iconSvg = svgs[typeKey] || svgs.bank;

    front.innerHTML =
      '<div class="fcard-top-row">' +
        '<div class="fcard-graphic">' + iconSvg + '</div>' +
        '<span class="fcard-badge fcard-badge--' + escapeHtml(typeKey) + '">' + escapeHtml(typeName) + '</span>' +
      '</div>' +
      '<div class="fcard-bottom">' +
        '<div class="fcard-institution">' + escapeHtml(account.institution) + '</div>' +
        '<div class="fcard-card-type">' + escapeHtml(cardLabel) + '</div>' +
        '<div class="fcard-hint">Tap to see details</div>' +
      '</div>';

    return front;
  }

  function buildBack(account) {
    var back = document.createElement("div");
    back.className = "flip-card-back";

    var isPositive  = account.change.charAt(0) !== "-";
    var changeClass = isPositive ? "fcard-change--positive" : "fcard-change--negative";
    var statusClass = account.status === "linked" ? "fcard-status--linked" : "fcard-status--manual";
    var statusLabel = account.status === "linked" ? "LINKED" : "MANUAL";
    var cardLabel   = account.cardType || (account.type.charAt(0).toUpperCase() + account.type.slice(1));

    back.innerHTML =
      '<div class="fcard-back-top">' +
        '<span class="fcard-back-institution">' + escapeHtml(account.institution) + '</span>' +
        '<span class="fcard-back-card-type">' + escapeHtml(cardLabel) + '</span>' +
      '</div>' +
      '<div class="fcard-back-balance">' + escapeHtml(formatCurrencyFromNumber(account.balance)) + '</div>' +
      '<div class="fcard-back-bottom">' +
        '<span class="fcard-change ' + changeClass + '">' + escapeHtml(account.change) + '</span>' +
        '<span class="fcard-status ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>';

    return back;
  }

  // Stagger animate cards on page load
  function animateCardsIn() {
    if (typeof anime === "undefined") {
      /* Fallback: make cards visible without animation */
      var cards = document.querySelectorAll(".flip-card-wrapper");
      cards.forEach(function (c) { c.style.opacity = 1; c.style.transform = ""; });
      return;
    }

    anime({
      targets: ".flip-card-wrapper",
      translateY: [20, 0],
      opacity:    [0, 1],
      scale:      [0.94, 1],
      delay:      anime.stagger(80, { start: 60 }),
      duration:   600,
      easing:     "spring(1, 78, 9, 0)",
    });
  }

  // Handle card hiding/showing animations during filtering
  function animateCardOut(card) {
    if (typeof anime === "undefined") { card.style.display = "none"; return; }
    anime({
      targets:  card,
      opacity:  [1, 0],
      scale:    [1, 0.88],
      duration: 200,
      easing:   "easeInQuart",
      complete: function () { card.style.display = "none"; },
    });
  }

  function animateCardIn(card, delay) {
    if (typeof anime === "undefined") { card.style.opacity = 1; card.style.transform = ""; return; }
    card.style.display = "";
    anime({
      targets:  card,
      opacity:  [0, 1],
      scale:    [0.88, 1],
      translateY: [12, 0],
      delay:    delay || 0,
      duration: 380,
      easing:   "spring(1, 70, 12, 0)",
    });
  }

  // Setup tab buttons to filter accounts by category
  function setupAccountTabs() {
    var tabInputs = document.querySelectorAll('input[name="dashboard-account-tabs"]');
    if (!tabInputs.length) return;

    tabInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        var nextFilter = normalizeFilterFromId(input.id);
        STATE.activeFilter = nextFilter;
        applyCardFilter(nextFilter, true);
        refreshKpis(false);
      });
    });

    applyCardFilter("all", false);
  }

  function normalizeFilterFromId(tabId) {
    if (!tabId || tabId.indexOf("tab-") !== 0) return "all";
    if (tabId === "tab-all-accounts")        return "all";
    if (tabId === "tab-bank-accounts")       return "bank";
    if (tabId === "tab-credit-accounts")     return "credit";
    if (tabId === "tab-investment-accounts") return "investment";
    if (tabId === "tab-crypto-accounts")     return "crypto";
    if (tabId === "tab-cash-accounts")       return "cash";
    return "all";
  }

  function applyCardFilter(filterValue, animated) {
    var row      = document.getElementById("accounts-flip-row");
    var emptyMsg = document.getElementById("accounts-flip-empty");
    if (!row) return;

    var cards       = Array.from(row.querySelectorAll(".flip-card-wrapper"));
    var showCards   = [];
    var hideCards   = [];

    cards.forEach(function (card) {
      var type = card.dataset.accountType || "other";
      var show = filterValue === "all" || type === filterValue;
      if (show) showCards.push(card);
      else hideCards.push(card);
    });

    // Animate out hidden cards and reset flip
    hideCards.forEach(function (card) {
      if (animated) {
        animateCardOut(card);
      } else {
        card.style.display = "none";
        card.style.opacity = 0;
      }
      card.classList.remove("flipped");
    });

    showCards.forEach(function (card, i) {
      if (animated) {
        animateCardIn(card, i * 60);
      } else {
        card.style.display = "";
        /* opacity & translateY set by initialiser; leave alone if already visible */
      }
    });

    if (emptyMsg) {
      emptyMsg.style.display = showCards.length === 0 ? "" : "none";
    }
  }

  // Link account modal event listeners
  function setupModalControls() {
    var toggleBtn = document.getElementById("payment-toggle-btn");
    var modal     = document.getElementById("paymentprompt");
    var backdrop  = document.getElementById("link-account-backdrop");
    var closeBtn  = document.getElementById("payment-close-btn");
    var cancelBtn = document.getElementById("payment-cancel-btn");

    if (!modal || !backdrop) return;

    function openModal() {
      // Ensure fixed-position modal is anchored to viewport, not a transformed ancestor.
      if (backdrop.parentNode !== document.body) {
        document.body.appendChild(backdrop);
      }
      if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
      }

      modal.style.display = "block";
      backdrop.style.display = "block";
      document.body.style.overflow = "hidden";

      if (typeof anime !== "undefined") {
        anime({
          targets:  modal,
          translateX: "-50%",
          translateY: "-50%",
          scale: [0.95, 1],
          opacity:  [0, 1],
          duration: 420,
          easing:   "spring(1, 80, 10, 0)",
        });
      }
    }

    function closeModal() {
      if (typeof anime !== "undefined") {
        anime({
          targets:  modal,
          translateX: "-50%",
          translateY: "-50%",
          scale: [1, 0.95],
          opacity:  [1, 0],
          duration: 240,
          easing:   "easeInCubic",
          complete: function () {
            modal.style.display = "none";
            backdrop.style.display = "none";
            document.body.style.overflow = "";
          },
        });
      } else {
        modal.style.display = "none";
        backdrop.style.display = "none";
        document.body.style.overflow = "";
      }
    }

    if (toggleBtn)  toggleBtn.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
    if (closeBtn)   closeBtn.addEventListener("click", closeModal);
    if (cancelBtn)  cancelBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.style.display === "block") closeModal();
    });

    var providerTabs = modal.querySelectorAll(".provider-tab");
    var providerInput = modal.querySelector("#link-provider-input");
    var providerCopy = modal.querySelector("#link-provider-copy");
    var providerPreview = modal.querySelector("#preview-provider");

    var accountTypeInput = modal.querySelector("#account-type");
    var dynamicFields = modal.querySelectorAll(".dynamic-field");

    var institutionInput = modal.querySelector("#institution-name");
    var nicknameInput = modal.querySelector("#account-nickname");
    var last4Input = modal.querySelector("#account-last4");
    var openingBalanceInput = modal.querySelector("#opening-balance");
    var currencySelect = modal.querySelector("#currency-select");

    var previewName = modal.querySelector("#preview-name");
    var previewType = modal.querySelector("#preview-type");
    var previewLast4 = modal.querySelector("#preview-last4");
    var previewBalance = modal.querySelector("#preview-balance");

    var providerMessages = {
      plaid: "A secure redirect opens in a new window for sign in.",
      finicity: "Choose your institution and confirm access in Finicity.",
      mx: "Connect with MX to auto-categorize and enrich transactions.",
      manual: "Manual sync keeps balances updated without sharing credentials."
    };

    var accountTypeLabels = {
      checking: "Checking Account",
      savings: "Savings Account",
      credit: "Credit Card",
      investment: "Investment Account",
      crypto: "Crypto Wallet",
      cash: "Cash / Other"
    };

    function formatPreviewBalance() {
      var amount = Number(openingBalanceInput && openingBalanceInput.value ? openingBalanceInput.value : 0);
      var currencyCode = currencySelect && currencySelect.value ? currencySelect.value : "EGP";

      try {
        return amount.toLocaleString(undefined, { style: "currency", currency: currencyCode });
      } catch (_error) {
        return formatCurrencyFromNumber(amount);
      }
    }

    function updateDynamicFields(selectedType) {
      dynamicFields.forEach(function (fieldGroup) {
        var tokens = (fieldGroup.getAttribute("data-account-types") || "")
          .split(" ")
          .filter(Boolean);

        var show = selectedType && tokens.indexOf(selectedType) !== -1;
        fieldGroup.hidden = !show;

        fieldGroup.querySelectorAll("input, select, textarea").forEach(function (input) {
          input.disabled = !show;
          if (!show) input.value = "";
        });
      });
    }

    function updatePreview() {
      var institution = institutionInput && institutionInput.value.trim() ? institutionInput.value.trim() : "New Institution";
      var nickname = nicknameInput && nicknameInput.value.trim() ? nicknameInput.value.trim() : "";
      var typeValue = accountTypeInput && accountTypeInput.value ? accountTypeInput.value : "";

      if (previewName) {
        previewName.textContent = nickname || institution;
      }

      if (previewType) {
        previewType.textContent = typeValue ? (accountTypeLabels[typeValue] || typeValue) : "Select account type";
      }

      if (previewLast4) {
        previewLast4.textContent = last4Input && last4Input.value ? last4Input.value : "••••";
      }

      if (previewBalance) {
        previewBalance.textContent = formatPreviewBalance();
      }
    }

    providerTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var provider = tab.getAttribute("data-provider") || "plaid";

        providerTabs.forEach(function (btn) { btn.classList.remove("active"); });
        tab.classList.add("active");

        if (providerInput) providerInput.value = provider;
        if (providerCopy) providerCopy.textContent = providerMessages[provider] || providerMessages.plaid;
        if (providerPreview) providerPreview.textContent = tab.textContent.trim();
      });
    });

    if (accountTypeInput) {
      accountTypeInput.addEventListener("change", function () {
        updateDynamicFields(accountTypeInput.value);
        updatePreview();
      });
    }

    [institutionInput, nicknameInput, last4Input, openingBalanceInput, currencySelect].forEach(function (field) {
      if (!field) return;
      field.addEventListener("input", updatePreview);
      field.addEventListener("change", updatePreview);
    });

    updateDynamicFields(accountTypeInput && accountTypeInput.value ? accountTypeInput.value : "");
    updatePreview();

    window.closeAccountsLinkModal = closeModal;
  }

  // Handles adding new accounts via the modal form
  function setupLinkFormSubmission() {
    var form = document.getElementById("formcard");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var institution = valueOf("institution-name") || "New Institution";
      var rawType     = valueOf("account-type")     || "checking";
      var rawBalance  = Number(valueOf("opening-balance") || 0);

      var cardTypeMap = {
        checking:   "Checking Account",
        savings:    "Savings Account",
        credit:     "Credit Card",
        investment: "Brokerage Account",
        crypto:     "Crypto Wallet",
        cash:       "Cash / Other",
      };

      var normalizedTypeMap = {
        checking:   "bank",
        savings:    "bank",
        credit:     "credit",
        investment: "investment",
        crypto:     "crypto",
        cash:       "cash",
      };

      var newAccount = {
        institution: institution,
        type:        normalizedTypeMap[rawType] || "bank",
        cardType:    cardTypeMap[rawType] || (rawType.charAt(0).toUpperCase() + rawType.slice(1)),
        balance:     rawBalance,
        change:      rawBalance >= 0 ? "+0.0%" : "-0.0%",
        status:      "linked",
        transactions: [
          { date: "Just now", desc: "Initial Deposit", amount: rawBalance }
        ]
      };

      ACCOUNTS.unshift(newAccount);

      var row  = document.getElementById("accounts-flip-row");
      var card = buildFlipCard(newAccount);
      
      // Mount new card hidden for animation
      card.style.opacity   = 0;
      card.style.transform = "translateY(20px) scale(0.9)";
      row.prepend(card);

      if (typeof anime !== "undefined") {
        anime({
          targets:    card,
          translateY: [20, 0],
          opacity:    [0, 1],
          scale:      [0.9, 1],
          duration:   500,
          easing:     "spring(1, 76, 10, 0)",
        });
      } else {
        card.style.opacity   = 1;
        card.style.transform = "";
      }

      refreshKpis(false);

      if (typeof window.closeAccountsLinkModal === "function") {
        window.closeAccountsLinkModal();
      }

      form.reset();

      var accountTypeSelect = document.getElementById("account-type");
      if (accountTypeSelect) {
        accountTypeSelect.dispatchEvent(new Event("change"));
      }

      var institutionInput = document.getElementById("institution-name");
      if (institutionInput) {
        institutionInput.dispatchEvent(new Event("input"));
      }
    });
  }

  // Updates global balances and activity based on current active cards
  function refreshKpis(animate) {
    var flippedElements = Array.from(document.querySelectorAll("#accounts-flip-row .flip-card-wrapper.flipped"));
    var targetAccounts = [];

    // Focus on manually flipped cards, fallback to active category filter
    if (flippedElements.length > 0) {
      targetAccounts = flippedElements.map(function(el) { return el._accountData; });
    } else {
      targetAccounts = STATE.activeFilter === "all"
        ? ACCOUNTS
        : ACCOUNTS.filter(function (a) { return a.type === STATE.activeFilter; });
    }

    // Recalculate totals
    var totalAssets = targetAccounts.reduce(function (sum, a) { return a.balance > 0 ? sum + a.balance : sum; }, 0);
    var totalLiab   = targetAccounts.reduce(function (sum, a) { return a.balance < 0 ? sum + a.balance : sum; }, 0);
    var linkedCount = targetAccounts.filter(function (a) { return a.status === "linked"; }).length;

    updateKpiValue("kpi-total-assets",     totalAssets,               animate, true);
    updateKpiValue("liabilities",          Math.abs(totalLiab),       animate, true, true);
    updateKpiValue("kpi-net-position",     totalAssets + totalLiab,   animate, true);
    updateKpiInteger("kpi-linked-accounts", linkedCount, animate);

    renderRecentActivity(targetAccounts);
  }

  function renderRecentActivity(accountsArray) {
    var tbody = document.getElementById("recent-activity-tbody");
    if (!tbody) return;

    var allTx = [];
    accountsArray.forEach(function(acc) {
      if (!acc.transactions) return;
      acc.transactions.forEach(function(tx) {
        allTx.push({
          date: tx.date,
          desc: tx.desc,
          amount: tx.amount,
          accountName: acc.institution + " " + acc.cardType.split(" ")[0]
        });
      });
    });

    tbody.innerHTML = "";
    if (allTx.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-label text-center" style="padding: 20px;">No transactions found.</td></tr>';
      return;
    }

    allTx.forEach(function(tx) {
      var tr = document.createElement("tr");
      tr.className = "recent-activity-details";

      var amountText  = tx.amount >= 0 ? "+" + formatCurrencyFromNumber(tx.amount) : formatCurrencyFromNumber(tx.amount);
      var amountStyle = tx.amount >= 0 ? "color: #5ab87a;" : "color: #eef0f3;";

      tr.innerHTML = 
        '<td class="ra-col institution-text">' + escapeHtml(tx.date) + '</td>' +
        '<td class="ra-col institution-text">' + escapeHtml(tx.desc) + '</td>' +
        '<td class="ra-col institution-text">' + escapeHtml(tx.accountName) + '</td>' +
        '<td class="ra-col ra-col-right institution-text" style="' + amountStyle + '">' + escapeHtml(amountText) + '</td>';
      tbody.appendChild(tr);
    });
  }

  function updateKpiValue(id, value, animate, currency, forceNegative) {
    var el = document.getElementById(id);
    if (!el) return;
    var finalValue = forceNegative ? -Math.abs(value) : value;
    if (animate && typeof animateCounter === "function") {
      animateCounter(el, finalValue, 700, "E£", 2);
      return;
    }
    el.textContent = currency ? formatCurrencyFromNumber(finalValue) : String(finalValue);
  }

  function updateKpiInteger(id, value, animate) {
    var el = document.getElementById(id);
    if (!el) return;
    if (animate && typeof animateCounter === "function") {
      animateCounter(el, value, 650, "", 0);
      return;
    }
    el.textContent = String(value);
  }

  // --- Utility functions ---

  function formatCurrencyFromNumber(value) {
    var abs = Math.abs(value);
    var formatted = "E£" + abs.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? "-" + formatted : formatted;
  }

  function valueOf(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
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
