"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-layer rounded-md border border-neutral-700 px-8 py-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
