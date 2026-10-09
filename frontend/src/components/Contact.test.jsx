import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Contact from './Contact';
import { ToastProvider } from './Toast';
import { api } from '../services/api';
jest.mock('../services/api', () => ({ api: { sendContact: jest.fn() } }));
const page = () => render(<ToastProvider><Contact /></ToastProvider>);
const fill = () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Feedback fixture  ' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' fixture@example.com ' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: '  Mobile feedback fixture  ' } });
};

test('feedback validates whitespace and focuses the first field without sending', () => {
  page();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(api.sendContact).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Name')).toHaveFocus();
  expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
  expect(screen.getByText('Write your feedback or question.')).toBeInTheDocument();
});

test('valid feedback is trimmed and cleared only after server confirmation', async () => {
  let resolve;
  api.sendContact.mockReturnValue(new Promise(done => { resolve = done; }));
  page();
  fill();
  fireEvent.click(screen.getByRole('button', { name: /Sending|Send feedback/ }));
  expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  expect(screen.getByLabelText('Message')).toHaveValue('  Mobile feedback fixture  ');
  expect(api.sendContact).toHaveBeenCalledWith({
    name: 'Feedback fixture', email: 'fixture@example.com', message: 'Mobile feedback fixture'
  });
  await act(async () => resolve({ status: 'success' }));
  expect(screen.getByText('Thank you. Your feedback has been received.')).toBeInTheDocument();
  expect(screen.getByLabelText('Message')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled();
});

test('failed feedback preserves the draft and succeeds on retry', async () => {
  api.sendContact.mockRejectedValueOnce(new Error('Connection unavailable'))
    .mockResolvedValueOnce({ status: 'success' });
  page();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable');
  expect(screen.getByLabelText('Message')).toHaveValue('  Mobile feedback fixture  ');
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  await screen.findByText('Thank you. Your feedback has been received.');
  expect(api.sendContact).toHaveBeenCalledTimes(2);
});

test('feedback field limits match the backend and invalid email is rejected', () => {
  page();
  expect(screen.getByLabelText('Name')).toHaveAttribute('maxlength', '100');
  expect(screen.getByLabelText('Email')).toHaveAttribute('maxlength', '254');
  expect(screen.getByLabelText('Message')).toHaveAttribute('maxlength', '5000');
  fill();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid@' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toHaveFocus();
  expect(api.sendContact).not.toHaveBeenCalled();
});
