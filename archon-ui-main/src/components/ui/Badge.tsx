import React from 'react';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: 'purple' | 'green' | 'pink' | 'blue' | 'gray' | 'orange';
  variant?: 'solid' | 'outline';
}
export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  variant = 'outline',
  className = '',
  ...props
}) => {
  const colorMap = {
    solid: {
      purple: 'bg-primary/10 text-primary',
      green: 'bg-primary/10 text-primary',
      pink: 'bg-primary/10 text-primary',
      blue: 'bg-primary/10 text-primary',
      gray: 'bg-muted text-muted-foreground',
      orange: 'bg-primary/10 text-primary'
    },
    outline: {
      purple: 'border border-primary/30 text-primary',
      green: 'border border-primary/30 text-primary',
      pink: 'border border-primary/30 text-primary',
      blue: 'border border-primary/30 text-primary',
      gray: 'border border-border text-muted-foreground',
      orange: 'border border-primary text-primary'
    }
  };
  return <span className={`
        inline-flex items-center text-xs px-2 py-1 rounded
        ${colorMap[variant][color]}
        ${className}
      `} {...props}>
      {children}
    </span>;
};