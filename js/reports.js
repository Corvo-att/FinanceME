/* ============================================================
   FINANCEME — Reports & Analytics Script (reports.js)
   Initializes and mounts all Chart.js instances according to 
   FinanceME design specifications.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Common Theme Colors from FinanceME Design Specs
  const colors = {
    bgElevated: "#1A1A24",
    borderSubtle: "rgba(255, 255, 255, 0.06)",
    textPrimary: "#F0F0F5",
    textSecondary: "#8888A0",
    accentGold: "#C9A84C",
    accentBlue: "#4C8EF5",
    positive: "#2ECC8A",
    negative: "#E05C5C",
    gridLines: "rgba(255, 255, 255, 0.06)",
  };

  // Fonts
  const fonts = {
    ui: "'Inter', -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', monospace"
  };

  // Chart.js default overrides for "FinanceME" Dark Luxury aesthetic
  Chart.defaults.color = colors.textSecondary;
  Chart.defaults.font.family = fonts.ui;
  Chart.defaults.font.size = 11;

  // Custom tooltips plugin setup
  const tooltipOptions = {
    backgroundColor: colors.bgElevated,
    titleColor: colors.textSecondary,
    titleFont: { family: fonts.ui, size: 12, weight: '500' },
    bodyColor: colors.textPrimary,
    bodyFont: { family: fonts.mono, size: 14, weight: '500' },
    borderColor: colors.accentGold,
    borderWidth: 1,
    cornerRadius: 6,
    padding: 12,
    displayColors: true,
    boxWidth: 8,
    boxHeight: 8,
    usePointStyle: true,
    callbacks: {
      label: function(context) {
        let label = context.dataset.label || '';
        if (label) {
          label += ': ';
        }
        if (context.parsed.y !== null) {
          label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
        } else if (context.parsed !== null) {
          // For pie charts
          label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
        }
        return label;
      }
    }
  };

  const gridOptions = {
    color: colors.gridLines,
    borderDash: [4, 4],
    drawBorder: false,
    tickLength: 0
  };

  // ----------------------------------------------------
  // 1. Income vs. Expenses (Bar Chart)
  // ----------------------------------------------------
  const ctxIncomeExpense = document.getElementById("incomeExpenseChart");
  if (ctxIncomeExpense) {
    new Chart(ctxIncomeExpense, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Income",
            data: [6500, 7200, 8000, 7400, 9200, 14100],
            backgroundColor: colors.positive,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: "Expenses",
            data: [4200, 4800, 5100, 5000, 6800, 8200],
            backgroundColor: colors.negative,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: "easeOutQuart"
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: { textTransform: "uppercase", letterSpacing: "1px" }
            }
          },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: fonts.ui, size: 11 },
              textTransform: "uppercase"
            }
          },
          y: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + (value / 1000) + "k";
              }
            }
          }
        }
      }
    });
  }

  // ----------------------------------------------------
  // 2. Spending Breakdown (Donut Chart)
  // ----------------------------------------------------
  const ctxSpending = document.getElementById("spendingDonutChart");
  if (ctxSpending) {
    new Chart(ctxSpending, {
      type: "doughnut",
      data: {
        labels: ["Housing", "Food", "Transport", "Utilities", "Entertainment", "Other"],
        datasets: [
          {
            data: [2500, 800, 450, 300, 600, 450],
            backgroundColor: [
              "#4C8EF5", // Blue
              "#C9A84C", // Gold
              "#2ECC8A", // Green
              "#E8A83A", // Warning/Orange
              "#E05C5C", // Red
              "#6B6B85"  // Neutral
            ],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%", // thin rings, hole ratio 0.72
        animation: {
          duration: 600,
          easing: "easeOutQuart"
        },
        plugins: {
          legend: {
            display: false // Hide legend to match "no legend inside" or save space
          },
          tooltip: tooltipOptions
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          var width = chart.width,
              height = chart.height,
              ctx = chart.ctx;
      
          ctx.restore();
          var fontSize = (height / 160).toFixed(2);
          ctx.font = "500 " + fontSize + "em " + fonts.ui;
          ctx.textBaseline = "middle";
          ctx.fillStyle = colors.textPrimary;
      
          var text = "Spending",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2 - 10;
      
          ctx.fillText(text, textX, textY);
          
          ctx.font = "400 " + (fontSize * 0.7) + "em " + fonts.mono;
          ctx.fillStyle = colors.textSecondary;
          var text2 = "$5,100",
              text2X = Math.round((width - ctx.measureText(text2).width) / 2),
              text2Y = height / 2 + 15;
              
          ctx.fillText(text2, text2X, text2Y);
          ctx.save();
        }
      }]
    });
  }

  // ----------------------------------------------------
  // 3. Net Worth Over Time (Line Area Chart)
  // ----------------------------------------------------
  const ctxNetWorth = document.getElementById("netWorthChart");
  if (ctxNetWorth) {
    // Generate gradient for the area fill
    const canvas = document.createElement("canvas");
    const testCtx = canvas.getContext("2d");
    let gradient = "rgba(201, 168, 76, 0.2)"; // fallback
    if (testCtx) {
      gradient = ctxNetWorth.getContext("2d").createLinearGradient(0, 0, 0, 360);
      gradient.addColorStop(0, "rgba(201, 168, 76, 0.3)"); // accent-gold 30%
      gradient.addColorStop(1, "rgba(201, 168, 76, 0.0)"); // 0%
    }

    new Chart(ctxNetWorth, {
      type: "line",
      data: {
        labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
        datasets: [
          {
            label: "Net Worth",
            data: [98000, 102000, 101500, 106000, 112000, 118000, 121000, 125000, 131000, 134000, 137000, 142500],
            borderColor: colors.accentGold,
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4, // smooth curves
            pointBackgroundColor: colors.bgElevated,
            pointBorderColor: colors.accentGold,
            pointBorderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: "easeOutQuart"
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: fonts.ui, size: 11 },
              textTransform: "uppercase"
            },
            border: { display: false }
          },
          y: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + (value / 1000) + "k";
              }
            }
          }
        }
      }
    });
  }

  // ========== CATEGORY TRENDS PAGE ==========
  // Category trend line chart
  const categoryTrendCtx = document.getElementById("categoryTrendChart");
  if (categoryTrendCtx) {
    new Chart(categoryTrendCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Groceries",
            data: [480, 520, 450, 480, 510, 520, 480, 460, 500, 580, 575, 580],
            borderColor: colors.accentBlue,
            backgroundColor: "rgba(76, 142, 245, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.accentBlue,
            pointBorderWidth: 0
          },
          {
            label: "Transportation",
            data: [350, 340, 360, 330, 320, 310, 340, 380, 385, 350, 385, 350],
            borderColor: colors.accentGold,
            backgroundColor: "rgba(201, 168, 76, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.accentGold,
            pointBorderWidth: 0
          },
          {
            label: "Utilities",
            data: [580, 620, 610, 580, 520, 480, 510, 620, 720, 820, 720, 820],
            borderColor: colors.positive,
            backgroundColor: "rgba(46, 204, 138, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.positive,
            pointBorderWidth: 0
          },
          {
            label: "Dining",
            data: [380, 360, 320, 300, 290, 280, 310, 280, 280, 213, 280, 213],
            borderColor: colors.negative,
            backgroundColor: "rgba(224, 92, 92, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.negative,
            pointBorderWidth: 0
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
            display: true,
            position: "top",
            labels: {
              font: { family: fonts.ui, size: 12 },
              color: colors.textPrimary,
              padding: 16,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          },
          y: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // YoY Growth Rate Bar Chart
  const growthRateCtx = document.getElementById("growthRateChart");
  if (growthRateCtx) {
    new Chart(growthRateCtx, {
      type: "bar",
      data: {
        labels: ["Groceries", "Transportation", "Utilities", "Dining", "Entertainment", "Healthcare", "Education"],
        datasets: [
          {
            label: "YoY Growth %",
            data: [-2.3, 4.5, 24.3, -18.7, 49.8, 19.8, 0.0],
            backgroundColor: [
              colors.positive, colors.positive, colors.negative, colors.positive, colors.negative, colors.negative, colors.textSecondary
            ],
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return value + "%";
              }
            }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          }
        }
      }
    });
  }

  // Volatility (Variance) Horizontal Bar Chart
  const volatilityCtx = document.getElementById("volatilityChart");
  if (volatilityCtx) {
    new Chart(volatilityCtx, {
      type: "bar",
      data: {
        labels: ["Groceries", "Transportation", "Utilities", "Dining", "Entertainment", "Healthcare", "Education"],
        datasets: [
          {
            label: "Variance ±%",
            data: [5.2, 8.4, 12.7, 16.3, 34.8, 11.9, 45.2],
            backgroundColor: colors.accentGold,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "±" + value + "%";
              }
            }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          }
        }
      }
    });
  }

  // ========== SAVINGS GOALS PAGE ==========
  // Goal Progress Projection Chart
  const goalProgressCtx = document.getElementById("goalProgressChart");
  if (goalProgressCtx) {
    new Chart(goalProgressCtx, {
      type: "line",
      data: {
        labels: ["Now", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        datasets: [
          {
            label: "Emergency Fund",
            data: [8500, 8900, 9300, 9700, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
            borderColor: colors.accentBlue,
            backgroundColor: "rgba(76, 142, 245, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.accentBlue,
            pointBorderWidth: 0
          },
          {
            label: "Vacation Fund",
            data: [4200, 4700, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
            borderColor: colors.accentGold,
            backgroundColor: "rgba(201, 168, 76, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.accentGold,
            pointBorderWidth: 0
          },
          {
            label: "Home Renovation",
            data: [3800, 4400, 5000, 5600, 6200, 6800, 7400, 8000, 8600, 9200, 9800, 10400, 11000],
            borderColor: colors.positive,
            backgroundColor: "rgba(46, 204, 138, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.positive,
            pointBorderWidth: 0
          },
          {
            label: "New Vehicle",
            data: [1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4250, 4500, 4750],
            borderColor: colors.negative,
            backgroundColor: "rgba(224, 92, 92, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.negative,
            pointBorderWidth: 0
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
            display: true,
            position: "top",
            labels: {
              font: { family: fonts.ui, size: 12 },
              color: colors.textPrimary,
              padding: 16,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          },
          y: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + (value / 1000) + "k";
              }
            }
          }
        }
      }
    });
  }

  // ========== TAX SUMMARY PAGE ==========
  // Quarterly tax projection (bar + line)
  const taxQuarterlyProjectionCtx = document.getElementById("taxQuarterlyProjectionChart");
  if (taxQuarterlyProjectionCtx) {
    new Chart(taxQuarterlyProjectionCtx, {
      type: "bar",
      data: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [
          {
            type: "bar",
            label: "Projected Tax",
            data: [5180, 5760, 5920, 5780],
            backgroundColor: "rgba(224, 92, 92, 0.72)",
            borderRadius: 4,
            barPercentage: 0.58,
            categoryPercentage: 0.75
          },
          {
            type: "bar",
            label: "Withholding",
            data: [4940, 5410, 5920, 5120],
            backgroundColor: "rgba(76, 142, 245, 0.68)",
            borderRadius: 4,
            barPercentage: 0.58,
            categoryPercentage: 0.75
          },
          {
            type: "line",
            label: "Quarter Gap",
            data: [240, 350, 0, 660],
            borderColor: colors.accentGold,
            backgroundColor: "rgba(201, 168, 76, 0.16)",
            yAxisID: "y1",
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: colors.accentGold,
            pointBorderColor: colors.bgElevated,
            pointBorderWidth: 2
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
            display: true,
            position: "top",
            labels: {
              font: { family: fonts.ui, size: 12 },
              color: colors.textPrimary,
              padding: 16,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          },
          y: {
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + (value / 1000).toFixed(1) + "k";
              }
            }
          },
          y1: {
            position: "right",
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + value;
              }
            }
          }
        }
      }
    });
  }

  // Tax liability mix (donut)
  const taxLiabilityMixCtx = document.getElementById("taxLiabilityMixChart");
  if (taxLiabilityMixCtx) {
    new Chart(taxLiabilityMixCtx, {
      type: "doughnut",
      data: {
        labels: ["Federal Income", "Payroll", "Capital Gains"],
        datasets: [
          {
            data: [17940, 3420, 1280],
            backgroundColor: [
              colors.accentBlue,
              colors.negative,
              colors.accentGold
            ],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              font: { family: fonts.ui, size: 11 },
              color: colors.textPrimary,
              padding: 12,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: tooltipOptions
        }
      }
    });
  }

  // Deductions by category (horizontal bars)
  const taxDeductionCategoryCtx = document.getElementById("taxDeductionCategoryChart");
  if (taxDeductionCategoryCtx) {
    new Chart(taxDeductionCategoryCtx, {
      type: "bar",
      data: {
        labels: [
          "Retirement Contributions",
          "Health Premiums",
          "Mortgage Interest",
          "Charitable Giving",
          "Education Credits"
        ],
        datasets: [
          {
            label: "Applied Deductions",
            data: [6200, 3400, 2800, 950, 650],
            backgroundColor: "rgba(76, 142, 245, 0.78)",
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: "Available Headroom",
            data: [900, 640, 420, 310, 180],
            backgroundColor: "rgba(201, 168, 76, 0.62)",
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { family: fonts.ui, size: 11 },
              color: colors.textPrimary,
              padding: 12,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: tooltipOptions
        },
        scales: {
          x: {
            stacked: true,
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return "$" + value.toLocaleString();
              }
            }
          },
          y: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          }
        }
      }
    });
  }

  // Effective tax rate trend (line)
  const taxEffectiveRateTrendCtx = document.getElementById("taxEffectiveRateTrendChart");
  if (taxEffectiveRateTrendCtx) {
    new Chart(taxEffectiveRateTrendCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Effective Rate",
            data: [24.8, 24.1, 23.9, 24.3, 23.7, 23.5, 23.8, 23.4, 23.2, 23.6, 23.5, 23.4],
            borderColor: colors.accentBlue,
            backgroundColor: "rgba(76, 142, 245, 0.12)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.accentBlue,
            pointBorderWidth: 0
          },
          {
            label: "Target Band",
            data: [22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8, 22.8],
            borderColor: colors.accentGold,
            borderDash: [6, 6],
            fill: false,
            tension: 0,
            pointRadius: 0
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
            display: true,
            position: "top",
            labels: {
              font: { family: fonts.ui, size: 11 },
              color: colors.textPrimary,
              padding: 12,
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            ...tooltipOptions,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || "Rate";
                const value = context.parsed.y;
                return `${label}: ${value.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: fonts.ui, size: 11 } }
          },
          y: {
            min: 21,
            max: 26,
            grid: gridOptions,
            border: { display: false },
            ticks: {
              font: { family: fonts.mono, size: 11 },
              callback: function(value) {
                return value + "%";
              }
            }
          }
        }
      }
    });
  }
});
