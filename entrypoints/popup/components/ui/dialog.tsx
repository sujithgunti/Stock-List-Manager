import React, { useEffect, useRef } from 'react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative bg-background-card border border-border/60 rounded-xl shadow-popup max-w-md w-full mx-4 max-h-[80vh] overflow-hidden animate-slide-in ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-1 p-4 border-b border-border/30 ${className}`}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-base font-semibold text-foreground ${className}`}>
      {children}
    </h2>
  );
};

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-xs text-foreground-muted ${className}`}>
      {children}
    </p>
  );
};

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end gap-2 p-4 border-t border-border/30 bg-background-muted/30 ${className}`}>
      {children}
    </div>
  );
};

export const DialogClose: React.FC<{ onClick?: () => void; children?: React.ReactNode }> = ({ onClick, children }) => {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {children || 'Done'}
    </Button>
  );
};
