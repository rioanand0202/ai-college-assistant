import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/services/api";

export const fetchPendingStaff = createAsyncThunk(
  "admin/fetchPendingStaff",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/staff/pending");
      return data?.data?.staff || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load requests");
    }
  },
);

export const approveStaffMember = createAsyncThunk(
  "admin/approveStaffMember",
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/staff/${id}/approve`);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Approve failed");
    }
  },
);

export const rejectStaffMember = createAsyncThunk(
  "admin/rejectStaffMember",
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/staff/${id}/reject`);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Reject failed");
    }
  },
);

const initialState = {
  pending: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminErrors(state) {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingStaff.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPendingStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pending = action.payload;
      })
      .addCase(fetchPendingStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load";
      })
      .addCase(approveStaffMember.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(approveStaffMember.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const id = String(action.payload);
        state.pending = state.pending.filter((s) => String(s._id) !== id);
      })
      .addCase(approveStaffMember.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload || "Approve failed";
      })
      .addCase(rejectStaffMember.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(rejectStaffMember.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const id = String(action.payload);
        state.pending = state.pending.filter((s) => String(s._id) !== id);
      })
      .addCase(rejectStaffMember.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload || "Reject failed";
      });
  },
});

export const { clearAdminErrors } = adminSlice.actions;
export default adminSlice.reducer;
