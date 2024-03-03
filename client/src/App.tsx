import ReactGA from 'react-ga4';
import { Search } from './components/Search';
import Layout from './components/Layout';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

ReactGA.initialize('G-R54SYJD2B8');
const publicVapidKey =
  'BCrScCgFJml1t1UsPNfsgd6562aSzuyRB_qQw79KrAfaALzpxkYPaLxavkP2s_P1OP3kWXuvhiK2T1ZJNmhhCiE'; //

export async function regSw(user) {
  if ('serviceWorker' in navigator) {
    console.log('Registering service worker...');
    const register = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    if (register.active) {
      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      if (subscription) {
        await axios.post('http://localhost:5000/api/subscription', {
          subscription,
          user,
        });
      }
      console.log('Push Sent...');
    }
  } else {
    console.log('Push');
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
      <Search />
    </Layout>
  );
}

export default App;
