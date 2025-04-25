import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-pomodoro',
  templateUrl: './pomodoro.page.html',
  styleUrls: ['./pomodoro.page.scss'],
})
export class PomodoroPage implements OnInit, OnDestroy {
  currentTime: string = '';
  timeLeft: number = 0;
  minutes: string = '00';
  seconds: string = '00';
  timerInterval: any;
  isRunning: boolean = false;
  isBreak: boolean = false;
  
  // Constants for timer durations (in seconds)
  readonly WORK_DURATION = 25 * 60; // 25 minutes
  readonly BREAK_DURATION = 5 * 60; // 5 minutes

  constructor(private platform: Platform) {
    // Handle hardware back button
    this.platform.backButton.subscribeWithPriority(10, () => {
      App.exitApp();
    });
  }

  ngOnInit() {
    this.updateCurrentTime();
    // Update the current time every second
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  updateCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  startPomodoroSession() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isBreak = false;
    this.timeLeft = this.WORK_DURATION;
    this.updateTimerDisplay();
    this.startTimer();
  }

  startBreakSession() {
    this.isBreak = true;
    this.timeLeft = this.BREAK_DURATION;
    this.updateTimerDisplay();
    this.startTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      
      if (this.timeLeft <= 0) {
        this.stopTimer();
        
        if (this.isBreak) {
          this.notifyBreakEnded();
          this.resetTimer();
        } else {
          this.notifyWorkEnded();
          this.startBreakSession();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.isRunning = false;
    this.isBreak = false;
    this.timeLeft = 0;
    this.minutes = '00';
    this.seconds = '00';
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    
    this.minutes = mins < 10 ? `0${mins}` : `${mins}`;
    this.seconds = secs < 10 ? `0${secs}` : `${secs}`;
  }

  async notifyWorkEnded() {
    await this.vibrate();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: 'Pomodoro Timer',
          body: 'Work session completed! Time for a break.',
          sound: 'beep.wav',
          schedule: { at: new Date(Date.now()) }
        }
      ]
    });
  }

  async notifyBreakEnded() {
    await this.vibrate();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 2,
          title: 'Pomodoro Timer',
          body: 'Break time finished! Ready for another Pomodoro?',
          sound: 'beep.wav',
          schedule: { at: new Date(Date.now()) }
        }
      ]
    });
  }

  async vibrate() {
    await Haptics.vibrate();
  }
}
