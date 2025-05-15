import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  userRole: string;
}

const initialState: UserState = {
  userRole: "",
};

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUserRole: (state, action: PayloadAction<string>) => {
      state.userRole = action.payload;
    },
  },
});

export const { setUserRole } = usersSlice.actions;

export default usersSlice.reducer;
