const response = (body, status = 200, type = 'application/json') => ({
  ok: status < 400, status, headers: { get: () => type }, json: async () => body
});
let api;
beforeEach(() => {
  jest.resetModules();
  global.fetch = jest.fn();
  api = require('./api').api;
});

test('reminder writes bootstrap CSRF and use matching relative endpoints', async () => {
  fetch.mockResolvedValueOnce(response({ csrfToken: 'fixture-token' }))
    .mockResolvedValueOnce(response({ id: 1 }, 201))
    .mockResolvedValueOnce(response({ deleted: true }));
  await api.saveMedicine({ medicine_name: 'Fixture' });
  await api.deleteMedicine(1);
  expect(fetch.mock.calls[0][0]).toBe('/api/csrf/');
  expect(fetch.mock.calls[1]).toEqual(['/api/medicines/add/', expect.objectContaining({
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: expect.objectContaining({ 'X-CSRFToken': 'fixture-token' })
  })]);
  expect(fetch.mock.calls[2][0]).toBe('/api/medicines/delete/');
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ medicine_id: 1 });
});

test('expired CSRF is refreshed once before retrying', async () => {
  fetch.mockResolvedValueOnce(response({ csrfToken: 'old' }))
    .mockResolvedValueOnce(response({}, 403, 'text/html'))
    .mockResolvedValueOnce(response({ csrfToken: 'new' }))
    .mockResolvedValueOnce(response({ id: 1 }, 201));
  await api.saveMedicine({ medicine_name: 'Fixture' });
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(fetch.mock.calls[3][1].headers['X-CSRFToken']).toBe('new');
});

test('server validation errors are surfaced to the caller', async () => {
  fetch.mockResolvedValueOnce(response({ csrfToken: 'fixture-token' }))
    .mockResolvedValueOnce(response({ error: 'Choose a valid alarm time' }, 400));
  await expect(api.saveMedicine({})).rejects.toThrow('Choose a valid alarm time');
});

test('HTML responses produce a useful error instead of a JSON parse failure', async () => {
  fetch.mockResolvedValueOnce(response({}, 500, 'text/html'));
  await expect(api.getMedicines()).rejects.toThrow('500');
});
