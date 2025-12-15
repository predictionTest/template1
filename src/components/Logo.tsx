/**
 * Animated Logo for Prediction Oracle
 * Crystal ball with pulse animation
 */
const Logo = () => {
  return (
    <div className="relative w-10 h-10">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer glow - pulsing */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#pulse-gradient)"
          opacity="0.3"
        >
          <animate
            attributeName="r"
            values="40;48;40"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.4;0.2"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Main orb */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="url(#orb-gradient)"
          stroke="url(#stroke-gradient)"
          strokeWidth="2"
        />

        {/* Inner shine */}
        <ellipse
          cx="42"
          cy="42"
          rx="12"
          ry="8"
          fill="white"
          opacity="0.6"
        >
          <animate
            attributeName="opacity"
            values="0.4;0.7;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Crystal pattern lines */}
        <g stroke="url(#line-gradient)" strokeWidth="1.5" opacity="0.5">
          <line x1="50" y1="25" x2="50" y2="75">
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="30" y1="35" x2="70" y2="65">
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2.5s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="30" y1="65" x2="70" y2="35">
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2.5s"
              begin="1s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* Floating particles */}
        <g>
          <circle cx="35" cy="30" r="2" fill="#0ea5e9" opacity="0.8">
            <animate
              attributeName="cy"
              values="30;25;30"
              dur="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="65" cy="40" r="2" fill="#0ea5e9" opacity="0.8">
            <animate
              attributeName="cy"
              values="40;35;40"
              dur="3.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="45" cy="70" r="2" fill="#0ea5e9" opacity="0.8">
            <animate
              attributeName="cy"
              values="70;65;70"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Gradients */}
        <defs>
          <radialGradient id="pulse-gradient">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="orb-gradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          <linearGradient id="stroke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="line-gradient">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;

