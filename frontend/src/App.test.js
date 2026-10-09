import { act, render, screen } from '@testing-library/react';
import App from './App';
import { api } from './services/api';
jest.mock('./services/api', () => ({ api: { getMedicines: jest.fn() } }));

test('renders OcuSense navigation and real home page', async () => {
  api.getMedicines.mockResolvedValue({ medicines: [] });
  await act(async () => render(<App />));
  expect(screen.getByRole('heading', { level: 1, name: 'A healthier rhythm. One small habit at a time.' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Start a focus session' })).toHaveAttribute('href', '/screen-health');
});
