export const SAVE_SUCCESS_EVENT = "hrms:save-success";

export function notifySaveSuccess(message = "Changes saved successfully.") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SAVE_SUCCESS_EVENT, {
      detail: { message },
    })
  );
}

export function navigateAfterSave({
  navigate,
  close,
  fallbackPath,
  message = "Changes saved successfully.",
  shouldNavigate = false,
}) {
  notifySaveSuccess(message);
  close?.();

  if (!shouldNavigate || !navigate) return;

  const returnTo = window.history.length > 1 ? -1 : fallbackPath;
  navigate(returnTo || fallbackPath || "/super-admin/dashboard");
}
