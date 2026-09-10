# Requirements Document

## Introduction

Cashlytics is a frontend-only expense tracker that runs entirely in the browser with no backend, server, or database. It is built with plain HTML, CSS, and vanilla JavaScript, storing all data in the browser's localStorage. The app targets beginner developers as a portfolio project, so the code must be clearly commented and organized. Users can add expenses, view a visual category breakdown, filter by date, manage their expense history, and review a summary dashboard — all without any installation or setup. The currency is Indonesian Rupiah (Rp) and the UI language is English.

---

## Glossary

- **App**: The Cashlytics single-page browser application.
- **Expense**: A single spending record consisting of a name, amount, category, and date.
- **Expense_Store**: The browser's localStorage key-value store used to persist all expense data.
- **Expense_Form**: The HTML form on the Add Expense tab used to create or edit an expense.
- **Expense_List**: The rendered list of expense entries shown on the History tab.
- **Dashboard**: The summary view showing totals and the chart, accessed via the Dashboard tab.
- **Chart**: The Chart.js-powered visual breakdown of spending by category.
- **Filter**: The date-range control that limits which expenses appear in the Expense_List and Chart.
- **Category**: One of the six predefined spending labels: Food, Transport, Shopping, Bills, Entertainment, Others — each paired with a corresponding emoji.
- **Tab_Bar**: The navigation component that switches between the Dashboard, Add Expense, and History tabs. Displayed at the top on desktop and at the bottom on mobile.
- **Rupiah_Formatter**: The utility that formats numeric amounts as Indonesian Rupiah strings (e.g., Rp 50.000).
- **Validator**: The client-side logic that checks Expense_Form inputs before saving.

---

## Requirements

### Requirement 1: Data Persistence

**User Story:** As a user, I want my expenses saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. THE Expense_Store SHALL persist all expense records using the browser's localStorage API, with a maximum of 10,000 expense records stored at any one time.
2. WHEN the App initialises, THE Expense_Store SHALL load all previously saved expense records from localStorage and make them available to the App before any expense data is rendered.
3. WHEN an expense is added, edited, or deleted, THE Expense_Store SHALL write the updated expense list to localStorage within 500 milliseconds of the triggering action completing.
4. IF localStorage is unavailable or a read/write error occurs, THEN THE App SHALL display an inline error message indicating that data cannot be saved, and SHALL retain the current in-memory expense list for the duration of the session without data loss.
5. IF the data retrieved from localStorage is malformed or cannot be parsed as a valid expense list, THEN THE Expense_Store SHALL discard the corrupted data, initialise with an empty expense list, and notify the App to display an inline error message indicating that saved data could not be loaded.

---

### Requirement 2: Add Expense

**User Story:** As a user, I want to submit a form to record a new expense, so that I can track what I have spent.

#### Acceptance Criteria

1. THE Expense_Form SHALL contain four input fields: expense name (text), amount (number), category (dropdown), and date (date picker).
2. THE Expense_Form SHALL provide a Category dropdown containing exactly the following options in order: 🍔 Food, 🚗 Transport, 🛍️ Shopping, 💡 Bills, 🎮 Entertainment, 📦 Others.
3. WHEN the user submits the Expense_Form, THE Validator SHALL verify that: the expense name is between 1 and 100 characters, the amount is a number between 0.01 and 999,999,999.99, the category is one of the six predefined options, and the date is a valid calendar date that is not in the future.
4. IF any Validator check fails, THEN THE Expense_Form SHALL display a per-field inline error message adjacent to the failing field indicating the specific violated rule, without clearing the values of fields that passed validation.
5. WHEN the Expense_Form passes all Validator checks, THE App SHALL save the new expense to the Expense_Store and update the Expense_List and Dashboard within 1 second without a page reload.
6. WHEN a new expense is successfully saved, THE Expense_Form SHALL reset all fields to their default empty state and display a success confirmation message that remains visible for at least 3 seconds.
7. IF saving the expense to the Expense_Store fails, THEN THE Expense_Form SHALL preserve the user's entered field values and display an inline error message notifying the user that the expense could not be saved.

---

### Requirement 3: Category Dropdown with Emoji Icons

**User Story:** As a user, I want each category to display a recognisable emoji, so that I can quickly identify spending types at a glance.

#### Acceptance Criteria

1. THE App SHALL display the category emoji immediately preceding the category label, separated by a single space, in every context where a category is shown: the Expense_Form dropdown, each Expense entry in the Expense_List, and the Chart legend.
2. THE App SHALL use exactly these category-to-emoji mappings: Food → 🍔, Transport → 🚗, Shopping → 🛍️, Bills → 💡, Entertainment → 🎮, Others → 📦.
3. THE App SHALL apply a distinct pastel background colour to each category label displayed in the Expense_List, where no two categories share the same background colour.
4. IF an expense record contains a category value that does not match any of the six predefined categories, THEN THE App SHALL display the Others emoji (📦) as the fallback without throwing an error.
5. WHEN the Category dropdown is open, THE App SHALL render all six category options as selectable items, each displaying its emoji immediately before its label.

---

### Requirement 4: Expense History List

**User Story:** As a user, I want to see all my recorded expenses in a list, so that I can review and manage my spending history.

#### Acceptance Criteria

1. THE Expense_List SHALL display all expenses sorted by date in descending order (most recent first); expenses sharing the same date SHALL be sorted in reverse insertion order (most recently added first).
2. WHILE the active Filter is applied, THE Expense_List SHALL display only the expenses whose date falls within the selected date range, inclusive of the start and end dates.
3. THE Expense_List SHALL display the following information for each expense entry: name (up to 100 characters), amount formatted by the Rupiah_Formatter, category with emoji, and date formatted as DD/MM/YYYY.
4. THE Expense_List SHALL provide a Delete button on each expense entry.
5. WHEN the user activates the Delete button on an expense entry, THE App SHALL remove that expense from the Expense_Store and re-render the Expense_List within 300 milliseconds.
6. IF the Delete operation fails, THEN THE App SHALL retain the expense entry in the Expense_List and Expense_Store, and display an inline error message indicating the deletion failed.
7. THE Expense_List SHALL provide an Edit button on each expense entry.
8. WHEN the user activates the Edit button on an expense entry, THE App SHALL populate the Expense_Form with that entry's name, amount, category, and date, and navigate to the Add Expense tab.
9. WHEN an edited expense is resubmitted via the Expense_Form, THE App SHALL replace the original expense record in the Expense_Store and re-render the Expense_List within 300 milliseconds.
10. IF the Expense_Store contains no expenses matching the active Filter, THEN THE Expense_List SHALL display an empty-state message indicating that no expenses were found for the selected period.

---

### Requirement 5: Date Filter

**User Story:** As a user, I want to filter expenses by date, so that I can focus on spending within a specific period.

#### Acceptance Criteria

1. THE Filter SHALL offer the following preset options: Today, This Week, This Month, and Custom Range.
2. WHEN the user selects the Custom Range option, THE Filter SHALL display two date inputs — a start date and an end date — and the start date SHALL not be later than the end date.
3. IF the user sets a Custom Range start date that is later than the end date, THEN THE App SHALL block filter application and display an inline error message indicating the date range is invalid.
4. WHEN the user changes the Filter selection, THE App SHALL re-render the Expense_List and the Chart to show only expenses within the selected date range (inclusive) within 500 milliseconds.
5. IF no expenses exist within the selected Filter range, THEN THE App SHALL display a descriptive empty-state message in the Expense_List and an empty-state placeholder in the Chart area.
6. THE Filter SHALL default to the This Month preset when the App first loads, where "This Month" is defined as the first calendar day of the current month through the current date, inclusive.

---

### Requirement 6: Chart / Category Breakdown

**User Story:** As a user, I want a visual chart of my spending by category, so that I can quickly understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render using the Chart.js library loaded from a CDN, with no local npm packages.
2. THE Chart SHALL display spending totals grouped by Category for all expenses matching the active Filter, where each category's total is the sum of all matching expense amounts.
3. THE Chart SHALL display the category emoji and label in its legend and tooltips, where the tooltip shows the category name and its total amount formatted by the Rupiah_Formatter.
4. THE App SHALL provide a toggle control that switches THE Chart between a donut chart view and a bar chart view, with the donut chart view active by default.
5. WHEN the user activates the chart-type toggle, THE Chart SHALL re-render in the selected chart type within 300 milliseconds without a page reload.
6. THE Chart SHALL use the same six pastel colours as the category labels used in the Expense_List, with each colour assigned consistently to its corresponding category across both chart types.
7. WHEN the viewport width is less than 768 px, THE Chart SHALL resize to fit within the available column width without horizontal overflow, and the legend SHALL wrap to avoid truncation.
8. IF all expense amounts for the active Filter period are zero, THEN THE Chart SHALL display an empty-state placeholder message instead of an empty chart.
9. IF the Chart.js library fails to load from the CDN, THEN THE App SHALL display an error message indicating the chart is unavailable and SHALL NOT render a broken or empty chart container.

---

### Requirement 7: Summary Dashboard

**User Story:** As a user, I want a dashboard overview of my expenses, so that I can quickly assess my spending at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total expense amount for all time, formatted by the Rupiah_Formatter.
2. THE Dashboard SHALL display the total expense amount for the currently active Filter period, formatted by the Rupiah_Formatter.
3. THE Dashboard SHALL identify and display the top spending category (the category with the highest total amount) for the active Filter period in a visually distinct section separate from the totals, including its emoji; if two or more categories share the highest total, the one that comes first alphabetically SHALL be displayed.
4. WHEN the active Filter changes, THE Dashboard SHALL update all displayed totals and the top spending category without a page reload.
5. IF no expenses exist for the active Filter period, THEN THE Dashboard SHALL display Rp 0 for the filtered total and display a "No data" label in place of the top spending category.

---

### Requirement 8: Tab-Based Navigation

**User Story:** As a user, I want a clear navigation structure, so that I can move between Dashboard, Add Expense, and History without confusion.

#### Acceptance Criteria

1. THE Tab_Bar SHALL provide exactly three navigation tabs: Dashboard, Add Expense, and History.
2. THE App SHALL display the Tab_Bar as a top navigation bar on viewports 768 px wide and above.
3. THE App SHALL display the Tab_Bar as a fixed bottom navigation bar on viewports narrower than 768 px.
4. WHEN the user activates a tab, THE App SHALL show the corresponding panel and hide the other two panels without a page reload.
5. WHEN the user activates a tab, THE App SHALL visually distinguish the active tab from inactive tabs by applying a visible indicator such as a change in text weight, underline, or background contrast.
6. WHEN the App first loads, THE App SHALL display the Dashboard tab as the active tab and hide the Add Expense and History panels.
7. IF the App fails to render a tab panel, THEN THE App SHALL display an error message indicating the panel could not be loaded and preserve the Tab_Bar in its last known state.

---

### Requirement 9: Currency Formatting

**User Story:** As a user, I want all amounts displayed in Indonesian Rupiah with thousand separators, so that I can read monetary values easily.

#### Acceptance Criteria

1. THE Rupiah_Formatter SHALL format any integer numeric amount in the range 0–999,999,999,999 as a string beginning with "Rp " followed by the value with periods as thousand separators (e.g., 50000 → "Rp 50.000", 0 → "Rp 0").
2. THE App SHALL use the Rupiah_Formatter in every location where an expense amount is rendered: the Expense_List entries, the Dashboard totals, and the Chart tooltips.
3. THE Expense_Form amount input SHALL accept only whole positive numeric values between 1 and 999,999,999,999 and SHALL not display currency formatting while the user is typing.
4. IF the Rupiah_Formatter receives a non-numeric value, a negative value, a decimal value, or a value exceeding 999,999,999,999, THEN THE Rupiah_Formatter SHALL return the string "Rp 0" and log a descriptive error message to the console.

---

### Requirement 10: Responsive Layout

**User Story:** As a user, I want the app to work on both desktop and mobile screen sizes, so that I can track expenses from any device.

#### Acceptance Criteria

1. WHEN the viewport width is 768 px or above, THE App SHALL display content in a multi-column desktop layout with a minimum of 2 columns.
2. WHEN the viewport width is less than 768 px, THE App SHALL reflow the Expense_List entries from a table-style row layout to a single-column stacked card layout, where each card displays all fields of the entry without truncation.
3. WHEN the viewport width is less than 768 px, THE App SHALL position the Tab_Bar as a fixed bottom navigation bar with a minimum height of 48 px and reserve equivalent bottom padding so that the Tab_Bar does not overlap scrollable content.
4. THE App SHALL not require horizontal scrolling at any viewport width of 320 px or above.
5. WHEN the viewport width changes from below 768 px to 768 px or above, THE App SHALL transition the Expense_List from the stacked card layout to the table-style row layout without requiring a page reload.

---

### Requirement 11: Visual Design

**User Story:** As a user, I want a soft pastel aesthetic with smooth interactions, so that the app feels modern and pleasant to use.

#### Acceptance Criteria

1. THE App SHALL load the Poppins or Quicksand typeface from Google Fonts and apply it as the default font family throughout all visible text elements, falling back to a generic sans-serif typeface if the Google Fonts resource is unavailable.
2. THE App SHALL use a pastel colour palette — pastel pink, lavender, mint green, baby blue, and soft peach/yellow — on an off-white or pale pastel background for all pages and modal surfaces.
3. THE App SHALL apply a border-radius of at least 8 px to all cards, buttons, input fields, and chart containers.
4. THE App SHALL apply a box shadow with a blur radius between 4 px and 16 px and an opacity between 5% and 20% to all card and panel components.
5. THE App SHALL apply a CSS transition with a duration between 150 ms and 300 ms and an easing function to all interactive elements, including buttons, tab switches, and hover states.
6. IF the Google Fonts resource fails to load within 3 seconds, THEN THE App SHALL display all text using the fallback sans-serif typeface without any layout shift or unstyled text flash.

---

### Requirement 12: Code Quality and Commenting

**User Story:** As a beginner developer reviewing this project, I want the code to be clearly commented and organised into named functions, so that I can understand and learn from the implementation.

#### Acceptance Criteria

1. THE App SHALL implement each major behaviour as a separately named JavaScript function, including at minimum: `addExpense()`, `renderChart()`, `filterByDate()`, `deleteExpense()`, `editExpense()`, `renderExpenseList()`, and `updateDashboard()`.
2. THE App SHALL include an inline comment of between 1 and 3 sentences directly above each named function declaration, written in plain English, describing what the function does, what arguments it expects (if any), and what it returns or modifies (if anything).
3. THE App SHALL organise `script.js` into clearly labelled sections using comment headers, covering at minimum: Data / Storage, Rendering, Event Handlers, and Utilities, where each section header is a single-line comment that exactly matches one of those four labels.
4. THE App SHALL contain no unused variables, unreachable code blocks, or `console.log` statements in the final deliverable, where "unused variable" means any declared variable that is never read after assignment, and "unreachable code block" means any statement that follows a `return`, `throw`, `break`, or `continue` within the same scope.
5. WHEN a required named function listed in criterion 1 is called with missing or invalid arguments, THE App SHALL treat missing arguments as `undefined` and apply a documented default value or skip the invalid operation without throwing an uncaught exception.
