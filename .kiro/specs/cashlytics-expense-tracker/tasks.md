# Implementation Plan: Cashlytics Expense Tracker

## Overview

Build a frontend-only expense tracker as three static files (`index.html`, `style.css`, `script.js`) with no build step. Implementation follows a bottom-up order: HTML skeleton → CSS → storage/utilities → rendering → interactivity → chart/dashboard → tests. Each task wires into the previous so there is no orphaned code at any step.

All property-based tests use **fast-check** and are tagged with their design property number. Unit tests use **Vitest** with a `jsdom` environment.

---

## Tasks

- [x] 1. Scaffold HTML structure
  - [x] 1.1 Create `index.html` with document skeleton, CDN links, and tab panels
    - Add `<meta charset>`, `<meta name="viewport">`, and `<title>Cashlytics</title>`
    - Link Google Fonts (Poppins) in `<head>`
    - Add Chart.js CDN script tag: `https://cdn.jsdelivr.net/npm/chart.js`
    - Add `<link rel="stylesheet" href="style.css">` and `<script src="script.js" defer></script>`
    - Create `<nav id="tab-bar">` with exactly three `<button>` elements: Dashboard, Add Expense, History
    - Create three `<section>` panel elements: `#panel-dashboard`, `#panel-add`, `#panel-history`
    - _Requirements: 2.1, 8.1, 8.2, 8.3, 12.1_

  - [x] 1.2 Add Expense_Form markup inside `#panel-add`
    - Add `<input id="input-name" type="text">`, `<input id="input-amount" type="number">`, `<select id="select-category">`, `<input id="input-date" type="date">`
    - Populate the category `<select>` with exactly six `<option>` elements in order: 🍔 Food, 🚗 Transport, 🛍️ Shopping, 💡 Bills, 🎮 Entertainment, 📦 Others
    - Add `<span class="error-msg">` adjacent to each field for inline validation errors
    - Add `<input type="hidden" id="editing-id">` for edit-mode tracking
    - Add `<div id="toast-success">` for the post-save confirmation message
    - _Requirements: 2.1, 2.2, 3.2_

  - [x] 1.3 Add Filter_Bar, Expense_List, and Dashboard markup
    - Create `<div id="filter-bar">` containing `<select id="filter-preset">` with four options: Today, This Week, This Month, Custom Range
    - Add `<input id="filter-start" type="date">` and `<input id="filter-end" type="date">` (hidden by default) inside `#filter-bar`
    - Inside `#panel-history`: add `<ul id="expense-list">` and `<p id="list-empty">`
    - Inside `#panel-dashboard`: add stat cards `#stat-alltime`, `#stat-filtered`, `#stat-top-category`; add `<canvas id="chart-canvas">`; add `<button id="chart-toggle">`; add `<p id="chart-error">` (hidden by default)
    - Add inline error banners: `#error-storage`, `#error-data` (hidden by default)
    - _Requirements: 4.3, 4.10, 5.1, 6.4, 7.1, 7.2, 7.3_

- [x] 2. Write base CSS and responsive layout
  - [x] 2.1 Set up CSS reset, custom properties, and typography
    - Define CSS custom properties for the six pastel category colours, background, text, and shadow values
    - Apply `font-family: 'Poppins', sans-serif` to `*` or `body`
    - Set `box-sizing: border-box` and a base margin/padding reset
    - _Requirements: 11.1, 11.2_

  - [x] 2.2 Style cards, inputs, buttons, and interactive elements
    - Apply `border-radius: 8px` or above to all cards, buttons, inputs, and chart container
    - Apply `box-shadow` with blur 4–16 px and opacity 5–20% to card and panel elements
    - Apply CSS `transition` (150–300 ms, easing) to buttons, tab switches, and hover states
    - Style the success toast (`#toast-success`) with a visible pastel background; default `display: none`
    - Style per-field `.error-msg` elements: red-tinted text, hidden by default
    - _Requirements: 11.3, 11.4, 11.5_

  - [x] 2.3 Implement responsive layout and mobile Tab_Bar
    - At ≥ 768 px: position `#tab-bar` as a fixed top bar; display content in a multi-column (≥ 2 columns) layout using CSS Grid or Flexbox
    - At < 768 px: move `#tab-bar` to `position: fixed; bottom: 0` with `min-height: 48px`; add equivalent `padding-bottom` to the page body to prevent overlap; reflow Expense_List entries to single-column stacked cards
    - Ensure no horizontal overflow at 320 px viewport width
    - Apply the `tab--active` class style (visible weight/underline/background contrast) for the active tab button
    - _Requirements: 8.2, 8.3, 10.1, 10.2, 10.3, 10.4_

- [ ] 3. Implement storage and utility functions in `script.js`
  - [x] 3.1 Set up app state, constants, and section headers
    - Declare `const CATEGORIES` object with all six entries (emoji + colour)
    - Declare in-memory state variables: `let expenses = []`, `let activeFilter`, `let editingId = null`, `let chartType = "doughnut"`, `let chartInstance = null`
    - Set default `activeFilter` to `{ preset: "month", startDate: null, endDate: null }`
    - Add comment-header sections: `// === Data / Storage ===`, `// === Rendering ===`, `// === Event Handlers ===`, `// === Utilities ===`
    - _Requirements: 12.3_

  - [x] 3.2 Implement `rupiahFormatter(n)`
    - Accept an integer; return `"Rp "` + value with period thousand separators
    - For `n = 0` return `"Rp 0"`
    - For any non-integer, negative, decimal, or out-of-range value: return `"Rp 0"` and log a descriptive error to console
    - _Requirements: 9.1, 9.4_

  - [ ] 3.3 Write property tests for `rupiahFormatter`
    - **Property 17: Rupiah_Formatter formats all valid integers correctly**
    - **Validates: Requirements 9.1**
    - **Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs**
    - **Validates: Requirements 9.4**

  - [x] 3.4 Implement `loadExpenses()` and `saveExpenses()`
    - `loadExpenses()`: wrap `localStorage.getItem("cashlytics_expenses")` in `try/catch`; parse JSON; validate result is an array of well-formed expense objects; on any failure return `[]` and set a flag to show `#error-data`
    - `saveExpenses()`: wrap `localStorage.setItem` in `try/catch`; on failure preserve in-memory state and show inline save-error message
    - On init: test localStorage availability with a probe `setItem`/`removeItem`; on failure show `#error-storage` banner
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 3.5 Write property test for malformed localStorage
    - **Property 1: Malformed localStorage always yields empty expense list**
    - **Validates: Requirements 1.5**

- [ ] 4. Implement the Validator
  - [ ] 4.1 Implement `validateForm()` returning an errors object
    - Check name: non-empty string, 1–100 characters
    - Check amount: whole positive integer, 1–999,999,999,999
    - Check category: one of the six predefined keys
    - Check date: valid calendar date, not in the future
    - Return a map of `{ fieldName: errorMessage }` for every failing field; return empty object if all pass
    - _Requirements: 2.3_

  - [ ] 4.2 Write property tests for the Validator
    - **Property 2: Validator accepts valid expenses and rejects invalid ones**
    - **Validates: Requirements 2.3**
    - **Property 19: Amount input rejects out-of-range and non-integer values**
    - **Validates: Requirements 9.3**

  - [ ] 4.3 Implement `showFormErrors(errors)` and `clearFormErrors()`
    - `showFormErrors(errors)`: for each key in the errors object, display the message in the corresponding `.error-msg` span; do not clear fields that passed validation
    - `clearFormErrors()`: hide all `.error-msg` spans and remove any error styling
    - _Requirements: 2.4_

  - [ ] 4.4 Write property test for valid-field preservation on rejection
    - **Property 3: Invalid fields never clear valid field values on rejected submission**
    - **Validates: Requirements 2.4**

- [ ] 5. Implement expense CRUD operations
  - [ ] 5.1 Implement `addExpense()` / `editExpense(id, data)`
    - `addExpense()`: call `validateForm()`; on failure call `showFormErrors()` and return; on success generate a new ID (`crypto.randomUUID()` with `Date.now().toString()` fallback), push to `expenses[]`, call `saveExpenses()`, call `renderAll()`, reset form fields, show `#toast-success` for 3 seconds
    - `editExpense(id, data)`: replace the matching expense in `expenses[]` by ID; call `saveExpenses()`; call `renderAll()`; clear `editingId`
    - Wire the form `submit` event to call `addExpense()` or `editExpense()` depending on whether `editingId` is set
    - _Requirements: 2.5, 2.6, 2.7, 4.9_

  - [ ] 5.2 Write property test for edit round-trip
    - **Property 10: Edit round-trip preserves exactly one updated record**
    - **Validates: Requirements 4.9**

  - [ ] 5.3 Implement `deleteExpense(id)`
    - Find the expense by `id` in `expenses[]`; remove it; call `saveExpenses()`; call `renderAll()` — all within 300 ms
    - Wrap in `try/catch`; on failure keep the entry in the list and show an inline delete-error message
    - Wire Delete button click events (via event delegation on `#expense-list`) to call `deleteExpense()`
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ] 5.4 Implement `populateFormForEdit(id)`
    - Find the expense by `id`; set `editingId = id`; populate `#input-name`, `#input-amount`, `#select-category`, `#input-date` with its values; navigate to the Add Expense tab
    - Wire Edit button click events (via event delegation on `#expense-list`) to call `populateFormForEdit()`
    - _Requirements: 4.7, 4.8_

- [ ] 6. Implement filtering logic
  - [ ] 6.1 Implement `filterByDate(expenses, filter)` returning a filtered array
    - Resolve `startDate` / `endDate` from the preset (`today`, `week`, `month`) or use the custom range values
    - Return every expense whose `date` string falls within `[startDate, endDate]` inclusive
    - For `custom` preset: if `startDate > endDate` throw / return an error sentinel (not the full list)
    - _Requirements: 4.2, 5.1, 5.4_

  - [ ] 6.2 Write property tests for date filter correctness
    - **Property 8: Date filter includes only in-range expenses**
    - **Validates: Requirements 4.2, 5.4**

  - [ ] 6.3 Implement Filter_Bar event handlers
    - On `#filter-preset` change: update `activeFilter.preset`; show/hide the custom date inputs when preset is `"custom"`; call `renderAll()`
    - On `#filter-start` or `#filter-end` change (custom range): validate start ≤ end; on violation block and show inline error; otherwise update `activeFilter` and call `renderAll()`
    - Default `#filter-preset` to "This Month" on load
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [ ] 6.4 Write property test for invalid custom range blocking
    - **Property 11: Custom range start-after-end is always blocked**
    - **Validates: Requirements 5.2, 5.3**

- [ ] 7. Implement Expense_List rendering
  - [ ] 7.1 Implement `renderExpenseList()`
    - Call `filterByDate(expenses, activeFilter)` to get the visible subset
    - Sort result: descending by `date`; ties broken by reverse insertion order (higher array index first)
    - For each expense, generate an `<li>` card with: name, `rupiahFormatter(amount)`, `"{emoji} {category}"`, date as `DD/MM/YYYY`, Delete button (`data-id`), Edit button (`data-id`)
    - Apply the category pastel background colour from `CATEGORIES` to the category badge
    - If result is empty, show `#list-empty`; otherwise hide it
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.10_

  - [ ] 7.2 Write property tests for list rendering
    - **Property 7: Expense list sort order invariant**
    - **Validates: Requirements 4.1**
    - **Property 9: Expense list entries render all required fields in correct format**
    - **Validates: Requirements 4.3**

  - [ ] 7.3 Write property tests for category rendering
    - **Property 4: Category emoji+label format holds in every rendering context**
    - **Validates: Requirements 3.1, 3.2**
    - **Property 5: All six category colours are pairwise distinct**
    - **Validates: Requirements 3.3, 6.6**
    - **Property 6: Unknown category always falls back to Others emoji**
    - **Validates: Requirements 3.4**

- [ ] 8. Checkpoint — core CRUD and list rendering
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Chart rendering
  - [ ] 9.1 Implement `renderChart(type)`
    - Check `typeof Chart === "undefined"` first; if true show `#chart-error`, hide `#chart-canvas`, and return
    - Call `filterByDate(expenses, activeFilter)` to get the visible subset
    - Sum amounts by category for all six categories (zero for categories with no matching expenses)
    - If all category totals are zero, destroy any existing chart instance, display an empty-state placeholder message, and return
    - Destroy `chartInstance` if it exists, then construct a new `Chart` on `#chart-canvas` using the summed data, `CATEGORIES` colours, and emoji+label strings for legend/tooltips
    - Tooltip format: category name + `rupiahFormatter(total)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.8, 6.9_

  - [ ] 9.2 Write property tests for chart data correctness
    - **Property 12: Chart data equals category-summed filtered expense amounts**
    - **Validates: Requirements 6.2**
    - **Property 13: Chart colours are consistent across chart types**
    - **Validates: Requirements 6.6**

  - [ ] 9.3 Implement `#chart-toggle` event handler
    - On click: toggle `chartType` between `"doughnut"` and `"bar"`; update button label; call `renderChart(chartType)` — completes within 300 ms
    - _Requirements: 6.4, 6.5_

- [ ] 10. Implement Dashboard calculations
  - [ ] 10.1 Implement `updateDashboard()`
    - All-time total: sum `amount` across all `expenses[]`; display via `rupiahFormatter()` in `#stat-alltime`
    - Filtered total: sum `amount` across `filterByDate(expenses, activeFilter)` result; display via `rupiahFormatter()` in `#stat-filtered`
    - Top category: find category with highest filtered total; on tie, pick alphabetically first (case-insensitive); display `"{emoji} {label}"` in `#stat-top-category`; if no filtered expenses, display `"Rp 0"` and `"No data"` respectively
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.2 Write property tests for dashboard calculations
    - **Property 14: All-time dashboard total equals sum of all expenses**
    - **Validates: Requirements 7.1**
    - **Property 15: Filtered dashboard total equals sum of filtered expenses**
    - **Validates: Requirements 7.2**
    - **Property 16: Top spending category uses correct argmax with alphabetical tie-breaking**
    - **Validates: Requirements 7.3**

- [ ] 11. Wire everything together with `renderAll()` and tab navigation
  - [ ] 11.1 Implement `renderAll()` and `switchTab(tabName)`
    - `renderAll()`: call `renderExpenseList()`, `renderChart(chartType)`, `updateDashboard()` in sequence using the current `activeFilter`
    - `switchTab(tabName)`: show the matching panel, hide the other two, apply `tab--active` to the clicked tab button, remove it from the others; wrap in `try/catch` — on failure show `#error-panel` and keep Tab_Bar in last known state
    - Wire `#tab-bar` button click events to call `switchTab()`
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 12.1_

  - [ ] 11.2 Implement app initialisation
    - On `DOMContentLoaded`: probe localStorage availability; call `loadExpenses()`; set `activeFilter` default to "month"; call `switchTab("dashboard")`; call `renderAll()`
    - Ensure the Expense_Store is populated before the first render
    - _Requirements: 1.2, 5.6, 8.6_

  - [ ] 11.3 Add inline JSDoc-style comments above every named function
    - Each comment must be 1–3 sentences in plain English describing: what the function does, what arguments it expects (if any), and what it returns or modifies
    - Functions requiring comments: `addExpense`, `renderChart`, `filterByDate`, `deleteExpense`, `editExpense`, `renderExpenseList`, `updateDashboard`, `rupiahFormatter`, `loadExpenses`, `saveExpenses`, `validateForm`, `switchTab`, `renderAll`, `populateFormForEdit`
    - _Requirements: 12.1, 12.2_

  - [ ] 11.4 Audit `script.js` for code quality
    - Remove any unused variables, unreachable code blocks, or stray `console.log` statements (keep only the required error log in `rupiahFormatter`)
    - Verify every named function from Req 12.1 treats missing/invalid arguments as `undefined` and applies a documented default or skips the operation without throwing
    - _Requirements: 12.4, 12.5_

- [ ] 12. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- The design uses vanilla JavaScript (ES6+) — no framework, no bundler, no npm required for the app itself
- Testing dependencies (`vitest`, `jsdom`, `fast-check`) are dev-only and do not affect the static output
- Property tests must be tagged: `// Feature: cashlytics-expense-tracker, Property {N}: {property_text}`
- Each property-based test runs a minimum of 100 iterations
- Visual/responsive layout requirements (Req 10) are best verified manually at 375 px and 1024 px viewports
- Chart rendering tests mock the `Chart` constructor and `localStorage` using an in-memory Map

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "3.2", "3.4"] },
    { "id": 2, "tasks": ["3.3", "3.5", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "5.1", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 10, "tasks": ["10.2", "11.1"] },
    { "id": 11, "tasks": ["11.2"] },
    { "id": 12, "tasks": ["11.3"] },
    { "id": 13, "tasks": ["11.4"] }
  ]
}
```
