import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CameraMonitor from './CameraMonitor';
import { ToastProvider } from './Toast';
import { FaceMesh } from '@mediapipe/face_mesh';

const mockModels = [];
jest.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: jest.fn(),
  FACEMESH_TESSELATION: [], FACEMESH_RIGHT_EYE: [], FACEMESH_LEFT_EYE: [], FACEMESH_FACE_OVAL: []
}));
jest.mock('@mediapipe/drawing_utils', () => ({ drawConnectors: jest.fn() }));

let track, stream, capture;
beforeEach(() => {
  jest.useFakeTimers();
  mockModels.length = 0;
  FaceMesh.mockImplementation(() => {
    const model = {
      setOptions: jest.fn(), onResults: jest.fn(),
      initialize: jest.fn().mockResolvedValue(), send: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue()
    };
    mockModels.push(model);
    return model;
  });
  track = { stop: jest.fn(), readyState: 'live' };
  stream = { getTracks: () => [track] };
  capture = jest.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: capture } });
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: jest.fn() });
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

const camera = () => render(<StrictMode><ToastProvider><CameraMonitor /></ToastProvider></StrictMode>);

test('camera survives success and toast-expiry renders, then stops explicitly', async () => {
  const view = camera();
  expect(screen.queryByText('Good (100%)')).not.toBeInTheDocument();
  expect(screen.getByText('Waiting for a face')).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start Camera' })));
  expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
  expect(capture).toHaveBeenCalledTimes(1);
  expect(track.stop).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(5000));
  expect(track.stop).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop Camera' }));
  expect(track.stop).toHaveBeenCalledTimes(1);
  expect(mockModels[0].close).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(track.stop).toHaveBeenCalledTimes(1);
});

test('navigation releases an active stream and model', async () => {
  const view = camera();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start Camera' })));
  view.unmount();
  expect(track.stop).toHaveBeenCalledTimes(1);
  expect(mockModels[0].close).toHaveBeenCalledTimes(1);
});

test('late camera permission result is released after navigation', async () => {
  let resolve;
  capture.mockReturnValue(new Promise(done => { resolve = done; }));
  const view = camera();
  fireEvent.click(screen.getByRole('button', { name: 'Start Camera' }));
  view.unmount();
  await act(async () => resolve(stream));
  expect(track.stop).toHaveBeenCalledTimes(1);
  expect(mockModels).toHaveLength(0);
});

test('distance requires calibration and blink frames count a completed blink', async () => {
  camera();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start Camera' })));
  const results = mockModels[0].onResults.mock.calls[0][0];
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  points[234] = { x: 0.2, y: 0.5 }; points[454] = { x: 0.8, y: 0.5 };
  points[33] = { x: 0.35, y: 0.4 }; points[133] = { x: 0.45, y: 0.4 };
  points[263] = { x: 0.65, y: 0.4 }; points[362] = { x: 0.55, y: 0.4 };
  points[159] = points[145] = { x: 0.4, y: 0.4 };
  points[386] = points[374] = { x: 0.6, y: 0.4 };
  act(() => { results({ multiFaceLandmarks: [points] }); results({ multiFaceLandmarks: [points] }); });
  expect(screen.getByRole('button', { name: 'Calibrate distance' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Measured distance from your camera (cm)'), { target: { value: '45' } });
  fireEvent.click(screen.getByRole('button', { name: 'Calibrate distance' }));
  points[159] = { x: 0.4, y: 0.37 }; points[145] = { x: 0.4, y: 0.43 };
  points[386] = { x: 0.6, y: 0.37 }; points[374] = { x: 0.6, y: 0.43 };
  act(() => results({ multiFaceLandmarks: [points] }));
  expect(screen.getByText('45.0 cm (estimate)')).toBeInTheDocument();
  const blinkCard = screen.getByText('Blink Count').parentElement;
  expect(blinkCard.querySelector('strong')).toHaveTextContent('1');
  points[234] = { x: 0, y: 0.5 }; points[454] = { x: 1, y: 0.5 };
  act(() => results({ multiFaceLandmarks: [points] }));
  expect(screen.getByText('Move back from the screen (ideal: 40-60 cm)')).toBeInTheDocument();
});
