import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider } from './Toast';
import FocusTimer from './FocusTimer';
import HydrationTracker from './HydrationTracker';
import { enableReminderSound, showReminderNotification } from '../services/notifications';

jest.mock('../services/notifications', () => ({
  enableReminderSound: jest.fn(), playReminderSound: jest.fn(), showReminderNotification: jest.fn()
}));
const tracker = component => render(<StrictMode><ToastProvider>{component}</ToastProvider></StrictMode>);
beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  enableReminderSound.mockResolvedValue();
});
afterEach(() => jest.useRealTimers());

test('focus restores saved state under StrictMode and can resume a paused session', () => {
  localStorage.setItem('focusTrackerState', JSON.stringify({
    seconds: 75, totalSeconds: 120, nextBreakSeconds: 1125, isRunning: true, isPaused: true
  }));
  const view = tracker(<FocusTimer />);
  expect(screen.getByText('00:01:15')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByText('00:01:15')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
  act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByText('00:01:17')).toBeInTheDocument();
  view.unmount();
  tracker(<FocusTimer />);
  expect(screen.getByText('00:01:17')).toBeInTheDocument();
});

test('focus break produces one alert when the countdown expires', () => {
  localStorage.setItem('focusTrackerState', JSON.stringify({
    seconds: 1199, totalSeconds: 1199, nextBreakSeconds: 1, isRunning: true, isPaused: false
  }));
  tracker(<FocusTimer />);
  act(() => jest.advanceTimersByTime(1000));
  expect(showReminderNotification).toHaveBeenCalledTimes(1);
  expect(screen.getByText('20:00')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));
  expect(showReminderNotification).toHaveBeenCalledTimes(1);
});

test('hydration preserves history on mount, resets at midnight, and keeps the earned streak', () => {
  jest.setSystemTime(new Date(2026, 8, 30, 23, 59, 30));
  const today = new Date().toDateString();
  localStorage.setItem('hydrationState', JSON.stringify({
    history: { [today]: 8 }, streak: 3, lastDrinkDate: new Date().toISOString()
  }));
  tracker(<HydrationTracker />);
  expect(screen.getByText('Goal reached! 3 day streak!')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('hydrationState')).history[today]).toBe(8);
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText('0 glasses - Keep going!')).toBeInTheDocument();
  expect(screen.getByText('3 days')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+ Add Glass' }));
  expect(screen.getByText('1 glasses - Keep going!')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('hydrationState')).history[today]).toBe(8);
});

test('resetting today cannot award the same daily streak twice', () => {
  tracker(<HydrationTracker />);
  for (let count = 0; count < 8; count++) fireEvent.click(screen.getByRole('button', { name: '+ Add Glass' }));
  expect(screen.getByText('Goal reached! 1 day streak!')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset Today' }));
  for (let count = 0; count < 8; count++) fireEvent.click(screen.getByRole('button', { name: '+ Add Glass' }));
  expect(screen.getByText('Goal reached! 1 day streak!')).toBeInTheDocument();
});
