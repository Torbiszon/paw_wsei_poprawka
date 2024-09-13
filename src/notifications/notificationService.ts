import { BehaviorSubject, Observable } from 'rxjs';

type ISOString = string;

export type Notification = {
  title: string;
  message: string;
  date: ISOString;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
};

class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  constructor() {
    this.init();
  }

  private init() {
    const notifications: Notification[] = []; 
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(notifications.filter(n => !n.read).length);
  }

  send(notification: Notification): void {
    const notifications = this.notificationsSubject.value;
    notifications.push(notification);
    this.notificationsSubject.next(notifications);
    if (!notification.read) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
  }

  list(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  unreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  getLatestNotification(): Notification | null {
    const notifications = this.notificationsSubject.value;
    return notifications.length ? notifications[notifications.length - 1] : null;
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(notification => ({
      ...notification,
      read: true
    }));
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(0);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}

const notificationService = new NotificationService();
export default notificationService;
