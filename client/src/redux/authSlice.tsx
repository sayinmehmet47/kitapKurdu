import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { apiBaseUrl } from './common.api';

// Define proper interfaces
interface User {
  id?: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AuthResponse {
  user: User;
}

interface AuthState {
  isLoggedIn: boolean;
  loginSuccess: boolean;
  error: boolean;
  errorMessage: string;
  isLoading: boolean;
  isAuthLoaded: boolean;
  user: AuthResponse;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export const loginThunk = createAsyncThunk(
  'authSlice/login',
  async ({ username, password }: LoginCredentials, { rejectWithValue }) => {
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
    { username, email, password, isAdmin = false }: RegisterCredentials,
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
      const err = error as AxiosError<{ errors: Array<{ message: string }> }>;
      return rejectWithValue(
        err.response?.data.errors?.[0]?.message || 'Registration failed'
      );
    }
  }
);

const initialState: AuthState = {
  isLoggedIn: false,
  loginSuccess: false,
  error: false,
  errorMessage: '',
  isLoading: false,
  isAuthLoaded: false,
  user: {
    user: {
      id: '',
      username: '',
      email: '',
      isAdmin: false,
    },
  },
};

export const authSlice = createSlice({
  name: 'loginSlice',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.loginSuccess = false;
      state.isAuthLoaded = true;
      state.user = {
        user: {
          id: '',
          username: '',
          email: '',
          isAdmin: false,
        },
      };
    },
    loadUser: (state, action: PayloadAction<AuthResponse>) => {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
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
        state.isAuthLoaded = true; // Auth check completed
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.error = true;
        state.errorMessage = action.payload as string;
        state.isLoading = false;
        state.isAuthLoaded = true; // Auth check completed
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoggedIn = false;
        state.isLoading = false;
        state.loginSuccess = false;
        state.isAuthLoaded = true;
        state.user = {
          user: {
            id: '',
            username: '',
            email: '',
            isAdmin: false,
          },
        };
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.error = true;
        state.isLoading = false;
        state.errorMessage = action.payload as string;
        state.isAuthLoaded = true; // Auth check completed
      })
      .addCase(logoutThunk.pending, (state) => {
        state.error = false;
        state.isLoading = true;
        state.errorMessage = '';
      })
      .addCase(loadUserThunk.pending, (state) => {
        state.error = false;
        state.errorMessage = '';
        state.isLoading = true;
      })
      .addCase(loadUserThunk.rejected, (state, action) => {
        state.error = true;
        state.errorMessage = action.payload as string;
        state.isLoading = false;
        state.isAuthLoaded = true; // Auth check completed
        state.isLoggedIn = false;
      })
      .addCase(loadUserThunk.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
        state.isLoading = false;
        state.loginSuccess = false;
        state.isAuthLoaded = true; // Auth check completed
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loginSuccess = true;
        state.error = false;
        state.errorMessage = '';
        state.isAuthLoaded = true; // Auth check completed
      })
      .addCase(registerThunk.pending, (state) => {
        state.error = false;
        state.errorMessage = '';
        state.isLoading = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.error = true;
        state.errorMessage = action.payload as string;
        state.isLoading = false;
        state.isAuthLoaded = true; // Auth check completed
      });
  },
});

export const { login, logout, loadUser } = authSlice.actions;

export default authSlice.reducer;
