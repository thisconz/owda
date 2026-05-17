/**
 * ChartTooltip — shared Recharts tooltip for all OWDA pages.
 *
 * Replaces the duplicated `CustomTooltip` defined locally in
 * WorkspacePage.tsx and AnalyticsPage.tsx.
 */

import React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    payload: Record<string, unknown>;
    name?: string;
  }>;
  /** Label displayed above the value in accent color */
  title?: string;
  /** Unit string appended after the value */
  unit?: string;
  /** Decimal places for number formatting (default: 2) */
  decimals?: number;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  title,
  unit = "",
  decimals = 2,
}) => {
  if (!active || !payload?.[0]) return null;

  const raw = payload[0].value;
  const displayValue =
    typeof raw === "number" ? raw.toFixed(decimals) : String(raw);

  const label =
    title ??
    (payload[0].payload["step"] as string | undefined) ??
    (payload[0].name ?? "Value");

  return (
    <div className="bg-[#1A1A1A] text-white p-3 border-2 border-[#D4FF00] font-mono shadow-[4px_4px_0px_#1A1A1A]">
      <p className="text-[9px] uppercase font-black text-[#D4FF00] mb-1 tracking-widest">
        {label}
      </p>
      <p className="text-xl font-black italic">
        {displayValue}
        {unit && (
          <span className="text-[10px] not-italic ml-1 opacity-50">{unit}</span>
        )}
      </p>
    </div>
  );
};

/**
 * Enthalpy-specific tooltip preset.
 * Usage: <Tooltip content={<EnthalpyTooltip />} />
 */
export const EnthalpyTooltip: React.FC<
  Omit<ChartTooltipProps, "title" | "unit">
> = (props) => (
  <ChartTooltip {...props} title="Enthalpy_Flux" unit="kJ/mol" decimals={1} />
);

/**
 * Energy path tooltip preset (for reaction pathway charts).
 */
export const EnergyTooltip: React.FC<
  Omit<ChartTooltipProps, "unit">
> = (props) => (
  <ChartTooltip {...props} unit="kJ/mol" decimals={1} />
);