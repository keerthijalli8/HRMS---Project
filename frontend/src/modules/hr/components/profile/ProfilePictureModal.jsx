import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import {
  cropAndCompressImage,
  saveAvatar,
  removeAvatar,
  validateImageFile,
  readFileAsDataUrl
} from '../../services/avatarStore.js';

export const ProfilePictureModal = ({
  isOpen,
  onClose,
  employee,
  currentAvatarUrl,
  onTriggerToast,
  onAvatarSaved
}) => {
  if (!isOpen) return null;

  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);

  const empId = employee?.employeeId || employee?.id || "EMP-1088";
  const empName = employee?.name || "Employee";

  // Handle file selection from native device file picker
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file fires onChange
    e.target.value = "";
    setErrorMessage("");

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setRawImageSrc(dataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage("Could not load selected photo. Please try a different image.");
    }
  };

  // Trigger native file picker
  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  // Drag to Pan Handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Limit pan to reasonable bounds
    const bound = 150 * zoom;
    setPan({
      x: Math.max(-bound, Math.min(bound, newX)),
      y: Math.max(-bound, Math.min(bound, newY))
    });
  }, [isDragging, dragStart, zoom]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Zoom controls
  const handleZoomChange = (newZoom) => {
    const clamped = Math.max(1, Math.min(3, newZoom));
    setZoom(parseFloat(clamped.toFixed(2)));
  };

  // Save cropped and compressed photo
  const handleSavePhoto = async () => {
    if (!rawImageSrc) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      // Map pan coordinates from pixels to percentage offsets
      const panXPercent = Math.max(-100, Math.min(100, (pan.x / 150) * 100));
      const panYPercent = Math.max(-100, Math.min(100, (pan.y / 150) * 100));

      const compressedDataUrl = await cropAndCompressImage({
        imageSrc: rawImageSrc,
        zoom,
        panX: panXPercent,
        panY: panYPercent,
        rotation,
        outputSize: 400,
        quality: 0.88,
        format: "image/jpeg"
      });

      const success = saveAvatar(empId, compressedDataUrl);
      setIsSaving(false);

      if (success) {
        onTriggerToast?.("Profile picture updated successfully!");
        onAvatarSaved?.(compressedDataUrl);
        onClose();
      } else {
        setErrorMessage("Failed to save profile picture to browser storage.");
      }
    } catch (err) {
      console.error("Save photo error:", err);
      setIsSaving(false);
      setErrorMessage("An error occurred while cropping the photo. Please try again.");
    }
  };

  // Remove Photo & Restore Default Avatar
  const handleRemovePhoto = () => {
    if (window.confirm("Remove your profile picture and restore the default initials avatar?")) {
      removeAvatar(empId);
      onTriggerToast?.("Profile picture removed. Default avatar restored.");
      onAvatarSaved?.(null);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="camera" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">Edit Profile Picture</div>
              <div className="text-xs text-muted">Upload, reposition, and crop your corporate display photo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
          >
            <Icon name="x" className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-bad/15 border border-bad/40 text-bad text-xs flex items-center gap-2 animate-shake">
              <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW A: Cropping & Repositioning Viewport (when an image is selected) */}
          {rawImageSrc ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="font-semibold text-ink text-xs block">
                  Drag photo to reposition · Scroll or slide to zoom
                </span>
                <span className="text-[11px] text-muted">
                  The area inside the circle will be your public avatar
                </span>
              </div>

              {/* Interactive Circular Crop Viewport */}
              <div className="relative w-64 h-64 select-none">
                {/* Image Canvas Box */}
                <div
                  ref={viewportRef}
                  onPointerDown={handlePointerDown}
                  className={`w-full h-full rounded-full overflow-hidden bg-black/40 border-2 border-accent relative shadow-2xl cursor-grab active:cursor-grabbing ${
                    isDragging ? 'cursor-grabbing' : ''
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  <img
                    src={rawImageSrc}
                    alt="Crop preview"
                    draggable={false}
                    className="absolute pointer-events-none origin-center max-w-none transition-transform duration-75"
                    style={{
                      transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                      left: '50%',
                      top: '50%',
                      minWidth: '100%',
                      minHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                {/* Circular Target Overlay Grid */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 pointer-events-none" />
              </div>

              {/* Reposition Controls: Zoom Slider & Rotate */}
              <div className="w-full flex flex-col gap-2.5 p-3 rounded-xl bg-surface2/50 border border-line/80">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted text-[11px] font-semibold flex items-center gap-1.5">
                    <Icon name="zoom-in" className="w-3.5 h-3.5 text-accent" />
                    <span>Zoom ({Math.round(zoom * 100)}%)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom - 0.2)}
                      className="p-1 rounded bg-surface2 border border-line text-muted hover:text-ink hover:border-accent"
                      title="Zoom out"
                    >
                      <Icon name="zoom-out" className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-32 accent-accent cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom + 0.2)}
                      className="p-1 rounded bg-surface2 border border-line text-muted hover:text-ink hover:border-accent"
                      title="Zoom in"
                    >
                      <Icon name="zoom-in" className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition flex items-center gap-1"
                    title="Rotate 90 degrees"
                  >
                    <Icon name="rotate-cw" className="w-3 h-3 text-accent" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>

              {/* Action: Choose Different Photo */}
              <button
                type="button"
                onClick={triggerPicker}
                className="text-accent underline hover:text-white transition font-semibold text-[11.5px]"
              >
                Choose a different photo from device
              </button>
            </div>
          ) : (
            /* VIEW B: Initial State (Select Image from device) */
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Current Avatar Display */}
              <div className="w-28 h-28 rounded-full border-2 border-accent/40 bg-surface2 p-1 shadow-lg flex items-center justify-center overflow-hidden">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={empName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-accent/20 flex items-center justify-center font-display font-extrabold text-3xl text-accent">
                    {empName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="font-bold text-ink text-sm">{empName}</div>
                <div className="text-muted text-xs mt-0.5">{empId}</div>
              </div>

              {/* File Selection Trigger Card */}
              <div
                onClick={triggerPicker}
                className="w-full p-6 rounded-2xl border-2 border-dashed border-line hover:border-accent bg-surface2/30 hover:bg-surface2/60 transition cursor-pointer flex flex-col items-center gap-2 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold mb-1 shadow-sm">
                  <Icon name="upload" className="w-6 h-6 text-accent" />
                </div>
                <span className="font-bold text-ink text-sm">
                  Choose Photo from Device
                </span>
                <span className="text-xs text-muted max-w-xs">
                  Select from Laptop / Desktop Files, Downloads, or Mobile Gallery.
                </span>
                <span className="text-[11px] text-accent font-semibold font-mono mt-1">
                  JPG, JPEG, PNG, WEBP · Max 5 MB
                </span>
              </div>

              {/* Quick Actions if custom photo exists */}
              {currentAvatarUrl && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-lg bg-bad/15 border border-bad/30 text-bad hover:bg-bad hover:text-white transition font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                    <span>Remove Photo & Restore Avatar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
            <SecondaryButton onClick={onClose}>
              Cancel
            </SecondaryButton>

            <div className="flex items-center gap-2">
              {rawImageSrc ? (
                <PrimaryButton
                  icon="check"
                  disabled={isSaving}
                  onClick={handleSavePhoto}
                >
                  {isSaving ? "Saving & Optimizing..." : "Save Photo"}
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  icon="camera"
                  onClick={triggerPicker}
                >
                  Select Photo
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
