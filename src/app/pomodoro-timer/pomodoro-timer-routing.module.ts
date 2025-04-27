import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PomodoroTimerPage } from './pomodoro-timer.page';

const routes: Routes = [
  {
    path: '',
    component: PomodoroTimerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PomodoroTimerPageRoutingModule {}
