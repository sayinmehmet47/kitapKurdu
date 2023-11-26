import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authSlice from './authSlice';
import { bookApi } from './services/book.api';
import { messagesApi } from './services/messages.api';

const rootReducer = combineReducers({
  [bookApi.reducerPath]: bookApi.reducer,
  [messagesApi.reducerPath]: messagesApi.reducer,
  authSlice: authSlice,
});

const middleware = (getDefaultMiddleware) =>
  getDefaultMiddleware()
    .concat(bookApi.middleware)
    .concat(messagesApi.middleware);

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: middleware,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
