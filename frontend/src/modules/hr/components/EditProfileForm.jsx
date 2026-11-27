import React, { useState, useRef, useMemo } from 'react';
import { Icon } from './Icon.jsx';
import { useProfile } from '../context/ProfileContext.jsx';

/**
 * Client-side image resizing and compression helper:
 * Resizes image down to max 512x512 while maintaining aspect ratio,
 * and compresses to a high-quality base64 WebP/JPEG data URL.
 */
function compressImageTo512(file, maxSize = 512) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL('image/webp', 0.9);
          resolve(dataUrl);
        } catch (err) {
          // Fallback to jpeg if webp not supported
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        }
      };
      img.onerror = () => reject(new Error("Unable to decode selected image."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

export const EditProfileForm = ({
  onSaveSuccess,
  onCancel,
  onTriggerToast,
  targetProfile = null // If passed, allows HR admin editing another profile
}) => {
  const { profile: currentUserProfile, updateProfile } = useProfile();
  const profile = targetProfile || currentUserProfile;

  // Authorization check: Only logged-in user can change own photo, HR admins can change anyone's
  const isHRAdmin = currentUserProfile?.systemRole === "HR" || currentUserProfile?.systemRole === "HR Manager";
  const isSelf = currentUserProfile?.employeeId === profile?.employeeId;
  const canEditPhoto = isSelf || isHRAdmin;

  // Extract initial values
  const initialFirstName = profile?.firstName || profile?.name?.split(' ')[0] || "";
  const initialLastName = profile?.lastName || profile?.name?.split(' ').slice(1).join(' ') || "";
  const initialRawMobile = String(profile?.mobile || "").replace(/\D/g, '').slice(-10);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [mobile, setMobile] = useState(initialRawMobile);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || null);
  const [photoError, setPhotoError] = useState("");
  const [permissionNotice, setPermissionNotice] = useState("");
  const [touched, setTouched] = useState({ firstName: false, lastName: false, mobile: false });
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Field Validations
  const errors = useMemo(() => {
    const errs = {};

    // First Name: required, at least 2 characters, letters only
    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      errs.firstName = "First name is required.";
    } else if (trimmedFirst.length < 2) {
      errs.firstName = "First name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirst)) {
      errs.firstName = "First name can only contain letters.";
    }

    // Last Name: required, at least 1 character
    const trimmedLast = lastName.trim();
    if (!trimmedLast) {
      errs.lastName = "Last name is required.";
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedLast)) {
      errs.lastName = "Last name can only contain letters.";
    }

    // Mobile: required, 10 digits, starts with 6, 7, 8, 9
    const cleanDigits = mobile.replace(/\D/g, '');
    if (!cleanDigits) {
      errs.mobile = "Mobile number is required.";
    } else if (cleanDigits.length !== 10) {
      errs.mobile = `Must be exactly 10 digits (currently ${cleanDigits.length}).`;
    } else if (!/^[6-9]/.test(cleanDigits)) {
      errs.mobile = "Indian mobile numbers must start with 6, 7, 8, or 9.";
    }

    return errs;
  }, [firstName, lastName, mobile]);

  // Has Form Changed?
  const hasChanges = useMemo(() => {
    const firstChanged = firstName.trim() !== initialFirstName.trim();
    const lastChanged = lastName.trim() !== initialLastName.trim();
    const cleanDigits = mobile.replace(/\D/g, '');
    const mobileChanged = cleanDigits !== initialRawMobile;
    const photoChanged = avatarUrl !== (profile?.avatarUrl || null);

    return firstChanged || lastChanged || mobileChanged || photoChanged;
  }, [firstName, lastName, mobile, avatarUrl, initialFirstName, initialLastName, initialRawMobile, profile?.avatarUrl]);

  const isValid = Object.keys(errors).length === 0 && !photoError;
  const canSave = hasChanges && isValid && !isProcessingPhoto;

  // Process & Validate selected image
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      // User cancelled picker or denied access
      return;
    }

    // Reset input so re-selecting same file triggers change
    e.target.value = "";
    setPhotoError("");
    setPermissionNotice("");

    // 1. Validate file format: jpg/png/webp
    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ["jpg", "jpeg", "png", "webp"].includes(ext);

    if (!allowedMime.includes(file.type) && !isAllowedExt) {
      setPhotoError("Invalid file type. Please choose a JPG, PNG, or WebP image.");
      return;
    }

    // 2. Validate max size: 2 MB (2 * 1024 * 1024 bytes)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setPhotoError(`File size is ${mb} MB. Maximum allowed size is 2 MB.`);
      return;
    }

    // 3. Compress & resize to max 512x512
    setIsProcessingPhoto(true);
    try {
      const compressedDataUrl = await compressImageTo512(file, 512);
      setAvatarUrl(compressedDataUrl);
      setPhotoError("");
    } catch (err) {
      setPhotoError("Could not process this image. Allow access to photos or camera in your browser settings.");
      setPermissionNotice("Allow access to photos or camera in your browser settings.");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    setPhotoError("");
    setPermissionNotice("");
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    setTouched({ firstName: true, lastName: true, mobile: true });
    if (!canSave) return;

    const cleanDigits = mobile.replace(/\D/g, '');
    const formattedMobile = `+91 ${cleanDigits}`;

    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: formattedMobile,
      avatarUrl: avatarUrl || null
    });

    if (onTriggerToast) {
      onTriggerToast("Profile updated successfully!");
    }

    if (onSaveSuccess) {
      onSaveSuccess();
    }
  };

  // Initials for avatar preview fallback
  const firstInitial = (firstName.trim()[0] || "P").toUpperCase();
  const lastInitial = (lastName.trim()[0] || "P").toUpperCase();
  const initials = `${firstInitial}${lastInitial}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-ink">
      {/* 1. PHOTO SECTION */}
      <div className="flex flex-col items-center gap-2.5 pb-3 border-b border-line/50">
        <div className="relative group">
          {/* Instant preview in a circular crop */}
          <div className="w-24 h-24 rounded-full border-2 border-accent/60 ring-4 ring-accent/20 overflow-hidden bg-surface2/80 shadow-md flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-ink bg-gradient-to-br from-accent/35 via-accent/15 to-[#062028]">
                {initials}
              </div>
            )}
          </div>

          {canEditPhoto && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-on-accent hover:brightness-110 shadow-lg border border-bg transition cursor-pointer"
              title="Change Photo"
              aria-label="Change Photo"
            >
              <Icon name="camera" className="w-3.5 h-3.5 text-on-accent" />
            </button>
          )}
        </div>

        {/* Hidden inputs: device file picker and mobile camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handlePhotoSelect}
          className="hidden"
          aria-label="Upload photo from files"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePhotoSelect}
          className="hidden"
          aria-label="Take photo with camera"
        />

        {/* Action Buttons for Photo */}
        {canEditPhoto ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="px-3 py-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
              <span>{isProcessingPhoto ? "Resizing…" : "Change Photo"}</span>
            </button>

            {/* Mobile Camera Option */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="sm:hidden px-3 py-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Take photo with camera"
            >
              <Icon name="camera" className="w-3.5 h-3.5 text-accent" />
              <span>Camera</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-2.5 py-1.5 rounded-lg hover:bg-bad/15 text-xs font-medium text-bad transition cursor-pointer"
              >
                Remove Photo
              </button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-muted italic">
            Only HR admins can change other employee photos.
          </div>
        )}

        <div className="text-[10.5px] text-muted">
          Max 2 MB · JPG, PNG, or WebP · Auto-resized to 512×512
        </div>

        {/* Inline error for file validation */}
        {photoError && (
          <div className="text-[11px] text-bad font-medium bg-bad/10 border border-bad/20 px-3 py-1.5 rounded-lg text-center max-w-xs">
            {photoError}
          </div>
        )}

        {/* Friendly permission denial notice */}
        {permissionNotice && (
          <div className="text-[11px] text-warn font-medium bg-warn/10 border border-warn/25 px-3 py-1.5 rounded-lg text-center max-w-xs">
            {permissionNotice}
          </div>
        )}
      </div>

      {/* 2. FORM FIELDS */}
      <div className="flex flex-col gap-3 text-left">
        {/* First Name */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            First Name <span className="text-bad">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
            placeholder="e.g. Pooja"
            className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border text-xs text-ink placeholder:text-muted/60 focus:outline-none transition ${
              touched.firstName && errors.firstName
                ? "border-bad focus:ring-1 focus:ring-bad"
                : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
            }`}
            required
            aria-invalid={Boolean(touched.firstName && errors.firstName)}
            aria-describedby={touched.firstName && errors.firstName ? "first-name-error" : undefined}
          />
          {touched.firstName && errors.firstName && (
            <p id="first-name-error" className="text-[10.5px] text-bad mt-1 font-medium">
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            Last Name <span className="text-bad">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
            placeholder="e.g. Patel"
            className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border text-xs text-ink placeholder:text-muted/60 focus:outline-none transition ${
              touched.lastName && errors.lastName
                ? "border-bad focus:ring-1 focus:ring-bad"
                : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
            }`}
            required
            aria-invalid={Boolean(touched.lastName && errors.lastName)}
            aria-describedby={touched.lastName && errors.lastName ? "last-name-error" : undefined}
          />
          {touched.lastName && errors.lastName && (
            <p id="last-name-error" className="text-[10.5px] text-bad mt-1 font-medium">
              {errors.lastName}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            Mobile Number <span className="text-bad">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="px-2.5 py-2 rounded-l-xl bg-surface2 border-y border-l border-line text-xs font-semibold text-muted select-none">
              +91
            </span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setMobile(digits);
              }}
              onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
              placeholder="9845012345"
              maxLength={10}
              className={`w-full px-3 py-2 rounded-r-xl bg-surface2/60 border text-xs text-ink placeholder:text-muted/60 focus:outline-none transition ${
                touched.mobile && errors.mobile
                  ? "border-bad focus:ring-1 focus:ring-bad"
                  : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
              }`}
              required
              aria-invalid={Boolean(touched.mobile && errors.mobile)}
              aria-describedby={touched.mobile && errors.mobile ? "mobile-error" : undefined}
            />
          </div>
          {touched.mobile && errors.mobile && (
            <p id="mobile-error" className="text-[10.5px] text-bad mt-1 font-medium">
              {errors.mobile}
            </p>
          )}
        </div>

        {/* Email Address (Read-Only) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Work Email
            </label>
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Icon name="lock" className="w-2.5 h-2.5 text-muted" />
              <span>Read-only</span>
            </span>
          </div>
          <input
            type="email"
            value={profile?.email || "pooja.patel@nexora.in"}
            readOnly
            disabled
            className="w-full px-3 py-2 rounded-xl bg-surface/40 border border-line/40 text-xs text-muted/80 cursor-not-allowed select-all"
            aria-label="Work Email Address (Read-only)"
          />
        </div>
      </div>

      {/* 3. ACTION BUTTONS */}
      <div className="flex items-center gap-2 pt-2 border-t border-line/50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-3 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:bg-surface2/80 transition cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!canSave}
          className="flex-1 py-2 px-3 rounded-xl bg-accent text-on-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-105 active:scale-[0.99]"
        >
          <Icon name="check" className="w-3.5 h-3.5 text-on-accent" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
};
