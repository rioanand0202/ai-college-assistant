import AdminRouteGuard from "./AdminRouteGuard";
import AdminShell from "./AdminShell";

export default function AdminLayout({ children }) {
  return (
    <AdminRouteGuard>
      <AdminShell>{children}</AdminShell>
    </AdminRouteGuard>
  );
}
