/* ============================================================
   FINANCEME — Planning & Forecasting Logic (planning.js)
   Shared behavior for:
   - bills.html
   - forecast.html
   - debt-payoff.html
   - investment-projector.html
   ============================================================ */

(function () {
  "use strict";

  const DEFAULT_CURRENCY = "EGP";

  const BILL_EVENTS = [
    { day: 2, name: "Rent", amount: 1850, status: "due", autopay: true },
    { day: 5, name: "Streaming Bundle", amount: 31.99, status: "upcoming", autopay: true },
    { day: 9, name: "Car Insurance", amount: 127.5, status: "upcoming", autopay: false },
    { day: 14, name: "Internet", amount: 64, status: "scheduled", autopay: true },
    { day: 18, name: "Credit Card", amount: 420, status: "due", autopay: false },
    { day: 22, name: "Phone", amount: 78, status: "scheduled", autopay: true },
    { day: 27, name: "Gym", amount: 45, status: "scheduled", autopay: true }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    initBillCalendarPage();
    initForecastPage();
    initDebtPayoffPage();
    initInvestmentProjectorPage();
  });

  /* ---------------------------------------------------------
     Bills
     --------------------------------------------------------- */

  function initBillCalendarPage() {
    const calendarGrid = document.getElementById("calendar-grid");
    if (!calendarGrid) return;

    const monthLabel = document.getElementById("calendar-month-label");
    const summaryDue = document.getElementById("bill-summary-due");
    const summaryAutopay = document.getElementById("bill-summary-autopay");
    const summaryCount = document.getElementById("bill-summary-count");
    const billList = document.getElementById("bill-list");

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (monthLabel) {
      monthLabel.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);
    }

    renderCalendarMonth(calendarGrid, year, month, BILL_EVENTS);
    renderBillList(billList, BILL_EVENTS);

    const totalDue = BILL_EVENTS.reduce((sum, event) => sum + event.amount, 0);
    const autoPayCount = BILL_EVENTS.filter((event) => event.autopay).length;

    if (summaryDue) summaryDue.textContent = formatCurrency(totalDue);
    if (summaryAutopay) summaryAutopay.textContent = `${autoPayCount}/${BILL_EVENTS.length}`;
    if (summaryCount) summaryCount.textContent = String(BILL_EVENTS.length);
  }

  function renderCalendarMonth(container, year, month, events) {
    container.innerHTML = "";

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const prevMonthLast = new Date(year, month, 0).getDate();
    const today = new Date();

    const eventMap = new Map();
    events.forEach((event) => {
      const existing = eventMap.get(event.day) || [];
      existing.push(event);
      eventMap.set(event.day, existing);
    });

    for (let i = 0; i < 42; i += 1) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";

      let dayNumber;
      let isCurrentMonth = true;

      if (i < startWeekday) {
        dayNumber = prevMonthLast - startWeekday + i + 1;
        isCurrentMonth = false;
      } else if (i >= startWeekday + daysInMonth) {
        dayNumber = i - (startWeekday + daysInMonth) + 1;
        isCurrentMonth = false;
      } else {
        dayNumber = i - startWeekday + 1;
      }

      if (!isCurrentMonth) {
        cell.classList.add("calendar-cell--muted");
      }

      if (
        isCurrentMonth &&
        dayNumber === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add("calendar-cell--today");
      }

      const dateEl = document.createElement("div");
      dateEl.className = "calendar-date";
      dateEl.textContent = String(dayNumber);
      cell.appendChild(dateEl);

      if (isCurrentMonth && eventMap.has(dayNumber)) {
        const dayEvents = eventMap.get(dayNumber);
        const first = dayEvents[0];

        const pill = document.createElement("span");
        pill.className = first.name.toLowerCase().includes("salary")
          ? "calendar-pill calendar-pill--salary"
          : "calendar-pill calendar-pill--bill";
        pill.textContent = first.name;
        cell.appendChild(pill);

        if (dayEvents.length > 1) {
          const more = document.createElement("span");
          more.className = "calendar-pill calendar-pill--bill";
          more.textContent = `+${dayEvents.length - 1}`;
          cell.appendChild(more);
        }
      }

      container.appendChild(cell);
    }
  }

  function renderBillList(container, events) {
    if (!container) return;

    const priority = { due: 0, upcoming: 1, scheduled: 2 };
    const sorted = [...events].sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return a.day - b.day;
    });

    container.innerHTML = "";

    sorted.forEach((event) => {
      const row = document.createElement("div");
      row.className = `bill-item${event.status === "due" ? " bill-item--urgent" : ""}`;

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="bill-item__name">${escapeHtml(event.name)}</div>
        <div class="bill-item__meta">${ordinal(event.day)} of month${event.autopay ? " • AutoPay" : " • Manual"}</div>
      `;

      const right = document.createElement("div");
      right.className = "bill-item__amount";
      right.innerHTML = `
        <strong>${formatCurrency(event.amount)}</strong>
        <div class="bill-item__status ${statusClass(event.status)}">${event.status}</div>
      `;

      row.appendChild(left);
      row.appendChild(right);
      container.appendChild(row);
    });
  }

  function statusClass(status) {
    if (status === "due") return "is-due";
    if (status === "upcoming") return "is-upcoming";
    return "is-scheduled";
  }

  /* ---------------------------------------------------------
     Forecast
     --------------------------------------------------------- */

  function initForecastPage() {
    const chartSvg = document.getElementById("forecast-chart-svg");
    if (!chartSvg) return;

    const segmentedButtons = Array.from(document.querySelectorAll(".segmented button[data-days]"));
    const compareToggle = document.getElementById("compare-toggle");

    const statEnding = document.getElementById("forecast-ending-balance");
    const statLow = document.getElementById("forecast-low-point");
    const statRunway = document.getElementById("forecast-runway");
    const noteEl = document.getElementById("forecast-note");

    let horizonDays = 60;
    let compareEnabled = true;

    function recompute() {
      const projection = buildProjection(horizonDays);
      const compare = buildProjection(horizonDays, 0.93);

      drawProjection(chartSvg, projection, compareEnabled ? compare : null);

      const ending = projection[projection.length - 1];
      const lowPoint = projection.reduce((min, value) => (value < min ? value : min), Number.POSITIVE_INFINITY);

      if (statEnding) statEnding.textContent = formatCurrency(ending);
      if (statLow) statLow.textContent = formatCurrency(lowPoint);
      if (statRunway) statRunway.textContent = `${Math.round(horizonDays / 30)} mo`;

      if (noteEl) {
        const riskText = lowPoint < 1000
          ? "Risk: projected buffer drops below safety floor."
          : "Healthy: projected buffer remains above safety floor.";
        noteEl.textContent = `${riskText} Consider moving one discretionary payment window to improve stability.`;
      }
    }

    segmentedButtons.forEach((button) => {
      button.addEventListener("click", function () {
        segmentedButtons.forEach((btn) => btn.classList.remove("is-active"));
        button.classList.add("is-active");
        horizonDays = Number(button.dataset.days || "60");
        recompute();
      });
    });

    if (compareToggle) {
      compareToggle.addEventListener("change", function () {
        compareEnabled = compareToggle.checked;
        recompute();
      });
    }

    recompute();
  }

  function buildProjection(days, incomeFactor) {
    const factor = typeof incomeFactor === "number" ? incomeFactor : 1;

    let balance = 6850;
    const values = [];

    for (let day = 1; day <= days; day += 1) {
      const baseExpense = 74 + (day % 6) * 8;
      const recurringExpense = day % 14 === 0 ? 210 : 0;
      const payday = day % 15 === 0 ? 1800 * factor : 0;

      balance += payday;
      balance -= baseExpense;
      balance -= recurringExpense;

      values.push(roundToTwo(balance));
    }

    return values;
  }

  function drawProjection(svg, series, compareSeries) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const width = 1100;
    const height = 330;
    const padding = { top: 24, right: 22, bottom: 36, left: 56 };

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const all = compareSeries ? series.concat(compareSeries) : series;
    const min = Math.min.apply(null, all);
    const max = Math.max.apply(null, all);

    const yMin = Math.floor((min - 400) / 100) * 100;
    const yMax = Math.ceil((max + 400) / 100) * 100;

    function xScale(index) {
      return padding.left + (index / (series.length - 1)) * (width - padding.left - padding.right);
    }

    function yScale(value) {
      return padding.top + ((yMax - value) / (yMax - yMin)) * (height - padding.top - padding.bottom);
    }

    for (let i = 0; i < 5; i += 1) {
      const y = padding.top + (i / 4) * (height - padding.top - padding.bottom);
      svg.appendChild(lineNode(padding.left, y, width - padding.right, y, "rgba(255,255,255,0.07)", "4 6"));

      const labelValue = roundToTwo(yMax - (i / 4) * (yMax - yMin));
      svg.appendChild(textNode(8, y + 4, compactCurrency(labelValue), "#8888A0"));
    }

    const areaPath = pathFromSeries(series, xScale, yScale, true, height - padding.bottom);
    svg.appendChild(pathNode(areaPath, "rgba(201,168,76,0.16)", "none", 0));

    const basePath = pathFromSeries(series, xScale, yScale, false);
    svg.appendChild(pathNode(basePath, "none", "#C9A84C", 3));

    if (compareSeries) {
      const comparePath = pathFromSeries(compareSeries, xScale, yScale, false);
      const compareLine = pathNode(comparePath, "none", "#4C8EF5", 2);
      compareLine.setAttribute("stroke-dasharray", "6 6");
      svg.appendChild(compareLine);
    }

    const endX = xScale(series.length - 1);
    const endY = yScale(series[series.length - 1]);
    svg.appendChild(circleNode(endX, endY, 5, "#C9A84C", "#0A0A0F", 2));

    svg.appendChild(textNode(endX - 14, endY - 12, compactCurrency(series[series.length - 1]), "#F0F0F5", "end"));
  }

  function pathFromSeries(series, xScale, yScale, closePath, bottomY) {
    if (!series.length) return "";

    let d = "";
    series.forEach((value, index) => {
      const x = xScale(index);
      const y = yScale(value);
      d += `${index === 0 ? "M" : "L"}${x} ${y} `;
    });

    if (closePath) {
      const lastX = xScale(series.length - 1);
      const firstX = xScale(0);
      d += `L${lastX} ${bottomY} L${firstX} ${bottomY} Z`;
    }

    return d.trim();
  }

  /* ---------------------------------------------------------
     Debt
     --------------------------------------------------------- */

  function initDebtPayoffPage() {
    const tableBody = document.getElementById("debt-rows");
    if (!tableBody) return;

    const addButton = document.getElementById("add-debt-row");
    const calcButton = document.getElementById("calculate-payoff");
    const extraPaymentInput = document.getElementById("extra-payment");
    const methodButtons = Array.from(document.querySelectorAll(".method-chip[data-method]"));

    const metricMonths = document.getElementById("payoff-months");
    const metricInterest = document.getElementById("payoff-interest");
    const metricFinish = document.getElementById("payoff-finish");
    const payoffPlan = document.getElementById("payoff-plan");

    let payoffMethod = "snowball";

    const seedDebts = [
      { name: "Visa", balance: 4200, apr: 24.9, minPayment: 120 },
      { name: "Car Loan", balance: 9500, apr: 6.2, minPayment: 220 },
      { name: "Student Loan", balance: 13800, apr: 4.8, minPayment: 165 }
    ];

    seedDebts.forEach((debt) => appendDebtRow(tableBody, debt));

    if (addButton) {
      addButton.addEventListener("click", function () {
        appendDebtRow(tableBody, { name: "", balance: 0, apr: 0, minPayment: 0 });
      });
    }

    methodButtons.forEach((button) => {
      button.addEventListener("click", function () {
        methodButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        payoffMethod = button.dataset.method || "snowball";
      });
    });

    if (calcButton) {
      calcButton.addEventListener("click", function () {
        const debts = readDebtRows(tableBody);
        const extra = parseMoney(extraPaymentInput ? extraPaymentInput.value : "0");

        const result = simulatePayoff(debts, extra, payoffMethod);

        if (!result) return;

        if (metricMonths) metricMonths.textContent = `${result.months} mo`;
        if (metricInterest) metricInterest.textContent = formatCurrency(result.totalInterest);
        if (metricFinish) metricFinish.textContent = result.finishDate;

        renderPayoffPlan(payoffPlan, result.sequence, result.months);
      });
    }

    // Initial render
    if (calcButton) calcButton.click();
  }

  function appendDebtRow(container, debt) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" value="${escapeHtml(debt.name)}" placeholder="Debt name" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.balance}" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.apr}" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.minPayment}" /></td>
      <td>
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove debt">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector("button");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        row.remove();
      });
    }

    container.appendChild(row);
  }

  function readDebtRows(container) {
    const rows = Array.from(container.querySelectorAll("tr"));

    return rows
      .map((row) => {
        const inputs = row.querySelectorAll("input");
        return {
          name: inputs[0] ? inputs[0].value.trim() : "Debt",
          balance: parseMoney(inputs[1] ? inputs[1].value : "0"),
          apr: parseMoney(inputs[2] ? inputs[2].value : "0"),
          minPayment: parseMoney(inputs[3] ? inputs[3].value : "0")
        };
      })
      .filter((debt) => debt.balance > 0 && debt.minPayment > 0);
  }

  function simulatePayoff(debts, extraPayment, method) {
    if (!debts.length) return null;

    const state = debts.map((debt, index) => ({
      id: index + 1,
      name: debt.name || `Debt ${index + 1}`,
      balance: debt.balance,
      apr: debt.apr,
      minPayment: debt.minPayment,
      paidMonth: null,
      totalPaid: 0
    }));

    let months = 0;
    let totalInterest = 0;

    while (months < 600 && state.some((item) => item.balance > 0.01)) {
      months += 1;

      // Accrue monthly interest first.
      state.forEach((item) => {
        if (item.balance <= 0) return;
        const interest = item.balance * (item.apr / 100 / 12);
        item.balance += interest;
        totalInterest += interest;
      });

      // Pay minimums for each active debt.
      let snowballPool = extraPayment;

      state.forEach((item) => {
        if (item.balance <= 0) return;

        const payment = Math.min(item.balance, item.minPayment);
        item.balance -= payment;
        item.totalPaid += payment;
      });

      // Determine payoff priority for extra payment.
      const remaining = state.filter((item) => item.balance > 0.01);
      remaining.sort((a, b) => {
        if (method === "avalanche") {
          if (b.apr !== a.apr) return b.apr - a.apr;
          return a.balance - b.balance;
        }
        if (a.balance !== b.balance) return a.balance - b.balance;
        return b.apr - a.apr;
      });

      for (let i = 0; i < remaining.length; i += 1) {
        if (snowballPool <= 0) break;
        const debt = remaining[i];
        const extra = Math.min(debt.balance, snowballPool);
        debt.balance -= extra;
        debt.totalPaid += extra;
        snowballPool -= extra;
      }

      state.forEach((item) => {
        if (item.balance <= 0.01) {
          item.balance = 0;
          if (!item.paidMonth) item.paidMonth = months;
        }
      });
    }

    const finish = new Date();
    finish.setMonth(finish.getMonth() + months);

    const sequence = state
      .slice()
      .sort((a, b) => (a.paidMonth || 999) - (b.paidMonth || 999))
      .map((item) => ({
        name: item.name,
        month: item.paidMonth || months,
        totalPaid: item.totalPaid
      }));

    return {
      months,
      totalInterest: roundToTwo(totalInterest),
      finishDate: new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(finish),
      sequence
    };
  }

  function renderPayoffPlan(container, sequence, totalMonths) {
    if (!container) return;

    container.innerHTML = "";

    sequence.forEach((entry) => {
      const progress = totalMonths ? Math.min(100, Math.max(5, (entry.month / totalMonths) * 100)) : 0;
      const row = document.createElement("div");
      row.className = "payoff-step";
      row.innerHTML = `
        <div class="payoff-step__row">
          <div>
            <div class="payoff-step__name">${escapeHtml(entry.name)}</div>
            <div class="payoff-step__meta">Paid off in month ${entry.month}</div>
          </div>
          <div class="payoff-step__meta">${formatCurrency(entry.totalPaid)}</div>
        </div>
        <div class="payoff-step__bar"><span style="width: ${progress.toFixed(1)}%"></span></div>
      `;
      container.appendChild(row);
    });
  }

  /* ---------------------------------------------------------
     Investment Projector
     --------------------------------------------------------- */

  function initInvestmentProjectorPage() {
    const form = document.getElementById("investment-form");
    if (!form) return;

    const resultValue = document.getElementById("projected-future-value");
    const resultReal = document.getElementById("projected-real-value");
    const curveSvg = document.getElementById("projector-curve-svg");
    const milestonesContainer = document.getElementById("projector-milestones");

    function computeProjection() {
      const principal = parseMoney(getInputValue("principal"));
      const monthly = parseMoney(getInputValue("monthly-contribution"));
      const annualReturn = parseMoney(getInputValue("annual-return"));
      const years = Math.max(1, Math.floor(parseMoney(getInputValue("investment-years"))));
      const inflation = Math.max(0, parseMoney(getInputValue("inflation-rate")));

      const timeline = buildInvestmentTimeline(principal, monthly, annualReturn, years);
      const futureValue = timeline[timeline.length - 1] || principal;

      const inflationFactor = Math.pow(1 + inflation / 100, years);
      const realValue = futureValue / inflationFactor;

      if (resultValue) resultValue.textContent = formatCurrency(futureValue);
      if (resultReal) resultReal.textContent = `${formatCurrency(realValue)} in today's pounds`;

      if (curveSvg) drawInvestmentCurve(curveSvg, timeline);
      if (milestonesContainer) renderMilestones(milestonesContainer, timeline, years);
    }

    form.addEventListener("input", computeProjection);
    computeProjection();
  }

  function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value : "0";
  }

  function buildInvestmentTimeline(principal, monthly, annualReturn, years) {
    const months = years * 12;
    const monthlyRate = annualReturn / 100 / 12;
    const values = [];

    let balance = principal;

    for (let month = 1; month <= months; month += 1) {
      balance += monthly;
      balance *= (1 + monthlyRate);

      if (month % 12 === 0) {
        values.push(roundToTwo(balance));
      }
    }

    return values;
  }

  function drawInvestmentCurve(svg, values) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (!values.length) return;

    const width = 760;
    const height = 190;
    const pad = { top: 12, right: 10, bottom: 16, left: 26 };

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const max = Math.max.apply(null, values) * 1.05;
    const min = Math.min.apply(null, values) * 0.95;

    function xScale(index) {
      return pad.left + (index / (values.length - 1 || 1)) * (width - pad.left - pad.right);
    }

    function yScale(value) {
      return pad.top + ((max - value) / (max - min || 1)) * (height - pad.top - pad.bottom);
    }

    const area = pathFromSeries(values, xScale, yScale, true, height - pad.bottom);
    const line = pathFromSeries(values, xScale, yScale, false);

    svg.appendChild(pathNode(area, "rgba(46, 204, 138, 0.2)", "none", 0));
    svg.appendChild(pathNode(line, "none", "#2ECC8A", 2.5));

    const lastX = xScale(values.length - 1);
    const lastY = yScale(values[values.length - 1]);
    svg.appendChild(circleNode(lastX, lastY, 4, "#2ECC8A", "#0A0A0F", 2));
  }

  function renderMilestones(container, timeline, years) {
    container.innerHTML = "";

    const points = [
      Math.min(5, years),
      Math.min(10, years),
      Math.min(15, years),
      years
    ];

    const uniqueYears = Array.from(new Set(points)).filter((year) => year > 0);

    uniqueYears.forEach((yearPoint) => {
      const value = timeline[yearPoint - 1] || timeline[timeline.length - 1] || 0;
      const item = document.createElement("div");
      item.className = "milestone";
      item.innerHTML = `
        <div>
          <div class="milestone__title">Year ${yearPoint}</div>
          <div class="milestone__meta">Projected portfolio checkpoint</div>
        </div>
        <div class="milestone__value">${formatCurrency(value)}</div>
      `;
      container.appendChild(item);
    });
  }

  /* ---------------------------------------------------------
     SVG helpers
     --------------------------------------------------------- */

  function lineNode(x1, y1, x2, y2, stroke, dash) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", "1");
    if (dash) line.setAttribute("stroke-dasharray", dash);
    return line;
  }

  function pathNode(d, fill, stroke, width) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", stroke);
    path.setAttribute("stroke-width", String(width));
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    return path;
  }

  function textNode(x, y, text, fill, anchor) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
    node.setAttribute("x", String(x));
    node.setAttribute("y", String(y));
    node.setAttribute("fill", fill || "#8888A0");
    node.setAttribute("font-size", "11");
    node.setAttribute("font-family", "JetBrains Mono, IBM Plex Mono, monospace");
    if (anchor) node.setAttribute("text-anchor", anchor);
    node.textContent = text;
    return node;
  }

  function circleNode(cx, cy, r, fill, stroke, width) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    node.setAttribute("cx", String(cx));
    node.setAttribute("cy", String(cy));
    node.setAttribute("r", String(r));
    node.setAttribute("fill", fill);
    node.setAttribute("stroke", stroke);
    node.setAttribute("stroke-width", String(width));
    return node;
  }

  /* ---------------------------------------------------------
     Generic helpers
     --------------------------------------------------------- */

  function parseMoney(raw) {
    const num = Number(String(raw || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(num) ? num : 0;
  }

  function formatCurrency(value) {
    if (typeof window.formatCurrency === "function") {
      return window.formatCurrency(value, DEFAULT_CURRENCY, false);
    }

    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function compactCurrency(value) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (abs >= 1000000) return `${sign}EGP ${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}EGP ${(abs / 1000).toFixed(1)}k`;
    return `${sign}EGP ${abs.toFixed(0)}`;
  }

  function roundToTwo(value) {
    return Math.round(value * 100) / 100;
  }

  function ordinal(day) {
    const n = Number(day);
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
