import React from 'react';
/**
 * ArchonLoadingSpinner - A loading animation component with subtle effects
 *
 * This component displays the Archon logo with animated spinning circles
 * using the warm theme colors.
 */
export const ArchonLoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  logoSrc?: string;
  className?: string;
}> = ({
  size = 'md',
  logoSrc = "/favicon.png",
  className = ''
}) => {
  // Size mappings for the container and logo
  const sizeMap = {
    sm: {
      container: 'w-8 h-8',
      logo: 'w-5 h-5'
    },
    md: {
      container: 'w-10 h-10',
      logo: 'w-7 h-7'
    },
    lg: {
      container: 'w-14 h-14',
      logo: 'w-9 h-9'
    }
  };
  
  return (
    <div className={`relative ${sizeMap[size].container} flex items-center justify-center ${className}`}>
      {/* Central logo */}
      <img src={logoSrc} alt="Loading" className={`${sizeMap[size].logo} z-10 relative`} />
      {/* Animated spinning circles with warm colors */}
      <div className="absolute inset-0 w-full h-full">
        {/* First circle - primary color with clockwise rotation */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-[spin_0.8s_linear_infinite] opacity-60"></div>
        {/* Second circle - primary color with counter-clockwise rotation */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-primary animate-[spin_0.6s_linear_infinite_reverse] opacity-40"></div>
      </div>
    </div>
  );
};

/**
 * Divider - A component that adds a subtle divider effect using theme colors
 */
export const Divider: React.FC<{
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}> = ({
  children,
  intensity = 'medium',
  className = ''
}) => {
  // Intensity mappings for divider strength
  const intensityMap = {
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg'
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 rounded-md border border-border ${intensityMap[intensity]}`}></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * EdgeLitEffect - A component that adds a subtle top border accent
 */
export const EdgeLitEffect: React.FC<{
  className?: string;
}> = ({
  className = ''
}) => {
  return (
    <div className={`absolute top-0 left-0 w-full h-[2px] bg-primary opacity-30 ${className}`}></div>
  );
};

