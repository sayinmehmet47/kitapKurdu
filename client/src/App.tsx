import ReactGA from 'react-ga4';
import { Search } from './components/Search';
import Layout from './components/Layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { apiBaseUrl } from './redux/common.api';
import { useAppDispatch, useAppSelector } from './redux/store';
import { loadUserThunk, refreshTokenThunk } from './redux/authSlice';

ReactGA.initialize('G-R54SYJD2B8');
const publicVapidKey =
  'BCrScCgFJml1t1UsPNfsgd6562aSzuyRB_qQw79KrAfaALzpxkYPaLxavkP2s_P1OP3kWXuvhiK2T1ZJNmhhCiE';

interface User {
  id: string;
  username: string;
  email: string;
}

export async function regSw(user: User): Promise<void> {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const permission = await window.Notification.requestPermission();

    if (permission === 'granted') {
      const register = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      if (register.active) {
        try {
          const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
          });

          if (subscription && apiBaseUrl) {
            await axios.post(`${apiBaseUrl}/subscription`, {
              subscription,
              user,
            });
          }
          console.log('Push Sent...');
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      console.log('Push notifications are not allowed by the user');
    }
  } else {
    console.log(
      'Service workers or Push notifications are not supported by the browser'
    );
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector(state => state.authSlice);

  useEffect(() => {
    ReactGA.send('pageview');
  }, [location]);

  // Periodic token refresh for logged-in users (every 10 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      dispatch(refreshTokenThunk()).catch(() => {
        // Token refresh failed, user will be logged out by the thunk
        console.log('Token refresh failed');
      });
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, [isLoggedIn, dispatch]);

  // After Google OAuth redirect (?auth=success), load user from backend and clean URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get('auth');
    if (auth === 'success') {
      (async () => {
        try {
          // Safari fallback: if hash contains access token and refresh token, keep them in memory
          const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
          const at = hash.get('at');
          const rt = hash.get('rt');
          if (at) {
            sessionStorage.setItem('auth_at', at);
            // Store refresh token for browsers that block 3rd party cookies
            if (rt) {
              sessionStorage.setItem('auth_rt', rt);
            }
            // Send as Bearer for initial auth load (server still authenticates via cookie when available)
            // We call the same endpoint via fetch here to set Redux state quickly for Safari users
            await fetch(`${apiBaseUrl}/user/auth`, {
              credentials: 'include',
              headers: at ? { Authorization: `Bearer ${at}` } : undefined,
            });
          }
          await dispatch(loadUserThunk()).unwrap();
        } catch {}
        // Remove the query param without reloading
        navigate({ pathname: location.pathname }, { replace: true });
        // Clear temporary tokens shortly after navigation only if cookies are working
        setTimeout(() => {
          // Only clear if we're not relying on sessionStorage for auth (i.e., cookies work)
          // For cross-domain setups (Vercel + Render), keep tokens in sessionStorage
          const hasCookies = document.cookie.split(';').some(cookie => cookie.trim().startsWith('accessToken='));
          const isDifferentDomain = apiBaseUrl && window.location.hostname !== new URL(apiBaseUrl).hostname;
          
          if (hasCookies && !isDifferentDomain) {
            sessionStorage.removeItem('auth_at');
            sessionStorage.removeItem('auth_rt');
          }
        }, 2000);
      })();
    }
  }, [location.search, location.pathname, location.hash, dispatch, navigate]);

  return (
    <Layout>
      <Search />
    </Layout>
  );
}

export default App;
