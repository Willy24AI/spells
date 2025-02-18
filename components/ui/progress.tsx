'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
  max?: number;
  /**
   * Optional callback to generate a label for screen readers.
   * By default, it generates a percentage.
   */
  getValueLabel?: (value: number, max: number) => string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, getValueLabel, ...props }, ref) => {
    const safeMax = max > 0 ? max : 100;
    const safeValue = value !== null ? Math.max(0, Math.min(safeMax, value)) : 0;
    const percentage = (safeValue / safeMax) * 100;
    
    // Default label generator - creates a percentage string
    const defaultGetValueLabel = (value: number, max: number) => 
      `${Math.round((value / max) * 100)}%`;
      
    const label = getValueLabel?.(safeValue, safeMax) || 
      defaultGetValueLabel(safeValue, safeMax);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={label}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };