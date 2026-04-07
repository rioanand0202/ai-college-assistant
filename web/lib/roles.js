export function isAdminRole(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  return r === "admin" || r === "super admin";
}

export function isStaffApproved(user) {
  if (!user || String(user.role || "").trim().toLowerCase() !== "staff") {
    return false;
  }
  const s = user.status;
  if (!s) return true;
  return String(s).trim().toLowerCase() === "approved";
}

/** Where to send someone right after login (and similar redirects). */
export function postLoginPath(user) {
  if (!user) return "/login";
  return isAdminRole(user.role) ? "/admin/staff-requests" : "/staff/dashboard";
}
