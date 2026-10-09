'use client';

import { Camera, Crop, RefreshCcw, Trash2 } from 'lucide-react';
import { type ChangeEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import ProjectCoverImage from '@/components/features/project/ProjectCoverImage';
import ImageCropModal from '@/components/shared/ImageCropModal';

interface CoverImageUploaderProps {
  id?: string;
  accept?: string;
  value?: File | null;
  initialPreviewUrl?: string | null;
  onChange?: (file: File | null) => void;
}

export default function CoverImageUploader({
  id = 'project-cover-image',
  accept = 'image/png,image/jpeg',
  value = null,
  initialPreviewUrl = null,
  onChange,
}: CoverImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(initialPreviewUrl);
      return;
    }

    const nextUrl = URL.createObjectURL(value);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [initialPreviewUrl, value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCropFile(file);
  };

  const handleCloseCrop = () => {
    setCropFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleOpenFileDialog = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    inputRef.current?.click();
  };

  const handleOpenCropEditor = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const currentSourceFile = sourceFile ?? value;
    if (currentSourceFile) {
      setCropFile(currentSourceFile);
      return;
    }

    if (!previewUrl || isPreparingCrop) {
      return;
    }

    try {
      setIsPreparingCrop(true);
      const response = await fetch(previewUrl);

      if (!response.ok) {
        throw new Error('이미지를 불러오지 못했습니다.');
      }

      const blob = await response.blob();
      const nextSourceFile = new File([blob], 'project-cover-source', {
        type: blob.type || 'image/jpeg',
      });

      setSourceFile(nextSourceFile);
      setCropFile(nextSourceFile);
    } finally {
      setIsPreparingCrop(false);
    }
  };

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onChange?.(null);
    setSourceFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const canEditCrop = Boolean(sourceFile ?? value ?? previewUrl);

  return (
    <>
      <label
        htmlFor={id}
        className={`group relative flex aspect-[1200/630] min-h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl text-center transition-colors sm:min-h-56 ${
          previewUrl
            ? 'border border-mt-border bg-mt-text-primary/5'
            : 'border-2 border-dashed border-mt-border bg-mt-bg-soft px-5 py-12 hover:bg-mt-primary/5 hover:shadow-sm sm:px-6 sm:py-20'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />

        {previewUrl && (
          <ProjectCoverImage
            src={previewUrl}
            alt="프로젝트 커버 미리보기"
            className="absolute inset-0 h-full rounded-none"
            imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}

        {!previewUrl && (
          <div className="relative z-10 flex flex-col items-center transition-transform duration-300 ease-out group-hover:scale-[1.01]">
            <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-text-secondary transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-mt-logo-blue group-hover:text-mt-primary sm:mb-5 sm:h-20 sm:w-20">
              <Camera className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
            </span>

            <p className="text-base leading-6 font-semibold text-mt-text-secondary transition-colors duration-300 group-hover:text-mt-primary sm:text-lg sm:leading-7">
              클릭하여 이미지를 업로드하세요
            </p>
            <p className="mt-1.5 text-sm font-medium leading-6 text-mt-text-secondary transition-colors duration-300 group-hover:text-mt-text-secondary">
              권장 사이즈: 1200 x 630px (JPG, PNG)
            </p>
          </div>
        )}

        {previewUrl && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 bg-mt-text-primary/45 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

            <div className="absolute inset-0 z-20 flex translate-y-3 flex-wrap items-center justify-center gap-2 px-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:gap-3">
              {canEditCrop ? (
                <button
                  type="button"
                  onClick={handleOpenCropEditor}
                  className="group/crop inline-flex h-10 scale-95 items-center gap-1.5 rounded-xl bg-mt-primary px-4 text-sm font-bold text-mt-white shadow-lg transition-transform duration-300 ease-out group-hover:scale-100 hover:-translate-y-0.5 hover:shadow-xl sm:h-12 sm:px-6 sm:text-base"
                >
                  <Crop
                    className="h-4 w-4 transition-transform duration-300 ease-out group-hover/crop:scale-110"
                    aria-hidden="true"
                    strokeWidth={1.8}
                  />
                  {isPreparingCrop ? '불러오는 중' : '이미지 조정'}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleOpenFileDialog}
                className="group/change inline-flex h-10 scale-95 items-center gap-1.5 rounded-xl bg-mt-white px-4 text-sm font-bold text-mt-text-primary shadow-lg transition-transform duration-300 ease-out group-hover:scale-100 hover:-translate-y-0.5 hover:shadow-xl sm:h-12 sm:px-6 sm:text-base"
              >
                <RefreshCcw
                  className="h-4 w-4 text-mt-primary transition-transform duration-300 ease-out group-hover/change:rotate-45"
                  aria-hidden="true"
                />
                이미지 변경하기
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="group/delete inline-flex h-10 w-10 scale-95 items-center justify-center rounded-xl bg-mt-hero-blue text-mt-white shadow-lg transition-transform delay-75 duration-300 ease-out group-hover:scale-100 hover:-translate-y-0.5 hover:shadow-xl sm:h-12 sm:w-12"
                aria-label="이미지 삭제"
              >
                <Trash2
                  className="h-5 w-5 transition-transform duration-300 ease-out group-hover/delete:scale-110 group-hover/delete:-translate-y-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </>
        )}
      </label>

      <ImageCropModal
        file={cropFile}
        isOpen={Boolean(cropFile)}
        title="프로젝트 커버 조정"
        aspectRatio={1200 / 630}
        outputWidth={1200}
        outputHeight={630}
        onClose={handleCloseCrop}
        onConfirm={(file) => {
          setSourceFile(cropFile);
          onChange?.(file);
          setCropFile(null);
        }}
      />
    </>
  );
}
