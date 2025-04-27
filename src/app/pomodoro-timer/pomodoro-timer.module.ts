import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PomodoroTimerPage } from './pomodoro-timer.page';

const routes: Routes = [
  {
    path: '',
    component: PomodoroTimerPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PomodoroTimerPageModule {}