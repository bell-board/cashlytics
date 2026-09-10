# Design Document — Cashlytics Expense Tracker

## Overview

Cashlytics is a single-page, frontend-only expense tracker delivered as three static files: `index.html`, `style.css`, and `script.js`. There is no build step, no server, and no npm. All expense data lives in the browser's `localStorage`. The app targets beginner developers as a portfolio project, so every architectural decision favours clarity over cleverness.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Vanilla JavaScript (ES6+) | No framework dependency; beginner-friendly; matches brief |
| Persistence | `localStorage` (JSON) | Zero-setup, browser-native, sufficient for ≤ 10,000 records |
| Charts | Chart.js v4 via jsDelivr CDN | Requirement-specified; no local install needed |
| Font | Poppins (Google Fonts CDN) | Requirement-specified; fallback to `sans-serif` |
| Module pattern | IIFE / plain functions | Avoids ES module tooling; compatible with `<script>` tags |
| Currency | Indonesian Rupiah (Rp) | Requirement-specified; formatted with period thousand separators |

---

## Architecture

The app follows a simple **data → logic → render** flow with no reactive framework. All state lives in a single in-memory array (`expenses`) that is kept in sync with `localStorage` after every mutation.

```
┌──────────────────────────────────────────────────────┐
│                     index.html                        │
│  ┌──────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Tab_Bar  │  │  Active Panel   │  │ Filter Bar  │  │
│  └──────────┘  └─────────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────┘
            │ DOM events │
            ▼            ▼
┌──────────────────────────────────────────────────────┐
│                     script.js                         │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │             In-memory state                      │  │
│  │   expenses[]   activeFilter   editingId          │  │
│  └─────────────────────────────────────────────────┘  │
│         │ read/write            │ read                │
│         ▼                       ▼                    │
│  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ Data/Storage │  │  Rendering (list, chart,     │   │
│  │  functions   │  │  dashboard, form)            │   │
│  └──────────────┘  └─────────────────────────────┘   │
│         │                       │                    │
│         ▼                       ▼                    │
│  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │  localStorage│  │      Chart.js (CDN)          │   │
│  └──────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Data Flow

1. On **load**: `loadExpenses()` reads `localStorage` → populates `expenses[]` → `renderAll()` fires.
2. On **add/edit**: `validateForm()` → `saveExpenses()` → `renderAll()`.
3. On **delete**: `deleteExpense(id)` → `saveExpenses()` → `renderAll()`.
4. On **filter change**: updates `activeFilter` state → `renderAll()`.
5. On **chart toggle**: calls `renderChart(type)` only.

`renderAll()` is a convenience function that calls `renderExpenseList()`, `renderChart()`, and `updateDashboard()` in sequence using the current `activeFilter`.

---

## Components and Interfaces

### Tab_Bar

- Rendered as a `<nav>` with three `<button>` elements: Dashboard, Add Expense, History.
- CSS class `tab--active` marks the currently active tab.
- Desktop (≥ 768 px): fixed top navigation bar.
- Mobile (< 768 px): fixed bottom navigation bar, min-height 48 px.
- Default active: Dashboard.

### Expense_Form

- Lives inside the Add Expense panel.
- Fields: `#input-name` (text), `#input-amount` (number), `#select-category` (select), `#input-date` (date).
- Hidden `#editing-id` field stores the ID of the expense being edited, or is empty for new additions.
- Error containers (`<span class="error-msg">`) sit adjacent to each field; toggled visible on validation failure.
- Success toast: a `<div id="toast-success">` shown for 3 seconds after successful save.

### Expense_List

- Lives inside the History panel.
- Rendered as a `<ul id="expense-list">` where each `<li>` is a card.
- Each card shows: name, `Rupiah_Formatter(amount)`, `{emoji} {category}`, date as `DD/MM/YYYY`.
- Each card has a Delete button (`data-id`) and an Edit button (`data-id`).
- Empty-state: a `<p id="list-empty">` shown when no entries match the active filter.

### Filter_Bar

- Displayed on both the History and Dashboard panels (or a shared sticky bar — single instance, shared via CSS visibility).
- Contains a `<select id="filter-preset">` with options: Today, This Week, This Month, Custom Range.
- Custom Range shows `#filter-start` and `#filter-end` date inputs, hidden otherwise.
- Defaults to "This Month" on load.

### Dashboard

- Lives inside the Dashboard panel.
- Three stat cards:
  - All-time total (`#stat-alltime`)
  - Filtered total (`#stat-filtered`)
  - Top spending category (`#stat-top-category`)
- The chart `<canvas id="chart-canvas">` lives below the stat cards.
- Chart type toggle: `<button id="chart-toggle">` cycles between "Donut" and "Bar".

### Chart

- Single `Chart` instance stored in `let chartInstance`.
- On `renderChart(type)`: if `chartInstance` exists, call `chartInstance.destroy()` then create a new one.
- CDN: `https://cdn.jsdelivr.net/npm/chart.js`
- If CDN fails (detected via `window.Chart === undefined` before render): show `#chart-error` message, hide `#chart-canvas`.

---

## Data Models

### Expense Object

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString() fallback
  name: string,        // 1–100 characters
  amount: number,      // integer, 1–999,999,999,999
  category: string,    // one of the six predefined category keys
  date: string         // ISO 8601 date "YYYY-MM-DD"
}
```

### localStorage Schema

```
Key:   "cashlytics_expenses"
Value: JSON string of Expense[]
```

Example stored value:
```json
[
  { "id": "1720000000001", "name": "Mie Goreng", "amount": 15000, "category": "Food", "date": "2024-07-03" }
]
```

### Category Registry

```js
const CATEGORIES = {
  Food:          { emoji: "🍔", colour: "#FFB3C1" },  // pastel pink
  Transport:     { emoji: "🚗", colour: "#C9B8FF" },  // lavender
  Shopping:      { emoji: "🛍️", colour: "#B5EAD7" },  // mint green
  Bills:         { emoji: "💡", colour: "#AEE1F9" },  // baby blue
  Entertainment: { emoji: "🎮", colour: "#FDFD96" },  // soft yellow
  Others:        { emoji: "📦", colour: "#FFD7B5" }   // soft peach
};
```

### Filter State Object

```js
{
  preset: "today" | "week" | "month" | "custom",
  startDate: string | null,   // "YYYY-MM-DD"
  endDate: string | null      // "YYYY-MM-DD"
}
```

### In-Memory App State

```js
let expenses    = [];           // loaded from localStorage on init
let activeFilter = { ... };     // current filter state, defaults to "month"
let editingId   = null;         // id of expense being edited, or null
let chartType   = "doughnut";   // "doughnut" | "bar"
let chartInstance = null;       // Chart.js instance reference
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Malformed localStorage always yields empty expense list

*For any* value stored at the `cashlytics_expenses` localStorage key that is not a valid JSON array of well-formed expense objects (e.g., arbitrary strings, numbers, null, malformed JSON, arrays of non-expense objects), loading the Expense_Store must return an empty array and must not throw an uncaught exception.

**Validates: Requirements 1.5**

---

### Property 2: Validator accepts valid expenses and rejects invalid ones

*For any* input object, the Validator must accept it if and only if all of the following hold: the name is a non-empty string of 1–100 characters, the amount is an integer in the range 1–999,999,999,999, the category is one of the six predefined category keys, and the date is a valid calendar date that is not in the future. Any input that violates at least one condition must be rejected.

**Validates: Requirements 2.3**

---

### Property 3: Invalid fields never clear valid field values on rejected submission

*For any* combination of form field values where at least one field is invalid, after a rejected form submission, every field whose value satisfies its validation constraint must retain its value unchanged.

**Validates: Requirements 2.4**

---

### Property 4: Category emoji+label format holds in every rendering context

*For any* of the six predefined categories, in every context where that category is rendered (Expense_Form dropdown option, Expense_List entry, Chart legend label), the rendered string must match the exact pattern `"{emoji} {label}"` using the mapping defined in the Category Registry — with the emoji immediately preceding a single space and then the label.

**Validates: Requirements 3.1, 3.2**

---

### Property 5: All six category colours are pairwise distinct

*For any* rendering of the six category labels in the Expense_List and the Chart, no two different categories may share the same background colour or chart segment colour. The mapping of category → colour must be bijective over the six colour values defined in the Category Registry.

**Validates: Requirements 3.3, 6.6**

---

### Property 6: Unknown category always falls back to Others emoji

*For any* string value that is not one of the six predefined category keys (including empty string, `null`, `undefined`, and arbitrary text), looking up that value in the category registry must return the Others emoji (`📦`) and must not throw an uncaught exception.

**Validates: Requirements 3.4**

---

### Property 7: Expense list sort order invariant

*For any* list of expenses, after calling `renderExpenseList()`, the rendered order must satisfy: for every pair of adjacent entries (i, i+1), `entry[i].date >= entry[i+1].date`. For entries sharing the same date, the entry that was inserted later (higher insertion index in the source array) must appear before the one inserted earlier.

**Validates: Requirements 4.1**

---

### Property 8: Date filter includes only in-range expenses

*For any* array of expenses and any active filter with a resolved `startDate` and `endDate`, every expense rendered in the Expense_List must have a date in the range `[startDate, endDate]` inclusive, and every expense with a date outside that range must not appear in the rendered list.

**Validates: Requirements 4.2, 5.4**

---

### Property 9: Expense list entries render all required fields in correct format

*For any* valid expense object, the rendered HTML for that entry in the Expense_List must contain: the expense name verbatim, the amount formatted as `"Rp X.XXX"` (with period thousand separators), the category as `"{emoji} {label}"`, and the date formatted as `"DD/MM/YYYY"`.

**Validates: Requirements 4.3**

---

### Property 10: Edit round-trip preserves exactly one updated record

*For any* existing expense and any valid set of replacement field values, after populating the form with the existing expense, submitting the updated values, the Expense_Store must contain exactly one record with the new field values and must not contain any record with the original field values of the edited expense.

**Validates: Requirements 4.9**

---

### Property 11: Custom range start-after-end is always blocked

*For any* custom date range where the start date is strictly after the end date, the filter application must be blocked and an inline error message must be displayed; the Expense_List and Chart must not re-render with that invalid range.

**Validates: Requirements 5.2, 5.3**

---

### Property 12: Chart data equals category-summed filtered expense amounts

*For any* expense list and active filter, the data value for each category in the rendered chart must equal the arithmetic sum of the `amount` fields of all expenses that both (a) match the active filter date range and (b) belong to that category. Categories with no matching expenses must contribute a value of 0.

**Validates: Requirements 6.2**

---

### Property 13: Chart colours are consistent across chart types

*For any* switch between donut and bar chart types, each category must be assigned the exact same colour value in both chart types as defined in the Category Registry; no category colour may differ between chart types.

**Validates: Requirements 6.6**

---

### Property 14: All-time dashboard total equals sum of all expenses

*For any* list of expenses stored in the Expense_Store, the all-time total displayed on the Dashboard must equal the arithmetic sum of the `amount` field across all stored expenses, formatted by the Rupiah_Formatter.

**Validates: Requirements 7.1**

---

### Property 15: Filtered dashboard total equals sum of filtered expenses

*For any* expense list and active filter, the filtered total displayed on the Dashboard must equal the arithmetic sum of the `amount` fields of all expenses whose date falls within the active filter range, formatted by the Rupiah_Formatter.

**Validates: Requirements 7.2**

---

### Property 16: Top spending category uses correct argmax with alphabetical tie-breaking

*For any* expense list and active filter, the top spending category displayed on the Dashboard must be the category whose total filtered amount is strictly greater than all others; when two or more categories share the highest total, the category that comes first alphabetically (by category key, case-insensitive) must be selected.

**Validates: Requirements 7.3**

---

### Property 17: Rupiah_Formatter formats all valid integers correctly

*For any* integer `n` in the range `[0, 999,999,999,999]`, `rupiahFormatter(n)` must return a string that begins with `"Rp "` followed by the decimal representation of `n` with periods inserted as thousand separators (every three digits from the right), with no leading zeros (except for `n = 0` which returns `"Rp 0"`).

**Validates: Requirements 9.1**

---

### Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs

*For any* input to `rupiahFormatter()` that is not an integer in `[0, 999,999,999,999]` — including non-numeric types, negative numbers, decimal numbers, values exceeding 999,999,999,999, `null`, `undefined`, and `NaN` — the return value must be exactly `"Rp 0"`.

**Validates: Requirements 9.4**

---

### Property 19: Amount input rejects out-of-range and non-integer values

*For any* value entered into the Expense_Form amount field that is not a whole positive integer in the range `[1, 999,999,999,999]` (including zero, negatives, decimals, and values exceeding the maximum), the Validator must reject that value and the form must not be submitted.

**Validates: Requirements 9.3**

---

## Error Handling

| Failure Mode | Detection | Response |
|---|---|---|
| `localStorage` unavailable | `try/catch` around `localStorage.setItem` test on init | Show `#error-storage` banner; continue with in-memory array |
| Malformed localStorage data | `JSON.parse` throws or result fails schema check | Discard, use `[]`, show `#error-data` inline message |
| `localStorage.setItem` fails on write | `try/catch` around every `saveExpenses()` call | Preserve in-memory state; show inline save-error message |
| Chart.js CDN fails to load | Check `typeof Chart === "undefined"` before `renderChart()` | Show `#chart-error` message; hide canvas |
| Google Fonts fails to load | CSS `@font-face` fallback; `font-display: swap` | Browser falls back to `sans-serif`; no JS intervention needed |
| `deleteExpense` fails | `try/catch` in `deleteExpense()` | Keep entry in list; show inline delete-error message |
| Tab panel fails to render | `try/catch` in `switchTab()` | Show `#error-panel` message; keep Tab_Bar in last known state |
| Form submitted with invalid args (per Req 12.5) | `typeof` checks at function entry in named functions | Apply documented defaults (`undefined` → skip) without throwing |

---

## Testing Strategy

### Overview

Because this app is frontend-only vanilla JavaScript with no build toolchain, tests use a lightweight test runner (e.g., [uvu](https://github.com/lukeed/uvu) or Vitest with `jsdom` environment) that can be run as a single script via Node. For property-based tests, [fast-check](https://fast-check.dev/) is used — it requires no bundler and can be required as a single CommonJS module.

### Unit Tests (Example-Based)

These verify specific behaviours and structural requirements:

- **DOM structure**: Expense_Form contains all four fields; Category dropdown has exactly six options in correct order; Tab_Bar has exactly three tabs; each Expense_List entry has Delete and Edit buttons.
- **Initialization**: Pre-populating localStorage then calling `loadExpenses()` makes expenses available before first render.
- **Form success flow**: Submitting a valid form saves the expense, resets fields, and shows the success toast for ≥ 3 seconds.
- **Form error preservation**: Submitting a form with one invalid field displays a per-field error and does not clear other fields.
- **Edit flow**: Clicking Edit populates the form with correct values and navigates to the Add Expense tab.
- **Delete flow**: Clicking Delete removes the entry from the store and re-renders within 300 ms.
- **Filter presets**: Today, This Week, This Month, Custom Range options all exist; default is This Month on load.
- **Filter change**: Changing filter re-renders list and chart.
- **Empty states**: Expense_List shows empty-state message when no expenses match the filter; Dashboard shows `Rp 0` and "No data"; Chart shows placeholder.
- **Chart toggle**: Clicking the toggle switches chart type and re-renders within 300 ms.
- **Chart CDN failure**: When `window.Chart` is undefined, `#chart-error` is shown and canvas is hidden.
- **Currency rendering contexts**: Expense_List, Dashboard totals, and Chart tooltip all use `rupiahFormatter()`.
- **Category emoji mappings**: Each of the six categories renders with its exact specified emoji.

### Property-Based Tests

Using **fast-check** with a minimum of **100 iterations per property**.

Each test references the design property it validates using the tag format:
`// Feature: cashlytics-expense-tracker, Property {N}: {property_text}`

| Property | What is randomised | What is asserted |
|---|---|---|
| P1: Malformed localStorage | Arbitrary JSON values (strings, numbers, malformed arrays, arrays of non-expense objects) | `loadExpenses()` returns `[]`, no exception thrown |
| P2: Validator accept/reject | Random objects with any combination of field values | Validator output matches hand-computed expected result based on each field's constraints |
| P3: Valid fields preserved on rejection | Expense objects with one randomly chosen field made invalid | All other field values unchanged in form DOM after rejected submit |
| P4: Category emoji+label format | Any of the six category keys; any rendering context | Output string matches `"^{emoji} {label}$"` |
| P5: Pairwise distinct category colours | No randomisation (fixed set of 6) | All six colour values are unique (`new Set().size === 6`) |
| P6: Unknown category fallback | Arbitrary strings not in the category registry | Returns `"📦"`, no exception |
| P7: List sort order invariant | Random arrays of 0–100 expense objects with varied dates | For all adjacent pairs, date ordering and tie-breaking by insertion order holds |
| P8: Date filter correctness | Random expense lists + random date ranges | All rendered expenses are in range; all out-of-range expenses are absent |
| P9: List entry render format | Random valid expense objects | Rendered HTML contains formatted amount, emoji+category, DD/MM/YYYY date |
| P10: Edit round-trip | Random existing expense + random valid replacement fields | Store has exactly one record with new values; original values gone |
| P11: Invalid custom range blocked | Random date pairs where start > end | Filter not applied; error message shown; list and chart unchanged |
| P12: Chart data equals filtered category sums | Random expense lists + random filters | Chart dataset values match `expenses.filter(e => inRange(e)).reduce(sum by category)` |
| P13: Chart colour consistency | No randomisation | Donut and bar configs share identical `backgroundColor` arrays |
| P14: All-time total | Random expense arrays | Dashboard all-time value equals `expenses.reduce((s, e) => s + e.amount, 0)` |
| P15: Filtered total | Random expense lists + random filters | Dashboard filtered value equals sum of in-range amounts |
| P16: Top category with tie-breaking | Random expense lists with controlled ties | Top category equals correct argmax; alphabetical winner on tie |
| P17: Rupiah formatter valid range | Random integers in `[0, 999_999_999_999]` | Output starts with `"Rp "`, correct period-separated digits, no leading zeros |
| P18: Rupiah formatter invalid input | Non-integer types, negatives, decimals, out-of-range | Always returns exactly `"Rp 0"` |
| P19: Amount validation | Random numbers (valid and invalid) | Validator rejects all values outside `[1, 999_999_999_999]` integers |

### Integration Notes

- Chart rendering tests run with `jsdom` and a mocked `Chart` constructor that records the config it receives.
- `localStorage` is mocked using a simple in-memory Map in the test environment.
- Visual/responsive layout tests (Req 10, chart resize) are best verified manually or with a tool like Playwright at 375 px and 1024 px viewports.
