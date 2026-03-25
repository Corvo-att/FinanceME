/* ============================================================
   FINANCEME — Goals & Savings Script (goals.js)
   Shared behavior for:
   - goals.html (overview)
   - goal-detail.html
   - add-goal.html
   ============================================================ */

(function () {
  "use strict";

  const GOALS_STORAGE_KEY = "financeme_goals_v1";
  const CONTRIBUTIONS_STORAGE_KEY = "financeme_goal_contributions_v1";
  const CIRCLE_RADIUS = 52;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  document.addEventListener("DOMContentLoaded", function () {
    ensureSeedData();

    const body = document.body;
    if (body.classList.contains("goals-page")) initGoalsOverviewPage();
    if (body.classList.contains("goals-detail-page")) initGoalDetailPage();
    if (body.classList.contains("goal-editor-page")) initGoalEditorPage();
  });

  function ensureSeedData() {
    const goals = readGoals();
    const contributions = readContributions();

    if (!goals.length) {
      writeGoals(defaultGoals());
    }

    if (!contributions.length) {
      writeContributions(defaultContributions());
    }
  }

  function initGoalsOverviewPage() {
    const goalsGrid = document.getElementById("goals-grid");
    const completedGrid = document.getElementById("completed-goals-grid");

    if (!goalsGrid || !completedGrid) return;

    const searchInput = document.getElementById("goal-search");
    const statusFilter = document.getElementById("goal-status-filter");
    const sortSelect = document.getElementById("goal-sort");
    const resetButton = document.getElementById("reset-filters");

    const modal = document.getElementById("contribute-modal");
    const modalGoalName = document.getElementById("contribute-goal-name");
    const amountInput = document.getElementById("contribution-amount");
    const noteInput = document.getElementById("contribution-note");
    const saveButton = document.getElementById("save-contribution");
    const closeButton = document.getElementById("close-contribute-modal");
    const cancelButton = document.getElementById("cancel-contribution");

    let selectedGoalId = null;

    function update() {
      const state = getGoalsState();
      const activeGoals = state.goals.filter(function (goal) {
        return !goal.completed;
      });
      const completedGoals = state.goals.filter(function (goal) {
        return goal.completed;
      });

      const query = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
      const filter = statusFilter ? statusFilter.value : "all";
      const sort = sortSelect ? sortSelect.value : "nearest-deadline";

      let filtered = activeGoals.filter(function (goal) {
        const matchQuery = !query || goal.name.toLowerCase().includes(query) || goal.category.toLowerCase().includes(query);
        const matchStatus = filter === "all" || goal.status === filter;
        return matchQuery && matchStatus;
      });

      filtered = sortGoals(filtered, sort);

      renderGoalCards(goalsGrid, filtered, false);
      renderGoalCards(completedGrid, completedGoals, true);
      fillOverviewMetrics(state);

      bindContributeButtons(filtered.concat(completedGoals));
    }

    function bindContributeButtons(source) {
      const contributeButtons = document.querySelectorAll("[data-contribute-id]");
      contributeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          const goalId = button.getAttribute("data-contribute-id");
          const goal = source.find(function (item) {
            return item.id === goalId;
          });
          if (!goal || goal.completed) return;

          selectedGoalId = goalId;
          if (modalGoalName) modalGoalName.textContent = "Goal: " + goal.icon + " " + goal.name;
          if (amountInput) amountInput.value = goal.monthlyContribution.toFixed(2);
          if (noteInput) noteInput.value = "";
          openModal(modal);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", update);
    if (statusFilter) statusFilter.addEventListener("change", update);
    if (sortSelect) sortSelect.addEventListener("change", update);

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "all";
        if (sortSelect) sortSelect.value = "nearest-deadline";
        update();
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        if (!selectedGoalId) return;

        const amount = parseFloat(amountInput && amountInput.value ? amountInput.value : "0");
        if (!isFinite(amount) || amount <= 0) return;

        const goals = readGoals();
        const goal = goals.find(function (item) {
          return item.id === selectedGoalId;
        });

        if (!goal) return;

        goal.current = roundMoney(goal.current + amount);
        if (goal.current >= goal.target) {
          goal.current = goal.target;
          goal.completed = true;
          goal.completedOn = todayISODate();
        }

        writeGoals(goals);

        const contributions = readContributions();
        contributions.unshift({
          id: buildId("contrib"),
          goalId: selectedGoalId,
          date: todayISODate(),
          amount: roundMoney(amount),
          channel: "Manual transfer",
          note: (noteInput && noteInput.value ? noteInput.value.trim() : "") || "Quick contribution"
        });
        writeContributions(contributions);

        closeModal(modal);
        selectedGoalId = null;
        update();
      });
    }

    [closeButton, cancelButton].forEach(function (button) {
      if (!button) return;
      button.addEventListener("click", function () {
        closeModal(modal);
      });
    });

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal(modal);
      });
    }

    update();
  }

  function initGoalDetailPage() {
    const goals = getGoalsState().goals;
    if (!goals.length) return;

    const goalId = new URLSearchParams(window.location.search).get("id");
    const goal = goals.find(function (item) {
      return item.id === goalId;
    }) || goals[0];

    fillText("goal-detail-title", goal.icon + " " + goal.name);
    fillText("goal-detail-subtitle", "Category: " + goal.category + " | Deadline: " + formatDateShort(goal.deadline));
    fillText("projection-hint", "Projection through " + formatDateShort(goal.deadline));

    const editLink = document.getElementById("edit-goal-link");
    if (editLink) editLink.href = "add-goal.html?id=" + encodeURIComponent(goal.id);

    fillText("snapshot-saved", formatCurrency(goal.current));
    fillText("snapshot-target", formatCurrency(goal.target));
    fillText("snapshot-gap", formatCurrency(Math.max(goal.target - goal.current, 0)));
    fillText("snapshot-monthly", formatCurrency(goal.monthlyContribution));
    fillText("snapshot-completion", projectCompletionLabel(goal));

    fillText("detail-contribute-goal", "Goal: " + goal.icon + " " + goal.name);

    renderGoalHistory(goal.id);
    renderRecentContributionList(goal.id);
    renderGoalProjectionChart(goal);

    const modal = document.getElementById("detail-contribute-modal");
    const openButton = document.getElementById("quick-contribute-btn");
    const closeButton = document.getElementById("detail-contribute-close");
    const cancelButton = document.getElementById("detail-contribute-cancel");
    const saveButton = document.getElementById("detail-contribute-save");

    const amountInput = document.getElementById("detail-contribution-amount");
    const channelSelect = document.getElementById("detail-contribution-channel");
    const noteInput = document.getElementById("detail-contribution-note");

    if (openButton) {
      openButton.addEventListener("click", function () {
        if (amountInput) amountInput.value = goal.monthlyContribution.toFixed(2);
        if (noteInput) noteInput.value = "";
        openModal(modal);
      });
    }

    [closeButton, cancelButton].forEach(function (button) {
      if (!button) return;
      button.addEventListener("click", function () {
        closeModal(modal);
      });
    });

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal(modal);
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        const amount = parseFloat(amountInput && amountInput.value ? amountInput.value : "0");
        if (!isFinite(amount) || amount <= 0) return;

        const updatedGoals = readGoals();
        const targetGoal = updatedGoals.find(function (item) {
          return item.id === goal.id;
        });

        if (!targetGoal) return;

        targetGoal.current = roundMoney(targetGoal.current + amount);
        if (targetGoal.current >= targetGoal.target) {
          targetGoal.current = targetGoal.target;
          targetGoal.completed = true;
          targetGoal.completedOn = todayISODate();
        }

        writeGoals(updatedGoals);

        const contributions = readContributions();
        contributions.unshift({
          id: buildId("contrib"),
          goalId: goal.id,
          date: todayISODate(),
          amount: roundMoney(amount),
          channel: channelSelect && channelSelect.value ? channelSelect.value : "Manual transfer",
          note: (noteInput && noteInput.value ? noteInput.value.trim() : "") || "Detail page contribution"
        });
        writeContributions(contributions);

        window.location.search = "?id=" + encodeURIComponent(goal.id);
      });
    }
  }

  function initGoalEditorPage() {
    const form = document.getElementById("goal-editor-form");
    if (!form) return;

    const fieldName = document.getElementById("goal-name");
    const fieldTarget = document.getElementById("goal-target");
    const fieldCurrent = document.getElementById("goal-current");
    const fieldDeadline = document.getElementById("goal-deadline");
    const fieldMonthly = document.getElementById("goal-monthly");
    const fieldCategory = document.getElementById("goal-category");
    const fieldPriority = document.getElementById("goal-priority");
    const fieldNotes = document.getElementById("goal-notes");

    const ringNode = document.getElementById("editor-ring-progress");
    const percentNode = document.getElementById("editor-percent");
    const needNode = document.getElementById("editor-monthly-need");
    const projectedNode = document.getElementById("editor-projected-date");
    const gapNode = document.getElementById("editor-gap");
    const riskChip = document.getElementById("editor-risk-chip");

    const titleNode = document.getElementById("goal-editor-title");
    const saveButton = document.getElementById("goal-save-btn");

    const goalId = new URLSearchParams(window.location.search).get("id");
    const goals = readGoals();
    const existingGoal = goals.find(function (goal) {
      return goal.id === goalId;
    });

    if (existingGoal) {
      if (titleNode) titleNode.textContent = "Edit Goal";
      if (saveButton) saveButton.textContent = "Update Goal";

      fieldName.value = existingGoal.name;
      fieldTarget.value = existingGoal.target;
      fieldCurrent.value = existingGoal.current;
      fieldDeadline.value = existingGoal.deadline;
      fieldMonthly.value = existingGoal.monthlyContribution;
      fieldCategory.value = existingGoal.category;
      fieldPriority.value = existingGoal.priority || "Medium";
      fieldNotes.value = existingGoal.notes || "";
    } else {
      fieldDeadline.value = buildFutureDate(180);
    }

    function updatePreview() {
      const target = parseFloat(fieldTarget.value || "0");
      const current = parseFloat(fieldCurrent.value || "0");
      const monthly = parseFloat(fieldMonthly.value || "0");
      const deadline = fieldDeadline.value;

      const safeTarget = isFinite(target) && target > 0 ? target : 0;
      const safeCurrent = isFinite(current) && current > 0 ? current : 0;
      const safeMonthly = isFinite(monthly) && monthly > 0 ? monthly : 0;

      const percent = safeTarget > 0 ? clamp((safeCurrent / safeTarget) * 100, 0, 100) : 0;
      setRingValue(ringNode, percent);
      if (percentNode) percentNode.textContent = percent.toFixed(0) + "%";

      const gap = Math.max(safeTarget - safeCurrent, 0);
      if (gapNode) gapNode.textContent = formatCurrency(gap);

      const monthsUntilDeadline = Math.max(monthDiff(todayISODate(), deadline), 1);
      const monthlyNeed = gap > 0 ? gap / monthsUntilDeadline : 0;
      if (needNode) needNode.textContent = formatCurrency(monthlyNeed);

      const projected = safeMonthly <= 0 ? "No projection" : projectDateFromMonthly(safeCurrent, safeTarget, safeMonthly);
      if (projectedNode) projectedNode.textContent = projected;

      if (riskChip) {
        if (monthlyNeed === 0) {
          riskChip.textContent = "Complete";
          riskChip.className = "goal-state goal-state--complete";
        } else if (safeMonthly >= monthlyNeed) {
          riskChip.textContent = "On track";
          riskChip.className = "goal-state goal-state--on-track";
        } else if (safeMonthly >= monthlyNeed * 0.8) {
          riskChip.textContent = "Watch";
          riskChip.className = "goal-state goal-state--watch";
        } else {
          riskChip.textContent = "At risk";
          riskChip.className = "goal-state goal-state--risk";
        }
      }
    }

    [fieldName, fieldTarget, fieldCurrent, fieldDeadline, fieldMonthly, fieldCategory, fieldPriority, fieldNotes].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", updatePreview);
      input.addEventListener("change", updatePreview);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const target = parseFloat(fieldTarget.value || "0");
      const current = parseFloat(fieldCurrent.value || "0");
      const monthly = parseFloat(fieldMonthly.value || "0");

      if (!fieldName.value.trim() || !isFinite(target) || target <= 0 || !fieldDeadline.value) return;

      const payload = {
        id: existingGoal ? existingGoal.id : buildId("goal"),
        name: fieldName.value.trim(),
        icon: existingGoal ? existingGoal.icon : chooseIconByCategory(fieldCategory.value),
        category: fieldCategory.value,
        target: roundMoney(target),
        current: roundMoney(Math.max(current, 0)),
        monthlyContribution: roundMoney(Math.max(monthly, 0)),
        deadline: fieldDeadline.value,
        completed: target > 0 && current >= target,
        completedOn: target > 0 && current >= target ? todayISODate() : null,
        notes: fieldNotes.value.trim(),
        priority: fieldPriority.value,
        monthlyDelta: existingGoal ? existingGoal.monthlyDelta : roundMoney(monthly * 0.12)
      };

      const updatedGoals = readGoals();
      const idx = updatedGoals.findIndex(function (item) {
        return item.id === payload.id;
      });

      if (idx >= 0) {
        updatedGoals[idx] = payload;
      } else {
        updatedGoals.push(payload);
      }

      writeGoals(updatedGoals);
      window.location.href = "goal-detail.html?id=" + encodeURIComponent(payload.id);
    });

    form.addEventListener("reset", function () {
      window.setTimeout(updatePreview, 0);
    });

    setRingValue(ringNode, 0);
    updatePreview();
  }

  function renderGoalCards(container, goals, completed) {
    container.innerHTML = "";

    if (!goals.length) {
      container.innerHTML =
        '<article class="card"><p class="text-secondary">No goals match this filter.</p></article>';
      return;
    }

    const fragment = document.createDocumentFragment();

    goals.forEach(function (goal) {
      const percent = goal.percent;
      const card = document.createElement("article");
      card.className = "goal-card" + (completed ? " goal-card--completed" : "");

      card.innerHTML =
        '<div class="goal-ring" style="--ring-progress: ' + statusColor(goal.status) + '">' +
          '<svg viewBox="0 0 120 120" aria-hidden="true">' +
            '<circle class="goal-ring__track" cx="60" cy="60" r="52"></circle>' +
            '<circle class="goal-ring__value" cx="60" cy="60" r="52"></circle>' +
          '</svg>' +
          '<span class="goal-ring__center">' +
            '<span class="goal-ring__percent">' + percent.toFixed(0) + '%</span>' +
            '<span class="goal-ring__label">Funded</span>' +
          '</span>' +
        '</div>' +
        '<div>' +
          '<h3 class="goal-card__title">' + escapeHtml(goal.icon) + ' ' + escapeHtml(goal.name) + '</h3>' +
          '<p class="goal-card__meta">' + escapeHtml(goal.category) + ' | Target: ' + formatCurrency(goal.target) + ' | Due: ' + formatDateShort(goal.deadline) + '</p>' +
          '<div class="goal-card__money">' +
            '<div class="goal-card__money-item">' +
              '<span class="goal-card__money-label">Saved</span>' +
              '<span class="goal-card__money-value">' + formatCurrency(goal.current) + '</span>' +
            '</div>' +
            '<div class="goal-card__money-item">' +
              '<span class="goal-card__money-label">Monthly</span>' +
              '<span class="goal-card__money-value">' + formatCurrency(goal.monthlyContribution) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="goal-card__footer">' +
            '<span class="goal-state ' + stateClass(goal.status) + '">' + stateLabel(goal.status) + '</span>' +
            '<div style="display: flex; gap: var(--space-xs); flex-wrap: wrap">' +
              '<a class="btn btn-ghost btn-sm" href="goal-detail.html?id=' + encodeURIComponent(goal.id) + '">Details</a>' +
              '<button class="btn btn-secondary btn-sm" type="button" data-contribute-id="' + escapeHtml(goal.id) + '" ' + (goal.completed ? "disabled" : "") + '>Contribute</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      const ringValue = card.querySelector(".goal-ring__value");
      setRingValue(ringValue, percent);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  function fillOverviewMetrics(state) {
    const metrics = state.metrics;

    fillText("hero-active-goals", String(metrics.activeGoals));
    fillText("hero-on-track", String(metrics.onTrackGoals));
    fillText("hero-saved", formatCurrency(metrics.totalSaved));
    fillText("hero-completion", metrics.completionRate.toFixed(1) + "%");

    fillText("kpi-total-saved", formatCurrency(metrics.totalSaved));
    fillText("kpi-target", formatCurrency(metrics.totalTarget));
    fillText("kpi-gap", formatCurrency(metrics.remainingGap) + " remaining");
    fillText("kpi-risk", formatCurrency(metrics.atRiskCapital));

    const projectionNode = document.getElementById("kpi-projection");
    if (projectionNode) projectionNode.textContent = metrics.projectedCompletion;

    const monthlyDeltaNode = document.getElementById("kpi-monthly-delta");
    if (monthlyDeltaNode) {
      const delta = metrics.monthlyDelta;
      monthlyDeltaNode.textContent = formatCurrency(Math.abs(delta)) + " this month";
      monthlyDeltaNode.style.color = delta >= 0 ? "var(--positive)" : "var(--negative)";
    }
  }

  function renderGoalHistory(goalId) {
    const tbody = document.getElementById("goal-history-body");
    if (!tbody) return;

    const contributions = readContributions()
      .filter(function (entry) {
        return entry.goalId === goalId;
      })
      .sort(function (a, b) {
        return b.date.localeCompare(a.date);
      });

    tbody.innerHTML = "";

    if (!contributions.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-secondary">No contributions recorded yet.</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    contributions.forEach(function (entry) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + formatDateShort(entry.date) + '</td>' +
        '<td>' + escapeHtml(entry.channel) + '</td>' +
        '<td>' + escapeHtml(entry.note || "-") + '</td>' +
        '<td style="color: var(--positive)">+' + formatCurrency(entry.amount).replace("$", "$") + '</td>';
      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }

  function renderRecentContributionList(goalId) {
    const list = document.getElementById("recent-contribution-list");
    if (!list) return;

    const contributions = readContributions()
      .filter(function (entry) {
        return entry.goalId === goalId;
      })
      .sort(function (a, b) {
        return b.date.localeCompare(a.date);
      })
      .slice(0, 5);

    list.innerHTML = "";

    if (!contributions.length) {
      list.innerHTML = '<p class="text-secondary">No recent contributions.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    contributions.forEach(function (entry) {
      const row = document.createElement("article");
      row.className = "goal-contribution-item";
      row.innerHTML =
        '<div>' +
          '<div class="goal-contribution-item__label">' + formatDateShort(entry.date) + ' | ' + escapeHtml(entry.channel) + '</div>' +
          '<div class="text-body">' + escapeHtml(entry.note || "Contribution") + '</div>' +
        '</div>' +
        '<strong class="goal-contribution-item__amount">+' + formatCurrency(entry.amount) + '</strong>';
      fragment.appendChild(row);
    });

    list.appendChild(fragment);
  }

  function renderGoalProjectionChart(goal) {
    const canvas = document.getElementById("goalProjectionChart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = [];
    const values = [];

    const now = new Date();
    let projected = goal.current;

    for (let i = 0; i < 12; i += 1) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      labels.push(month.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      projected = Math.min(goal.target, projected + goal.monthlyContribution);
      values.push(roundMoney(projected));
    }

    new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: goal.name,
            data: values,
            borderColor: "#4C8EF5",
            backgroundColor: "rgba(76, 142, 245, 0.1)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: "#4C8EF5"
          },
          {
            label: "Target",
            data: labels.map(function () {
              return goal.target;
            }),
            borderColor: "#C9A84C",
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: "#F0F0F5",
              font: {
                family: "Inter"
              }
            }
          },
          tooltip: {
            backgroundColor: "#1A1A24",
            titleColor: "#8888A0",
            bodyColor: "#F0F0F5",
            borderColor: "#C9A84C",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return context.dataset.label + ": " + formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.06)"
            },
            ticks: {
              color: "#8888A0"
            }
          },
          y: {
            grid: {
              color: "rgba(255, 255, 255, 0.06)",
              borderDash: [4, 6]
            },
            ticks: {
              color: "#8888A0",
              callback: function (value) {
                return "$" + Number(value).toLocaleString("en-US");
              }
            }
          }
        }
      }
    });
  }

  function getGoalsState() {
    const goals = readGoals().map(deriveGoalState);

    const activeGoals = goals.filter(function (goal) {
      return !goal.completed;
    });

    const totalSaved = sumBy(goals, "current");
    const totalTarget = sumBy(goals, "target");
    const remainingGap = Math.max(totalTarget - totalSaved, 0);
    const completionRate = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const onTrackGoals = activeGoals.filter(function (goal) {
      return goal.status === "on-track";
    }).length;

    const atRiskCapital = activeGoals
      .filter(function (goal) {
        return goal.status === "risk";
      })
      .reduce(function (sum, goal) {
        return sum + Math.max(goal.target - goal.current, 0);
      }, 0);

    const monthlyDelta = sumBy(goals, "monthlyDelta");
    const projectedCompletion = buildPortfolioProjectionLabel(activeGoals);

    return {
      goals: goals,
      metrics: {
        activeGoals: activeGoals.length,
        onTrackGoals: onTrackGoals,
        totalSaved: totalSaved,
        totalTarget: totalTarget,
        remainingGap: remainingGap,
        completionRate: completionRate,
        atRiskCapital: atRiskCapital,
        monthlyDelta: monthlyDelta,
        projectedCompletion: projectedCompletion
      }
    };
  }

  function deriveGoalState(goal) {
    const percent = goal.target > 0 ? clamp((goal.current / goal.target) * 100, 0, 100) : 0;
    const remaining = Math.max(goal.target - goal.current, 0);
    const monthsLeft = Math.max(monthDiff(todayISODate(), goal.deadline), 1);
    const monthlyNeed = remaining > 0 ? remaining / monthsLeft : 0;

    let status = "on-track";
    if (goal.completed || percent >= 100) status = "complete";
    else if (goal.monthlyContribution < monthlyNeed * 0.8) status = "risk";
    else if (goal.monthlyContribution < monthlyNeed) status = "watch";

    return Object.assign({}, goal, {
      percent: percent,
      status: status,
      monthlyNeed: monthlyNeed
    });
  }

  function sortGoals(goals, mode) {
    const sorted = goals.slice();

    if (mode === "highest-progress") {
      sorted.sort(function (a, b) {
        return b.percent - a.percent;
      });
      return sorted;
    }

    if (mode === "largest-target") {
      sorted.sort(function (a, b) {
        return b.target - a.target;
      });
      return sorted;
    }

    sorted.sort(function (a, b) {
      return a.deadline.localeCompare(b.deadline);
    });
    return sorted;
  }

  function setRingValue(node, percent) {
    if (!node) return;
    const p = clamp(percent, 0, 100);
    const offset = CIRCLE_CIRCUMFERENCE * (1 - p / 100);
    node.setAttribute("stroke-dasharray", String(CIRCLE_CIRCUMFERENCE));
    node.setAttribute("stroke-dashoffset", String(offset));
  }

  function stateClass(status) {
    if (status === "risk") return "goal-state--risk";
    if (status === "watch") return "goal-state--watch";
    if (status === "complete") return "goal-state--complete";
    return "goal-state--on-track";
  }

  function stateLabel(status) {
    if (status === "risk") return "At risk";
    if (status === "watch") return "Watch";
    if (status === "complete") return "Complete";
    return "On track";
  }

  function statusColor(status) {
    if (status === "risk") return "var(--negative)";
    if (status === "watch") return "var(--warning)";
    if (status === "complete") return "var(--accent-blue-bright)";
    return "var(--accent-blue)";
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  function readGoals() {
    return readJSON(GOALS_STORAGE_KEY, []);
  }

  function writeGoals(goals) {
    writeJSON(GOALS_STORAGE_KEY, goals);
  }

  function readContributions() {
    return readJSON(CONTRIBUTIONS_STORAGE_KEY, []);
  }

  function writeContributions(contributions) {
    writeJSON(CONTRIBUTIONS_STORAGE_KEY, contributions);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // Ignore storage failures gracefully.
    }
  }

  function defaultGoals() {
    return [
      {
        id: "goal-emergency",
        name: "Emergency Fund",
        icon: "S",
        category: "Emergency",
        target: 10000,
        current: 6200,
        monthlyContribution: 650,
        monthlyDelta: 140,
        deadline: buildFutureDate(240),
        completed: false,
        completedOn: null,
        notes: "6 months of core expenses",
        priority: "High"
      },
      {
        id: "goal-vacation",
        name: "Summer Vacation",
        icon: "T",
        category: "Travel",
        target: 5500,
        current: 3100,
        monthlyContribution: 480,
        monthlyDelta: 80,
        deadline: buildFutureDate(160),
        completed: false,
        completedOn: null,
        notes: "Family trip to Spain",
        priority: "Medium"
      },
      {
        id: "goal-vehicle",
        name: "Vehicle Upgrade",
        icon: "V",
        category: "Vehicle",
        target: 18000,
        current: 2900,
        monthlyContribution: 420,
        monthlyDelta: -60,
        deadline: buildFutureDate(300),
        completed: false,
        completedOn: null,
        notes: "Replace current car with hybrid",
        priority: "High"
      },
      {
        id: "goal-studio",
        name: "Home Studio Setup",
        icon: "H",
        category: "Housing",
        target: 4000,
        current: 4000,
        monthlyContribution: 0,
        monthlyDelta: 0,
        deadline: buildFutureDate(-20),
        completed: true,
        completedOn: buildFutureDate(-30),
        notes: "Completed in full",
        priority: "Low"
      }
    ];
  }

  function defaultContributions() {
    return [
      {
        id: "contrib-1",
        goalId: "goal-emergency",
        date: buildFutureDate(-6),
        amount: 650,
        channel: "Auto transfer",
        note: "Monthly reserve funding"
      },
      {
        id: "contrib-2",
        goalId: "goal-emergency",
        date: buildFutureDate(-35),
        amount: 650,
        channel: "Auto transfer",
        note: "Monthly reserve funding"
      },
      {
        id: "contrib-3",
        goalId: "goal-vacation",
        date: buildFutureDate(-4),
        amount: 400,
        channel: "Paycheck split",
        note: "March split"
      },
      {
        id: "contrib-4",
        goalId: "goal-vacation",
        date: buildFutureDate(-29),
        amount: 500,
        channel: "Manual transfer",
        note: "Tax return add-on"
      },
      {
        id: "contrib-5",
        goalId: "goal-vehicle",
        date: buildFutureDate(-12),
        amount: 300,
        channel: "Round-ups",
        note: "Quarterly bucket"
      },
      {
        id: "contrib-6",
        goalId: "goal-studio",
        date: buildFutureDate(-60),
        amount: 1200,
        channel: "Manual transfer",
        note: "Final contribution"
      }
    ];
  }

  function sumBy(items, key) {
    return roundMoney(
      items.reduce(function (sum, item) {
        const value = Number(item[key]);
        return sum + (isFinite(value) ? value : 0);
      }, 0)
    );
  }

  function formatDateShort(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function fillText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function buildFutureDate(dayOffset) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().slice(0, 10);
  }

  function todayISODate() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthDiff(fromISO, toISO) {
    const from = new Date(fromISO + "T00:00:00");
    const to = new Date(toISO + "T00:00:00");

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;

    const years = to.getFullYear() - from.getFullYear();
    const months = to.getMonth() - from.getMonth();
    const total = years * 12 + months;

    return total + (to.getDate() >= from.getDate() ? 0 : -1);
  }

  function projectDateFromMonthly(current, target, monthly) {
    if (!isFinite(current) || !isFinite(target) || !isFinite(monthly) || monthly <= 0 || target <= current) {
      return "Complete";
    }

    const remaining = target - current;
    const months = Math.ceil(remaining / monthly);

    const date = new Date();
    date.setMonth(date.getMonth() + months);

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  }

  function projectCompletionLabel(goal) {
    if (goal.completed) return "Completed";
    return projectDateFromMonthly(goal.current, goal.target, goal.monthlyContribution);
  }

  function buildPortfolioProjectionLabel(goals) {
    if (!goals.length) return "No active goals";

    let weightedMonth = 0;
    let weightedSum = 0;

    goals.forEach(function (goal) {
      const remaining = Math.max(goal.target - goal.current, 0);
      if (remaining <= 0 || goal.monthlyContribution <= 0) return;
      const months = Math.ceil(remaining / goal.monthlyContribution);
      weightedMonth += months * remaining;
      weightedSum += remaining;
    });

    if (!weightedSum) return "No projection";

    const averageMonths = Math.ceil(weightedMonth / weightedSum);
    const projected = new Date();
    projected.setMonth(projected.getMonth() + averageMonths);

    return projected.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  }

  function chooseIconByCategory(category) {
    if (category === "Emergency") return "S";
    if (category === "Travel") return "T";
    if (category === "Vehicle") return "V";
    if (category === "Housing") return "H";
    if (category === "Education") return "E";
    if (category === "Investment") return "I";
    return "G";
  }

  function buildId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
