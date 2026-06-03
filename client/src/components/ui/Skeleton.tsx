import React from 'react';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
};

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 py-4 border-b border-border">
    <Skeleton className="h-4 w-4 rounded" />
    <Skeleton className="h-5 w-40" />
    <Skeleton className="h-5 w-60" />
    <Skeleton className="h-5 w-28" />
    <Skeleton className="h-5 w-24" />
    <Skeleton className="h-5 w-20" />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="border border-border rounded-xl p-5 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-12" />
    </div>
    <Skeleton className="h-8 w-24" />
    <Skeleton className="h-4 w-40" />
  </div>
);
