import { useState, useEffect } from "react";
import { KeyIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/Toast";
import { SettingSection, PasswordInput } from "./shared";
import { securityApi } from "@/services/tauri-api";

export function SecuritySettings() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [securityStatus, setSecurityStatus] = useState<{
    configured: boolean;
    unlocked: boolean;
  }>({ configured: false, unlocked: false });
  const [newMasterPwd, setNewMasterPwd] = useState("");
  const [newMasterPwdConfirm, setNewMasterPwdConfirm] = useState("");
  const [unlockPwd, setUnlockPwd] = useState("");
  const [secLoading, setSecLoading] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");

  const refreshSecurityStatus = async () => {
    try {
      const status = await securityApi.status();
      setSecurityStatus(status);
    } catch (e: any) {
      showToast(e?.message || t("settings.statusFetchFail"), "error");
    }
  };

  useEffect(() => {
    refreshSecurityStatus();
  }, []);

  const handleSetMasterPassword = async () => {
    if (!newMasterPwd || newMasterPwd.length < 4) {
      showToast(t("settings.pwdTooShort"), "error");
      return;
    }
    if (newMasterPwd !== newMasterPwdConfirm) {
      showToast(t("settings.pwdMismatch"), "error");
    }
    setSecLoading(true);
    try {
      await securityApi.setMasterPassword(newMasterPwd);
      await refreshSecurityStatus();
      setNewMasterPwd("");
      setNewMasterPwdConfirm("");
      showToast(t("settings.masterSetSuccess"), "success");
    } catch (e: any) {
      showToast(e?.message || t("settings.masterSetFail"), "error");
    } finally {
      setSecLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockPwd) {
      showToast(t("settings.enterMasterPwd"), "error");
      return;
    }
    setSecLoading(true);
    try {
      const result = await securityApi.unlock(unlockPwd);
      if (result) {
        await refreshSecurityStatus();
        setUnlockPwd("");
        showToast(t("settings.unlockSuccess"), "success");
      } else {
        showToast(t("settings.pwdWrong"), "error");
      }
    } catch (e: any) {
      showToast(e?.message || t("settings.unlockFail"), "error");
    } finally {
      setSecLoading(false);
    }
  };

  const handleLock = async () => {
    setSecLoading(true);
    try {
      await securityApi.lock();
      await refreshSecurityStatus();
      showToast(t("settings.lockSuccess"), "success");
    } catch (e: any) {
      showToast(e?.message || t("settings.lockFail"), "error");
    } finally {
      setSecLoading(false);
    }
  };

  const handleChangeMasterPassword = async () => {
    if (!oldPwd) {
      showToast(t("settings.enterCurrentPwd"), "error");
      return;
    }
    if (!newPwd || newPwd.length < 4) {
      showToast(t("settings.newPwdTooShort"), "error");
      return;
    }
    if (newPwd !== newPwdConfirm) {
      showToast(t("settings.pwdMismatch"), "error");
    }
    setSecLoading(true);
    try {
      const unlockResult = await securityApi.unlock(oldPwd);
      if (!unlockResult) {
        showToast(t("settings.currentPwdWrong"), "error");
        setSecLoading(false);
        return;
      }
      await securityApi.setMasterPassword(newPwd);
      await refreshSecurityStatus();
      setOldPwd("");
      setNewPwd("");
      setNewPwdConfirm("");
      setShowChangePwd(false);
      showToast(t("settings.changePwdSuccess"), "success");
    } catch (e: any) {
      showToast(e?.message || t("settings.changePwdFail"), "error");
    } finally {
      setSecLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SettingSection title={t("settings.security", "安全与主密码")}>
        <div className="p-4 space-y-3 bg-muted/30 rounded-xl border border-border/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <KeyIcon className="w-4 h-4" />
            <span>
              {t("settings.securityStatus", "Status")}:
              {securityStatus.configured
                ? t("settings.masterSet", "Master Password Set")
                : t("settings.masterNotSet", "Master Password Not Set")}
            </span>
          </div>

          {!securityStatus.configured && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="text-sm font-medium">
                {t("settings.setMaster", "Set master password (min 4 chars)")}
              </div>
              <PasswordInput
                value={newMasterPwd}
                onChange={setNewMasterPwd}
                placeholder={t(
                  "settings.masterPlaceholder",
                  "Enter master password",
                )}
              />
              <PasswordInput
                value={newMasterPwdConfirm}
                onChange={setNewMasterPwdConfirm}
                placeholder={t(
                  "settings.masterConfirmPlaceholder",
                  "Confirm master password",
                )}
              />
              <button
                onClick={handleSetMasterPassword}
                className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                disabled={secLoading}
              >
                {secLoading
                  ? t("common.loading", "Loading...")
                  : t("settings.setMasterBtn", "Set Master Password")}
              </button>
            </div>
          )}

          {securityStatus.configured && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {t("settings.changePwd", "Change Master Password")}
                </div>
                <button
                  onClick={() => setShowChangePwd(!showChangePwd)}
                  className="text-xs text-primary hover:underline"
                >
                  {showChangePwd
                    ? t("common.cancel", "Cancel")
                    : t("settings.changePwdBtn", "Change Password")}
                </button>
              </div>
              {showChangePwd && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <PasswordInput
                    value={oldPwd}
                    onChange={setOldPwd}
                    placeholder={t(
                      "settings.oldPwdPlaceholder",
                      "Enter current master password",
                    )}
                  />
                  <PasswordInput
                    value={newPwd}
                    onChange={setNewPwd}
                    placeholder={t(
                      "settings.newPwdPlaceholder",
                      "Enter new master password (min 4 chars)",
                    )}
                  />
                  <PasswordInput
                    value={newPwdConfirm}
                    onChange={setNewPwdConfirm}
                    placeholder={t(
                      "settings.newPwdConfirmPlaceholder",
                      "Confirm new master password",
                    )}
                  />
                  <button
                    onClick={handleChangeMasterPassword}
                    className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    disabled={secLoading}
                  >
                    {secLoading
                      ? t("common.loading", "Loading...")
                      : t("settings.confirmChange", "Confirm Change")}
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              "settings.securityDesc",
              "Master password is used to unlock private content. It is not stored on disk. If lost, data cannot be recovered.",
            )}
          </p>
        </div>
      </SettingSection>
    </div>
  );
}
