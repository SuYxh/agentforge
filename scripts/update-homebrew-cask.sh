#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: $0 <version>}"
REPO="legeling/PromptHub"
TAP_REPO="legeling/homebrew-tap"
CASK_FILE="Casks/prompthub.rb"
TAP_BRANCH="${HOMEBREW_TAP_BRANCH:-main}"
TAP_TOKEN="${HOMEBREW_TAP_TOKEN:-}"

if [ -z "$TAP_TOKEN" ]; then
  echo "Error: HOMEBREW_TAP_TOKEN env var is required."
  exit 1
fi

echo "Updating Homebrew Cask for PromptHub v${VERSION}..."

ARM64_URL="https://github.com/${REPO}/releases/download/v${VERSION}/PromptHub_${VERSION}_aarch64.dmg"
X64_URL="https://github.com/${REPO}/releases/download/v${VERSION}/PromptHub_${VERSION}_x64.dmg"

echo "Downloading macOS ARM64 DMG..."
curl -fL --retry 3 --retry-delay 5 -o /tmp/prompthub-aarch64.dmg "$ARM64_URL"
ARM64_SHA=$(shasum -a 256 /tmp/prompthub-aarch64.dmg | awk '{print $1}')
echo "ARM64 SHA256: ${ARM64_SHA}"

echo "Downloading macOS x64 DMG..."
curl -fL --retry 3 --retry-delay 5 -o /tmp/prompthub-x64.dmg "$X64_URL"
X64_SHA=$(shasum -a 256 /tmp/prompthub-x64.dmg | awk '{print $1}')
echo "x64 SHA256: ${X64_SHA}"

WORK_DIR=$(mktemp -d)
echo "Cloning ${TAP_REPO} into ${WORK_DIR}..."
git clone "https://x-access-token:${TAP_TOKEN}@github.com/${TAP_REPO}.git" "$WORK_DIR"

mkdir -p "${WORK_DIR}/Casks"

cat > "${WORK_DIR}/${CASK_FILE}" <<EOF
cask "prompthub" do
  version "${VERSION}"

  on_arm do
    sha256 "${ARM64_SHA}"
    url "https://github.com/${REPO}/releases/download/v#{version}/PromptHub_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "${X64_SHA}"
    url "https://github.com/${REPO}/releases/download/v#{version}/PromptHub_#{version}_x64.dmg"
  end

  name "PromptHub"
  desc "AI Prompt & Skill Management Tool"
  homepage "https://github.com/${REPO}"

  app "PromptHub.app"

  zap trash: [
    "~/Library/Application Support/com.prompthub.app",
    "~/Library/Caches/com.prompthub.app",
    "~/Library/Preferences/com.prompthub.app.plist",
  ]
end
EOF

echo "Generated Cask formula:"
cat "${WORK_DIR}/${CASK_FILE}"

cd "$WORK_DIR"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add "${CASK_FILE}"

if git diff --cached --quiet; then
  echo "Homebrew cask is already up to date."
else
  git commit -m "Update PromptHub cask to v${VERSION}"
  git push origin "${TAP_BRANCH}"
  echo "Pushed update to ${TAP_REPO}."
fi

rm -rf "$WORK_DIR" /tmp/prompthub-aarch64.dmg /tmp/prompthub-x64.dmg
echo "Done! Homebrew Cask updated to v${VERSION}."
