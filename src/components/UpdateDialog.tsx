import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DownloadIcon,
  CheckCircleIcon,
  XIcon,
  Loader2Icon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";

export type UpdateStatus =
  | { status: "checking" }
  | { status: "available"; update: Update }
  | { status: "not-available" }
  | { status: "downloading"; percent: number }
  | { status: "downloaded" }
  | { status: "error"; error: string };

interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateDialog({ isOpen, onClose }: UpdateDialogProps) {
  const { t } = useTranslation();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => {});
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    setUpdateStatus({ status: "checking" });
    try {
      const update = await check();
      if (update) {
        setUpdateStatus({ status: "available", update });
      } else {
        setUpdateStatus({ status: "not-available" });
      }
    } catch (e) {
      setUpdateStatus({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      handleCheckUpdate();
    }
  }, [isOpen, handleCheckUpdate]);

  const handleDownloadAndInstall = async () => {
    if (updateStatus?.status !== "available") return;
    const { update } = updateStatus;
    try {
      setUpdateStatus({ status: "downloading", percent: 0 });
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setUpdateStatus({ status: "downloading", percent: 0 });
            break;
          case "Progress": {
            setUpdateStatus((prev) => {
              if (prev?.status !== "downloading") return prev;
              const total = event.data.contentLength ?? 1;
              const delta = event.data.chunkLength;
              const newPercent = Math.min(
                ((prev.percent / 100) * total + delta) / total * 100,
                99.9,
              );
              return { status: "downloading", percent: newPercent };
            });
            break;
          }
          case "Finished":
            break;
        }
      });
      setUpdateStatus({ status: "downloaded" });
    } catch (e) {
      setUpdateStatus({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (!updateStatus) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("settings.version")}: {currentVersion}
          </p>
          <button
            onClick={handleCheckUpdate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            {t("settings.checkUpdate")}
          </button>
        </div>
      );
    }

    switch (updateStatus.status) {
      case "checking":
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t("settings.checking")}</p>
          </div>
        );

      case "available":
        return (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DownloadIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {t("settings.updateAvailable")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.updateAvailableDesc", {
                    version: updateStatus.update.version,
                  })}
                </p>
              </div>
            </div>
            {updateStatus.update.body && (
              <div className="mb-4 p-4 rounded-lg bg-muted/50 flex-1 min-h-[200px] max-h-[350px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t("settings.releaseNotes")}
                </p>
                <div className="whitespace-pre-wrap text-sm">
                  {updateStatus.update.body}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDownloadAndInstall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                {t("settings.downloadUpdate")}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                {t("settings.installLater")}
              </button>
            </div>
          </div>
        );

      case "not-available":
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold text-lg mb-1">
              {t("settings.noUpdate")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.noUpdateDesc", { version: currentVersion })}
            </p>
          </div>
        );

      case "downloading": {
        const percent = updateStatus.percent;
        return (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-md mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{t("settings.downloading")}</span>
                <span>{percent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("settings.downloadProgress", { percent: percent.toFixed(1) })}
            </p>
          </div>
        );
      }

      case "downloaded":
        return (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {t("settings.downloadComplete")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.downloadCompleteDesc")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t("settings.installRestartHint")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {t("settings.installNow")}
              </button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-6 flex flex-col h-full shrink-0">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
              <XIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-lg mb-1 text-red-500">
              {t("common.error")}
            </h3>
            <p className="text-sm text-muted-foreground break-all whitespace-pre-wrap max-h-24 overflow-y-auto mb-4 px-2">
              {updateStatus.error}
            </p>
            <div className="space-y-4 mt-auto">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-left">
                <p className="text-xs text-muted-foreground mb-3">
                  {t("settings.manualDownloadHint")}
                </p>
                <button
                  onClick={() => {
                    import("@tauri-apps/plugin-opener").then(({ openUrl }) => {
                      openUrl(
                        "https://github.com/nicepkg/aide/releases",
                      ).catch(() => {});
                    });
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-background border border-border hover:bg-muted transition-all text-sm font-medium shadow-sm active:scale-95"
                >
                  <ExternalLinkIcon className="w-4 h-4 text-muted-foreground" />
                  {t("settings.manualDownload")}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 p-6 rounded-2xl bg-card border border-border shadow-xl min-h-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t("settings.checkUpdate")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <XIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 flex flex-col">{renderContent()}</div>
      </div>
    </div>
  );
}
