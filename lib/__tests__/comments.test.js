import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  head: vi.fn(),
}));

import { list, put, head } from '@vercel/blob';
import { listComments, createComment } from '../comments.js';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listComments', () => {
  it('följer cursor över flera sidor och sorterar på createdAt', async () => {
    list
      .mockResolvedValueOnce({ blobs: [{ url: 'u1' }], hasMore: true, cursor: 'c1' })
      .mockResolvedValueOnce({ blobs: [{ url: 'u2' }], hasMore: false });
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      ok: true,
      json: async () => ({ id: url, createdAt: url === 'u1' ? '2026-08-02' : '2026-08-01' }),
    })));

    const out = await listComments();

    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[1][0].cursor).toBe('c1');
    expect(out.map((c) => c.id)).toEqual(['u2', 'u1']);
  });

  it('hoppar över blobbar som inte går att läsa', async () => {
    list.mockResolvedValueOnce({ blobs: [{ url: 'ok' }, { url: 'trasig' }], hasMore: false });
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      ok: url === 'ok',
      json: async () => ({ id: url, createdAt: '2026-08-01' }),
    })));

    const out = await listComments();
    expect(out.map((c) => c.id)).toEqual(['ok']);
  });
});

describe('createComment', () => {
  it('slumpar om id:t när det redan är upptaget', async () => {
    head
      .mockResolvedValueOnce({ url: 'finns-redan' })
      .mockRejectedValue(new Error('not found'));
    put.mockResolvedValue({});

    const c = await createComment({ anchor: 'p-hej-0', initials: 'JW', text: 'hej', page: 'lokal' });

    expect(head).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][2].allowOverwrite).toBe(false);
    expect(c.text).toBe('hej');
    expect(c.id).toMatch(/^c_[a-f0-9]{8}$/);
  });

  it('ger upp med fel efter för många kollisioner', async () => {
    head.mockResolvedValue({ url: 'alltid-upptaget' });

    await expect(createComment({ anchor: 'a', initials: 'JW', text: 'x' }))
      .rejects.toThrow('unikt');
    expect(put).not.toHaveBeenCalled();
  });

  it('släpper igenom andra skrivfel', async () => {
    head.mockRejectedValue(new Error('not found'));
    put.mockRejectedValue(new Error('nätverksfel'));

    await expect(createComment({ anchor: 'a', initials: 'JW', text: 'x' }))
      .rejects.toThrow('nätverksfel');
  });
});
