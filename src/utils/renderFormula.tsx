/** 
 * Utility to render chemical formulas with subscripts
 * Converts "H2O" to React nodes with <sub> tags
 */
export const renderFormula = (formula: string) => {
  return formula.split(/(\d+)/).map((part, i) => 
    /\d+/.test(part) ? <sub key={i} className="text-[0.7em] bottom-[-0.2em] relative">{part}</sub> : part
  );
};