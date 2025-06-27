import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { apiBaseUrl } from './common.api';

export const loginThunk = createAsyncThunk(
  'authSlice/login',
  async (
    { username, password }: { username: any; password: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(
        `${apiBaseUrl}/user/login`,
        {
          username,
          password,
        },
        {
          withCredentials: true,
        }
      );
      return res.data;
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue(err.message);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'authSlice/logout',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${apiBaseUrl}/user/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      return res.data;
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue(err.message);
    }
  }
);

export const loadUserThunk = createAsyncThunk(
  'authSlice/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${apiBaseUrl}/user/auth`, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue(err.message);
    }
  }
);

export const registerThunk = createAsyncThunk(
  'authSlice/register',
  async (
    {
      username,
      email,
      password,
      isAdmin = false,
    }: {
      username: any;
      email: any;
      password: any;
      isAdmin?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(`${apiBaseUrl}/user/register`, {
        username,
        email,
        password,
        isAdmin,
      });

      return res.data;
    } catch (error) {
      const err = error as any;
      return rejectWithValue(err.response?.data.errors[0].message);
    }
  }
);

export const authSlice = createSlice({
  name: 'loginSlice',
  initialState: {
    isLoggedIn: false,
    loginSuccess: false,
    error: false,
    errorMessage: '',
    isLoading: false,
    user: {
      user: {
        username: '',
        email: '',
        isAdmin: false,
      },
    },
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
    },
    logout: (state, action) => {
      state.isLoggedIn = false;
      state.loginSuccess = false;
      state.user = {
        user: {
          username: '',
          email: '',
          isAdmin: false,
        },
      };
    },

    loadUser: (state, action) => {
      state.isLoggedIn = true;
      state.user = {
        user: action.payload.user,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state, action) => {
        state.error = false;
        state.errorMessage = '';
        state.isLoading = true;
        state.loginSuccess = false;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
        state.isLoading = false;
        state.loginSuccess = true;
      })
      .addCase(loginThunk.rejected, (state: any, action) => {
        state.error = true;
        state.errorMessage = action.payload;
        state.isLoading = false;
      })
      .addCase(logoutThunk.fulfilled, (state, action) => {
        state.isLoggedIn = false;
        state.isLoading = false;
        state.loginSuccess = false;
        state.user = {
          user: {
            username: '',
            email: '',
            isAdmin: false,
          },
        };
      })
      .addCase(logoutThunk.rejected, (state: any, action) => {
        state.error = true;
        state.isLoading = false;
        state.errorMessage = action.payload;
      })
      .addCase(logoutThunk.pending, (state, action) => {
        state.error = false;
        state.isLoading = true;
        state.errorMessage = '';
      })
      .addCase(loadUserThunk.pending, (state, action) => {
        state.error = false;
        state.errorMessage = '';
        state.isLoading = true;
      })
      .addCase(loadUserThunk.rejected, (state: any, action) => {
        state.error = true;
        state.errorMessage = action.payload;
        state.isLoading = false;
      })
      .addCase(loadUserThunk.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
        state.isLoading = false;
        state.loginSuccess = false;
      })
      .addCase(registerThunk.rejected, (state: any, action) => {
        state.error = true;
        state.errorMessage = action.payload;
        state.isLoading = false;
      });
  },
});

export const { login, logout, loadUser } = authSlice.actions;

export default authSlice.reducer;
