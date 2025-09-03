import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: 'neutral' | 'purple' | 'green' | 'pink' | 'blue';
  icon?: React.ReactNode;
  label?: string;
}
export const Input: React.FC<InputProps> = ({
  accentColor = 'neutral',
  icon,
  label,
  className = '',
  ...props
}) => {
  const accentBorderMap: Record<NonNullable<InputProps['accentColor']>, string> = {
    neutral: 'focus-within:ring-2 ring-ring',
    purple: 'focus-within:ring-2 ring-purple-500/40',
    green: 'focus-within:ring-2 ring-emerald-500/40',
    pink: 'focus-within:ring-2 ring-pink-500/40',
    blue: 'focus-within:ring-2 ring-blue-500/40',
  };
  return <div className="w-full">
      {label && <label className="block text-foreground/80 text-sm mb-1.5">
          {label}
        </label>}
      <div className={`
        flex items-center bg-card text-card-foreground 
        border border-input rounded-md px-3 py-2 transition-all duration-150 
        ${accentBorderMap[accentColor]}
      `}>
        {icon && <div className="mr-2 text-foreground/60">{icon}</div>}
        <input className={`
            w-full bg-transparent text-foreground placeholder:text-foreground/50
            focus:outline-none ${className}
          `} {...props} />
      </div>
    </div>;
};
