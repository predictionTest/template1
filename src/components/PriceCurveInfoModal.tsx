import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface PriceCurveInfoModalProps {
  className?: string;
}

export const PriceCurveInfoModal = ({
  className = "",
}: PriceCurveInfoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button - Circle with question mark */}
      <button
        id="price-curve-info-modal"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center w-6 h-6 rounded-full bg-primary-600/30 hover:bg-primary-600/50 border border-primary-500/50 text-primary-400 hover:text-primary-300 transition-all ${className}`}
        title="How pricing curves work"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                ⚖️ Time-Weighted Pricing
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-6 text-sm">
              {/* Problem Section */}
              <section>
                <h3 className="text-primary-400 font-semibold mb-2">
                  The Problem with Traditional Betting
                </h3>
                <p className="text-gray-300">
                  In traditional pari-mutuel, early bets immediately set the
                  odds. This allows whales to manipulate prices and creates wild
                  volatility at the start.
                </p>
              </section>

              {/* Solution Section */}
              <section>
                <h3 className="text-primary-400 font-semibold mb-2">
                  Our Solution: Time-Weighted Pricing
                </h3>
                <p className="text-gray-300 mb-3">
                  The influence of bets on price{" "}
                  <strong>grows over time</strong>. Early bets get fair shares
                  regardless of the side, while late bets reflect actual market
                  sentiment.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-xs">
                  <div className="text-green-400 mb-1">At market START:</div>
                  <div className="text-gray-400 mb-3 ml-2">
                    Bet on YES or NO → get ~equal shares
                  </div>
                  <div className="text-amber-400 mb-1">At market CLOSE:</div>
                  <div className="text-gray-400 ml-2">
                    Shares reflect actual collateral ratio
                  </div>
                </div>
              </section>

              {/* Curve K Parameter */}
              <section>
                <h3 className="text-primary-400 font-semibold mb-2">
                  📈 Curve Flattener (k)
                </h3>
                <p className="text-gray-300 mb-3">
                  Controls how quickly the price transitions from 50/50 to the
                  target ratio:
                </p>

                {/* Visual Curves */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* k=1 Linear */}
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 text-center">
                      k=1 (Linear)
                    </div>
                    <svg
                      viewBox="0 0 100 60"
                      className="w-full h-16"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <line
                        x1="10"
                        y1="50"
                        x2="90"
                        y2="50"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <line
                        x1="10"
                        y1="50"
                        x2="10"
                        y2="10"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 40 L 90 15"
                        stroke="#22c55e"
                        strokeWidth="2"
                        fill="none"
                      />
                      <text x="5" y="42" fontSize="6" fill="#94a3b8">
                        50%
                      </text>
                      <text x="5" y="18" fontSize="6" fill="#94a3b8">
                        70%
                      </text>
                    </svg>
                    <div className="text-xs text-gray-500 text-center">
                      Steady progression
                    </div>
                  </div>

                  {/* k=5 Moderate */}
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 text-center">
                      k=5 (Moderate)
                    </div>
                    <svg
                      viewBox="0 0 100 60"
                      className="w-full h-16"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <line
                        x1="10"
                        y1="50"
                        x2="90"
                        y2="50"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <line
                        x1="10"
                        y1="50"
                        x2="10"
                        y2="10"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 40 Q 50 38, 70 30 T 90 15"
                        stroke="#eab308"
                        strokeWidth="2"
                        fill="none"
                      />
                      <text x="5" y="42" fontSize="6" fill="#94a3b8">
                        50%
                      </text>
                      <text x="5" y="18" fontSize="6" fill="#94a3b8">
                        70%
                      </text>
                    </svg>
                    <div className="text-xs text-gray-500 text-center">
                      Balanced curve
                    </div>
                  </div>

                  {/* k=11 Sharp */}
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 text-center">
                      k=11 (Very Sharp)
                    </div>
                    <svg
                      viewBox="0 0 100 60"
                      className="w-full h-16"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <line
                        x1="10"
                        y1="50"
                        x2="90"
                        y2="50"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <line
                        x1="10"
                        y1="50"
                        x2="10"
                        y2="10"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <path
                        d="M 10 40 L 70 39 Q 80 35, 85 25 T 90 15"
                        stroke="#ef4444"
                        strokeWidth="2"
                        fill="none"
                      />
                      <text x="5" y="42" fontSize="6" fill="#94a3b8">
                        50%
                      </text>
                      <text x="5" y="18" fontSize="6" fill="#94a3b8">
                        70%
                      </text>
                    </svg>
                    <div className="text-xs text-gray-500 text-center">
                      Flat start, sharp end
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 text-xs mt-3">
                  💡 <strong>Higher k</strong> = more protection against early
                  manipulation, price forms closer to market close
                </p>
              </section>

              {/* Offset Parameter */}
              <section>
                <h3 className="text-primary-400 font-semibold mb-2">
                  🎯 Curve Offset
                </h3>
                <p className="text-gray-300 mb-3">
                  Offset shifts the starting point - the market begins as if
                  some time has already passed on the curve:
                </p>

                {/* Main offset diagram */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-3 text-center">
                    Offset = 30% — Market starts at 56% instead of 50%
                  </div>
                  <svg
                    viewBox="0 0 200 90"
                    className="w-full h-28"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Y-axis */}
                    <line
                      x1="40"
                      y1="75"
                      x2="40"
                      y2="10"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    {/* X-axis (extended to show virtual start) */}
                    <line
                      x1="10"
                      y1="75"
                      x2="190"
                      y2="75"
                      stroke="#475569"
                      strokeWidth="1"
                    />

                    {/* Virtual start zone (before actual market) */}
                    <rect
                      x="10"
                      y="10"
                      width="30"
                      height="65"
                      fill="#1e293b"
                      opacity="0.7"
                    />

                    {/* Dashed line from virtual start (50%) to actual start (56%) */}
                    <path
                      d="M 10 60 Q 25 58, 40 52"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="4,3"
                    />

                    {/* Main curve from actual start to end */}
                    <path
                      d="M 40 52 Q 100 48, 140 35 T 180 18"
                      stroke="#22c55e"
                      strokeWidth="2"
                      fill="none"
                    />

                    {/* Virtual start point (50%) */}
                    <circle cx="10" cy="60" r="3" fill="#64748b" />
                    {/* Actual start point (56%) */}
                    <circle cx="40" cy="52" r="4" fill="#eab308" />
                    {/* End point (70%) */}
                    <circle cx="180" cy="18" r="4" fill="#3b82f6" />

                    {/* Y-axis labels */}
                    <text x="3" y="63" fontSize="7" fill="#64748b">
                      50%
                    </text>
                    <text x="3" y="55" fontSize="7" fill="#eab308">
                      56%
                    </text>
                    <text x="3" y="22" fontSize="7" fill="#3b82f6">
                      70%
                    </text>

                    {/* X-axis labels */}
                    <text x="5" y="85" fontSize="6" fill="#64748b">
                      Virtual
                    </text>
                    <text x="5" y="90" fontSize="6" fill="#64748b">
                      start
                    </text>
                    <text x="32" y="85" fontSize="7" fill="#eab308">
                      Start
                    </text>
                    <text x="173" y="85" fontSize="7" fill="#3b82f6">
                      End
                    </text>

                    {/* Offset bracket */}
                    <line
                      x1="10"
                      y1="70"
                      x2="40"
                      y2="70"
                      stroke="#eab308"
                      strokeWidth="1"
                    />
                    <line
                      x1="10"
                      y1="68"
                      x2="10"
                      y2="72"
                      stroke="#eab308"
                      strokeWidth="1"
                    />
                    <line
                      x1="40"
                      y1="68"
                      x2="40"
                      y2="72"
                      stroke="#eab308"
                      strokeWidth="1"
                    />
                    <text x="18" y="69" fontSize="6" fill="#eab308">
                      30%
                    </text>

                    {/* Legend */}
                    <line
                      x1="100"
                      y1="82"
                      x2="115"
                      y2="82"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />
                    <text x="118" y="84" fontSize="6" fill="#64748b">
                      Virtual (skipped)
                    </text>
                    <line
                      x1="100"
                      y1="88"
                      x2="115"
                      y2="88"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                    <text x="118" y="90" fontSize="6" fill="#22c55e">
                      Actual curve
                    </text>
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-xs text-gray-400">Offset 0%</div>
                    <div className="text-sm text-green-400 font-medium">
                      Start: 50%
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-xs text-gray-400">Offset 30%</div>
                    <div className="text-sm text-amber-400 font-medium">
                      Start: 56%
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 text-xs mt-3">
                  💡 Use offset for markets with known favorites — the price
                  starts closer to the expected outcome
                </p>
              </section>

              {/* Benefits */}
              <section>
                <h3 className="text-primary-400 font-semibold mb-2">
                  ✅ Benefits
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>
                      <strong>Manipulation resistant</strong> — early whale bets
                      have minimal impact
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>
                      <strong>Fair for early bettors</strong> — get good odds
                      regardless of side
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>
                      <strong>Information-weighted</strong> — later bets (with
                      more info) have more influence
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>
                      <strong>Smooth price curve</strong> — no wild swings from
                      individual bets
                    </span>
                  </li>
                </ul>
              </section>

              {/* Quick Tips */}
              <section className="bg-primary-900/20 border border-primary-700/30 rounded-lg p-4">
                <h3 className="text-primary-400 font-semibold mb-2">
                  🎮 Quick Setup Guide
                </h3>
                <div className="space-y-2 text-gray-300 text-xs">
                  <p>
                    <strong>Standard market:</strong> k=5, offset=0%
                  </p>
                  <p>
                    <strong>High manipulation risk:</strong> k=7-11, offset=0%
                  </p>
                  <p>
                    <strong>Known favorite (e.g. 70/30):</strong> k=5-7,
                    offset=20-30%
                  </p>
                  <p>
                    <strong>Short duration market:</strong> k=3-5, offset=10-20%
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-3">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] rounded-lg font-medium transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceCurveInfoModal;
