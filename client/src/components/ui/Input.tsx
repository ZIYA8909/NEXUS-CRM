import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || React.useId();

  return (
    <div className="flex flex-col w-full gap-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-transparent border rounded-md border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
          error ? 'border-destructive focus:ring-destructive focus:border-destructive' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
