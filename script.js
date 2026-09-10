// === Data / Storage ===

/**
 * Expense categories — each with an emoji icon and a distinct pastel colour.
 */
const EXPENSE_CATEGORIES = {
  Food:          { emoji: "🍔", colour: "#FFB3C1" },
  Transport:     { emoji: "🚗", colour: "#C9B8FF" },
  Shopping:      { emoji: "🛍️", colour: "#B5EAD7" },
  Bills:         { emoji: "💡", colour: "#AEE1F9" },
  Entertainment: { emoji: "🎮", colour: "#FDFD96" },
  Others:        { emoji: "📦", colour: "#FFD7B5" }
};

/**
 * Income categories — each with an emoji icon and a distinct pastel colour.
 */
const INCOME_CATEGORIES = {
  Salary:    { emoji: "💼", colour: "#B8F0B8" },
  Allowance: { emoji: "🎒", colour: "#FFE5B4" },
  Gift:      { emoji: "🎁", colour: "#FFD6E0" },
  Freelance: { emoji: "💻", colour: "#D4E8FF" },
  Others:    { emoji: "✨", colour: "#E8D5FF" }
};

/**
 * Alias so existing code that references CATEGORIES continues to work.
 */
const CATEGORIES = EXPENSE_CATEGORIES;

// In-memory transaction list — loaded from localStorage on init.
let transactions = [];

// Active date-range filter. Defaults to the current calendar month on load.
let activeFilter = { preset: "month", startDate: null, endDate: null };

// ID of the transaction currently being edited; null = "add new" mode.
let editingId = null;

// Current chart visualisation type — "doughnut" or "bar".
let chartType = "doughnut";

// Whether the chart shows expense or income breakdown.
let chartDataMode = "expense";

// Reference to the active Chart.js instance.
let chartInstance = null;

// Tracks the active type-toggle selection for the Add Transaction form.
let currentType = "expense";

// Current search term for the History panel name filter.
let searchTerm = "";

// Storage keys
const STORAGE_KEY_NEW = "cashlytics_transactions";
const STORAGE_KEY_OLD = "cashlytics_expenses";

// === Storage Probe ===

/**
 * Tests whether localStorage is readable and writable. Shows/hides the
 * `#error-storage` banner accordingly. Returns true when storage is available.
 */
function probeLocalStorage() {
  const PROBE_KEY = "__cashlytics_probe__";
  try {
    localStorage.setItem(PROBE_KEY, "1");
    localStorage.removeItem(PROBE_KEY);
    const banner = document.getElementById("error-storage");
    if (banner) banner.hidden = true;
    return true;
  } catch (e) {
    const banner = document.getElementById("error-storage");
    if (banner) banner.hidden = false;
    return false;
  }
}

// === Load / Save ===

/**
 * Validates that a value is a well-formed transaction record.
 * Requires type === "expense" | "income" in addition to the base fields.
 */
function isWellFormedTransaction(e) {
  return (
    e !== null &&
    typeof e === "object" &&
    typeof e.id       === "string" &&
    typeof e.name     === "string" &&
    typeof e.category === "string" &&
    typeof e.date     === "string" &&
    typeof e.amount   === "number" &&
    Number.isInteger(e.amount) &&
    e.amount > 0 &&
    (e.type === "expense" || e.type === "income")
  );
}

/**
 * Validates that a value is a well-formed legacy expense record (no type field
 * required). Used by the exported `loadExpenses()` for backward compatibility.
 */
function isWellFormedExpense(e) {
  return (
    e !== null &&
    typeof e === "object" &&
    typeof e.id       === "string" &&
    typeof e.name     === "string" &&
    typeof e.category === "string" &&
    typeof e.date     === "string" &&
    typeof e.amount   === "number" &&
    Number.isInteger(e.amount) &&
    e.amount > 0
  );
}

/**
 * Loads transactions from localStorage under `"cashlytics_transactions"`.
 * Also checks the old `"cashlytics_expenses"` key and migrates data if found
 * (adds `type: "expense"` to any record missing it, saves under the new key,
 * and removes the old key).
 * Returns a valid array on success; returns [] and shows `#error-data` on
 * any parse or validation failure.
 */
function loadTransactions() {
  // --- Migration: upgrade old data to new format ---
  try {
    const oldRaw = localStorage.getItem(STORAGE_KEY_OLD);
    if (oldRaw !== null) {
      const oldParsed = JSON.parse(oldRaw);
      if (Array.isArray(oldParsed)) {
        const migrated = oldParsed
          .filter(isWellFormedExpense)
          .map((e) => ({ type: "expense", ...e }));
        localStorage.setItem(STORAGE_KEY_NEW, JSON.stringify(migrated));
        localStorage.removeItem(STORAGE_KEY_OLD);
      }
    }
  } catch (_) {
    // Migration failure is non-fatal; continue to load from new key.
  }

  // --- Load from new key ---
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NEW);
    if (raw === null) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Stored value is not an array.");
    }

    if (!parsed.every(isWellFormedTransaction)) {
      throw new Error("One or more transaction records are malformed.");
    }

    const banner = document.getElementById("error-data");
    if (banner) banner.hidden = true;

    return parsed;
  } catch (err) {
    console.error("loadTransactions: could not load saved data —", err.message);
    const banner = document.getElementById("error-data");
    if (banner) banner.hidden = false;
    return [];
  }
}

/**
 * Serialises the in-memory `transactions` array to localStorage under the
 * key `"cashlytics_transactions"`. Logs an error on any write failure.
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY_NEW, JSON.stringify(transactions));
  } catch (err) {
    console.error(
      "saveTransactions: data could not be written to localStorage —",
      err.message,
      "Your changes are retained for this session but will not persist."
    );
  }
}

// === Exported functions (backward compatibility for tests) ===

/**
 * Loads expenses from the legacy `"cashlytics_expenses"` localStorage key.
 * Validates that each record is a well-formed expense object (no type field
 * required). Returns [] on any error.
 *
 * Exported so existing test files continue to work unchanged.
 */
export function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OLD);
    if (raw === null) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Stored value is not an array.");
    }

    if (!parsed.every(isWellFormedExpense)) {
      throw new Error("One or more expense records are malformed.");
    }

    const banner = document.getElementById("error-data");
    if (banner) banner.hidden = true;

    return parsed;
  } catch (err) {
    console.error("loadExpenses: could not load saved data —", err.message);
    const banner = document.getElementById("error-data");
    if (banner) banner.hidden = false;
    return [];
  }
}

// === Utilities ===

/**
 * Formats a non-negative integer as an Indonesian Rupiah string with period
 * thousand separators (e.g. 50000 → "Rp 50.000"). Returns "Rp 0" for any
 * invalid input.
 *
 * Exported so existing test files continue to work unchanged.
 */
export function rupiahFormatter(n) {
  const MAX = 999_999_999_999;

  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > MAX) {
    console.error(
      `rupiahFormatter: invalid input "${n}". Expected a non-negative integer ` +
      `in the range [0, ${MAX}]. Returning "Rp 0".`
    );
    return "Rp 0";
  }

  if (n === 0) return "Rp 0";

  const formatted = n
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return "Rp " + formatted;
}

/**
 * Converts an ISO date string "YYYY-MM-DD" into "DD/MM/YYYY".
 */
function formatDate(dateStr) {
  if (typeof dateStr !== "string") return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Reads and validates the four Expense_Form fields. Returns an object of
 * field-name → error-message pairs; returns {} when all fields pass.
 */
function validateForm() {
  const errors = {};
  const MAX_AMOUNT = 999_999_999_999;

  // --- Name ---
  const nameEl  = document.getElementById("input-name");
  const nameVal = nameEl ? nameEl.value.trim() : "";
  if (nameVal.length < 1 || nameVal.length > 100) {
    errors.name = "Name is required and must be 1–100 characters.";
  }

  // --- Amount ---
  const amountEl  = document.getElementById("input-amount");
  const amountRaw = amountEl ? amountEl.value : "";
  const amountNum = Number(amountRaw);
  if (
    amountRaw.trim() === "" ||
    !Number.isInteger(amountNum) ||
    amountNum < 1 ||
    amountNum > MAX_AMOUNT
  ) {
    errors.amount = "Amount must be a whole number between 1 and 999,999,999,999.";
  }

  // --- Category --- validate against correct set based on currentType
  const categoryEl  = document.getElementById("select-category");
  const categoryVal = categoryEl ? categoryEl.value : "";
  const activeCats  = currentType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!Object.prototype.hasOwnProperty.call(activeCats, categoryVal)) {
    errors.category = "Please select a valid category.";
  }

  // --- Date ---
  const dateEl  = document.getElementById("input-date");
  const dateVal = dateEl ? dateEl.value : "";
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateVal)) {
    errors.date = "Please enter a valid date.";
  } else {
    const [year, month, day] = dateVal.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth()    !== month - 1 ||
      parsed.getDate()     !== day
    ) {
      errors.date = "Please enter a valid date.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed > today) {
        errors.date = "Date cannot be in the future.";
      }
    }
  }

  return errors;
}

/**
 * Filters an array of transaction objects to those whose date falls within
 * the resolved date range of the given filter object.
 */
function filterByDate(txList, filter) {
  if (!Array.isArray(txList)) return [];
  if (!filter || typeof filter !== "object") return txList;

  const toDateStr = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(now);

  let startDate, endDate;

  switch (filter.preset) {
    case "today":
      startDate = todayStr;
      endDate   = todayStr;
      break;

    case "week": {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      startDate = toDateStr(monday);
      endDate   = todayStr;
      break;
    }

    case "month": {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = toDateStr(firstOfMonth);
      endDate   = todayStr;
      break;
    }

    case "custom": {
      const s = filter.startDate;
      const e = filter.endDate;
      if (!s || !e) return txList;
      if (s > e) return [];
      startDate = s;
      endDate   = e;
      break;
    }

    default:
      return txList;
  }

  return txList.filter(
    (tx) => typeof tx.date === "string" && tx.date >= startDate && tx.date <= endDate
  );
}

// === Rendering ===

/**
 * Renders the filtered and sorted transaction list into `#expense-list`.
 * Expenses show in red, income in green. Each item gets `.tx-expense` or
 * `.tx-income` and a circular category icon badge (Change 2).
 */
function renderExpenseList() {
  const list  = document.getElementById("expense-list");
  const empty = document.getElementById("list-empty");
  if (!list || !empty) return;

  // Apply name search filter (case-insensitive, partial match)
  const term = searchTerm.trim().toLowerCase();
  const dateFiltered = filterByDate(transactions, activeFilter);
  const filtered = term
    ? dateFiltered.filter((tx) => tx.name.toLowerCase().includes(term))
    : dateFiltered;

  const indexed = filtered.map((tx) => ({
    tx,
    originalIndex: transactions.indexOf(tx)
  }));

  indexed.sort((a, b) => {
    if (b.tx.date > a.tx.date) return 1;
    if (b.tx.date < a.tx.date) return -1;
    return b.originalIndex - a.originalIndex;
  });

  if (indexed.length === 0) {
    list.innerHTML = "";
    empty.textContent = term
      ? "No transactions match your search."
      : "No transactions found for the selected period.";
    empty.hidden   = false;
    return;
  }

  empty.hidden = true;

  list.innerHTML = indexed.map(({ tx }) => {
    const isIncome = tx.type === "income";
    const catMap   = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const cat      = catMap[tx.category] || (isIncome ? INCOME_CATEGORIES["Others"] : EXPENSE_CATEGORIES["Others"]);
    const dateFormatted = formatDate(tx.date);
    const typeClass     = isIncome ? "tx-income" : "tx-expense";
    // Amount prefix: + for income, − for expense
    const amountPrefix  = isIncome ? "+" : "−";
    const amountDisplay = amountPrefix + rupiahFormatter(tx.amount).slice(3); // strip "Rp "

    return `<li class="expense-item ${typeClass}" data-id="${escapeHtml(tx.id)}" data-type="${escapeHtml(tx.type)}">
      <span class="cat-icon" style="background-color:${cat.colour}">${cat.emoji}</span>
      <span class="expense-name">${escapeHtml(tx.name)}</span>
      <span class="expense-amount">Rp ${escapeHtml(amountDisplay)}</span>
      <div class="expense-meta">
        <span class="expense-category-label">${escapeHtml(tx.category)}</span>
        <span class="expense-date">${dateFormatted}</span>
      </div>
      <div class="expense-actions">
        <button type="button" data-action="edit"   data-id="${escapeHtml(tx.id)}" class="btn-edit">Edit</button>
        <button type="button" data-action="delete" data-id="${escapeHtml(tx.id)}" class="btn-danger">Delete</button>
      </div>
    </li>`;
  }).join("");
}

/**
 * Renders (or re-renders) the spending chart. Respects `chartDataMode`
 * ("expense" or "income") and `chartType` ("doughnut" or "bar").
 * Uses `maintainAspectRatio: false` so the `.chart-area` container controls
 * the size (Change 1).
 *
 * @param {string} type - "doughnut" or "bar"
 */
function renderChart(type) {
  const canvas = document.getElementById("chart-canvas");
  const errEl  = document.getElementById("chart-error");

  if (typeof Chart === "undefined") {
    if (canvas) canvas.hidden = true;
    if (errEl) {
      errEl.textContent = "📉 Chart unavailable — the charting library could not be loaded.";
      errEl.hidden = false;
    }
    return;
  }

  const filtered = filterByDate(transactions, activeFilter);

  // Choose category map based on chartDataMode
  const catMap = chartDataMode === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Sum amounts per category for the selected type only
  const totals = {};
  Object.keys(catMap).forEach((cat) => { totals[cat] = 0; });
  filtered
    .filter((tx) => tx.type === chartDataMode)
    .forEach((tx) => {
      if (Object.prototype.hasOwnProperty.call(totals, tx.category)) {
        totals[tx.category] += tx.amount;
      }
    });

  const allZero = Object.values(totals).every((v) => v === 0);

  if (allZero) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    if (canvas) canvas.hidden = true;
    if (errEl) {
      errEl.innerHTML = `No ${chartDataMode} entries yet. <a class="empty-state-link" data-tab="add">Add your first one!</a>`;
      errEl.hidden = false;
    }
    return;
  }

  if (canvas) canvas.hidden = false;
  if (errEl)  errEl.hidden  = true;

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const labels  = Object.keys(catMap).map((k) => `${catMap[k].emoji} ${k}`);
  const data    = Object.keys(catMap).map((k) => totals[k]);
  const colours = Object.values(catMap).map((c) => c.colour);

  chartInstance = new Chart(canvas, {
    type: type === "bar" ? "bar" : "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colours,
        borderWidth: 1
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false, // Change 1: respect container height
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${rupiahFormatter(ctx.raw)}`
          }
        }
      }
    }
  });
}

/**
 * Calculates and renders the dashboard stat cards:
 * - Period income / Period expense / Net balance
 * - Top expense category
 */
function updateDashboard() {
  const filtered = filterByDate(transactions, activeFilter);

  // Period income
  const periodIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Period expense
  const periodExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Net balance
  const netBalance = periodIncome - periodExpense;

  const incomeEl  = document.getElementById("stat-income");
  const expenseEl = document.getElementById("stat-expense");
  const balanceEl = document.getElementById("stat-balance");

  if (incomeEl)  incomeEl.textContent  = rupiahFormatter(periodIncome);
  if (expenseEl) expenseEl.textContent = rupiahFormatter(periodExpense);

  if (balanceEl) {
    const absBalance = Math.abs(netBalance);
    const prefix     = netBalance >= 0 ? "+" : "−";
    balanceEl.textContent = `${prefix}${rupiahFormatter(absBalance).slice(3)}`; // keep "Rp " stripped

    // Actually, display with Rp prefix for clarity
    balanceEl.textContent = netBalance >= 0
      ? `+Rp ${rupiahFormatter(absBalance).slice(3)}`
      : `−Rp ${rupiahFormatter(absBalance).slice(3)}`;

    balanceEl.className = "stat-value " + (netBalance >= 0
      ? "stat-balance-positive"
      : "stat-balance-negative");
  }

  // Top expense category
  const expenseTotals = {};
  Object.keys(EXPENSE_CATEGORIES).forEach((cat) => { expenseTotals[cat] = 0; });
  filtered
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      if (Object.prototype.hasOwnProperty.call(expenseTotals, tx.category)) {
        expenseTotals[tx.category] += tx.amount;
      }
    });

  const topCatEl = document.getElementById("stat-top-category");
  if (!topCatEl) return;

  const maxVal = Math.max(...Object.values(expenseTotals));
  if (maxVal === 0) {
    topCatEl.innerHTML = '<a class="empty-state-link" data-tab="add">No expenses yet — add one! 🎯</a>';
  } else {
    const topCat = Object.keys(expenseTotals)
      .filter((k) => expenseTotals[k] === maxVal)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))[0];
    topCatEl.textContent = `${EXPENSE_CATEGORIES[topCat].emoji} ${topCat}`;
  }
}

/**
 * Re-renders all three dynamic UI sections.
 */
function renderAll() {
  renderExpenseList();
  renderChart(chartType);
  updateDashboard();
}

// === Event Handlers ===

/**
 * Shows per-field validation error messages in the Expense_Form.
 */
function showFormErrors(errors) {
  if (!errors || typeof errors !== "object") return;

  const fieldMap = {
    name:     { inputId: "input-name",      errorId: "error-name"     },
    amount:   { inputId: "input-amount",    errorId: "error-amount"   },
    category: { inputId: "select-category", errorId: "error-category" },
    date:     { inputId: "input-date",      errorId: "error-date"     }
  };

  Object.keys(errors).forEach((field) => {
    const mapping = fieldMap[field];
    if (!mapping) return;

    const errorSpan = document.getElementById(mapping.errorId);
    if (errorSpan) {
      errorSpan.textContent = errors[field];
      errorSpan.hidden      = false;
      errorSpan.style.display = "block";
    }

    const inputEl = document.getElementById(mapping.inputId);
    if (inputEl) inputEl.classList.add("is-invalid");
  });
}

/**
 * Clears all per-field validation error messages and removes "is-invalid" styling.
 */
function clearFormErrors() {
  const fieldMap = {
    name:     { inputId: "input-name",      errorId: "error-name"     },
    amount:   { inputId: "input-amount",    errorId: "error-amount"   },
    category: { inputId: "select-category", errorId: "error-category" },
    date:     { inputId: "input-date",      errorId: "error-date"     }
  };

  Object.values(fieldMap).forEach(({ inputId, errorId }) => {
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) {
      errorSpan.textContent   = "";
      errorSpan.hidden        = true;
      errorSpan.style.display = "";
    }
    const inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.classList.remove("is-invalid");
  });
}

/**
 * Repopulates the `#select-category` dropdown with options matching `currentType`.
 */
function populateCategorySelect() {
  const sel = document.getElementById("select-category");
  if (!sel) return;

  const catMap = currentType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  sel.innerHTML = `<option value="" disabled selected>Select a category</option>` +
    Object.entries(catMap)
      .map(([key, val]) => `<option value="${escapeHtml(key)}">${val.emoji} ${escapeHtml(key)}</option>`)
      .join("");
}

/**
 * Wires the type-toggle buttons and keeps `currentType`, the category select,
 * and the form heading in sync.
 */
function setupTypeToggle() {
  const toggle = document.getElementById("type-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-btn");
    if (!btn) return;

    const newType = btn.dataset.type;
    if (newType !== "expense" && newType !== "income") return;

    currentType = newType;

    // Update button active states
    toggle.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.toggle("type-btn--active", b.dataset.type === newType);
    });

    // Repopulate category select
    populateCategorySelect();

    // Update form heading
    const heading = document.getElementById("form-heading");
    if (heading) heading.textContent = currentType === "income" ? "Add Income" : "Add Expense";

    // Update submit button label (only when not in edit mode)
    if (editingId === null) {
      const submitBtn = document.getElementById("btn-submit");
      if (submitBtn) submitBtn.textContent = currentType === "income" ? "Save Income" : "Save Expense";
    }

    clearFormErrors();
  });
}

/**
 * Reads the form, validates, creates a new transaction record, and appends it
 * to the in-memory list. Persists to localStorage, re-renders the UI, resets
 * the form, and shows the success toast.
 */
function addTransaction() {
  clearFormErrors();

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    return;
  }

  const id = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : Date.now().toString();

  const name     = document.getElementById("input-name").value.trim();
  const amount   = parseInt(document.getElementById("input-amount").value, 10);
  const category = document.getElementById("select-category").value;
  const date     = document.getElementById("input-date").value;

  transactions.push({ id, type: currentType, name, amount, category, date });
  saveTransactions();
  renderAll();

  // Reset form
  document.getElementById("expense-form").reset();
  editingId = null;

  // Reset type toggle to expense
  currentType = "expense";
  const toggle = document.getElementById("type-toggle");
  if (toggle) {
    toggle.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.toggle("type-btn--active", b.dataset.type === "expense");
    });
  }
  populateCategorySelect();

  const heading   = document.getElementById("form-heading");
  const submitBtn = document.getElementById("btn-submit");
  if (heading)   heading.textContent   = "Add Expense";
  if (submitBtn) submitBtn.textContent = "Save Expense";

  // Show success toast
  showToast();
}

/**
 * Replaces the transaction record with the given `id` with merged `data`.
 * Persists and re-renders. Resets form to "add new" mode.
 */
function editTransaction(id, data) {
  if (!id || !data) return;

  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) return;

  transactions[index] = { ...transactions[index], ...data };
  saveTransactions();
  renderAll();

  editingId = null;
  const submitBtn = document.getElementById("btn-submit");
  if (submitBtn) submitBtn.textContent = "Save Expense";
}

/**
 * Removes the transaction with the given `id` from the list, persists, and re-renders.
 */
function deleteExpense(id) {
  if (!id) return;

  const backup = transactions.slice();
  try {
    transactions = transactions.filter((tx) => tx.id !== id);
    saveTransactions();
    renderAll();
  } catch (err) {
    console.error("deleteExpense: failed to remove transaction —", err.message);
    transactions = backup;
    renderAll();
  }
}

/**
 * Populates the form with the values of the transaction matching `id`, sets
 * the form into edit mode, and navigates to the Add Transaction tab.
 */
function populateFormForEdit(id) {
  if (!id) return;

  const tx = transactions.find((t) => t.id === id);
  if (!tx) return;

  editingId   = id;
  currentType = tx.type || "expense";

  // Update type toggle UI
  const toggle = document.getElementById("type-toggle");
  if (toggle) {
    toggle.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.toggle("type-btn--active", b.dataset.type === currentType);
    });
  }

  // Repopulate category select for the correct type, then set value
  populateCategorySelect();

  const nameEl     = document.getElementById("input-name");
  const amountEl   = document.getElementById("input-amount");
  const categoryEl = document.getElementById("select-category");
  const dateEl     = document.getElementById("input-date");

  if (nameEl)     nameEl.value     = tx.name;
  if (amountEl)   amountEl.value   = tx.amount;
  if (categoryEl) categoryEl.value = tx.category;
  if (dateEl)     dateEl.value     = tx.date;

  const heading   = document.getElementById("form-heading");
  const submitBtn = document.getElementById("btn-submit");
  if (heading)   heading.textContent   = currentType === "income" ? "Edit Income" : "Edit Expense";
  if (submitBtn) submitBtn.textContent = "Update Transaction";

  clearFormErrors();
  switchTab("add");
}

/**
 * Shows the success toast for 3 seconds.
 */
function showToast() {
  const toast = document.getElementById("toast-success");
  if (toast) {
    toast.hidden        = false;
    toast.style.display = "block";
    setTimeout(() => {
      toast.hidden        = true;
      toast.style.display = "";
    }, 3000);
  }
}

/**
 * Handles the Expense_Form "submit" event.
 */
function handleFormSubmit(e) {
  e.preventDefault();

  if (editingId !== null) {
    clearFormErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      showFormErrors(errors);
      return;
    }

    const name     = document.getElementById("input-name").value.trim();
    const amount   = parseInt(document.getElementById("input-amount").value, 10);
    const category = document.getElementById("select-category").value;
    const date     = document.getElementById("input-date").value;

    editTransaction(editingId, { type: currentType, name, amount, category, date });
    document.getElementById("expense-form").reset();
    showToast();
  } else {
    addTransaction();
  }
}

/**
 * Handles delegated click events on `#expense-list` for edit/delete actions.
 */
function handleListClick(e) {
  const target = e.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id     = target.dataset.id;

  if (action === "edit") {
    populateFormForEdit(id);
  } else if (action === "delete") {
    deleteExpense(id);
  }
}

/**
 * Wires filter bar change handlers for both the dashboard and history panels.
 */
function setupFilterHandlers() {
  const presetEl       = document.getElementById("filter-preset");
  const presetHistEl   = document.getElementById("filter-preset-history");
  const customDiv      = document.getElementById("filter-custom");
  const customHistDiv  = document.getElementById("filter-custom-history");
  const startEl        = document.getElementById("filter-start");
  const endEl          = document.getElementById("filter-end");
  const startHistEl    = document.getElementById("filter-start-history");
  const endHistEl      = document.getElementById("filter-end-history");
  const rangeErrEl     = document.getElementById("filter-range-error");
  const rangeErrHistEl = document.getElementById("filter-range-error-history");

  function toggleCustomInputs(preset) {
    const isCustom = preset === "custom";
    if (customDiv)     customDiv.hidden     = !isCustom;
    if (customHistDiv) customHistDiv.hidden = !isCustom;
  }

  function applyPreset(preset) {
    activeFilter.preset = preset;
    if (preset !== "custom") {
      activeFilter.startDate = null;
      activeFilter.endDate   = null;
    }
    toggleCustomInputs(preset);
    renderAll();
  }

  if (presetEl) {
    presetEl.addEventListener("change", () => {
      if (presetHistEl) presetHistEl.value = presetEl.value;
      applyPreset(presetEl.value);
    });
  }

  if (presetHistEl) {
    presetHistEl.addEventListener("change", () => {
      if (presetEl) presetEl.value = presetHistEl.value;
      applyPreset(presetHistEl.value);
    });
  }

  function handleStartChange(value, errEl) {
    activeFilter.startDate = value || null;
    if (activeFilter.startDate && activeFilter.endDate &&
        activeFilter.startDate > activeFilter.endDate) {
      if (errEl) errEl.hidden = false;
      return;
    }
    if (rangeErrEl)     rangeErrEl.hidden     = true;
    if (rangeErrHistEl) rangeErrHistEl.hidden = true;
    renderAll();
  }

  function handleEndChange(value, errEl) {
    activeFilter.endDate = value || null;
    if (activeFilter.startDate && activeFilter.endDate &&
        activeFilter.startDate > activeFilter.endDate) {
      if (errEl) errEl.hidden = false;
      return;
    }
    if (rangeErrEl)     rangeErrEl.hidden     = true;
    if (rangeErrHistEl) rangeErrHistEl.hidden = true;
    renderAll();
  }

  if (startEl)     startEl.addEventListener("change",     () => handleStartChange(startEl.value,     rangeErrEl));
  if (startHistEl) startHistEl.addEventListener("change", () => handleStartChange(startHistEl.value, rangeErrHistEl));
  if (endEl)       endEl.addEventListener("change",       () => handleEndChange(endEl.value,         rangeErrEl));
  if (endHistEl)   endHistEl.addEventListener("change",   () => handleEndChange(endHistEl.value,     rangeErrHistEl));
}

/**
 * Wires the search input in the History panel to filter the transaction list
 * by name in real-time.
 */
function setupSearchHandler() {
  const searchEl = document.getElementById("search-history");
  if (!searchEl) return;
  searchEl.addEventListener("input", () => {
    searchTerm = searchEl.value;
    renderExpenseList();
  });
}

/**
 * Shows the panel for `tabName` and hides the others. Updates Tab_Bar styles.
 */
function switchTab(tabName) {
  if (typeof tabName !== "string") return;

  try {
    const panels = {
      dashboard: "panel-dashboard",
      add:       "panel-add",
      history:   "panel-history"
    };

    if (!Object.prototype.hasOwnProperty.call(panels, tabName)) return;

    Object.keys(panels).forEach((key) => {
      const panel = document.getElementById(panels[key]);
      if (panel) panel.hidden = (key !== tabName);
    });

    document.querySelectorAll("#tab-bar .tab-btn").forEach((btn) => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle("tab--active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  } catch (err) {
    console.error("switchTab: failed to switch tab —", err.message);
    const errPanel = document.getElementById("error-panel");
    if (errPanel) errPanel.hidden = false;
  }
}

// === Init ===

document.addEventListener("DOMContentLoaded", () => {
  probeLocalStorage();

  transactions  = loadTransactions();
  activeFilter  = { preset: "month", startDate: null, endDate: null };

  // Sync filter dropdowns to default "month"
  const presetEl     = document.getElementById("filter-preset");
  const presetHistEl = document.getElementById("filter-preset-history");
  if (presetEl)     presetEl.value     = "month";
  if (presetHistEl) presetHistEl.value = "month";

  // Wire filter handlers
  setupFilterHandlers();
  setupSearchHandler();

  // Wire type-toggle
  setupTypeToggle();

  // Populate initial category options (expense by default)
  populateCategorySelect();

  // Wire tab navigation
  document.querySelectorAll("#tab-bar .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Wire form submit
  const form = document.getElementById("expense-form");
  if (form) form.addEventListener("submit", handleFormSubmit);

  // Wire list click delegation
  const list = document.getElementById("expense-list");
  if (list) list.addEventListener("click", handleListClick);

  // Wire chart-type toggle (doughnut ↔ bar)
  const chartToggle = document.getElementById("chart-toggle");
  if (chartToggle) {
    chartToggle.addEventListener("click", () => {
      chartType = chartType === "doughnut" ? "bar" : "doughnut";
      chartToggle.textContent = chartType === "doughnut"
        ? "Switch to Bar Chart"
        : "Switch to Doughnut Chart";
      renderChart(chartType);
    });
  }

  // Wire chart data mode toggle (expense ↔ income)
  const chartDataToggle = document.getElementById("chart-data-toggle");
  if (chartDataToggle) {
    chartDataToggle.addEventListener("click", () => {
      chartDataMode = chartDataMode === "expense" ? "income" : "expense";
      chartDataToggle.textContent = chartDataMode === "expense"
        ? "Viewing: Expenses → Switch to Income"
        : "Viewing: Income → Switch to Expenses";
      renderChart(chartType);
    });
  }

  // Wire empty-state "add" links on dashboard (delegated)
  const dashPanel = document.getElementById("panel-dashboard");
  if (dashPanel) {
    dashPanel.addEventListener("click", (e) => {
      const link = e.target.closest(".empty-state-link");
      if (link && link.dataset.tab) switchTab(link.dataset.tab);
    });
  }

  // Show dashboard and render
  switchTab("dashboard");
  renderAll();
});
