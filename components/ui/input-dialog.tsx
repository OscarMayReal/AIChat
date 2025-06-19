'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react';
import { Button } from './button';
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
  label?: string;
  defaultValue?: string;
  required?: boolean;
  confirmText?: string;
  cancelText?: string;
};

type DialogContextType = {
  showDialog: (options: DialogOptions) => Promise<string | null>;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

type DialogState = {
  isOpen: boolean;
  dialogProps: DialogOptions;
  inputValue: string;
  resolveFn: ((value: string | null) => void) | null;
};

type ConfirmDialogState = {
  isOpen: boolean;
  confirmProps: ConfirmDialogOptions;
  resolveFn: ((value: boolean) => void) | null;
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    dialogProps: { title: '' },
    inputValue: '',
    resolveFn: null,
  });
  
  const [confirmState, setConfirmState] = useState<ConfirmDialogState>({
    isOpen: false,
    confirmProps: {
      title: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'default',
    },
    resolveFn: null,
  });

  const showDialog = useCallback(async (options: DialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        dialogProps: options,
        inputValue: options.defaultValue || '',
        resolveFn: resolve,
      });
    });
  }, []);

  const handleDialogConfirm = useCallback(() => {
    if (dialogState.resolveFn) {
      dialogState.resolveFn(dialogState.inputValue);
    }
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
      resolveFn: null,
    }));
  }, [dialogState]);

  const handleDialogCancel = useCallback(() => {
    if (dialogState.resolveFn) {
      dialogState.resolveFn(null);
    }
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
      resolveFn: null,
    }));
  }, [dialogState]);

  const showConfirm = useCallback(async (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        confirmProps: {
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || 'default',
        },
        resolveFn: resolve,
      });
    });
  }, []);

  const handleConfirmDialog = useCallback((confirmed: boolean) => {
    if (confirmState.resolveFn) {
      confirmState.resolveFn(confirmed);
    }
    setConfirmState(prev => ({
      ...prev,
      isOpen: false,
      resolveFn: null,
    }));
  }, [confirmState]);

  const contextValue = useMemo(
    () => ({ showDialog, showConfirm }),
    [showDialog, showConfirm]
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      
      {/* Input Dialog */}
      <Dialog 
        open={dialogState.isOpen} 
        onOpenChange={(open) => !open && handleDialogCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.dialogProps.title}</DialogTitle>
            {dialogState.dialogProps.description && (
              <DialogDescription>{dialogState.dialogProps.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
                id="dialog-input"
                value={dialogState.inputValue}
                onChange={(e) => 
                  setDialogState(prev => ({
                    ...prev,
                    inputValue: e.target.value
                  }))
                }
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDialogConfirm();
                  }
                }}
              />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleDialogCancel}
            >
              {dialogState.dialogProps.cancelText || 'Cancel'}
            </Button>
            <Button 
              onClick={handleDialogConfirm}
              disabled={dialogState.dialogProps.required && !dialogState.inputValue.trim()}
            >
              {dialogState.dialogProps.confirmText || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog 
        open={confirmState.isOpen} 
        onOpenChange={(open) => !open && handleConfirmDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmState.confirmProps.title}</DialogTitle>
            {confirmState.confirmProps.description && (
              <DialogDescription>
                {confirmState.confirmProps.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleConfirmDialog(false)}
            >
              {confirmState.confirmProps.cancelText}
            </Button>
            <Button 
              variant={confirmState.confirmProps.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => handleConfirmDialog(true)}
            >
              {confirmState.confirmProps.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useInputDialog() {
  const context = useContext(DialogContext);
  
  if (process.env.NODE_ENV !== 'production' && !context) {
    console.error('useInputDialog must be used within a DialogProvider');
  }
  
  if (!context) {
    return {
      showDialog: async (options: DialogOptions) => {
        if (typeof window !== 'undefined') {
          const value = window.prompt(options.description || options.title, options.defaultValue || '');
          return value !== null ? value : null;
        }
        return null;
      },
      showConfirm: async (options: ConfirmDialogOptions) => {
        if (typeof window !== 'undefined') {
          return window.confirm(options.description || options.title);
        }
        return false;
      },
    } as DialogContextType;
  }
  
  return context;
}

// For backward compatibility
export const showInputDialog = (options: DialogOptions) => {
  console.warn('showInputDialog is deprecated. Use useInputDialog hook instead.');
  if (typeof window !== 'undefined') {
    const value = window.prompt(options.description || options.title, options.defaultValue || '');
    return Promise.resolve(value !== null ? value : null);
  }
  return Promise.resolve(null);
};

// For backward compatibility
export const showConfirm = (options: ConfirmDialogOptions) => {
  console.warn('showConfirm is deprecated. Use useInputDialog hook instead.');
  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(options.description || options.title);
    return Promise.resolve(confirmed);
  }
  return Promise.resolve(false);
};
