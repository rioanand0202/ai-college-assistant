import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/services/api";

/** refreshToken: string = store, null = remove, undefined = leave unchanged */
const persistAuth = (user, token, refreshToken) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  if (refreshToken !== undefined) {
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    else localStorage.removeItem("refreshToken");
  }
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
};

export const registerStaff = createAsyncThunk(
  "auth/registerStaff",
  async (payload, { rejectWithValue }) => {
    try {
      const college = String(
        payload.collegeCode || process.env.NEXT_PUBLIC_COLLEGE_CODE || "",
      ).trim();
      if (!college) {
        return rejectWithValue(
          "College code is required. Enter it on the form or set NEXT_PUBLIC_COLLEGE_CODE in .env.local.",
        );
      }
      const body = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: "staff",
        collegeCode: college,
      };
      if (payload.degree) body.degree = payload.degree;
      if (payload.department) body.department = payload.department;

      const { data } = await api.post("/auth/register", body, {
        headers: { "x-college-code": college },
      });
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Registration failed";
      return rejectWithValue(msg);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, collegeCode }, { rejectWithValue }) => {
    try {
      const cc = String(collegeCode || "").trim();
      if (!cc) {
        return rejectWithValue("College code is required.");
      }
      const { data } = await api.post("/auth/login", {
        email,
        password,
        collegeCode: cc,
      });
      if (data?.mfaRequired) {
        return rejectWithValue(
          "This account uses MFA. Complete OTP verification to continue.",
        );
      }
      const token = data?.data?.accessToken;
      const refreshToken = data?.data?.refreshToken;
      const user = data?.data?.user;
      if (!token || !user) {
        return rejectWithValue("Unexpected login response");
      }
      persistAuth(user, token, refreshToken);
      return { user, token };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      return rejectWithValue(msg);
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/me");
      const user = data?.data?.user;
      if (!user) return rejectWithValue("No user");
      persistAuth(user, localStorage.getItem("token"));
      return { user };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Session expired";
      return rejectWithValue(msg);
    }
  },
);

const initialState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      const raw = localStorage.getItem("user");
      if (token) state.token = token;
      if (raw) {
        try {
          state.user = JSON.parse(raw);
        } catch {
          state.user = null;
        }
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      persistAuth(null, null, null);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerStaff.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerStaff.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(registerStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Registration failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = localStorage.getItem("token");
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || null;
        state.user = null;
        state.token = null;
      persistAuth(null, null, null);
    });
  },
});

export const { hydrateFromStorage, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
