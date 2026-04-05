import { useState } from "react";
import {
  SparklesIcon,
  TerminalIcon,
  GithubIcon,
  WindIcon,
  SparkleIcon,
  ZapIcon,
  BotIcon,
  LayoutGridIcon,
  BugIcon,
} from "lucide-react";

import claudeIcon from "@/assets/platforms/claude.png";
import cursorIcon from "@/assets/platforms/cursor.png";
import copilotIcon from "@/assets/platforms/copilot.png";
import windsurfIcon from "@/assets/platforms/windsurf.png";
import kiroIcon from "@/assets/platforms/kiro.png";
import geminiIcon from "@/assets/platforms/gemini.png";
import traeIcon from "@/assets/platforms/trae.png";
import opencodeIcon from "@/assets/platforms/opencode.png";
import codexIcon from "@/assets/platforms/codex.png";
import rooIcon from "@/assets/platforms/roo.png";
import ampIcon from "@/assets/platforms/amp.png";
import openclawIcon from "@/assets/platforms/openclaw.png";
import qoderIcon from "@/assets/platforms/qoder.png";
import qoderworkIcon from "@/assets/platforms/qoderwork.png";
import codebuddyLightIcon from "@/assets/platforms/codebuddy-light.svg";
import codebuddyDarkIcon from "@/assets/platforms/codebuddy-dark.svg";

type PlatformIconSource = string | { light: string; dark: string };

const PLATFORM_ICONS: Record<string, PlatformIconSource> = {
  claude: claudeIcon,
  cursor: cursorIcon,
  copilot: copilotIcon,
  windsurf: windsurfIcon,
  kiro: kiroIcon,
  gemini: geminiIcon,
  trae: traeIcon,
  opencode: opencodeIcon,
  codex: codexIcon,
  roo: rooIcon,
  amp: ampIcon,
  openclaw: openclawIcon,
  qoder: qoderIcon,
  qoderwork: qoderworkIcon,
  codebuddy: {
    light: codebuddyLightIcon,
    dark: codebuddyDarkIcon,
  },
};

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  claude: <SparklesIcon />,
  cursor: <TerminalIcon />,
  copilot: <GithubIcon />,
  windsurf: <WindIcon />,
  kiro: <SparkleIcon />,
  gemini: <SparklesIcon />,
  trae: <ZapIcon />,
  opencode: <TerminalIcon />,
  codex: <TerminalIcon />,
  roo: <BotIcon />,
  amp: <ZapIcon />,
  openclaw: <BugIcon />,
  qoder: <BotIcon />,
  qoderwork: <BotIcon />,
  codebuddy: <BotIcon />,
};

interface PlatformIconProps {
  platformId: string;
  size?: number;
  className?: string;
}

export function PlatformIcon({
  platformId,
  size = 24,
  className = "",
}: PlatformIconProps) {
  const [imageError, setImageError] = useState(false);

  const iconSrc = PLATFORM_ICONS[platformId];
  const fallbackIcon = FALLBACK_ICONS[platformId] || <LayoutGridIcon />;

  if (!iconSrc || imageError) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          style={{ width: size, height: size }}
          className="flex items-center justify-center"
        >
          {fallbackIcon}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${className} ${
        platformId === "copilot"
          ? "rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800/80 dark:ring-slate-700"
          : ""
      }`}
      style={{ width: size, height: size }}
    >
      {typeof iconSrc === "string" ? (
        <img
          src={iconSrc}
          alt={`${platformId} icon`}
          width={size}
          height={size}
          className={`object-contain ${
            platformId === "copilot"
              ? "brightness-0 dark:brightness-0 dark:invert"
              : ""
          }`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <>
          <img
            src={iconSrc.light}
            alt={`${platformId} icon`}
            width={size}
            height={size}
            className="object-contain dark:hidden"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <img
            src={iconSrc.dark}
            alt={`${platformId} icon`}
            width={size}
            height={size}
            className="hidden object-contain dark:block"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </>
      )}
    </span>
  );
}

export function getPlatformIconElement(
  platformId: string,
  size: number = 16,
): React.ReactNode {
  return <PlatformIcon platformId={platformId} size={size} />;
}
