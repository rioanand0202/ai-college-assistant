import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/services/api";

export const uploadMaterial = createAsyncThunk(
  "material/uploadMaterial",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/materials/upload", formData);
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Upload failed";
      return rejectWithValue(msg);
    }
  },
);

export const getMyMaterials = createAsyncThunk(
  "material/getMyMaterials",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/materials/mine");
      return data?.data?.materials || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load materials");
    }
  },
);

const initialState = {
  materials: [],
  uploadStatus: "idle",
  uploadError: null,
  listStatus: "idle",
  listError: null,
};

const materialSlice = createSlice({
  name: "material",
  initialState,
  reducers: {
    clearUploadState(state) {
      state.uploadStatus = "idle";
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadMaterial.pending, (state) => {
        state.uploadStatus = "loading";
        state.uploadError = null;
      })
      .addCase(uploadMaterial.fulfilled, (state) => {
        state.uploadStatus = "succeeded";
        state.uploadError = null;
      })
      .addCase(uploadMaterial.rejected, (state, action) => {
        state.uploadStatus = "failed";
        state.uploadError = action.payload || "Upload failed";
      })
      .addCase(getMyMaterials.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(getMyMaterials.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.materials = action.payload;
      })
      .addCase(getMyMaterials.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload || "Failed to load";
      });
  },
});

export const { clearUploadState } = materialSlice.actions;
export default materialSlice.reducer;
