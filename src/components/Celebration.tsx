import { useEffect, useState } from 'react';

interface CelebrationProps {
  type: 'yes' | 'no';
}

const Celebration = ({ type }: CelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: type === 'yes' 
        ? ['#10b981', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 3)]
        : ['#ef4444', '#f87171', '#fca5a5'][Math.floor(Math.random() * 3)],
    }));
    
    setParticles(newParticles);
  }, [type]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `celebrate 1.5s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: particle.color }}
          />
        </div>
      ))}
      
      <style>{`
        @keyframes celebrate {
          0% {
            transform: translateY(0) scale(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Celebration;

