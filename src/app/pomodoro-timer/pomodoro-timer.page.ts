import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-pomodoro-timer',
  templateUrl: './pomodoro-timer.page.html',
  styleUrls: ['./pomodoro-timer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class PomodoroTimerPage implements OnInit, OnDestroy {
  // Constants
  readonly WORK_DURATION = 25 * 60; // 25 minutes in seconds
  readonly BREAK_DURATION = 5 * 60; // 5 minutes in seconds
  
  // Test mode constants (short durations for testing)
  readonly TEST_WORK_DURATION = 10; // 10 seconds
  readonly TEST_BREAK_DURATION = 5; // 5 seconds
  
  // Timer variables
  timerRunning = false;
  timeRemaining = this.WORK_DURATION;
  timerDisplay = '25:00';
  isBreak = false;
  timerInterval: any;
  completedSessions = 0;
  testMode = false;
  
  // Clock variables
  currentTime = new Date();
  clockInterval: any;

  constructor(private platform: Platform) {
    this.setupBackButtonHandler();
  }

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
    
    // Set up notifications and permissions
    this.setupNotifications();
    
    // Make sure timer is in initial state
    this.resetPomodoro();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  setupBackButtonHandler() {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      App.exitApp();
    });
  }

  async setupNotifications() {
    try {
      // Request notification permissions
      const permStatus = await LocalNotifications.requestPermissions();
      console.log('Notification permission status:', permStatus);
      
      // Set up notification listeners
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received:', notification);
      });
      
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  updateClock() {
    this.currentTime = new Date();
  }

  startPomodoro() {
    if (this.timerRunning) return;
    
    this.timerRunning = true;
    
    // Request notification permissions if not already granted
    LocalNotifications.requestPermissions().then(result => {
      console.log('Notification permission status:', result);
    });
    
    // Start the timer interval
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      
      if (this.timeRemaining <= 0) {
        this.handleTimerComplete();
      }
    }, 1000);
  }
  
  // Toggle test mode
  toggleTestMode() {
    this.testMode = !this.testMode;
    this.resetPomodoro();
  }
  
  // Test notification directly
  async testNotification() {
    await this.showNotification('Test Notification', 'This is a test notification');
  }

  stopPomodoro() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
    }
  }

  resetPomodoro() {
    // Stop any running timer
    this.stopPomodoro();
    
    // Reset to initial state
    this.isBreak = false;
    
    // Use test durations if in test mode
    if (this.testMode) {
      this.timeRemaining = this.TEST_WORK_DURATION;
    } else {
      this.timeRemaining = this.WORK_DURATION;
    }
    
    this.timerRunning = false;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    
    this.timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  async handleTimerComplete() {
    clearInterval(this.timerInterval);
    
    if (!this.isBreak) {
      // Work session completed
      this.completedSessions++;
      
      // Show notification with sound and vibration
      await this.showNotification(
        'Work Session Complete', 
        'Time for a break!'
      );
      
      // Start break - set up break state immediately
      this.isBreak = true;
      
      // Use test duration if in test mode
      if (this.testMode) {
        this.timeRemaining = this.TEST_BREAK_DURATION;
      } else {
        this.timeRemaining = this.BREAK_DURATION;
      }
      
      this.updateTimerDisplay();
      
      // Start the break timer immediately
      this.timerRunning = true;
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        this.updateTimerDisplay();
        
        if (this.timeRemaining <= 0) {
          this.handleTimerComplete();
        }
      }, 1000);
    } else {
      // Break completed
      
      // Show notification with sound and vibration
      await this.showNotification(
        'Break Complete', 
        'Ready for another Pomodoro?'
      );
      
      // Reset for next session - back to initial state
      this.isBreak = false;
      this.timerRunning = false;
      
      // Use test duration if in test mode
      if (this.testMode) {
        this.timeRemaining = this.TEST_WORK_DURATION;
      } else {
        this.timeRemaining = this.WORK_DURATION;
      }
      
      this.updateTimerDisplay();
    }
  }

  async showNotification(title: string, body: string) {
    try {
      // Vibrate device
      if (this.platform.is('capacitor')) {
        // First do a heavy impact
        await Haptics.impact({ style: ImpactStyle.Heavy });
        
        // Then add a vibration pattern for more emphasis
        await Haptics.vibrate();
      }
      
      // Play a sound effect
      this.playSound();
      
      // Show notification with explicit sound
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Math.floor(Math.random() * 10000) + 1, // Random ID to avoid conflicts
            sound: "default",
            schedule: { at: new Date() },
            extra: { data: "Pass data to your handler" }
          }
        ]
      });
      
      // Also display an alert for immediate visibility
      alert(`${title}\n${body}`);
      
      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  // Play a beep sound
  playSound() {
    try {
      // Create audio element
      const audio = new Audio();
      audio.src = 'assets/sounds/notification.mp3'; // Make sure this file exists in your assets folder
      audio.load();
      audio.play();
    } catch (e) {
      console.error('Error playing sound:', e);
      
      // Fallback to system beep
      try {
        const fallbackAudio = new Audio('data:audio/wav;base64,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');
        fallbackAudio.play();
      } catch (fallbackError) {
        console.error('Error playing fallback sound:', fallbackError);
      }
    }
  }
}