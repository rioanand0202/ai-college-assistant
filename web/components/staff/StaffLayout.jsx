import StaffRouteGuard from "./StaffRouteGuard";
import StaffShell from "./StaffShell";

export default function StaffLayout({ children }) {
  return (
    <StaffRouteGuard>
      <StaffShell>{children}</StaffShell>
    </StaffRouteGuard>
  );
}
