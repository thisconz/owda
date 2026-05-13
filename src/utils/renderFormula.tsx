/**
 * Chemical formula rendering utilities.
 *
 * Two variants exist intentionally:
 *  - renderFormula()     → React nodes  — use inside JSX trees
 *  - renderFormulaHTML() → plain string — use with dangerouslySetInnerHTML ONLY
 *
 * Never pass renderFormula() to dangerouslySetInnerHTML: React elements are
 * objects and serialise to "[object Object]" when coerced to a string.
 */

/** React JSX variant — use inside React trees */
export const renderFormula = (formula: string): React.ReactNode => {
  return formula.split(/(\d+)/).map((part, i) =>
    /^\d+$/.test(part) ? (
      <sub key={i} className="text-[0.7em] bottom-[-0.2em] relative">
        {part}
      </sub>
    ) : (
      part
    ),
  );
};

/**
 * HTML string variant — use with dangerouslySetInnerHTML ONLY.
 * Wraps digit sequences in <sub> tags and escapes the rest.
 */
export const renderFormulaHTML = (formula: string): string =>
  formula
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(\d+)/g, "<sub>$1</sub>");
