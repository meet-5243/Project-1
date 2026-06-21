// Service worker event listener for incoming push notifications
self.addEventListener('push', (event) => {
  let payload = { title: 'Clear&Sync', body: 'You have a new update.' };
  
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Clear&Sync', body: event.data.text() };
    }
  }

  const options = {
    body: payload.body,
    icon: '/pwa-icon.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: payload.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Service worker event listener for when a user clicks a push notification card
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a browser tab is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === clickUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
