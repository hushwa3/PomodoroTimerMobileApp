import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PomodoroTimerPage } from './pomodoro-timer.page';

describe('PomodoroTimerPage', () => {
  let component: PomodoroTimerPage;
  let fixture: ComponentFixture<PomodoroTimerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PomodoroTimerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
