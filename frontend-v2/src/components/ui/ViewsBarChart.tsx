import { compactNumber } from "@/lib/format";

interface BarDatum {
  label: string;
  value: number;
}

interface ViewsBarChartProps {
  data: BarDatum[];
}

/**
 * Single-series magnitude comparison (views per video) — one brand hue,
 * value at the bar's tip in a text token (never the bar's own color), a
 * lighter track behind the fill so the scale reads even at low values.
 * No legend: one measure, named by the chart title.
 */
export function ViewsBarChart({ data }: ViewsBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-xs text-ink-dim">{d.label}</span>
            <span className="shrink-0 text-xs font-semibold text-ink">{compactNumber(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-cyan"
              style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
