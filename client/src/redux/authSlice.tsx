import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAuthorizationToken } from '../helpers/setAuthorizationToken';

export const loginThunk = createAsyncThunk(
  'authSlice/login',
  async (
    { username, password }: { username: any; password: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(`/user/login`, {
        username,
        password,
      });
      const { token } = res.data;
      localStorage.setItem('jwtToken', token);
      setAuthorizationToken(token);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'authSlice/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('jwtToken');
      setAuthorizationToken(false);
      return { status: true };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const loadUserThunk = createAsyncThunk(
  'authSlice/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      if (localStorage.jwtToken) {
        setAuthorizationToken(localStorage.jwtToken);
      }
      const res = await axios.get(`/user/auth`);

      return res.data;
    } catch (err) {
      return rejectWithValue(err);
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
      const res = await axios.post(`/user/register`, {
        username,
        email,
        password,
        isAdmin,
      });
      if (res.data.status) {
        const { token } = res.data;
        localStorage.setItem('jwtToken', token);
        setAuthorizationToken(token);
      }
      return res;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const authSlice = createSlice({
  name: 'loginSlice',
  initialState: {
    isLoggedIn: false,
    error: false,
    errorMessage: '',
    user: {},
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
    },
    logout: (state, action) => {
      state.isLoggedIn = false;
      state.user = {};
    },

    loadUser: (state, action) => {
      state.isLoggedIn = true;
      state.user = {
        token: action.payload.token,
        user: action.payload.user,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state, action) => {
        state.error = false;
        state.errorMessage = '';
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state: any, action) => {
        state.error = true;
        state.errorMessage = action.payload;
      })
      .addCase(logoutThunk.fulfilled, (state, action) => {
        state.isLoggedIn = false;
        state.user = {};
      })
      .addCase(logoutThunk.rejected, (state: any, action) => {
        state.error = true;
        state.errorMessage = action.payload;
      })
      .addCase(logoutThunk.pending, (state, action) => {
        state.error = false;
        state.errorMessage = '';
      })
      .addCase(loadUserThunk.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
      });
  },
});

export const { login, logout, loadUser } = authSlice.actions;

export default authSlice.reducer;