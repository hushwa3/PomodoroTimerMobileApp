import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
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
  
  // Sound variables
  workCompleteSound: HTMLAudioElement | null = null;
  breakCompleteSound: HTMLAudioElement | null = null;
  
  // Clock variables
  currentTime = new Date();
  clockInterval: any;

  constructor(private platform: Platform) {
    this.setupBackButtonHandler();
    this.initSounds();
  }

  // Initialize sound objects
  initSounds() {
    try {
      // Create audio elements for both notification types
      this.workCompleteSound = new Audio();
      this.breakCompleteSound = new Audio();
      
      // Use device notification sound (base64 encoded default beep sound)
      const defaultSound = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFdgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAaWQgAAQAAABXZDc4AlAAAAAAAAAAAAAAAAAAAA//vQZAAAAlAXs1NKGAAPAAABKAAAAT0Bk01MYEA8gAAEoAAAAQXer2trImJiYmJiYmJiYmJiYmLu7u7u7u7u7u7u7u7u7u7u7u///////////////////93d3d3d3d3d3d3d3d3d3d3d3f//////////////////99PT09PT09PT09PT09PT09PT0////////////8mJiYmJiYmJiYmJiYmJiYmJ///////////////+7u7u7u7u7u7u7u7u7u7u7u////////////93d3d3d3d3d3d3d3d3d3d3d3d3////////////9PT09PT09PT09PT09PT09PT0///////////yYmJiYmJiYmJiYmJiYmJiYmJiAABrRAAAAT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UGTZgAKmLWU/aSAARkABheAAAAArwubT85kABLIAGH4AAAL5RTAwMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
      
      this.workCompleteSound.src = defaultSound;
      this.breakCompleteSound.src = defaultSound;
      
      // Preload the sounds
      this.workCompleteSound.load();
      this.breakCompleteSound.load();
      
      console.log('Sound objects initialized');
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }
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
        // Play sound when notification is received
        this.playSound();
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
    const title = this.isBreak ? 'Break Complete' : 'Work Session Complete';
    const body = this.isBreak ? 'Ready for another Pomodoro?' : 'Time for a break!';
    await this.showNotification(title, body);
  }

  // Stop now resets the timer to initial state
  stopPomodoro() {
    // Call resetPomodoro to go back to initial state
    this.resetPomodoro();
  }

  resetPomodoro() {
    // Clear any running timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Reset to initial state
    this.isBreak = false;
    this.timerRunning = false;
    
    // Use test durations if in test mode
    if (this.testMode) {
      this.timeRemaining = this.TEST_WORK_DURATION;
    } else {
      this.timeRemaining = this.WORK_DURATION;
    }
    
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

  // Play the appropriate sound based on current timer state
  playSound() {
    try {
      // Determine which sound to play
      const sound = this.isBreak ? this.breakCompleteSound : this.workCompleteSound;
      
      if (sound) {
        // Reset the sound to the beginning
        sound.currentTime = 0;
        
        // Try to play with user interaction context
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Sound played successfully');
            })
            .catch(error => {
              console.error('Error playing sound:', error);
              
              // Fallback approach - create and play a new Audio element
              this.playFallbackSound();
            });
        }
      } else {
        // If sound objects not initialized, use fallback
        this.playFallbackSound();
      }
    } catch (error) {
      console.error('Error in playSound:', error);
      this.playFallbackSound();
    }
  }
  
  // Fallback sound method
  playFallbackSound() {
    try {
      // Create a new audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        
        // Create oscillator for a beep sound
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(830, audioCtx.currentTime); // Beep frequency
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
        
        console.log('Fallback sound played via Web Audio API');
      } else {
        // Last resort - try to play a short click sound
        const tempAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFdgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAaWQgAAQAAABXZDc4AlAAAAAAAAAAAAAAAAAAAA//vQZAAAAlAXs1NKGAAPAAABKAAAAT0Bk01MYEA8gAAEoAAAAQXer2trImJiYmJiYmJiYmJiYmLu7u7u7u7u7u7u7u7u7u7u7u///////////////////93d3d3d3d3d3d3d3d3d3d3d3f//////////////////99PT09PT09PT09PT09PT09PT0////////////8mJiYmJiYmJiYmJiYmJiYmJ///////////////+7u7u7u7u7u7u7u7u7u7u7u////////////93d3d3d3d3d3d3d3d3d3d3d3d3////////////9PT09PT09PT09PT09PT09PT0///////////yYmJiYmJiYmJiYmJiYmJiYmJiAABrRAAAAT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UGTZgAKmLWU/aSAARkABheAAAAArwubT85kABLIAGH4AAAL5RTAwMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
        tempAudio.play().catch(e => console.error('Final fallback sound failed:', e));
      }
    } catch (fallbackError) {
      console.error('Fallback sound failed:', fallbackError);
    }
  }

  async showNotification(title: string, body: string) {
    try {
      // Create notification ID - use timestamp for uniqueness
      const notificationId = Math.floor(Math.random() * 10000) + 1;
      
      // --- 1. SOUND FEEDBACK ---
      // Play sound directly - not waiting for notification
      this.playSound();
      
      // --- 2. HAPTIC FEEDBACK ---
      if (this.platform.is('capacitor')) {
        try {
          // Create a strong physical vibration pattern
          await Haptics.impact({ style: ImpactStyle.Heavy });
          
          // Follow with a notification vibration pattern
          await Haptics.notification({ type: NotificationType.Success });
          
          // Add a final distinct vibration
          await Haptics.vibrate();
        } catch (hapticError) {
          console.error('Error with haptic feedback:', hapticError);
        }
      }
      
      // --- 3. NOTIFICATION API ---
      // Schedule notification (may also trigger sound depending on system)
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: notificationId,
            sound: "default",
            schedule: { at: new Date() },
            // Add some custom data if needed
            extra: { 
              type: this.isBreak ? 'break-end' : 'work-end',
              sessionCount: this.completedSessions 
            }
          }
        ]
      });
      
      // --- 4. VISUAL FEEDBACK with native alert ---
      alert(`${title}\n${body}`);
      
      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Fallback alert if the notification fails
      alert(`${title}\n${body}`);
      
      // Still try to play sound even if notification fails
      this.playSound();
    }
  }
}