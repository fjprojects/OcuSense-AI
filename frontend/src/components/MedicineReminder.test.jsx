import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from './Toast';
import { MedicineProvider } from './MedicineProvider';
import MedicineReminder from './MedicineReminder';
import { api } from '../services/api';
import { enableReminderSound, showReminderNotification } from '../services/notifications';

jest.mock('../services/api', () => ({ api: {
  getMedicines: jest.fn(), saveMedicine: jest.fn(), updateMedicine: jest.fn(),
  deleteMedicine: jest.fn(), markMedicineTaken: jest.fn(), claimMedicineAlert: jest.fn()
}}));
jest.mock('../services/notifications', () => ({
  enableReminderSound: jest.fn().mockResolvedValue(),
  playReminderSound: jest.fn(), showReminderNotification: jest.fn()
}));

const fixture = extra => ({
  id: 1, medicine_name: 'Fixture drops', dosage: 'Test instructions',
  active: true, paused: false, status: 'Pending', repeat: true,
  next_reminder_time: new Date(Date.now() + 60000).toISOString(),
  last_alerted_at: null, ...extra
});
const page = () => render(<ToastProvider><MedicineProvider><MedicineReminder /></MedicineProvider></ToastProvider>);
beforeEach(() => {
  jest.clearAllMocks();
  enableReminderSound.mockResolvedValue();
  api.getMedicines.mockResolvedValue({ medicines: [] });
});
afterEach(() => jest.useRealTimers());

test('adding saves to API and a new mount reloads the saved reminder', async () => {
  let saved = [];
  api.getMedicines.mockImplementation(async () => ({ medicines: saved }));
  api.saveMedicine.mockImplementation(async data => {
    const medicine = fixture({ ...data });
    saved = [medicine];
    return medicine;
  });
  const first = page();
  await screen.findByText('No medicines added yet.');
  fireEvent.change(screen.getByLabelText('Medicine name'), { target: { value: 'Fixture drops' } });
  fireEvent.change(screen.getByLabelText('Alarm time (your local time)'), { target: { value: '09:30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save reminder' }));
  await screen.findByText('Fixture drops');
  expect(api.saveMedicine).toHaveBeenCalledWith(expect.objectContaining({
    medicine_name: 'Fixture drops', alarm_time: '09:30', repeat: true
  }));
  first.unmount();
  page();
  await screen.findByText('Fixture drops');
  expect(api.getMedicines).toHaveBeenCalledTimes(2);
});

test('pause, resume and delete use persistent server operations', async () => {
  api.getMedicines.mockResolvedValue({ medicines: [fixture()] });
  api.updateMedicine.mockImplementation(async (id, paused) => fixture({ paused }));
  api.deleteMedicine.mockResolvedValue({ deleted: true });
  page();
  await screen.findByText('Fixture drops');
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  await screen.findByRole('button', { name: 'Resume' });
  expect(api.updateMedicine).toHaveBeenLastCalledWith(1, true);
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
  await screen.findByRole('button', { name: 'Pause' });
  expect(api.updateMedicine).toHaveBeenLastCalledWith(1, false);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete Fixture drops' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Delete Fixture drops' }));
  await screen.findByText('No medicines added yet.');
  expect(api.deleteMedicine).toHaveBeenCalledWith(1);
});

test('alerts continue after leaving the medicine page and occur once', async () => {
  jest.useFakeTimers();
  const medicine = fixture({ next_reminder_time: new Date(Date.now() + 2000).toISOString() });
  api.getMedicines.mockResolvedValue({ medicines: [medicine] });
  api.claimMedicineAlert.mockResolvedValue({
    notify: true, medicine: { ...medicine, last_alerted_at: medicine.next_reminder_time }
  });
  const Pages = () => {
    const [show, setShow] = useState(true);
    return <><button onClick={() => setShow(false)}>Other page</button>{show ? <MedicineReminder /> : <p>Other module</p>}</>;
  };
  render(<ToastProvider><MedicineProvider><Pages /></MedicineProvider></ToastProvider>);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Other page' }));
  await act(async () => jest.advanceTimersByTime(3000));
  expect(showReminderNotification).toHaveBeenCalledTimes(1);
  expect(api.claimMedicineAlert).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(10000));
  expect(api.claimMedicineAlert).toHaveBeenCalledTimes(1);
});

test('paused reminders do not trigger notifications', async () => {
  jest.useFakeTimers();
  api.getMedicines.mockResolvedValue({ medicines: [fixture({
    paused: true, next_reminder_time: new Date(Date.now() - 1000).toISOString()
  })] });
  page();
  await act(async () => {});
  await act(async () => jest.advanceTimersByTime(3000));
  expect(api.claimMedicineAlert).not.toHaveBeenCalled();
  expect(showReminderNotification).not.toHaveBeenCalled();
});

test('server errors remain visible with a retry action', async () => {
  api.getMedicines.mockRejectedValue(new Error('Connection unavailable'));
  page();
  await screen.findByText('Connection unavailable');
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
