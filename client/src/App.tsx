import axios from 'axios';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Search } from './components/Search';
import { loadUserThunk } from './redux/authSlice';
import { apiBaseUrl } from './redux/common.api';
import { useAppDispatch } from './redux/store';

ReactGA.initialize('G-R54SYJD2B8');

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function regSw(): Promise<void> {
  if (!publicVapidKey) {
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  const permission = await window.Notification.requestPermission();
  if (permission !== 'granted') {
    return;
  }

  try {
    const register = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    if (!register.active) {
      return;
    }

    let subscription = await register.pushManager.getSubscription();

    // Browsers that do not expose options.applicationServerKey cannot be
    // checked, so treat the existing subscription as reusable rather than
    // unsubscribing on every visit. Real mismatch rotation only applies when
    // the key bytes are available.
    if (
      subscription?.options?.applicationServerKey &&
      !pushApplicationServerKeyMatches(subscription, urlBase64ToUint8Array(publicVapidKey))
    ) {
      await subscription.unsubscribe();
      subscription = null;
    }

    if (!subscription) {
      subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
    }

    if (subscription && apiBaseUrl) {
      const headers: Record<string, string> = {};
      const authToken = sessionStorage.getItem('auth_at');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      await axios.post(
        `${apiBaseUrl}/subscription`,
        { subscription },
        { headers, withCredentials: true }
      );
    }
  } catch {
    // Push registration is best-effort; never surface endpoints or tokens.
    console.log('Push notification setup failed');
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

function pushApplicationServerKeyMatches(
  subscription: PushSubscription,
  expectedKey: Uint8Array
): boolean {
  const currentKey = subscription.options?.applicationServerKey;
  if (!currentKey) {
    return false;
  }
  return bytesEqual(new Uint8Array(currentKey), expectedKey);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location.pathname]);

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
          const hasCookies = document.cookie
            .split(';')
            .some((cookie) => cookie.trim().startsWith('accessToken='));
          const isDifferentDomain =
            apiBaseUrl && window.location.hostname !== new URL(apiBaseUrl).hostname;

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
