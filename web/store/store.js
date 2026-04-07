import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/authSlice";
import adminReducer from "@/features/adminSlice";
import dropdownReducer from "@/features/dropdownSlice";
import materialReducer from "@/features/materialSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      admin: adminReducer,
      dropdown: dropdownReducer,
      material: materialReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });
