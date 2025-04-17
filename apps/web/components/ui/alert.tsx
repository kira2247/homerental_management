import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'border-blue-200 bg-blue-50 text-blue-800',
    destructive: 'border-red-200 bg-red-50 text-red-800',
  };

  return (
    <div
      className={`relative flex w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`text-sm ${className}`}>{children}</div>;
};
