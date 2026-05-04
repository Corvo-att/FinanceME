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
  const STORAGE_KEYS = {
    bills: "financeme.planning.bills",
    forecast: "financeme.planning.forecast",
    debts: "financeme.planning.debts",
    investment: "financeme.planning.investment"
  };

  function readJsonStorage(key, fallback) {
    if (!window.localStorage) return fallback;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;

      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    if (!window.localStorage) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore storage quota and privacy mode failures.
    }
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

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
    const summaryCountInline = document.getElementById("bill-summary-count-inline");
    const billList = document.getElementById("bill-list");
    const billForm = document.getElementById("bill-form");
    const billFormPanel = document.getElementById("bill-form-panel");
    const billFormToggle = document.getElementById("bill-form-toggle");
    const billNameInput = document.getElementById("bill-name");
    const billDayInput = document.getElementById("bill-day");
    const billAmountInput = document.getElementById("bill-amount");
    const billStatusInput = document.getElementById("bill-status");
    const billAutopayInput = document.getElementById("bill-autopay");

    let billEvents = normalizeBillEvents(readJsonStorage(STORAGE_KEYS.bills, []));

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (monthLabel) {
      monthLabel.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);
    }

    function setBillFormOpen(isOpen) {
      if (billFormPanel) billFormPanel.classList.toggle("is-open", isOpen);
      if (billFormToggle) billFormToggle.setAttribute("aria-expanded", String(isOpen));
    }

    function renderBillCalendar() {
      renderCalendarMonth(calendarGrid, year, month, billEvents);
      renderBillList(billList, billEvents, function (id) {
        billEvents = billEvents.filter((event) => event.id !== id);
        persistBillEvents();
        renderBillCalendar();
      });

      const totalDue = billEvents.reduce((sum, event) => sum + event.amount, 0);
      const autoPayCount = billEvents.filter((event) => event.autopay).length;

      if (summaryDue) summaryDue.textContent = formatCurrency(totalDue);
      if (summaryAutopay) summaryAutopay.textContent = `${autoPayCount}/${billEvents.length}`;
      if (summaryCount) summaryCount.textContent = String(billEvents.length);
      if (summaryCountInline) {
        summaryCountInline.textContent = `${billEvents.length} item${billEvents.length === 1 ? "" : "s"}`;
      }
    }

    function persistBillEvents() {
      writeJsonStorage(STORAGE_KEYS.bills, billEvents);
    }

    if (billForm) {
      billForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = billNameInput ? billNameInput.value.trim() : "";
        const day = clampInteger(billDayInput ? billDayInput.value : "", 1, 31, 1);
        const amount = parseMoney(billAmountInput ? billAmountInput.value : "0");
        const status = normalizeBillStatus(billStatusInput ? billStatusInput.value : "scheduled");
        const autopay = billAutopayInput ? billAutopayInput.value === "true" : false;

        if (!name || amount <= 0) return;

        billEvents = billEvents.concat([
          {
            id: createId("bill"),
            name,
            day,
            amount,
            status,
            autopay
          }
        ]);

        persistBillEvents();
        renderBillCalendar();
        billForm.reset();

        if (billStatusInput) billStatusInput.value = "scheduled";
        if (billAutopayInput) billAutopayInput.value = "false";
        if (billNameInput) billNameInput.focus();
        setBillFormOpen(true);
      });
    }

    if (billFormToggle) {
      billFormToggle.addEventListener("click", function () {
        const isOpen = billFormPanel ? billFormPanel.classList.contains("is-open") : false;
        setBillFormOpen(!isOpen);
      });
    }

    renderBillCalendar();
    setBillFormOpen(false);
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

  function renderBillList(container, events, onRemove) {
    if (!container) return;

    const priority = { due: 0, upcoming: 1, scheduled: 2 };
    const sorted = [...events].sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return a.day - b.day;
    });

    container.innerHTML = "";

    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "bill-list-empty";
      empty.innerHTML = `
        <div class="bill-list-empty__title">No upcoming payments yet</div>
        <div class="bill-list-empty__copy">Use the entry panel above to add bills, transfers, or any custom recurring payment.</div>
      `;
      container.appendChild(empty);
      return;
    }

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

      if (typeof onRemove === "function") {
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-ghost btn-sm";
        removeButton.style.marginTop = "var(--space-xs)";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", function () {
          onRemove(event.id);
        });
        right.appendChild(removeButton);
      }

      row.appendChild(left);
      row.appendChild(right);
      container.appendChild(row);
    });
  }

  function normalizeBillEvents(events) {
    if (!Array.isArray(events)) return [];

    return events
      .map((event) => ({
        id: event && event.id ? String(event.id) : createId("bill"),
        name: String((event && event.name) || "").trim(),
        day: clampInteger(event && event.day, 1, 31, 1),
        amount: parseMoney(event && event.amount),
        status: normalizeBillStatus(event && event.status),
        autopay: Boolean(event && event.autopay)
      }))
      .filter((event) => event.name && event.amount > 0);
  }

  function normalizeBillStatus(status) {
    if (status === "due" || status === "upcoming" || status === "scheduled") return status;
    return "scheduled";
  }

  function statusClass(status) {
    if (status === "due") return "is-due";
    if (status === "upcoming") return "is-upcoming";
    return "is-scheduled";
  }

  function renderForecastEventList(container, events, onRemove) {
    if (!container) return;

    const sorted = [...(Array.isArray(events) ? events : [])].sort((a, b) => a.day - b.day);
    container.innerHTML = "";

    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "text-caption";
      empty.style.color = "var(--text-secondary)";
      empty.textContent = "Add cash events to drive the forecast.";
      container.appendChild(empty);
      return;
    }

    sorted.forEach((event) => {
      const row = document.createElement("div");
      row.className = `bill-item${event.amount < 0 ? " bill-item--urgent" : ""}`;

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="bill-item__name">${escapeHtml(event.label)}</div>
        <div class="bill-item__meta">Day ${event.day}</div>
      `;

      const right = document.createElement("div");
      right.className = "bill-item__amount";
      right.innerHTML = `
        <strong class="${event.amount >= 0 ? "is-positive" : "is-negative"}">${formatCurrency(Math.abs(event.amount))}</strong>
        <div class="bill-item__status ${event.amount >= 0 ? "is-upcoming" : "is-due"}">${event.amount >= 0 ? "inflow" : "outflow"}</div>
      `;

      if (typeof onRemove === "function") {
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-ghost btn-sm";
        removeButton.style.marginTop = "var(--space-xs)";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", function () {
          onRemove(event.id);
        });
        right.appendChild(removeButton);
      }

      row.appendChild(left);
      row.appendChild(right);
      container.appendChild(row);
    });
  }

  function normalizeForecastState(state) {
    const fallback = {
      balance: 0,
      horizon: 60,
      compare: true,
      events: []
    };

    if (!state || typeof state !== "object") return fallback;

    return {
      balance: parseMoney(state.balance),
      horizon: clampInteger(state.horizon, 1, 365, 60),
      compare: state.compare !== false,
      events: Array.isArray(state.events) ? state.events.map(normalizeForecastEvent).filter(Boolean) : []
    };
  }

  function normalizeForecastEvent(event) {
    if (!event || typeof event !== "object") return null;

    const label = String(event.label || event.name || "").trim();
    const amount = parseMoney(event.amount);

    if (!label || amount === 0) return null;

    return {
      id: event.id ? String(event.id) : createId("forecast"),
      day: clampInteger(event.day, 1, 365, 1),
      label,
      amount
    };
  }

  /* ---------------------------------------------------------
     Forecast
     --------------------------------------------------------- */

  function initForecastPage() {
    const chartSvg = document.getElementById("forecast-chart-svg");
    if (!chartSvg) return;

    const segmentedButtons = Array.from(document.querySelectorAll(".segmented button[data-days]"));
    const compareToggle = document.getElementById("compare-toggle");
    const balanceInput = document.getElementById("forecast-balance");
    const horizonInput = document.getElementById("forecast-horizon");
    const eventForm = document.getElementById("forecast-event-form");
    const eventDayInput = document.getElementById("forecast-event-day");
    const eventLabelInput = document.getElementById("forecast-event-label");
    const eventAmountInput = document.getElementById("forecast-event-amount");
    const eventTypeInput = document.getElementById("forecast-event-type");
    const eventList = document.getElementById("forecast-event-list");

    const statEnding = document.getElementById("forecast-ending-balance");
    const statLow = document.getElementById("forecast-low-point");
    const statRunway = document.getElementById("forecast-runway");
    const noteEl = document.getElementById("forecast-note");

    let forecastState = normalizeForecastState(readJsonStorage(STORAGE_KEYS.forecast, null));

    function persistForecastState() {
      writeJsonStorage(STORAGE_KEYS.forecast, forecastState);
    }

    function syncForecastControls() {
      if (balanceInput) balanceInput.value = forecastState.balance ? String(forecastState.balance) : "";
      if (horizonInput) horizonInput.value = String(forecastState.horizon);
      if (compareToggle) compareToggle.checked = forecastState.compare;

      if (eventTypeInput) eventTypeInput.value = "outflow";
      if (eventDayInput) eventDayInput.value = "";
      if (eventLabelInput) eventLabelInput.value = "";
      if (eventAmountInput) eventAmountInput.value = "";
    }

    function activeHorizon() {
      return clampInteger(horizonInput ? horizonInput.value : forecastState.horizon, 1, 365, forecastState.horizon);
    }

    function updatePresetButtons() {
      const horizon = activeHorizon();
      segmentedButtons.forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.days || "0") === horizon);
      });
    }

    function renderForecastEvents() {
      renderForecastEventList(eventList, forecastState.events, function (id) {
        forecastState.events = forecastState.events.filter((event) => event.id !== id);
        persistForecastState();
        recompute();
      });
    }

    function recompute() {
      forecastState.balance = parseMoney(balanceInput ? balanceInput.value : forecastState.balance);
      forecastState.horizon = activeHorizon();
      forecastState.compare = compareToggle ? compareToggle.checked : forecastState.compare;

      persistForecastState();

      const projection = buildProjection(forecastState.horizon, forecastState.balance, forecastState.events);
      const compare = buildProjection(
        forecastState.horizon,
        forecastState.balance * 0.93,
        forecastState.events,
        0.93
      );

      drawProjection(chartSvg, projection, forecastState.compare ? compare : null);

      const ending = projection.length ? projection[projection.length - 1] : forecastState.balance;
      const lowPoint = projection.length
        ? projection.reduce((min, value) => (value < min ? value : min), Number.POSITIVE_INFINITY)
        : forecastState.balance;

      if (statEnding) statEnding.textContent = formatCurrency(ending);
      if (statLow) statLow.textContent = formatCurrency(lowPoint);
      if (statRunway) statRunway.textContent = `${Math.max(1, Math.ceil(forecastState.horizon / 30))} mo`;

      if (noteEl) {
        const riskText = lowPoint < forecastState.balance * 0.7
          ? "Risk: projected buffer falls sharply against your starting balance."
          : "Healthy: projected buffer stays within your chosen horizon.";
        noteEl.textContent = `${riskText} Add or remove cash events to model a different payment path.`;
      }

      updatePresetButtons();
      renderForecastEvents();
    }

    syncForecastControls();

    if (balanceInput) {
      balanceInput.addEventListener("input", function () {
        forecastState.balance = parseMoney(balanceInput.value);
        recompute();
      });
    }

    if (horizonInput) {
      horizonInput.addEventListener("input", function () {
        forecastState.horizon = activeHorizon();
        recompute();
      });
    }

    if (eventForm) {
      eventForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const label = eventLabelInput ? eventLabelInput.value.trim() : "";
        const day = clampInteger(eventDayInput ? eventDayInput.value : "", 1, 365, 1);
        const amount = parseMoney(eventAmountInput ? eventAmountInput.value : "0");
        const type = eventTypeInput ? eventTypeInput.value : "outflow";

        if (!label || amount <= 0) return;

        forecastState.events = forecastState.events.concat([
          normalizeForecastEvent({
            id: createId("forecast"),
            day,
            label,
            amount: type === "inflow" ? amount : -amount
          })
        ]);

        persistForecastState();
        syncForecastControls();
        recompute();
      });
    }

    segmentedButtons.forEach((button) => {
      button.addEventListener("click", function () {
        segmentedButtons.forEach((btn) => btn.classList.remove("is-active"));
        button.classList.add("is-active");
        forecastState.horizon = Number(button.dataset.days || forecastState.horizon);
        if (horizonInput) horizonInput.value = String(forecastState.horizon);
        recompute();
      });
    });

    if (compareToggle) {
      compareToggle.addEventListener("change", function () {
        forecastState.compare = compareToggle.checked;
        recompute();
      });
    }

    recompute();
  }

  function buildProjection(days, startingBalance, events, compareFactor) {
    const factor = typeof compareFactor === "number" ? compareFactor : 1;

    const eventMap = new Map();
    (Array.isArray(events) ? events : []).forEach((event) => {
      const day = clampInteger(event.day, 1, 365, 1);
      const dayEvents = eventMap.get(day) || [];
      dayEvents.push(event);
      eventMap.set(day, dayEvents);
    });

    let balance = parseMoney(startingBalance);
    const values = [];

    for (let day = 1; day <= days; day += 1) {
      const dayEvents = eventMap.get(day) || [];
      dayEvents.forEach((event) => {
        const amount = event.amount >= 0 ? event.amount * factor : event.amount / factor;
        balance += amount;
      });

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
      return padding.left + (index / (series.length - 1 || 1)) * (width - padding.left - padding.right);
    }

    function yScale(value) {
      return padding.top + ((yMax - value) / (yMax - yMin || 1)) * (height - padding.top - padding.bottom);
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
    const storedDebts = normalizeDebtRows(readJsonStorage(STORAGE_KEYS.debts, []));

    if (storedDebts.length) {
      storedDebts.forEach((debt) => appendDebtRow(tableBody, debt, persistDebtRows));
    } else {
      appendDebtRow(tableBody, { name: "", balance: "", apr: "", minPayment: "" }, persistDebtRows);
    }

    function persistDebtRows() {
      writeJsonStorage(STORAGE_KEYS.debts, readDebtRows(tableBody));
    }

    tableBody.addEventListener("input", persistDebtRows);
    tableBody.addEventListener("change", persistDebtRows);

    if (addButton) {
      addButton.addEventListener("click", function () {
        appendDebtRow(tableBody, { name: "", balance: "", apr: "", minPayment: "" }, persistDebtRows);
        persistDebtRows();
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
        persistDebtRows();
      });
    }

    // Initial render
    if (calcButton) calcButton.click();
  }

  function appendDebtRow(container, debt, onRemove) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" value="${escapeHtml(debt.name || "")}" placeholder="Debt name" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.balance ?? ""}" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.apr ?? ""}" /></td>
      <td><input type="number" min="0" step="0.01" value="${debt.minPayment ?? ""}" /></td>
      <td>
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove debt">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector("button");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        row.remove();
        if (typeof onRemove === "function") onRemove();
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

  function normalizeDebtRows(debts) {
    if (!Array.isArray(debts)) return [];

    return debts
      .map((debt) => ({
        name: String((debt && debt.name) || "").trim(),
        balance: parseMoney(debt && debt.balance),
        apr: parseMoney(debt && debt.apr),
        minPayment: parseMoney(debt && debt.minPayment)
      }))
      .filter((debt) => debt.name && debt.balance > 0 && debt.minPayment > 0);
  }

  function normalizeInvestmentState(state) {
    if (!state || typeof state !== "object") {
      return {
        principal: 0,
        monthlyContribution: 0,
        annualReturn: 0,
        investmentYears: 1,
        inflationRate: 0
      };
    }

    return {
      principal: parseMoney(state.principal),
      monthlyContribution: parseMoney(state.monthlyContribution),
      annualReturn: parseMoney(state.annualReturn),
      investmentYears: clampInteger(state.investmentYears, 1, 50, 1),
      inflationRate: parseMoney(state.inflationRate)
    };
  }

  function clampInteger(value, min, max, fallback) {
    const num = Math.floor(parseMoney(value));
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num || fallback));
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

    const principalInput = document.getElementById("principal");
    const monthlyInput = document.getElementById("monthly-contribution");
    const returnInput = document.getElementById("annual-return");
    const yearsInput = document.getElementById("investment-years");
    const inflationInput = document.getElementById("inflation-rate");
    const resultValue = document.getElementById("projected-future-value");
    const resultReal = document.getElementById("projected-real-value");
    const curveSvg = document.getElementById("projector-curve-svg");
    const milestonesContainer = document.getElementById("projector-milestones");

    const storedInvestment = normalizeInvestmentState(readJsonStorage(STORAGE_KEYS.investment, null));

    function syncInvestmentInputs() {
      if (principalInput) principalInput.value = storedInvestment.principal > 0 ? String(storedInvestment.principal) : "";
      if (monthlyInput) monthlyInput.value = storedInvestment.monthlyContribution > 0 ? String(storedInvestment.monthlyContribution) : "";
      if (returnInput) returnInput.value = storedInvestment.annualReturn > 0 ? String(storedInvestment.annualReturn) : "";
      if (yearsInput) yearsInput.value = storedInvestment.investmentYears > 0 ? String(storedInvestment.investmentYears) : "";
      if (inflationInput) inflationInput.value = storedInvestment.inflationRate > 0 ? String(storedInvestment.inflationRate) : "";
    }

    function persistInvestmentState() {
      writeJsonStorage(STORAGE_KEYS.investment, {
        principal: parseMoney(principalInput ? principalInput.value : "0"),
        monthlyContribution: parseMoney(monthlyInput ? monthlyInput.value : "0"),
        annualReturn: parseMoney(returnInput ? returnInput.value : "0"),
        investmentYears: clampInteger(yearsInput ? yearsInput.value : "", 1, 50, 1),
        inflationRate: parseMoney(inflationInput ? inflationInput.value : "0")
      });
    }

    syncInvestmentInputs();

    function computeProjection() {
      const principal = parseMoney(getInputValue("principal"));
      const monthly = parseMoney(getInputValue("monthly-contribution"));
      const annualReturn = parseMoney(getInputValue("annual-return"));
      const years = clampInteger(getInputValue("investment-years"), 1, 50, 1);
      const inflation = Math.max(0, parseMoney(getInputValue("inflation-rate")));

      const timeline = buildInvestmentTimeline(principal, monthly, annualReturn, years);
      const futureValue = timeline[timeline.length - 1] || principal;

      const inflationFactor = Math.pow(1 + inflation / 100, years);
      const realValue = futureValue / inflationFactor;

      if (resultValue) resultValue.textContent = formatCurrency(futureValue);
      if (resultReal) resultReal.textContent = `${formatCurrency(realValue)} in today's pounds`;

      if (curveSvg) drawInvestmentCurve(curveSvg, timeline);
      if (milestonesContainer) renderMilestones(milestonesContainer, timeline, years);

      persistInvestmentState();
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
