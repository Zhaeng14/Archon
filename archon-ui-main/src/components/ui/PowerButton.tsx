import React from 'react';
import { motion } from 'framer-motion';

interface PowerButtonProps {
  isOn: boolean;
  onClick: () => void;
  color?: 'neutral' | 'purple' | 'green' | 'pink' | 'blue' | 'cyan' | 'orange';
  size?: number;
}

// Helper function to get color hex values for animations
const getColorValue = (color: string) => {
  const colorValues = {
    purple: 'rgb(168,85,247)',
    green: 'rgb(16,185,129)',
    pink: 'rgb(236,72,153)',
    blue: 'rgb(59,130,246)',
    cyan: 'rgb(34,211,238)',
    orange: 'rgb(249,115,22)'
  };
  return colorValues[color as keyof typeof colorValues] || colorValues.blue;
};

export const PowerButton: React.FC<PowerButtonProps> = ({
  isOn,
  onClick,
  color = 'blue',
  size = 40
}) => {
  const colorMap = { neutral: { border: 'border-border', glow: 'shadow-none', glowHover: 'hover:shadow-none', fill: 'bg-muted', innerGlow: 'shadow-none' },
    purple: {
      border: 'border-purple-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-purple-400',
      innerGlow: 'shadow-none'
    },
    green: {
      border: 'border-emerald-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-emerald-400',
      innerGlow: 'shadow-none'
    },
    pink: {
      border: 'border-pink-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-pink-400',
      innerGlow: 'shadow-none'
    },
    blue: {
      border: 'border-blue-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-blue-400',
      innerGlow: 'shadow-none'
    },
    cyan: {
      border: 'border-cyan-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-cyan-400',
      innerGlow: 'shadow-none'
    },
    orange: {
      border: 'border-orange-400',
      glow: 'shadow-none',
      glowHover: 'hover:shadow-none',
      fill: 'bg-muted',
      innerGlow: 'shadow-none'
    }
  };

  const styles = colorMap[color];

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative rounded-full border-2 transition-all duration-200
        ${styles.border}
        
        ${styles.glowHover}
        bg-card text-card-foreground
        hover:scale-105
        active:scale-95
      `}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer ring glow effect - keep this for the button border glow */}
      

      {/* Inner glow effect - glows inside the button */}
      

      {/* Inner power symbol container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Power symbol (circle with line) */}
        <motion.svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10"
          animate={{
            filter: isOn ? [
              `drop-shadow(0 0 8px ${getColorValue(color)}) drop-shadow(0 0 12px ${getColorValue(color)})`,
              `drop-shadow(0 0 12px ${getColorValue(color)}) drop-shadow(0 0 16px ${getColorValue(color)})`,
              `drop-shadow(0 0 8px ${getColorValue(color)}) drop-shadow(0 0 12px ${getColorValue(color)})`
            ] : 'none'
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Power line */}
          <path
            d="M12 2L12 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={isOn ? 'text-white' : 'text-gray-600'}
          />
          {/* Power circle */}
          <path
            d="M18.36 6.64a9 9 0 1 1-12.73 0"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={isOn ? 'text-white' : 'text-gray-600'}
          />
        </motion.svg>

        {/* Inner glow when on - removed since it was causing circle behind icon */}
      </div>

      {/* Removed center dot - it was causing the colored circles */}
    </motion.button>
  );
};


