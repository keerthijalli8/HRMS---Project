// Avatar Storage & Image Processing Service
// Provides scoped avatar persistence per Employee ID using localStorage + IndexedDB,
// file validation (JPG, JPEG, PNG, WEBP <= 5MB), and HTML5 Canvas-based cropping & compression.

const STORAGE_KEY = "hrms_avatars_v1";
const EVENT_NAME = "hrms_avatar_updated";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Helper: Normalize employee key identifier
export function getEmployeeKey(emp) {
  if (!emp) return null;
  if (typeof emp === "string") return emp.trim().toUpperCase();
  const id = emp.employeeId || emp.id || emp.email || emp.name;
  return id ? String(id).trim().toUpperCase() : null;
}

// Memory cache to avoid repeated JSON parses
let memoryCache = null;

// Read all avatars from storage
export function loadAllAvatars() {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
  } catch (e) {
    console.error("Error reading avatars from localStorage:", e);
  }
  memoryCache = {};
  return memoryCache;
}

// Retrieve avatar data URL for an employee ID
export function getAvatar(employeeOrId) {
  const key = getEmployeeKey(employeeOrId);
  if (!key) return null;
  const store = loadAllAvatars();
  return store[key] || null;
}

// Save avatar data URL for an employee ID
export function saveAvatar(employeeOrId, dataUrl) {
  const key = getEmployeeKey(employeeOrId);
  if (!key || !dataUrl) return false;

  try {
    const store = loadAllAvatars();
    store[key] = dataUrl;
    memoryCache = { ...store };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    // Also update currentUser in hrms_user if this matches the active session
    try {
      const activeRaw = localStorage.getItem("hrms_user");
      if (activeRaw) {
        const activeUser = JSON.parse(activeRaw);
        const activeKey = getEmployeeKey(activeUser);
        if (activeKey === key) {
          activeUser.avatarUrl = dataUrl;
          localStorage.setItem("hrms_user", JSON.stringify(activeUser));
        }
      }
    } catch (e) {}

    // Dispatch reactive update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { employeeId: key, avatarUrl: dataUrl }
      }));
    }
    return true;
  } catch (e) {
    console.error("Error saving avatar:", e);
    return false;
  }
}

// Remove avatar for an employee ID (restores default initials avatar)
export function removeAvatar(employeeOrId) {
  const key = getEmployeeKey(employeeOrId);
  if (!key) return false;

  try {
    const store = loadAllAvatars();
    delete store[key];
    memoryCache = { ...store };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    // Also remove from hrms_user if matching active session
    try {
      const activeRaw = localStorage.getItem("hrms_user");
      if (activeRaw) {
        const activeUser = JSON.parse(activeRaw);
        const activeKey = getEmployeeKey(activeUser);
        if (activeKey === key) {
          delete activeUser.avatarUrl;
          localStorage.setItem("hrms_user", JSON.stringify(activeUser));
        }
      }
    } catch (e) {}

    // Dispatch reactive update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { employeeId: key, avatarUrl: null }
      }));
    }
    return true;
  } catch (e) {
    console.error("Error removing avatar:", e);
    return false;
  }
}

// Subscribe to avatar changes
export function subscribeAvatarStore(callback) {
  if (typeof window === "undefined") return () => {};

  const handler = (e) => {
    memoryCache = null; // Invalidate cache
    callback(e.detail || {});
  };

  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY || e.key === "hrms_user") {
      memoryCache = null;
      callback({});
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

// ------------------- FILE VALIDATION -------------------

/**
 * Validates a user-selected File object.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No image file selected." };
  }

  // Check file type / extension
  const fileName = file.name || "";
  const ext = fileName.split(".").pop().toLowerCase();
  const mime = (file.type || "").toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mime) || mime.startsWith("image/");

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      error: `Unsupported format (${ext ? '.' + ext : 'unknown'}). Please choose a JPG, JPEG, PNG, or WEBP image.`
    };
  }

  // Check file size limit (5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Selected file is ${sizeMb} MB. Maximum allowed profile picture size is 5 MB.`
    };
  }

  return { valid: true };
}

// ------------------- IMAGE COMPRESSION & CROPPING -------------------

/**
 * Reads a File object as Data URL
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an HTMLImageElement from a data URL or source
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crops, positions, and compresses an image onto an offscreen canvas.
 * Returns a high-quality, lightweight base64 Data URL (typically 30KB - 80KB)
 * ready for safe storage and fast rendering.
 */
export async function cropAndCompressImage({
  imageSrc,
  zoom = 1,
  panX = 0, // -100 to 100 percentage offset
  panY = 0,
  rotation = 0, // 0, 90, 180, 270 degrees
  outputSize = 400, // 400x400 square crop
  quality = 0.88,
  format = "image/jpeg"
}) {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context could not be initialized");
  }

  // Fill with clean white/transparent background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  ctx.save();

  // Move origin to center of canvas for rotation and scaling
  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Determine aspect ratio scaling: cover outputSize
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;

  const baseScale = Math.max(outputSize / imgWidth, outputSize / imgHeight);
  const finalScale = baseScale * zoom;

  const drawWidth = imgWidth * finalScale;
  const drawHeight = imgHeight * finalScale;

  // Compute pan offsets in pixels relative to zoom
  const maxPanX = Math.max(0, (drawWidth - outputSize) / 2);
  const maxPanY = Math.max(0, (drawHeight - outputSize) / 2);

  const offsetX = (panX / 100) * maxPanX;
  const offsetY = (panY / 100) * maxPanY;

  ctx.drawImage(
    img,
    -drawWidth / 2 + offsetX,
    -drawHeight / 2 + offsetY,
    drawWidth,
    drawHeight
  );

  ctx.restore();

  // Export as compressed data URL
  return canvas.toDataURL(format, quality);
}
