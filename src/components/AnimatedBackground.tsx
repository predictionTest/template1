/**
 * Electric Grid Background - Sonic themed
 * Animated grid with electric pulses
 */
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Static grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0ea5e9 1px, transparent 1px),
            linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Animated electric pulses - horizontal */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-[2px] left-0 right-0"
            style={{
              top: `${20 + i * 15}%`,
              background: 'linear-gradient(90deg, transparent, #0ea5e9 20%, #38bdf8 50%, #0ea5e9 80%, transparent)',
              animation: `electricPulseH ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
              opacity: 0,
              boxShadow: '0 0 10px #0ea5e9',
            }}
          />
        ))}
      </div>

      {/* Animated electric pulses - vertical */}
      <div className="absolute inset-0">
        {[...Array(4)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-[2px] top-0 bottom-0"
            style={{
              left: `${15 + i * 25}%`,
              background: 'linear-gradient(180deg, transparent, #0ea5e9 20%, #38bdf8 50%, #0ea5e9 80%, transparent)',
              animation: `electricPulseV ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0,
              boxShadow: '0 0 10px #0ea5e9',
            }}
          />
        ))}
      </div>

      {/* Energy nodes at intersections */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={`node-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${15 + (i % 4) * 25}%`,
              top: `${20 + Math.floor(i / 4) * 15}%`,
              background: '#0ea5e9',
              animation: `nodePulse ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i % 5) * 0.3}s`,
              boxShadow: '0 0 10px #0ea5e9, 0 0 20px #0ea5e9, 0 0 30px #0ea5e9',
            }}
          />
        ))}
      </div>

      {/* Rare lightning flashes */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <filter id="electricGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <path
          d="M 200 50 L 220 150 L 210 150 L 230 280"
          stroke="#38bdf8"
          strokeWidth="3"
          fill="none"
          filter="url(#electricGlow)"
          opacity="0"
          style={{
            animation: 'lightning 8s ease-in-out infinite',
          }}
        />
        <path
          d="M 600 100 L 580 200 L 590 200 L 570 350"
          stroke="#38bdf8"
          strokeWidth="3"
          fill="none"
          filter="url(#electricGlow)"
          opacity="0"
          style={{
            animation: 'lightning 10s ease-in-out infinite',
            animationDelay: '3s',
          }}
        />
      </svg>

      <style>{`
        @keyframes electricPulseH {
          0%, 100% { 
            opacity: 0; 
            transform: translateX(-100%); 
          }
          10% { opacity: 0.6; }
          50% { 
            opacity: 0.8; 
            transform: translateX(0%); 
          }
          90% { opacity: 0.6; }
          100% { 
            opacity: 0; 
            transform: translateX(100%); 
          }
        }

        @keyframes electricPulseV {
          0%, 100% { 
            opacity: 0; 
            transform: translateY(-100%); 
          }
          10% { opacity: 0.5; }
          50% { 
            opacity: 0.7; 
            transform: translateY(0%); 
          }
          90% { opacity: 0.5; }
          100% { 
            opacity: 0; 
            transform: translateY(100%); 
          }
        }

        @keyframes nodePulse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: scale(2.5); 
          }
        }

        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          91% { opacity: 1; }
          92% { opacity: 0.2; }
          93% { opacity: 1; }
          94% { opacity: 0; }
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;

