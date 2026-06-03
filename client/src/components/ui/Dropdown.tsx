import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children, 
  align = 'right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && (
        <div 
          className={`absolute z-30 mt-1 rounded-md border border-border bg-card shadow-lg ring-1 ring-black/5 focus:outline-none min-w-[160px] ${
            align === 'right' ? 'right-0' : 'left-0'
          } animate-fade-in`}
        >
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <button
    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground transition-all flex items-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);
