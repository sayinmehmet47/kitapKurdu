import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authSlice from './authSlice';
import { bookApi } from './services/book.api';
import { messagesApi } from './services/messages.api';
import { commonApi } from './common.api';

const rootReducer = combineReducers({
  [commonApi.reducerPath]: commonApi.reducer,
  authSlice: authSlice,
});

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(commonApi.middleware)
      .concat(bookApi.middleware)
      .concat(messagesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
