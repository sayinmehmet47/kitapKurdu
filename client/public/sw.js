/* eslint-disable no-restricted-globals */
self.addEventListener('message', async (event) => {
  console.log('Got message in the service worker', event);
});

console.log('Service Worker Loaded...');

self.addEventListener('push', async (e) => {
  const data = e.data.json();
  console.log('Push Received:', data);
  await self.registration.showNotification(data.title, {
    body: data.body,
  });
});
