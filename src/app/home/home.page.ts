import { Component, OnInit } from '@angular/core';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { NotificationService } from '../services/notification.service';
import { getDefaultTimezone, formatDateInTimezone } from '../utils/timezone-util';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentTime: string = '';
  
  ngOnInit(): void {
    this.notificationService.listenForIncomingNotifications();
  }
  
  constructor(
    private platform: Platform,
    private notificationService: NotificationService,
    private routerOutlet: IonRouterOutlet,
    private router: Router
  ) {
    setInterval(() => { this.updateCurrentTime() }, 1000);
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        // App.exitApp();
        App.minimizeApp();
      }
    });
  }
  
  // Navigation function for Pomodoro Timer
  navigateToPomodoroTimer() {
    this.router.navigate(['/pomodoro-timer']);
  }
  
  updateCurrentTime() {
    const now = new Date();
    const defaultTimezone = getDefaultTimezone(); 
    this.currentTime = formatDateInTimezone(now, defaultTimezone);
  }
  
  async checkPermissions() {
    const permissions = await this.notificationService.checkNotificationPermissions();
    alert(`Current Permissions: ${JSON.stringify(permissions)}`);
  }
  
  async requestPermissions() {
    const permissions = await this.notificationService.requestNotificationPermissions();
    alert(`Updated Permissions: ${JSON.stringify(permissions)}`);
  }
  
  async createNotification() {
    const permissions = await this.notificationService.checkNotificationPermissions();
    if (permissions.display !== 'granted') {
      alert('Notification permissions not granted. Requesting permissions...');
      await this.requestPermissions();
    }
    const notification: any = {
      title: 'Reminder',
      body: 'You have a meeting in 10 minutes!',
      id: 1,
      schedule: { at: new Date(new Date().getTime() + 60 * 1000) }, 
      sound: null,
      attachments: null,
      actionTypeId: '',
      extra: null,
    };
    await this.notificationService.scheduleNotification(notification);
  }
  
  async viewPendingNotifications() {
    const pending = await this.notificationService.getPendingNotifications();
    alert(JSON.stringify(pending));
  }
  
  async updateNotification() {
    const updatedNotification: any = {
      title: 'Updated Reminder',
      body: 'Your meeting has been rescheduled.',
      id: 1,
      schedule: { at: new Date(new Date().getTime() + 120 * 1000) },
      sound: null,
      attachments: null,
      actionTypeId: '',
      extra: null,
    };
    await this.notificationService.updateNotification(1, updatedNotification);
  }
  
  async deleteNotification() {
    await this.notificationService.cancelNotification(1);
  }
}