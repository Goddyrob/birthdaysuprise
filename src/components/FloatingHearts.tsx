import React, { useEffect, useState } from 'react';

interface HeartParticle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  symbol: string;
}

export const FloatingHearts: React.FC<{ count?: number; dark?: boolean }> = ({ count = 15, dark = false }) => {
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    const symbols = dark ? ['✨', '⭐', '💫', '✦'] : ['💖', '💕', '🌸', '✨', '💗', '🤍'];
    const colors = dark
      ? ['rgba(255, 255, 255, 0.7)', 'rgba(253, 230, 138, 0.8)', 'rgba(244, 114, 182, 0.6)']
      : ['#a86473', '#b87a75', '#fda4af', '#8b3f4a', '#884257'];

    const items: HeartParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * (dark ? 14 : 18) + (dark ? 10 : 12),
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.4 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)]
    }));

    setParticles(items);
  }, [count, dark]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute select-none"
          style={{
            left: `${p.x}%`,
            bottom: '-40px',
            fontSize: `${p.size}px`,
            color: p.color,
            opacity: p.opacity,
            animation: `float-heart ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
};
