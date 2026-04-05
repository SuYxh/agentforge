import { useCallback, useEffect, useRef, useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { imageApi, videoApi } from '@/services/tauri-api';

interface PromptMediaManagerOptions {
  isOpen: boolean;
  initialImages?: string[];
  initialVideos?: string[];
  translate: (key: string, fallback?: string) => string;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function usePromptMediaManager({
  isOpen,
  initialImages = [],
  initialVideos = [],
  translate,
  showToast,
}: PromptMediaManagerOptions) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [videos, setVideos] = useState<string[]>(initialVideos);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const prevInitialImagesRef = useRef<string[]>(initialImages);
  const prevInitialVideosRef = useRef<string[]>(initialVideos);

  useEffect(() => {
    if (!isOpen) return;

    const imagesChanged = !arraysEqual(
      prevInitialImagesRef.current,
      initialImages,
    );
    const videosChanged = !arraysEqual(
      prevInitialVideosRef.current,
      initialVideos,
    );

    if (imagesChanged) {
      setImages(initialImages);
      prevInitialImagesRef.current = initialImages;
    }
    if (videosChanged) {
      setVideos(initialVideos);
      prevInitialVideosRef.current = initialVideos;
    }
  }, [initialImages, initialVideos, isOpen]);

  const handleSelectImage = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
      });
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        const savedImages = await imageApi.save(paths);
        if (savedImages && savedImages.length > 0) {
          setImages((prev) => [...prev, ...savedImages]);
        }
      }
    } catch (error) {
      console.error("Failed to select images:", error);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleSelectVideo = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi'] }],
      });
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        const savedVideos = await videoApi.save(paths);
        if (savedVideos && savedVideos.length > 0) {
          setVideos((prev) => [...prev, ...savedVideos]);
        }
      }
    } catch (error) {
      console.error("Failed to select videos:", error);
    }
  }, []);

  const handleRemoveVideo = useCallback((index: number) => {
    setVideos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleUrlUpload = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      setIsDownloadingImage(true);
      showToast(
        translate("prompt.downloadingImage", "正在下载图片..."),
        "info",
      );

      try {
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error("timeout")), 30000);
        });
        const downloadPromise = imageApi.download(url);
        const fileName = await Promise.race([downloadPromise, timeoutPromise]);

        if (fileName) {
          setImages((prev) => [...prev, fileName]);
          showToast(
            translate("prompt.uploadSuccess", "图片添加成功"),
            "success",
          );
        } else {
          showToast(
            translate(
              "prompt.uploadFailed",
              "图片下载失败，请检查链接是否有效",
            ),
            "error",
          );
        }
      } catch (error) {
        console.error("Failed to upload image from URL:", error);
        if (error instanceof Error && error.message === "timeout") {
          showToast(
            translate(
              "prompt.downloadTimeout",
              "图片下载超时，请检查网络或链接",
            ),
            "error",
          );
        } else {
          showToast(
            translate(
              "prompt.uploadFailed",
              "图片下载失败，请检查链接是否有效",
            ),
            "error",
          );
        }
      } finally {
        setIsDownloadingImage(false);
      }
    },
    [showToast, translate],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const buffer = await blob.arrayBuffer();
            const fileName = await imageApi.saveBuffer(Array.from(new Uint8Array(buffer)));
            if (fileName) {
              setImages((prev) => [...prev, fileName]);
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen]);

  return {
    imageUrl,
    images,
    isDownloadingImage,
    setImageUrl,
    setImages,
    setShowUrlInput,
    setVideos,
    showUrlInput,
    videos,
    handleRemoveImage,
    handleRemoveVideo,
    handleSelectImage,
    handleSelectVideo,
    handleUrlUpload,
  };
}
