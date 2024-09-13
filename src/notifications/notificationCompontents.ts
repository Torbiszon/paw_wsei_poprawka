import notificationService from '../notifications/notificationService';

export function initializeUnreadNotificationCounter() {
  const counterElement = document.getElementById('unread-notification-counter');

  if (counterElement) {
    notificationService.unreadCount().subscribe(count => {
      counterElement.textContent = `${count}`;
    });
  }
}

export function initializeAllNotificationsView() {
  const notificationsContainer = document.getElementById('notifications-container');

  if (notificationsContainer) {
    notificationService.list().subscribe(notifications => {
      notificationsContainer.innerHTML = notifications.map(notification => `
        <li>
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          <p>${notification.date}</p>
          <p>${notification.priority}</p>
        </li>
      `).join('');
    });
  }
}

export function initializeNotificationDialog() {
  notificationService.list().subscribe(notifications => {
    const lastNotification = notifications[notifications.length - 1];
    if (lastNotification && (lastNotification.priority === 'medium' || lastNotification.priority === 'high')) {
      alert(`New Notification:\n\nTitle: ${lastNotification.title}\nMessage: ${lastNotification.message}`);
    }
  });
}

export function initializeReadAllButton() {
  const readAllButton = document.getElementById('notification-panel-read-all-button');
  const notificationsContainer = document.getElementById('notifications-container');

  if (readAllButton && notificationsContainer) {
    readAllButton.addEventListener('click', () => {
      notificationService.clearAllNotifications();
      notificationsContainer.innerHTML = '';
    });
  }
}
