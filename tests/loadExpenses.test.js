/**
 * Tests for loadExpenses()
 *
 * Feature: cashlytics-expense-tracker
 * Property 1: Malformed localStorage always yields empty expense list
 *
 * For any value stored at "cashlytics_expenses" that is NOT a valid JSON
 * array of well-formed expense objects, loadExpenses() must return [] and
 * must not throw an uncaught exception.
 *
 * Validates: Requirements 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { loadExpenses } from "../script.js";

// ---------------------------------------------------------------------------
// localStorage mock setup
// ---------------------------------------------------------------------------
// jsdom provides a real localStorage implementation, so we can use it directly.
// We clear it before each test to ensure a clean slate.
// We also provide a minimal DOM element for the #error-data banner that
// loadExpenses() tries to show on parse failure.

beforeEach(() => {
  localStorage.clear();

  // Provide a minimal #error-data element so loadExpenses() can toggle it
  // without throwing a "Cannot set properties of null" error.
  if (!document.getElementById("error-data")) {
    const banner = document.createElement("p");
    banner.id = "error-data";
    banner.hidden = true;
    document.body.appendChild(banner);
  }
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "cashlytics_expenses";

/** Store a raw string directly into localStorage under the expenses key. */
function storeRaw(value) {
  localStorage.setItem(STORAGE_KEY, value);
}

/** Store a value serialised via JSON.stringify. */
function storeJson(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

/** A fully valid expense object — used as a baseline for mutation tests. */
const validExpense = {
  id: "1720000000001",
  name: "Mie Goreng",
  amount: 15000,
  category: "Food",
  date: "2024-07-03",
};

// ---------------------------------------------------------------------------
// Arbitraries (fast-check generators)
// ---------------------------------------------------------------------------

/** Generates an arbitrary string that is NOT valid JSON for an expense array. */
const arbitraryNonArrayJson = fc.oneof(
  fc.integer(),                          // JSON number
  fc.float({ noNaN: true }),             // JSON float
  fc.boolean(),                          // true / false
  fc.constant(null),                     // null (JSON null)
  fc.record({ key: fc.string() }),       // plain object, not array
  fc.string()                            // arbitrary string (likely invalid JSON)
);

/** Generates an arbitrary string that is definitely malformed JSON. */
const arbitraryMalformedJson = fc.oneof(
  fc.string().filter((s) => {
    try { JSON.parse(s); return false; } catch { return true; }
  }),
  fc.constant("undefined"),
  fc.constant("{bad json}"),
  fc.constant("[1,2,"),
  fc.constant("NaN"),
  fc.constant("Infinity"),
  fc.constant(""),
);

/** Generates an array of objects that are missing one or more required expense fields. */
const arbitraryMalformedExpenseArray = fc.array(
  fc.oneof(
    // Missing id field
    fc.record({
      name: fc.string({ minLength: 1 }),
      amount: fc.integer({ min: 1 }),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // Amount is a string instead of number
    fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      amount: fc.string(),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // Amount is a float (non-integer)
    fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      amount: fc.float({ noNaN: true, min: 0.01, max: 1000 }).filter((n) => !Number.isInteger(n)),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // Amount is zero (not positive)
    fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      amount: fc.constant(0),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // Amount is negative
    fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      amount: fc.integer({ max: -1 }),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // id is a number instead of string
    fc.record({
      id: fc.integer(),
      name: fc.string({ minLength: 1 }),
      amount: fc.integer({ min: 1 }),
      category: fc.constant("Food"),
      date: fc.constant("2024-01-01"),
    }),
    // null element in array
    fc.constant(null),
    // Completely arbitrary object
    fc.object(),
  ),
  { minLength: 1, maxLength: 20 }
);

// ---------------------------------------------------------------------------
// Property 1 — Malformed localStorage always yields empty expense list
// Feature: cashlytics-expense-tracker, Property 1: Malformed localStorage always yields empty expense list
// ---------------------------------------------------------------------------

describe("Property 1 — Malformed localStorage always yields empty expense list", () => {

  // -------------------------------------------------------------------------
  // Sub-property 1a: malformed / non-parseable JSON strings → []
  // -------------------------------------------------------------------------
  it(
    "P1a: returns [] and does not throw for any malformed JSON string stored in localStorage",
    () => {
      fc.assert(
        fc.property(arbitraryMalformedJson, (badJson) => {
          storeRaw(badJson);
          const result = loadExpenses();
          expect(result).toEqual([]);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Sub-property 1b: valid JSON but not an array (number, boolean, object, null) → []
  // -------------------------------------------------------------------------
  it(
    "P1b: returns [] and does not throw when localStorage holds valid JSON that is not an array",
    () => {
      fc.assert(
        fc.property(arbitraryNonArrayJson, (value) => {
          storeJson(value);
          const result = loadExpenses();
          expect(result).toEqual([]);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Sub-property 1c: array of malformed expense objects → []
  // -------------------------------------------------------------------------
  it(
    "P1c: returns [] and does not throw when localStorage holds a JSON array containing malformed expense objects",
    () => {
      fc.assert(
        fc.property(arbitraryMalformedExpenseArray, (badArray) => {
          storeJson(badArray);
          const result = loadExpenses();
          expect(result).toEqual([]);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete edge-case examples
  // -------------------------------------------------------------------------
  it("returns [] when localStorage key is absent", () => {
    // Key is not set at all
    const result = loadExpenses();
    expect(result).toEqual([]);
  });

  it("returns [] for JSON null", () => {
    storeRaw("null");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for a JSON number", () => {
    storeRaw("42");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an empty JSON object", () => {
    storeRaw("{}");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an empty string", () => {
    storeRaw("");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for the string 'undefined'", () => {
    storeRaw("undefined");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for truncated JSON", () => {
    storeRaw("[{\"id\":\"1\",\"name\":\"test\"");
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an array containing null", () => {
    storeJson([null]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an array of plain strings", () => {
    storeJson(["food", "transport"]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with a float amount", () => {
    storeJson([{ ...validExpense, amount: 15000.50 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with amount = 0", () => {
    storeJson([{ ...validExpense, amount: 0 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with a negative amount", () => {
    storeJson([{ ...validExpense, amount: -100 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with a numeric id", () => {
    storeJson([{ ...validExpense, id: 12345 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with a numeric category", () => {
    storeJson([{ ...validExpense, category: 1 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an expense with a missing date field", () => {
    const { date: _omitted, ...noDate } = validExpense;
    storeJson([noDate]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an array mixing valid and invalid expenses", () => {
    // Even one malformed entry must cause the whole load to fail
    storeJson([validExpense, { ...validExpense, amount: -1 }]);
    expect(loadExpenses()).toEqual([]);
  });

  it("returns [] for an array with a missing name field", () => {
    const { name: _omitted, ...noName } = validExpense;
    storeJson([noName]);
    expect(loadExpenses()).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Positive sanity check — a well-formed list must load correctly
  // -------------------------------------------------------------------------
  it("returns the correct array when all stored expenses are well-formed", () => {
    const data = [validExpense];
    storeJson(data);
    const result = loadExpenses();
    expect(result).toEqual(data);
  });
});
