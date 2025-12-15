import { useMemo } from "react";

interface PariMutuelCurveChartProps {
  k: number; // Curve flattener [1, 11]
  offset: number; // Curve offset in BPS [0, 1_000_000)
  yesWeight: number;
  noWeight: number;
}

const BPS_DENOMINATOR = 1_000_000;

/**
 * Calculate time weight based on power curve with offset
 * Formula: wTime = offset + (BPS - offset) * (progress^k) / BPS^k
 */
const calcTimeWeight = (
  progress: number, // [0, 1]
  k: number,
  offset: number // BPS
): number => {
  if (progress >= 1) return BPS_DENOMINATOR;
  if (progress <= 0) return offset;

  // Progress in BPS scale
  const progressBps = progress * BPS_DENOMINATOR;

  // Power curve: progress^k / BPS^(k-1)
  const curveValue =
    k === 1
      ? progressBps
      : Math.pow(progressBps, k) / Math.pow(BPS_DENOMINATOR, k - 1);

  // Scale to [offset, BPS]
  return offset + ((BPS_DENOMINATOR - offset) * curveValue) / BPS_DENOMINATOR;
};

/**
 * Calculate YES chance at a given time progress
 * Uses the pari-mutuel formula from the contract:
 * - At wTime=0: chance = 50% (equal shares)
 * - At wTime=BPS: chance = target (yesWeight / total)
 * - wTime follows power curve with offset
 */
const calcYesChance = (
  progress: number,
  k: number,
  offset: number,
  yesWeight: number,
  noWeight: number
): number => {
  const total = yesWeight + noWeight;
  if (total === 0) return 50;

  // Time weight from curve [offset, BPS] based on progress
  const wTime = calcTimeWeight(progress, k, offset);
  const wTimeNormalized = wTime / BPS_DENOMINATOR;

  // Interpolate: at wTime=0 → 50%, at wTime=BPS → target
  const baseChance = 50;
  const targetChance = (yesWeight / total) * 100;

  return baseChance + (targetChance - baseChance) * wTimeNormalized;
};

const PariMutuelCurveChart = ({
  k,
  offset,
  yesWeight,
  noWeight,
}: PariMutuelCurveChartProps) => {
  // Generate curve points
  const curvePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const yesChance = calcYesChance(progress, k, offset, yesWeight, noWeight);
      points.push({ x: progress * 100, y: yesChance });
    }

    return points;
  }, [k, offset, yesWeight, noWeight]);

  // Calculate SVG path
  const pathD = useMemo(() => {
    if (curvePoints.length === 0) return "";

    const width = 300;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Y-axis range: 0% to 100% for full visibility
    const yMin = 0;
    const yMax = 100;

    const scaleX = (x: number) => padding.left + (x / 100) * chartWidth;
    const scaleY = (y: number) =>
      padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    let d = `M ${scaleX(curvePoints[0].x)} ${scaleY(
      Math.max(yMin, Math.min(yMax, curvePoints[0].y))
    )}`;

    for (let i = 1; i < curvePoints.length; i++) {
      const y = Math.max(yMin, Math.min(yMax, curvePoints[i].y));
      d += ` L ${scaleX(curvePoints[i].x)} ${scaleY(y)}`;
    }

    return d;
  }, [curvePoints]);

  const width = 300;
  const height = 220;
  const padding = { top: 20, right: 15, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const yMin = 0;
  const yMax = 100;

  const total = yesWeight + noWeight;
  const targetChance = total > 0 ? (yesWeight / total) * 100 : 50;
  // Start depends on offset: at offset=0 it's 50%, at offset=100% it's target
  // Formula: startChance = 50 + (target - 50) * (offset / BPS)
  const offsetNormalized = offset / BPS_DENOMINATOR;
  const startChance = 50 + (targetChance - 50) * offsetNormalized;
  const endChance = targetChance;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-300">
          Price Curve Preview
        </h4>
        <div className="flex gap-4 text-xs">
          <span className="text-gray-400">
            Start:{" "}
            <span className="text-green-400 font-medium">
              {startChance.toFixed(1)}%
            </span>
          </span>
          <span className="text-gray-400">
            End:{" "}
            <span className="text-blue-400 font-medium">
              {endChance.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: "240px" }}
      >
        {/* Grid lines */}
        {[20, 40, 50, 60, 80, 100].map((y) => (
          <g key={y}>
            <line
              x1={padding.left}
              y1={
                padding.top +
                chartHeight -
                ((y - yMin) / (yMax - yMin)) * chartHeight
              }
              x2={padding.left + chartWidth}
              y2={
                padding.top +
                chartHeight -
                ((y - yMin) / (yMax - yMin)) * chartHeight
              }
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray={y === 50 ? "none" : "2,2"}
              opacity={y === 50 ? 0.5 : 0.3}
            />
            <text
              x={padding.left - 5}
              y={
                padding.top +
                chartHeight -
                ((y - yMin) / (yMax - yMin)) * chartHeight +
                3
              }
              fill="#9CA3AF"
              fontSize="9"
              textAnchor="end"
            >
              {y}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {[0, 25, 50, 75, 100].map((x) => (
          <text
            key={x}
            x={padding.left + (x / 100) * chartWidth}
            y={height - 12}
            fill="#9CA3AF"
            fontSize="9"
            textAnchor="middle"
          >
            {x}%
          </text>
        ))}

        {/* Gradient definition - must be before path that uses it */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Target line (horizontal dashed line at end value) */}
        <line
          x1={padding.left}
          y1={
            padding.top +
            chartHeight -
            ((Math.max(yMin, Math.min(yMax, endChance)) - yMin) /
              (yMax - yMin)) *
              chartHeight
          }
          x2={padding.left + chartWidth}
          y2={
            padding.top +
            chartHeight -
            ((Math.max(yMin, Math.min(yMax, endChance)) - yMin) /
              (yMax - yMin)) *
              chartHeight
          }
          stroke="#3B82F6"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.5"
        />

        {/* Curve */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start point */}
        <circle
          cx={padding.left}
          cy={
            padding.top +
            chartHeight -
            ((Math.max(yMin, Math.min(yMax, startChance)) - yMin) /
              (yMax - yMin)) *
              chartHeight
          }
          r="4"
          fill="#22C55E"
        />

        {/* End point */}
        <circle
          cx={padding.left + chartWidth}
          cy={
            padding.top +
            chartHeight -
            ((Math.max(yMin, Math.min(yMax, endChance)) - yMin) /
              (yMax - yMin)) *
              chartHeight
          }
          r="4"
          fill="#3B82F6"
        />

        {/* Axis label - Time */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 2}
          fill="#6B7280"
          fontSize="8"
          textAnchor="middle"
        >
          Time Progress
        </text>
      </svg>

      <div className="mt-2 text-xs text-gray-500 text-center">
        k={k} (
        {k === 1 ? "Linear" : k <= 3 ? "Gentle" : k <= 7 ? "Moderate" : "Sharp"}
        ), offset={((offset / BPS_DENOMINATOR) * 100).toFixed(0)}%
      </div>
    </div>
  );
};

export default PariMutuelCurveChart;
