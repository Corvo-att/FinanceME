/* ============================================================
   FINANCEME - Dashboard Script (dashboard.js)
   Focuses on daily operations and avoids analytics duplication.
   ============================================================ */

const dashboardData = {
  signals: [
    { label: "Liquidity Buffer", value: "41 days", tone: "good" },
    { label: "Debt Utilization", value: "18%", tone: "watch" },
    { label: "Subscriptions", value: "EGP 112 / month", tone: "risk" },
    { label: "Autopay Coverage", value: "92%", tone: "good" },
  ],
  kpis: {
    netWorth: {
      value: 142500.84,
      delta: "+3.8% vs last month",
      spark: [130500, 132100, 133000, 135200, 136900, 138200, 139000, 140300, 141000, 141800, 142100, 142500],
      color: "#C9A84C",
    },
    cashOnHand: {
      value: 44551.04,
      delta: "+EGP 2,250 this week",
      spark: [39800, 40550, 41000, 41900, 42150, 42500, 42900, 43340, 43700, 44010, 44300, 44551],
      color: "#4C8EF5",
    },
    billsDue: {
      value: 1850.45,
      delta: "3 bills in next 7 days",
      spark: [900, 1200, 820, 1490, 1100, 1700, 1420, 1850, 1310, 1690, 1400, 1850],
      color: "#E05C5C",
    },
    savingsRate: {
      value: 34.8,
      delta: "+1.9 pts this cycle",
      spark: [27.2, 27.9, 28.4, 29.2, 29.8, 31.1, 31.5, 32.7, 33.2, 33.8, 34.1, 34.8],
      color: "#2ECC8A",
    },
  },
  runwayFloor: 30000,
  runwaySeries: [44550, 43820, 43100, 42750, 42110, 41520, 40890, 40400, 39980, 39350, 38800, 38220, 37710, 37190],
  budgets: [
    { category: "Dining", spent: 420, limit: 500 },
    { category: "Transport", spent: 265, limit: 300 },
    { category: "Entertainment", spent: 211, limit: 180 },
    { category: "Shopping", spent: 96, limit: 200 },
  ],
  transactions: [
    {
      description: "Atlas Grocery Market",
      category: "Food",
      date: daysFromNow(-1),
      amount: -84.5,
      categoryColor: "#2ECC8A",
    },
    {
      description: "Payroll Deposit",
      category: "Income",
      date: daysFromNow(-2),
      amount: 4500,
      categoryColor: "#4C8EF5",
    },
    {
      description: "Metro Rail Pass",
      category: "Transport",
      date: daysFromNow(-2),
      amount: -42,
      categoryColor: "#E8A83A",
    },
    {
      description: "Studio Utilities",
      category: "Utilities",
      date: daysFromNow(-3),
      amount: -120.73,
      categoryColor: "#E05C5C",
    },
    {
      description: "Streaming Bundle",
      category: "Subscriptions",
      date: daysFromNow(-4),
      amount: -27.99,
      categoryColor: "#6B6B85",
    },
    {
      description: "Freelance Invoice",
      category: "Income",
      date: daysFromNow(-5),
      amount: 780,
      categoryColor: "#4C8EF5",
    },
  ],
  bills: [
    {
      name: "Rent - Midtown Apt",
      dueDate: daysFromNow(2),
      amount: 1200,
      autopay: true,
    },
    {
      name: "Electric Utility",
      dueDate: daysFromNow(4),
      amount: 210.45,
      autopay: false,
    },
    {
      name: "Card Statement - Sapphire",
      dueDate: daysFromNow(6),
      amount: 440,
      autopay: false,
    },
  ],
  accounts: [
    {
      name: "Chase Checking",
      mask: "...8472",
      balance: 12450.22,
      icon: "CH",
      type: "bank",
    },
    {
      name: "High Yield Savings",
      mask: "...1129",
      balance: 32100.82,
      icon: "HY",
      type: "cash",
    },
    {
      name: "Amex Sapphire",
      mask: "...6551",
      balance: -2450,
      icon: "AX",
      type: "credit",
    },
    {
      name: "Vanguard Core",
      mask: "...9910",
      balance: 100399.8,
      icon: "VG",
      type: "invest",
    },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenuButton();
  renderSignalRail();
  renderKpis();
  renderRunwayChart();
  renderRunwayStats();
  renderBudgetRiskList();
  renderTransactions();
  renderUpcomingBills();
  renderAccounts();
});

function setupMobileMenuButton() {
  const button = document.getElementById("mobile-menu-btn");
  if (!button) return;

  const check = () => {
    button.style.display = window.innerWidth <= 768 ? "flex" : "none";
  };

  check();
  window.addEventListener("resize", check);
}

function renderSignalRail() {
  const rail = document.getElementById("signal-rail");
  if (!rail) return;

  rail.innerHTML = dashboardData.signals
    .map(
      (signal) => `
        <li class="signal-chip" data-tone="${signal.tone}">
          <span class="signal-chip__label">${signal.label}</span>
          <span class="signal-chip__value">${signal.value}</span>
        </li>
      `,
    )
    .join("");
}

function renderKpis() {
  const netWorthEl = document.getElementById("kpi-net-worth");
  const cashEl = document.getElementById("kpi-cash-on-hand");
  const billsEl = document.getElementById("kpi-bills-due");
  const savingsEl = document.getElementById("kpi-savings-rate");

  setText("delta-net-worth", dashboardData.kpis.netWorth.delta);
  setText("delta-cash-on-hand", dashboardData.kpis.cashOnHand.delta);
  setText("delta-bills-due", dashboardData.kpis.billsDue.delta);
  setText("delta-savings-rate", dashboardData.kpis.savingsRate.delta);

  animateValue(netWorthEl, dashboardData.kpis.netWorth.value, 900, (value) => formatMoney(value));
  animateValue(cashEl, dashboardData.kpis.cashOnHand.value, 900, (value) => formatMoney(value));
  animateValue(billsEl, -dashboardData.kpis.billsDue.value, 900, (value) => formatMoney(value));
  animateValue(savingsEl, dashboardData.kpis.savingsRate.value, 900, (value) => `${value.toFixed(1)}%`);
}

function renderRunwayChart() {
  const canvas = document.getElementById("cashRunwayChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = dashboardData.runwaySeries.map((_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return day.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  });

  const ctx = canvas.getContext("2d");
  const areaGradient = ctx.createLinearGradient(0, 0, 0, 300);
  areaGradient.addColorStop(0, "rgba(76, 142, 245, 0.35)");
  areaGradient.addColorStop(1, "rgba(76, 142, 245, 0)");

  Chart.defaults.color = "#8888A0";
  Chart.defaults.font.family = "'Inter', sans-serif";

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Projected balance",
          data: dashboardData.runwaySeries,
          borderColor: "#4C8EF5",
          backgroundColor: areaGradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: "Safety floor",
          data: dashboardData.runwaySeries.map(() => dashboardData.runwayFloor),
          borderColor: "#C9A84C",
          borderWidth: 1.4,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "#1A1A24",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatMoney(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxTicksLimit: 7,
          },
        },
        y: {
          grid: {
            color: "rgba(255,255,255,0.06)",
            borderDash: [4, 4],
          },
          ticks: {
            callback(value) {
              return `$${Math.round(value / 1000)}k`;
            },
          },
        },
      },
    },
  });
}

function renderRunwayStats() {
  const lowestPoint = Math.min(...dashboardData.runwaySeries);
  const floorGap = lowestPoint - dashboardData.runwayFloor;

  const dailyChanges = dashboardData.runwaySeries
    .slice(1)
    .map((value, index) => value - dashboardData.runwaySeries[index]);

  const burnChanges = dailyChanges
    .filter((change) => change < 0)
    .map((change) => Math.abs(change));

  const averageBurn = burnChanges.length
    ? burnChanges.reduce((sum, value) => sum + value, 0) / burnChanges.length
    : 0;

  setText("runway-lowest", formatMoney(lowestPoint));
  setText("runway-floor-gap", `${floorGap >= 0 ? "+" : ""}${formatMoney(floorGap)}`);
  setText("runway-burn-rate", `${formatMoney(averageBurn)}/day`);
}

function renderBudgetRiskList() {
  const container = document.getElementById("budget-risk-list");
  if (!container) return;

  container.innerHTML = dashboardData.budgets
    .map((budget) => {
      const ratio = (budget.spent / budget.limit) * 100;
      const progressClass = typeof getProgressClass === "function"
        ? getProgressClass(ratio)
        : ratio >= 90
          ? "progress-bar__fill--danger"
          : ratio >= 70
            ? "progress-bar__fill--warning"
            : "progress-bar__fill--ok";

      const state = ratio >= 100
        ? { label: "Over", className: "risk-state--danger" }
        : ratio >= 90
          ? { label: "Critical", className: "risk-state--danger" }
          : ratio >= 70
            ? { label: "Watch", className: "risk-state--watch" }
            : { label: "Healthy", className: "risk-state--ok" };

      return `
        <div class="risk-item">
          <div class="risk-item__header">
            <span class="risk-item__category">${budget.category}</span>
            <span class="risk-item__amount">${formatMoney(budget.spent)} / ${formatMoney(budget.limit)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill ${progressClass}" style="width: ${Math.min(ratio, 100)}%"></div>
          </div>
          <div class="risk-item__meta">
            <span class="data-figure-sm">${ratio.toFixed(0)}% used</span>
            <span class="risk-state ${state.className}">${state.label}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTransactions() {
  const tableBody = document.getElementById("recent-transactions-body");
  const mobileList = document.getElementById("recent-transactions-mobile");
  if (!tableBody || !mobileList) return;

  tableBody.innerHTML = dashboardData.transactions
    .map((transaction) => {
      const amountClass = typeof getAmountClass === "function"
        ? getAmountClass(transaction.amount)
        : transaction.amount >= 0
          ? "amount-positive"
          : "amount-negative";

      return `
        <tr>
          <td>
            <span class="transaction-title">
              <span class="category-dot" style="background:${transaction.categoryColor}"></span>
              ${transaction.description}
            </span>
          </td>
          <td class="text-caption">${transaction.category}</td>
          <td class="text-caption">${formatDateSafe(transaction.date, "short")}</td>
          <td class="col-amount data-figure-sm ${amountClass}">${formatMoney(transaction.amount)}</td>
        </tr>
      `;
    })
    .join("");

  mobileList.innerHTML = dashboardData.transactions
    .map((transaction) => {
      const amountClass = typeof getAmountClass === "function"
        ? getAmountClass(transaction.amount)
        : transaction.amount >= 0
          ? "amount-positive"
          : "amount-negative";

      return `
        <article class="transaction-card">
          <div class="transaction-card__top">
            <span class="transaction-title">
              <span class="category-dot" style="background:${transaction.categoryColor}"></span>
              ${transaction.description}
            </span>
            <span class="data-figure-sm ${amountClass}">${formatMoney(transaction.amount)}</span>
          </div>
          <div class="transaction-card__bottom">
            <span>${transaction.category}</span>
            <span>${formatDateSafe(transaction.date, "short")}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderUpcomingBills() {
  const list = document.getElementById("upcoming-bills-list");
  if (!list) return;

  list.innerHTML = dashboardData.bills
    .map((bill) => {
      const days = dayDiffFromNow(bill.dueDate);
      const state = bill.autopay
        ? { label: "Autopay", className: "bill-state--autopay" }
        : days <= 2
          ? { label: "Urgent", className: "bill-state--urgent" }
          : { label: "Manual", className: "bill-state--manual" };

      return `
        <li class="bill-item">
          <div class="bill-item__top">
            <span class="bill-item__name">${bill.name}</span>
            <span class="data-figure-sm amount-negative">${formatMoney(-bill.amount)}</span>
          </div>
          <div class="bill-item__meta">
            <span>${dueLabel(days)} (${formatDateSafe(bill.dueDate, "short")})</span>
            <span class="bill-state ${state.className}">${state.label}</span>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderAccounts() {
  const container = document.getElementById("account-snapshot-grid");
  if (!container) return;

  container.innerHTML = dashboardData.accounts
    .map((account) => {
      const amountClass = typeof getAmountClass === "function"
        ? getAmountClass(account.balance)
        : account.balance >= 0
          ? "amount-positive"
          : "amount-negative";

      return `
        <article class="account-tile">
          <div class="account-tile__top">
            <span class="account-tile__icon account-tile__icon--${account.type}">${account.icon}</span>
            <div>
              <p class="account-tile__name">${account.name}</p>
              <p class="account-tile__mask">${account.mask}</p>
            </div>
          </div>
          <p class="data-figure-sm account-tile__balance ${amountClass}">${formatMoney(account.balance)}</p>
        </article>
      `;
    })
    .join("");
}

function animateValue(element, endValue, duration, formatter) {
  if (!element) return;

  const startValue = 0;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startValue + (endValue - startValue) * eased;
    element.textContent = formatter(current);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatMoney(value) {
  if (typeof formatCurrency === "function") {
    return formatCurrency(value);
  }

  const abs = Math.abs(value).toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (value < 0) return `-EGP ${abs}`;
  return `EGP ${abs}`;
}

function formatDateSafe(date, style) {
  if (typeof formatDate === "function") {
    return formatDate(date, style);
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dayDiffFromNow(dateValue) {
  const target = new Date(dateValue);
  const now = new Date();

  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return Math.round((target - now) / 86400000);
}

function dueLabel(days) {
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace("#", "");
  const bigint = Number.parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}