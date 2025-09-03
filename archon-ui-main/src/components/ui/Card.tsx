import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accentColor?: 'neutral' | 'purple' | 'green' | 'pink' | 'blue' | 'cyan' | 'orange' | 'none';
  variant?: 'default' | 'bordered';
}
export const Card: React.FC<CardProps> = ({
  children,
  accentColor = 'neutral',
  variant = 'default',
  className = '',
  ...props
}) => {
  const accentColorMap = {
    purple: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-purple-500',
      border: 'border-purple-300 dark:border-purple-500/30',
      gradientFrom: 'from-purple-100 dark:from-purple-500/20',
      gradientTo: 'to-white dark:to-purple-500/5'
    },
    green: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-emerald-500',
      border: 'border-emerald-300 dark:border-emerald-500/30',
      gradientFrom: 'from-emerald-100 dark:from-emerald-500/20',
      gradientTo: 'to-white dark:to-emerald-500/5'
    },
    pink: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-pink-500',
      border: 'border-pink-300 dark:border-pink-500/30',
      gradientFrom: 'from-pink-100 dark:from-pink-500/20',
      gradientTo: 'to-white dark:to-pink-500/5'
    },
    blue: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-blue-500',
      border: 'border-blue-300 dark:border-blue-500/30',
      gradientFrom: 'from-blue-100 dark:from-blue-500/20',
      gradientTo: 'to-white dark:to-blue-500/5'
    },
    cyan: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-cyan-500',
      border: 'border-cyan-300 dark:border-cyan-500/30',
      gradientFrom: 'from-cyan-100 dark:from-cyan-500/20',
      gradientTo: 'to-white dark:to-cyan-500/5'
    },
    orange: {
      glow: 'before:shadow-none dark:before:shadow-none',
      line: 'before:bg-primary',
      border: 'border-border',
      gradientFrom: 'from-transparent',
      gradientTo: 'to-transparent'
    },
    neutral: { glow: 'before:shadow-none dark:before:shadow-none', line: 'before:bg-border', border: 'border-border', gradientFrom: 'from-transparent', gradientTo: 'to-transparent' },
    none: { glow: '', line: '', border: 'border-border', gradientFrom: 'from-transparent', gradientTo: 'to-transparent' }
  };
  const variantClasses = {
    default: 'border',
    bordered: 'border'
  };
  return <div className={`
        relative p-4 rounded-md
        bg-card text-card-foreground
        ${variantClasses[variant]} ${accentColorMap[accentColor].border}
        shadow-sm
        hover:shadow-md
        transition-all duration-300
        ${accentColor !== 'none' ? `
          before:content-[""] before:absolute before:top-[0px] before:left-[1px] before:right-[1px] before:h-[2px] 
          before:rounded-t-[4px]
          ${accentColorMap[accentColor].line} ${accentColorMap[accentColor].glow}
          after:content-[""] after:absolute after:top-0 after:left-0 after:right-0 after:h-16
          after:bg-gradient-to-b ${accentColorMap[accentColor].gradientFrom} ${accentColorMap[accentColor].gradientTo}
          after:rounded-t-md after:pointer-events-none
        ` : ''}
        ${className}
      `} {...props}>
      <div className="relative z-10">{children}</div>
    </div>;
};







