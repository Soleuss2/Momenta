"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isPending = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstButton = dialogRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
    firstButton?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onCancel, open]);

  if (!open) return null;

  return (
    <div className="confirmation-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onCancel(); }}>
      <section ref={dialogRef} className="confirmation-modal-card" role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title" aria-describedby="confirmation-modal-description">
        <div className="confirmation-modal-icon"><AlertTriangle size={19} /></div>
        <div className="confirmation-modal-copy">
          <h2 id="confirmation-modal-title">{title}</h2>
          <p id="confirmation-modal-description">{description}</p>
          {children}
        </div>
        <div className="confirmation-modal-actions">
          <button type="button" className="workspace-secondary" onClick={onCancel} disabled={isPending}><X size={15} /> {cancelLabel}</button>
          <button type="button" className="workspace-primary" onClick={onConfirm} disabled={isPending}><Check size={15} /> {confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
