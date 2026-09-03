'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function ModalShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const handleClose = () => onClose();
    
    dialog?.addEventListener('close', handleClose);
    return () => dialog?.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close();
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100vw-2rem)] sm:w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm open:animate-in open:zoom-in-95 open:fade-in-90"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            {icon}
          </span>
          <h3 className="font-semibold text-slate-900 line-clamp-1">{title}</h3>
        </div>
        <button
          onClick={() => {
            dialogRef.current?.close();
            onClose();
          }}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </dialog>
  );
}