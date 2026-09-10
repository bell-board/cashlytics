// Feature: cashlytics-expense-tracker
// Tests for rupiahFormatter — Properties 17 and 18

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { rupiahFormatter } from "../script.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reference implementation of the expected output for any valid integer n
 * in [0, 999_999_999_999].  Used to cross-check the real function.
 */
function expectedRupiah(n) {
  if (n === 0) return "Rp 0";
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "Rp " + formatted;
}

const MAX = 999_999_999_999;

// ---------------------------------------------------------------------------
// Property 17: Rupiah_Formatter formats all valid integers correctly
// ---------------------------------------------------------------------------
// Feature: cashlytics-expense-tracker, Property 17: Rupiah_Formatter formats
// all valid integers correctly. For any integer n in [0, 999_999_999_999],
// rupiahFormatter(n) must return a string that begins with "Rp " followed by
// the decimal representation of n with periods as thousand separators and no
// leading zeros (except "Rp 0" for n = 0).

describe("rupiahFormatter — Property 17: valid integer formatting", () => {
  it("returns 'Rp 0' for n = 0", () => {
    expect(rupiahFormatter(0)).toBe("Rp 0");
  });

  it("formats a known mid-range value correctly", () => {
    expect(rupiahFormatter(50000)).toBe("Rp 50.000");
    expect(rupiahFormatter(1000000)).toBe("Rp 1.000.000");
    expect(rupiahFormatter(999999999999)).toBe("Rp 999.999.999.999");
    expect(rupiahFormatter(1)).toBe("Rp 1");
    expect(rupiahFormatter(999)).toBe("Rp 999");
    expect(rupiahFormatter(1000)).toBe("Rp 1.000");
  });

  it(
    "[PBT] output always starts with 'Rp ' for any integer in [0, MAX]",
    () => {
      // Feature: cashlytics-expense-tracker, Property 17: Rupiah_Formatter formats all valid integers correctly
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX }),
          (n) => {
            const result = rupiahFormatter(n);
            return (
              typeof result === "string" &&
              result.startsWith("Rp ")
            );
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] output matches reference formatter for any integer in [0, MAX]",
    () => {
      // Feature: cashlytics-expense-tracker, Property 17: Rupiah_Formatter formats all valid integers correctly
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX }),
          (n) => {
            return rupiahFormatter(n) === expectedRupiah(n);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] digit part contains only digits and period separators, no leading zeros",
    () => {
      // Feature: cashlytics-expense-tracker, Property 17: Rupiah_Formatter formats all valid integers correctly
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX }), // n=0 case handled separately
          (n) => {
            const result = rupiahFormatter(n);
            // Strip the "Rp " prefix
            const digits = result.slice(3);
            // Must match pattern: groups of 1-3 digits separated by periods
            return /^\d{1,3}(\.\d{3})*$/.test(digits);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] re-parsing the digit part reproduces the original number",
    () => {
      // Feature: cashlytics-expense-tracker, Property 17: Rupiah_Formatter formats all valid integers correctly
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX }),
          (n) => {
            const result = rupiahFormatter(n);
            const digits = result.slice(3).replace(/\./g, "");
            return parseInt(digits, 10) === n;
          }
        ),
        { numRuns: 200 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs
// ---------------------------------------------------------------------------
// Feature: cashlytics-expense-tracker, Property 18: Rupiah_Formatter always
// returns "Rp 0" for invalid inputs. For any input that is not an integer in
// [0, 999_999_999_999] — including non-numeric types, negatives, decimals,
// values exceeding the max, null, undefined, and NaN — the return value must
// be exactly "Rp 0".

describe("rupiahFormatter — Property 18: invalid input always returns 'Rp 0'", () => {
  // Concrete edge cases
  it("returns 'Rp 0' for null", () => expect(rupiahFormatter(null)).toBe("Rp 0"));
  it("returns 'Rp 0' for undefined", () => expect(rupiahFormatter(undefined)).toBe("Rp 0"));
  it("returns 'Rp 0' for NaN", () => expect(rupiahFormatter(NaN)).toBe("Rp 0"));
  it("returns 'Rp 0' for -1", () => expect(rupiahFormatter(-1)).toBe("Rp 0"));
  it("returns 'Rp 0' for -0", () => expect(rupiahFormatter(-0)).toBe("Rp 0"));
  it("returns 'Rp 0' for 0.5 (decimal)", () => expect(rupiahFormatter(0.5)).toBe("Rp 0"));
  it("returns 'Rp 0' for 1.1 (decimal)", () => expect(rupiahFormatter(1.1)).toBe("Rp 0"));
  it("returns 'Rp 0' for MAX + 1", () => expect(rupiahFormatter(MAX + 1)).toBe("Rp 0"));
  it("returns 'Rp 0' for Infinity", () => expect(rupiahFormatter(Infinity)).toBe("Rp 0"));
  it("returns 'Rp 0' for -Infinity", () => expect(rupiahFormatter(-Infinity)).toBe("Rp 0"));
  it("returns 'Rp 0' for empty string", () => expect(rupiahFormatter("")).toBe("Rp 0"));
  it("returns 'Rp 0' for string '1000'", () => expect(rupiahFormatter("1000")).toBe("Rp 0"));
  it("returns 'Rp 0' for object {}", () => expect(rupiahFormatter({})).toBe("Rp 0"));
  it("returns 'Rp 0' for array [1]", () => expect(rupiahFormatter([1])).toBe("Rp 0"));
  it("returns 'Rp 0' for boolean true", () => expect(rupiahFormatter(true)).toBe("Rp 0"));

  it(
    "[PBT] negative integers always return 'Rp 0'",
    () => {
      // Feature: cashlytics-expense-tracker, Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs
      fc.assert(
        fc.property(
          fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -1 }),
          (n) => rupiahFormatter(n) === "Rp 0"
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] integers above MAX always return 'Rp 0'",
    () => {
      // Feature: cashlytics-expense-tracker, Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs
      fc.assert(
        fc.property(
          fc.integer({ min: MAX + 1, max: Number.MAX_SAFE_INTEGER }),
          (n) => rupiahFormatter(n) === "Rp 0"
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] non-integer numbers (decimals) always return 'Rp 0'",
    () => {
      // Feature: cashlytics-expense-tracker, Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs
      fc.assert(
        fc.property(
          // Generate a float and ensure it's not a whole number
          fc.float({ min: 0.001, max: 999999999998.999, noNaN: true }).filter(
            (n) => !Number.isInteger(n)
          ),
          (n) => rupiahFormatter(n) === "Rp 0"
        ),
        { numRuns: 200 }
      );
    }
  );

  it(
    "[PBT] non-number types always return 'Rp 0'",
    () => {
      // Feature: cashlytics-expense-tracker, Property 18: Rupiah_Formatter always returns "Rp 0" for invalid inputs
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(NaN),
            fc.array(fc.integer()),
            fc.object()
          ),
          (val) => rupiahFormatter(val) === "Rp 0"
        ),
        { numRuns: 200 }
      );
    }
  );
});
