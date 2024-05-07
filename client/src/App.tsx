import ReactGA from 'react-ga4';
import { Search } from './components/Search';
import Layout from './components/Layout';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { apiBaseUrl } from './redux/common.api';

ReactGA.initialize('G-R54SYJD2B8');
const publicVapidKey =
  'BCrScCgFJml1t1UsPNfsgd6562aSzuyRB_qQw79KrAfaALzpxkYPaLxavkP2s_P1OP3kWXuvhiK2T1ZJNmhhCiE'; //

export async function regSw(user) {
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
      'Service workers or Push notifications are not supported by the browser!!'
    );
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send('pageview');
  }, [location]);
  return (
    <Layout>
      <div>test1</div>
      <Search />
    </Layout>
  );
}

export default App;
