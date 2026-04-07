"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { hydrateFromStorage, getCurrentUser } from "@/features/authSlice";
import { isAdminRole } from "@/lib/roles";

export default function AdminRouteGuard({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch(hydrateFromStorage());
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    dispatch(getCurrentUser()).then((action) => {
      if (getCurrentUser.rejected.match(action)) {
        router.replace("/login");
        return;
      }
      const user = action.payload?.user;
      if (!user || !isAdminRole(user.role)) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [dispatch, router]);

  if (!ready) {
    return (
      <Box
        minHeight="50vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return children;
}
