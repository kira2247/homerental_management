"use client";

import * as React from "react";
import Image from "next/image";
import { X, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";
import { DEFAULT_IMAGES } from "@/lib/constants/images";

interface ImageUploaderProps {
  currentImage?: string | null;
  onImageChange: (file: File | null) => void;
  onImageDelete?: () => void;
  type?: "thumbnail" | "profile" | "general";
  aspectRatio?: "square" | "landscape" | "portrait";
  className?: string;
  disabled?: boolean;
  allowDelete?: boolean;
  maxSizeMB?: number;
}

export function ImageUploader({
  currentImage,
  onImageChange,
  onImageDelete,
  type = "general",
  aspectRatio = "landscape",
  className = "",
  disabled = false,
  allowDelete = true,
  maxSizeMB = 5
}: ImageUploaderProps) {
  const { t } = useLocale();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Create preview when file selected
  React.useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      onImageChange(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(t("upload.errors.invalidFileType"));
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(t("upload.errors.fileTooLarge", { maxSize: maxSizeMB }));
      return;
    }

    setSelectedFile(file);
    onImageChange(file);
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageChange(null);
  };

  const handleDelete = () => {
    clearFileSelection();
    if (onImageDelete) {
      onImageDelete();
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getImageClassName = () => {
    const baseClass = "rounded-md overflow-hidden";
    switch (aspectRatio) {
      case "square":
        return `${baseClass} aspect-square object-cover`;
      case "portrait":
        return `${baseClass} aspect-[3/4] object-cover`;
      case "landscape":
      default:
        return `${baseClass} aspect-[16/9] object-cover`;
    }
  };

  const getPlaceholderImage = () => {
    switch (type) {
      case "thumbnail":
        return DEFAULT_IMAGES.PROPERTY;
      case "profile":
        return DEFAULT_IMAGES.USER;
      default:
        return DEFAULT_IMAGES.DOCUMENT;
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative">
        <div className={`relative h-[180px] w-full ${getImageClassName()}`}>
          {(preview || currentImage) ? (
            <Image
              src={preview || currentImage || getPlaceholderImage()}
              fill
              alt="Image preview"
              className={getImageClassName()}
              priority
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Overlay buttons */}
        <div className="absolute right-2 top-2 flex gap-1">
          {(preview || (currentImage && allowDelete)) && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full"
              onClick={handleDelete}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleButtonClick}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {currentImage || preview
            ? t("properties.upload.buttons.changeImage")
            : t("properties.upload.buttons.uploadImage")}
        </Button>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
