import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Themed native <select>.
 *
 * The raw element used on the internships page rendered with the browser's
 * default chrome: a light popup with grey option text and a Windows-blue
 * selection bar, which is unreadable in the dark theme and looked half-styled
 * next to the rest of the UI. This wrapper:
 *
 *   - removes the native arrow and draws an on-brand chevron, so the control
 *     matches the Input component;
 *   - lets the popup inherit the page `color-scheme` (globals.css sets it per
 *     theme), which is what makes the OS popup dark instead of white;
 *   - keeps the same focus ring / border tokens as <Input> so the two read as
 *     one control.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, id, ...props }, ref) => {
    return (
      <div className="relative block w-full">
        <select
          ref={ref}
          id={id}
          /* Inherit the page color-scheme so the native option popup is drawn
             with the current theme instead of the OS light default. */
          style={{ colorScheme: 'inherit' }}
          className={cn(
            'flex h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 transition-all',
            'focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
