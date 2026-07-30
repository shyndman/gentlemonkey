import { sendCmdDirectly } from '@/common';
import {
  aiPresentations,
  loadAiPresentations,
} from '@/common/ai/presentations';

jest.mock('@/common', () => ({ sendCmdDirectly: jest.fn() }));

afterEach(() => {
  sendCmdDirectly.mockReset();
  for (const id in aiPresentations) delete aiPresentations[id];
});

test('initializes presentations from the background snapshot', async () => {
  const presentation = { runId: 'run-1', scriptId: 7, state: 'constructing' };
  sendCmdDirectly.mockResolvedValue([presentation]);

  await loadAiPresentations();

  expect(aiPresentations[7]).toEqual(presentation);
});

test('degrades to an empty snapshot when the background cannot respond', async () => {
  aiPresentations[7] = { runId: 'stale', scriptId: 7, state: 'ready' };
  sendCmdDirectly.mockResolvedValue(undefined);

  await expect(loadAiPresentations()).resolves.toBeUndefined();

  expect(aiPresentations).toEqual({});
});

test('rejects malformed background data', async () => {
  sendCmdDirectly.mockResolvedValue({ scriptId: 7 });

  await expect(loadAiPresentations()).rejects.toThrow('Invalid AI presentation snapshot');
});
