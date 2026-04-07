import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/services/api";

export const fetchDropdowns = createAsyncThunk(
  "dropdown/fetchDropdowns",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/meta");
      const payload = data?.data || data;
      return {
        degrees: payload.degrees || [],
        departments: payload.departments || [],
        years: payload.years || [],
        semesters: payload.semesters || [],
      };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load options");
    }
  },
);

const initialState = {
  degrees: [],
  departments: [],
  years: [],
  semesters: [],
  status: "idle",
  error: null,
};

const dropdownSlice = createSlice({
  name: "dropdown",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDropdowns.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDropdowns.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.degrees = action.payload.degrees;
        state.departments = action.payload.departments;
        state.years = action.payload.years;
        state.semesters = action.payload.semesters;
      })
      .addCase(fetchDropdowns.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load";
      });
  },
});

export default dropdownSlice.reducer;
