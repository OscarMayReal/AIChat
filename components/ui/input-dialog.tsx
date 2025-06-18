'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './button';

// Simple error boundary using React's built-in error handling
const ErrorBoundary: React.FC<{children: ReactNode}> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Dialog error:', error.error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Something went wrong with the dialog. Please try again.</p>
      </div>
    );
  }
  
  return <>{children}</>;
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Input } from './input';
import { Label } from './label';

type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

type DialogOptions = {
  title: string;
  description?: string;
  defaultValue?: string;
};

type DialogContextType = {
  showDialog: (options: DialogOptions) => Promise<string | null>;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  console.log('DialogProvider mounted');
  
  // Debug: Log when children change
  React.useEffect(() => {
    console.log('DialogProvider children updated');
  }, [children]);
  // Input dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<DialogOptions>({ title: '' });
  const [inputValue, setInputValue] = useState('');
  const [resolveFn, setResolveFn] = useState<((value: string | null) => void) | null>(null);
  
  // Confirm dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState<ConfirmDialogOptions>({ 
    title: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default'
  });
  const [resolveConfirmFn, setResolveConfirmFn] = useState<((value: boolean) => void) | null>(null);

  const showDialog = useCallback((options: DialogOptions) => {
    console.log('showDialog called with options:', options);
    return new Promise<string | null>((resolve) => {
      console.log('Setting up dialog with options:', options);
      setDialogProps(options);
      setInputValue(options.defaultValue || '');
      console.log('Setting isOpen to true');
      
      // Force a state update to ensure the dialog opens
      requestAnimationFrame(() => {
        setIsOpen(true);
        console.log('isOpen set to true');
      });
      
      setResolveFn(() => {
        console.log('Setting resolve function');
        return resolve;
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolveFn) {
      resolveFn(inputValue);
      setResolveFn(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolveFn) {
      resolveFn(null);
      setResolveFn(null);
    }
    setIsOpen(false);
  };

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmProps({
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
      });
      setIsConfirmOpen(true);
      setResolveConfirmFn(() => resolve);
    });
  }, []);

  const handleConfirmDialog = (confirmed: boolean) => {
    if (resolveConfirmFn) {
      resolveConfirmFn(confirmed);
      setResolveConfirmFn(null);
    }
    setIsConfirmOpen(false);
  };

  return (
    <DialogContext.Provider value={{ showDialog, showConfirm }}>
      {children}
      
      {/* Input Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        console.log('Dialog open state changed:', open);
        if (!open) {
          handleCancel();
        }
      }}>
        <ErrorBoundary>
          <DialogContent className="sm:max-w-[425px] bg-white shadow-xl rounded-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {dialogProps.title}
            </DialogTitle>
            {dialogProps.description && (
              <DialogDescription className="text-sm text-gray-500">
                {dialogProps.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={inputValue}
                onChange={(e) => {
                  console.log('Input value changed:', e.target.value);
                  setInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('Enter key pressed');
                    handleConfirm();
                  }
                  if (e.key === 'Escape') {
                    console.log('Escape key pressed');
                    handleCancel();
                  }
                }}
                autoFocus
                placeholder="Enter your API key..."
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={(e) => {
                console.log('Cancel button clicked');
                handleCancel();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={(e) => {
                console.log('Save button clicked');
                handleConfirm();
              }}
              disabled={!inputValue.trim()}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                inputValue.trim() 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-300 cursor-not-allowed'
              }`}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
        </ErrorBoundary>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <ErrorBoundary>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmProps.title}</DialogTitle>
            {confirmProps.description && (
              <DialogDescription>{confirmProps.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleConfirmDialog(false)}
            >
              {confirmProps.cancelText}
            </Button>
            <Button 
              variant={confirmProps.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => handleConfirmDialog(true)}
            >
              {confirmProps.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
        </ErrorBoundary>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useInputDialog() {
  console.log('useInputDialog called');
  const context = useContext(DialogContext);
  
  // Debug: Log the context value
  React.useEffect(() => {
    console.log('Dialog context value:', context ? 'exists' : 'missing');
  }, [context]);
  
  if (context === undefined) {
    console.error('useInputDialog must be used within a DialogProvider');
    // Return a mock implementation for development
    return {
      showDialog: async () => {
        console.warn('DialogProvider not found, using mock implementation');
        return prompt('Enter API Key (DialogProvider not found):') || '';
      },
      showConfirm: async () => {
        console.warn('DialogProvider not found, using mock implementation');
        return confirm('Confirm action? (DialogProvider not found)');
      }
    } as DialogContextType;
  }
  
  return context;
}

// For backward compatibility
export const showInputDialog = (options: DialogOptions) => {
  console.warn('showInputDialog should be called from within a DialogProvider');
  return Promise.resolve<string | null>(null);
};

export const showConfirm = (options: ConfirmDialogOptions) => {
  console.warn('showConfirm should be called from within a DialogProvider');
  return Promise.resolve(false);
};
