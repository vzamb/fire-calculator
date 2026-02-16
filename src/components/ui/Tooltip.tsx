import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Position the tooltip so it doesn't overflow the viewport
  React.useEffect(() => {
    if (!show || !triggerRef.current || !tooltipRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const tip = tooltipRef.current;

    // Reset positioning
    tip.style.left = '';
    tip.style.right = '';
    tip.style.top = '';
    tip.style.bottom = '';
    tip.style.transform = '';

    const tipRect = tip.getBoundingClientRect();
    const vw = window.innerWidth;

    // Default: above, centered
    let left = trigger.left + trigger.width / 2 - tipRect.width / 2;

    // Clamp to viewport edges with 8px padding
    if (left < 8) left = 8;
    if (left + tipRect.width > vw - 8) left = vw - 8 - tipRect.width;

    // Position relative to trigger
    tip.style.position = 'fixed';
    tip.style.left = `${left}px`;
    tip.style.top = `${trigger.top - tipRect.height - 6}px`;

    // If it would go above viewport, show below instead
    if (trigger.top - tipRect.height - 6 < 8) {
      tip.style.top = `${trigger.bottom + 6}px`;
    }
  }, [show]);

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
        aria-label="More info"
      >
        {children ?? <Info className="w-3.5 h-3.5" />}
      </button>
      {show && (
        <div
          ref={tooltipRef}
          className="fixed px-3 py-2 text-xs text-popover-foreground bg-popover border border-border rounded-lg shadow-xl max-w-[220px] z-[100] animate-fade-in whitespace-normal leading-relaxed pointer-events-none"
        >
          {content}
        </div>
      )}
    </span>
  );
}
