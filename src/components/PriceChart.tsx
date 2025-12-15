import { useMemo, useRef, useEffect, useState, useCallback, memo } from "react";
import { Line } from "@nivo/line";
import { Bar } from "@nivo/bar";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ChartDataPoint {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

export type ChartType = "line" | "candle";

interface PriceChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  height?: number; // Total height including volume chart
  chartType?: ChartType;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PriceChart = ({
  data,
  isLoading,
  height: propHeight,
  chartType = "line",
}: PriceChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 600,
    height: propHeight || 320,
  });
  const [candleOffset, setCandleOffset] = useState(0); // 0 = show latest candles

  // Calculate how many candles fit in the container
  const candleWidth = 16;
  const candleSpacing = 6;
  const totalCandleWidth = candleWidth + candleSpacing;
  const chartMargin = 65; // left margin for y-axis
  const maxVisibleCandles = Math.max(
    1,
    Math.floor((dimensions.width - chartMargin) / totalCandleWidth)
  );

  // Visible candle data (for candle mode)
  const visibleCandleData = useMemo(() => {
    if (chartType !== "candle" || data.length <= maxVisibleCandles) {
      return data;
    }
    const endIndex = data.length - candleOffset;
    const startIndex = Math.max(0, endIndex - maxVisibleCandles);
    return data.slice(startIndex, endIndex);
  }, [data, chartType, maxVisibleCandles, candleOffset]);

  // Navigation state
  const canGoBack = candleOffset < data.length - maxVisibleCandles;
  const canGoForward = candleOffset > 0;

  const handleGoBack = () => {
    setCandleOffset((prev) =>
      Math.min(
        prev + Math.floor(maxVisibleCandles / 2),
        data.length - maxVisibleCandles
      )
    );
  };

  const handleGoForward = () => {
    setCandleOffset((prev) =>
      Math.max(prev - Math.floor(maxVisibleCandles / 2), 0)
    );
  };

  // Reset offset when switching to candle mode or when data changes significantly
  useEffect(() => {
    setCandleOffset(0);
  }, [chartType]);

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width || containerRef.current.offsetWidth;
        const height = rect.height || containerRef.current.offsetHeight;
        if (width > 50) {
          const finalHeight = height > 100 ? height : propHeight || 320;
          setDimensions({ width, height: finalHeight });
        }
      }
    };

    // Initial measurement with delay for mobile
    updateDimensions();
    const timer1 = setTimeout(updateDimensions, 100);
    const timer2 = setTimeout(updateDimensions, 300);
    const timer3 = setTimeout(updateDimensions, 500);

    window.addEventListener("resize", updateDimensions);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateDimensions);
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, [propHeight]);

  // Re-measure when data changes (chart becomes visible)
  useEffect(() => {
    if (data.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || containerRef.current.offsetWidth;
      const height = rect.height || containerRef.current.offsetHeight;
      if (width > 50) {
        const finalHeight = height > 100 ? height : propHeight || 320;
        setDimensions({ width, height: finalHeight });
      }
    }
  }, [data.length, propHeight]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS

  // Transform data for nivo line chart
  const lineData = useMemo(() => {
    if (data.length === 0) return [];

    return [
      {
        id: "YES Price",
        data: data.map((d, index) => ({
          x: index,
          y: d.close,
        })),
      },
    ];
  }, [data]);

  // Transform data for volume bar chart
  const volumeData = useMemo(() => {
    return data.map((d, index) => ({
      index: index.toString(),
      volume: d.volume,
      color: d.close >= d.open ? "#22c55e" : "#ef4444",
    }));
  }, [data]);

  // Get min/max for better axis scaling
  // For candle mode, use visible data; for line mode, use all data
  const priceRange = useMemo(() => {
    const sourceData = chartType === "candle" ? visibleCandleData : data;
    if (sourceData.length === 0) return { min: 0, max: 100 };
    const prices = sourceData.flatMap((d) => [d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = Math.max(5, (maxPrice - minPrice) * 0.15);
    const min = Math.max(0, Math.floor((minPrice - padding) / 5) * 5);
    const max = Math.min(100, Math.ceil((maxPrice + padding) / 5) * 5);
    return { min, max };
  }, [data, chartType, visibleCandleData]);

  const maxVolume = useMemo(() => {
    if (data.length === 0) return 100;
    const max = Math.max(...data.map((d) => d.volume));
    return max > 0 ? max * 1.2 : 100;
  }, [data]);

  // Generate x-axis tick values - fewer on small screens
  const tickIndices = useMemo(() => {
    const len = data.length;
    if (len === 0) return [];
    if (len <= 3) return data.map((_, i) => i);

    const isMobile = dimensions.width < 500;
    const numTicks = isMobile ? 3 : 5;

    if (len <= numTicks) return data.map((_, i) => i);

    const step = Math.floor(len / (numTicks - 1));
    const ticks = [];
    for (let i = 0; i < numTicks - 1; i++) {
      ticks.push(i * step);
    }
    ticks.push(len - 1);
    return ticks;
  }, [data, dimensions.width]);

  // Theme colors
  const colors = useMemo(
    () => ({
      background: isDark ? "#1e293b" : "#f1f5f9",
      grid: isDark ? "#334155" : "#cbd5e1",
      text: isDark ? "#94a3b8" : "#475569",
      up: "#22c55e",
      down: "#ef4444",
    }),
    [isDark]
  );

  // Custom layer for colored area segments
  const coloredAreaLayer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ series, xScale, yScale, innerHeight }: any) => {
      if (!series || series.length === 0 || !series[0].data) return null;

      const points = series[0].data;
      if (points.length < 2) return null;

      const segments: JSX.Element[] = [];
      const baseY = innerHeight;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const x1 = xScale(p1.data.x);
        const y1 = yScale(p1.data.y);
        const x2 = xScale(p2.data.x);
        const y2 = yScale(p2.data.y);

        const isUp = p2.data.y >= p1.data.y;
        const color = isUp ? colors.up : colors.down;

        // Create area path for this segment
        const areaPath = `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${baseY} L ${x1} ${baseY} Z`;

        segments.push(
          <g key={`segment-${i}`}>
            {/* Gradient fill */}
            <defs>
              <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#grad-${i})`} />
            {/* Line segment */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      }

      // Add points
      points.forEach((point: { data: { x: number; y: number } }, i: number) => {
        const x = xScale(point.data.x);
        const y = yScale(point.data.y);
        const isLast = i === points.length - 1;

        // Point color based on direction from previous point
        let pointColor = colors.up;
        if (i > 0) {
          const prevY = points[i - 1].data.y;
          pointColor = point.data.y >= prevY ? colors.up : colors.down;
        }

        segments.push(
          <g key={`point-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={isLast ? 5 : 4}
              fill={colors.background}
              stroke={pointColor}
              strokeWidth={2}
            />
          </g>
        );
      });

      return <g>{segments}</g>;
    },
    [colors]
  );

  // Custom layer for candlestick chart
  const candlestickLayer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ yScale, innerWidth, innerHeight }: any) => {
      if (visibleCandleData.length === 0) return null;

      // Start from left
      const startX = candleWidth / 2 + 10;

      // Calculate which candles to show time labels for
      const labelInterval = Math.max(
        1,
        Math.floor(visibleCandleData.length / 5)
      );

      return (
        <g>
          {/* Candles */}
          {visibleCandleData.map((d, i) => {
            const x = startX + i * totalCandleWidth;
            const isUp = d.close >= d.open;
            const color = isUp ? colors.up : colors.down;

            const yOpen = yScale(d.open);
            const yClose = yScale(d.close);
            const yHigh = yScale(d.high);
            const yLow = yScale(d.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            // Skip if candle is outside visible area
            if (x < -candleWidth || x > innerWidth + candleWidth) return null;

            return (
              <g key={`candle-${i}`}>
                {/* Wick (high to low) */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth={1.5}
                  rx={1}
                />
              </g>
            );
          })}

          {/* Time labels aligned with candles */}
          {visibleCandleData.map((d, i) => {
            // Show label for first, last, and every labelInterval candles
            const showLabel =
              i === 0 ||
              i === visibleCandleData.length - 1 ||
              i % labelInterval === 0;
            if (!showLabel) return null;

            const x = startX + i * totalCandleWidth;
            if (x < 0 || x > innerWidth) return null;

            const date = new Date(d.time * 1000);
            const isMobile = innerWidth < 400;
            const label = isMobile
              ? date.toLocaleString("en-US", {
                  day: "numeric",
                  hour: "numeric",
                  hour12: true,
                })
              : date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  hour12: true,
                });

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={innerHeight + 30}
                textAnchor="middle"
                fill={colors.text}
                fontSize={innerWidth < 400 ? 8 : 10}
                transform={`rotate(-45, ${x}, ${innerHeight + 30})`}
              >
                {label}
              </text>
            );
          })}
        </g>
      );
    },
    [visibleCandleData, colors, candleWidth, totalCandleWidth]
  );

  // NOW EARLY RETURNS ARE SAFE

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg w-full h-full"
        style={{ minHeight: propHeight || 320, background: colors.background }}
      >
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-slate-600 w-full h-full"
        style={{ minHeight: propHeight || 320, background: colors.background }}
      >
        <div className="text-gray-400 text-lg">No trading data yet</div>
      </div>
    );
  }

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ point }: any) => {
    const idx = point.data.x as number;
    const tooltipData = chartType === "candle" ? visibleCandleData : data;
    const dataPoint = tooltipData[idx];
    const isUp = dataPoint ? dataPoint.close >= dataPoint.open : true;

    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
        <div className="text-xs text-gray-400 mb-1">
          {dataPoint ? formatTime(dataPoint.time) : `Point ${idx}`}
        </div>
        {chartType === "candle" && dataPoint ? (
          <div className="text-xs">
            {dataPoint.volume > 0 ? (
              <>
                <div className="text-white">
                  Vol: ${dataPoint.volume.toFixed(2)}
                </div>
                <div className="text-gray-400">{dataPoint.trades} trades</div>
              </>
            ) : (
              <div className="text-gray-400">No trades</div>
            )}
          </div>
        ) : (
          <>
            <div className="text-sm font-medium text-white">
              YES:{" "}
              <span className={isUp ? "text-green-400" : "text-red-400"}>
                {Number(point.data.y).toFixed(1)}%
              </span>
            </div>
            {dataPoint && dataPoint.volume > 0 && (
              <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-slate-700">
                Vol: ${dataPoint.volume.toFixed(2)} • {dataPoint.trades} trades
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Chart theme - smaller fonts on mobile
  const isMobile = dimensions.width < 500;
  const fontSize = isMobile ? 9 : 11;

  const chartTheme = {
    background: colors.background,
    text: {
      fill: colors.text,
      fontSize: fontSize,
    },
    grid: {
      line: {
        stroke: colors.grid,
        strokeWidth: 1,
      },
    },
    axis: {
      ticks: {
        text: {
          fill: colors.text,
          fontSize: fontSize,
        },
      },
    },
    crosshair: {
      line: {
        stroke: colors.text,
        strokeWidth: 1,
        strokeOpacity: 0.5,
      },
    },
  };

  // Calculate dynamic heights
  const totalHeight = dimensions.height;
  // Smaller volume chart on mobile/small heights
  const volumeRatio = totalHeight < 250 ? 0.15 : 0.2;
  const volumeChartHeight = Math.max(40, Math.floor(totalHeight * volumeRatio));
  const priceChartHeight = totalHeight - volumeChartHeight;

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden relative"
      style={{ background: colors.background }}
    >
      {/* Price Chart with colored segments */}
      <div style={{ height: priceChartHeight, overflow: "hidden" }}>
        {dimensions.width > 0 && (
          <Line
            width={dimensions.width}
            height={priceChartHeight}
            data={lineData}
            margin={{
              top: 15,
              right: 15,
              bottom: dimensions.height < 250 ? 40 : 55,
              left: 40,
            }}
            xScale={{ type: "linear", min: 0, max: data.length - 1 }}
            yScale={{
              type: "linear",
              min: priceRange.min,
              max: priceRange.max,
            }}
            curve="linear"
            axisTop={null}
            axisRight={null}
            axisBottom={
              chartType === "candle"
                ? null
                : {
                    tickSize: 0,
                    tickPadding: 8,
                    tickRotation: dimensions.width < 500 ? -60 : -45,
                    tickValues: tickIndices,
                    format: (value) => {
                      const idx = value as number;
                      if (idx >= 0 && idx < data.length) {
                        const date = new Date(data[idx].time * 1000);
                        if (dimensions.width < 500) {
                          return date.toLocaleString("en-US", {
                            day: "numeric",
                            hour: "numeric",
                            hour12: true,
                          });
                        }
                        return date.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          hour12: true,
                        });
                      }
                      return "";
                    },
                  }
            }
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              tickRotation: 0,
              format: (value) => `${value}%`,
              tickValues: 5,
            }}
            enableGridX={false}
            gridYValues={5}
            colors={[colors.up]}
            lineWidth={0}
            enablePoints={false}
            enableArea={false}
            useMesh={true}
            tooltip={CustomTooltip}
            theme={chartTheme}
            layers={[
              "grid",
              "markers",
              "axes",
              chartType === "candle" ? candlestickLayer : coloredAreaLayer,
              "crosshair",
              "slices",
              "mesh",
              "legends",
            ]}
          />
        )}
      </div>

      {/* Volume Chart */}
      {maxVolume > 0 && volumeData.length > 0 && dimensions.width > 0 && (
        <div style={{ height: volumeChartHeight, overflow: "hidden" }}>
          {chartType === "candle" ? (
            // Custom SVG volume bars aligned with candles
            <svg width={dimensions.width} height={volumeChartHeight}>
              <rect
                width={dimensions.width}
                height={volumeChartHeight}
                fill={colors.background}
              />
              {/* Y-axis label */}
              <text
                x={35}
                y={volumeChartHeight / 2}
                textAnchor="end"
                fill={colors.text}
                fontSize={isMobile ? 8 : 10}
              >
                Vol
              </text>
              {visibleCandleData.map((d, i) => {
                const startX = candleWidth / 2 + 10 + 45; // +45 for left margin
                const x = startX + i * totalCandleWidth;
                const visibleMaxVolume = Math.max(
                  ...visibleCandleData.map((c) => c.volume),
                  1
                );
                const barHeight =
                  visibleMaxVolume > 0
                    ? (d.volume / visibleMaxVolume) * (volumeChartHeight - 10)
                    : 0;
                const isUp = d.close >= d.open;

                if (x > dimensions.width) return null;

                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - candleWidth / 2}
                    y={volumeChartHeight - barHeight - 5}
                    width={candleWidth}
                    height={Math.max(1, barHeight)}
                    fill={isUp ? colors.up : colors.down}
                    opacity={0.7}
                    rx={1}
                  />
                );
              })}
            </svg>
          ) : (
            <Bar
              width={dimensions.width}
              height={volumeChartHeight}
              data={volumeData}
              keys={["volume"]}
              indexBy="index"
              margin={{ top: 0, right: 20, bottom: 20, left: 45 }}
              padding={0.3}
              valueScale={{ type: "linear", max: maxVolume }}
              indexScale={{ type: "band", round: true }}
              colors={(d) => (d.data.color as string) || "#22c55e"}
              axisTop={null}
              axisRight={null}
              axisBottom={null}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                tickRotation: 0,
                tickValues: 2,
                format: (v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`,
              }}
              enableGridY={false}
              enableLabel={false}
              isInteractive={false}
              theme={{
                background: colors.background,
                text: {
                  fill: colors.text,
                  fontSize: 10,
                },
              }}
            />
          )}
        </div>
      )}

      {/* Navigation buttons for candle mode */}
      {chartType === "candle" && data.length > maxVisibleCandles && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="View older candles"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 min-w-[50px] text-center">
            {candleOffset > 0 ? `-${candleOffset}` : "Latest"}
          </span>
          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="View newer candles"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(PriceChart);
