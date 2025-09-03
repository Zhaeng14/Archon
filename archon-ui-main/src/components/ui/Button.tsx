import React from 'react';
/**
 * Props for the Button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}
/**
 * Button - A customizable button component
 *
 * This component provides a reusable button with various styles,
 * sizes, and color options using the warm theme colors.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  // Size variations
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-base px-6 py-2.5 rounded-md'
  };
  
  // Style variations based on variant - using theme colors
  const variantClasses = {
    primary: `
      bg-primary text-primary-foreground font-medium
      hover:bg-primary/90 
      shadow-sm hover:shadow-md
      transition-all duration-200
    `,
    secondary: `
      bg-secondary text-secondary-foreground
      hover:bg-secondary/80
      transition-all duration-200
    `,
    outline: `
      bg-transparent border border-input text-foreground
      hover:bg-accent hover:text-accent-foreground
      transition-all duration-200
    `,
    ghost: `
      bg-transparent text-foreground
      hover:bg-accent hover:text-accent-foreground
      transition-all duration-200
    `
  };
  
  return (
    <button 
      className={`
        inline-flex items-center justify-center 
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};