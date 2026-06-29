import React, { useEffect, useRef } from 'react';

export default function FocusTrap({ children, onClose, className = '' }: { children: React.ReactNode; onClose?: () => void, className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { 
        onClose?.(); 
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { 
          e.preventDefault(); 
          last?.focus(); 
        } else if (!e.shiftKey && document.activeElement === last) { 
          e.preventDefault(); 
          first?.focus(); 
        }
      }
    };
    
    document.addEventListener('keydown', onKey);
    // Auto-focus the first element if any
    first?.focus();
    
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" className={className}>{children}</div>;
}
