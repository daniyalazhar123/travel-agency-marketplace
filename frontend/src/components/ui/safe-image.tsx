"use client";

import { useState } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority = false,
  sizes,
  quality = 85,
  fallbackSrc,
  onLoad,
  onError,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("Image failed to load:", src, error);
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error(`Failed to load image: ${src}`));
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (hasError && fallbackSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        priority={priority}
        sizes={sizes}
        quality={quality}
        onLoad={handleLoad}
      />
    );
  }

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-muted-foreground/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      priority={priority}
      sizes={sizes}
      quality={quality}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

interface SafeBackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  overlayOpacity?: number;
}

export function SafeBackgroundImage({
  src,
  alt = "",
  className = "",
  fallbackSrc,
  overlayOpacity = 0.4,
}: SafeBackgroundImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.warn("Background image failed to load:", src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority={!hasError}
        className={`object-cover transition-opacity duration-700 ${
          isLoading && !hasError ? "opacity-0" : "opacity-100"
        }`}
        sizes="100vw"
        quality={90}
        onLoad={handleLoad}
        onError={handleError}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(12, 10, 9, ${overlayOpacity})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" aria-hidden="true" />
    </div>
  );
}
