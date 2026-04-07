"use client";

import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  approveStaffMember,
  clearAdminErrors,
  fetchPendingStaff,
  rejectStaffMember,
} from "@/features/adminSlice";
import { useAppSnackbar } from "@/components/providers/SnackbarContext";

export default function AdminStaffRequestsPage() {
  const dispatch = useDispatch();
  const { show } = useAppSnackbar();
  const { pending, status, error, actionStatus, actionError } = useSelector(
    (s) => s.admin,
  );

  useEffect(() => {
    dispatch(clearAdminErrors());
    dispatch(fetchPendingStaff());
  }, [dispatch]);

  useEffect(() => {
    if (actionError) show(actionError, "error");
  }, [actionError, show]);

  const onApprove = async (id) => {
    const res = await dispatch(approveStaffMember(id));
    if (approveStaffMember.fulfilled.match(res)) show("Approved", "success");
  };

  const onReject = async (id) => {
    const res = await dispatch(rejectStaffMember(id));
    if (rejectStaffMember.fulfilled.match(res)) show("Rejected", "success");
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>
        Pending staff
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Same college as your account. Approve or reject registration requests.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {status === "loading" ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary" py={2}>
                      No pending requests.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={actionStatus === "loading"}
                        onClick={() => onApprove(row._id)}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        disabled={actionStatus === "loading"}
                        onClick={() => onReject(row._id)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
