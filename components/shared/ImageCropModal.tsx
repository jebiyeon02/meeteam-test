'use client';

import { ImageIcon, Minus, Move, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';

import BaseButton from '@/components/shared/BaseButton';
import BaseModal from '@/components/shared/BaseModal';

type CropShape = 'rect' | 'circle';

interface ImageCropModalProps {
  file: File | null;
  isOpen: boolean;
  title: string;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  cropShape?: CropShape;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getOutputType(type: string) {
  return type === 'image/png' ? 'image/png' : 'image/jpeg';
}

function getOutputName(name: string, type: string) {
  const extension = type === 'image/png' ? 'png' : 'jpg';
  const baseName = name.replace(/\.[^.]+$/, '') || 'image';

  return `${baseName}-cropped.${extension}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createCroppedFile({
  sourceUrl,
  sourceFile,
  crop,
  outputWidth,
  outputHeight,
}: {
  sourceUrl: string;
  sourceFile: File;
  crop: Area;
  outputWidth: number;
  outputHeight: number;
}) {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지를 처리할 수 없습니다.');
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const outputType = getOutputType(sourceFile.type);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType));

  if (!blob) {
    throw new Error('이미지를 처리할 수 없습니다.');
  }

  return new File([blob], getOutputName(sourceFile.name, outputType), { type: outputType });
}

export default function ImageCropModal({
  file,
  isOpen,
  title,
  aspectRatio,
  outputWidth,
  outputHeight,
  cropShape = 'rect',
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file || !isOpen) {
      setImageUrl(null);
      setCroppedAreaPixels(null);
      return undefined;
    }

    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file, isOpen]);

  const handleCropComplete = useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const handleZoomChange = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  const handleConfirm = async () => {
    if (!file || !imageUrl || !croppedAreaPixels) {
      return;
    }

    try {
      setIsProcessing(true);
      const croppedFile = await createCroppedFile({
        sourceUrl: imageUrl,
        sourceFile: file,
        crop: croppedAreaPixels,
        outputWidth,
        outputHeight,
      });

      onConfirm(croppedFile);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-mt-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mt-badge-bg text-mt-primary">
              <ImageIcon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            </span>
            <h2 className="truncate text-base leading-6 font-bold text-mt-text-primary">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
            aria-label="이미지 조정 닫기"
          >
            <X className="h-5 w-5" aria-hidden strokeWidth={1.8} />
          </button>
        </div>

        <div className="pt-5">
          <div className="rounded-2xl bg-mt-bg-soft p-4">
            <div
              className={`relative mx-auto w-full max-w-xl overflow-hidden bg-mt-text-primary ${
                cropShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
              }`}
              style={{ aspectRatio }}
            >
              {imageUrl ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  aspect={aspectRatio}
                  cropShape={cropShape === 'circle' ? 'round' : 'rect'}
                  objectFit="cover"
                  showGrid={false}
                  restrictPosition
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                  style={{
                    containerStyle: {
                      background: 'var(--color-mt-text-primary)',
                    },
                    cropAreaStyle: {
                      border: '2px solid var(--color-mt-white)',
                      color: 'rgba(0, 0, 0, 0.38)',
                    },
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm leading-5 font-medium text-mt-text-secondary">
              <Move className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              <span>드래그해서 보일 위치를 맞춰주세요.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.2)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-mt-border text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
                aria-label="축소"
              >
                <Minus className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={ZOOM_STEP}
                value={zoom}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
                className="w-32 accent-mt-primary"
                aria-label="이미지 확대"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.2)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-mt-border text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
                aria-label="확대"
              >
                <Plus className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <BaseButton variant="gray" size="M" onClick={onClose} disabled={isProcessing}>
              취소
            </BaseButton>
            <BaseButton
              size="M"
              onClick={() => void handleConfirm()}
              disabled={!imageUrl || !croppedAreaPixels || isProcessing}
            >
              {isProcessing ? '처리 중' : '적용하기'}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
