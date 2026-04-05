import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface LocalImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
}

export function LocalImage({ 
  src, 
  alt = 'image', 
  className = '', 
  fallbackClassName = '',
  onClick 
}: LocalImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 text-muted-foreground/30 ${fallbackClassName || className}`}
        onClick={onClick}
      >
        <ImageIcon className="w-8 h-8 opacity-50" />
      </div>
    );
  }

  const filePath = src.startsWith('local-image://') ? src.replace('local-image://', '') : src;
  const imageSrc = src.startsWith('http') || src.startsWith('data:') ? src : convertFileSrc(filePath);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setError(true)}
    />
  );
}
