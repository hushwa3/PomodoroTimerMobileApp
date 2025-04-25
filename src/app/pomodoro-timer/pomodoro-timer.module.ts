import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PomodoroTimerPageRoutingModule } from './pomodoro-timer-routing.module';

import { PomodoroPage } from './pomodoro-timer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PomodoroTimerPageRoutingModule
  ],
  declarations: [PomodoroPage]
})
export class PomodoroTimerPageModule {}
