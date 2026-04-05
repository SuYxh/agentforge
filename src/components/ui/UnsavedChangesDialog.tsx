import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation();
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        saveButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 glass-overlay"
        onClick={onClose}
      />

      <div className="relative glass-strong rounded-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-center mb-2">
          {t("prompt.unsavedChanges", "未保存的更改")}
        </h3>

        <div className="text-sm text-muted-foreground text-center mb-6">
          {t("prompt.unsavedChangesMessage", "您有未保存的更改，是否要保存？")}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
          >
            {t("common.cancel", "取消")}
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 h-10 px-4 rounded-lg border border-border bg-background hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
          >
            {t("prompt.discardChanges", "不保存")}
          </button>
          <button
            ref={saveButtonRef}
            onClick={onSave}
            className="flex-1 h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary/90"
          >
            {t("common.save", "保存")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
