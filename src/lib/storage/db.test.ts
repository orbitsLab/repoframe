import { describe, expect, it } from 'vitest';

import { deleteStore, readStore, writeStore } from '@/lib/storage/db';

describe('IndexedDB storage', () => {
  it('degrades to no-op operations when IndexedDB is unavailable', async () => {
    await expect(readStore('repos', 'owner/repo')).resolves.toBeUndefined();
    await expect(
      writeStore('repos', 'owner/repo', { value: true }),
    ).resolves.toBeUndefined();
    await expect(deleteStore('repos', 'owner/repo')).resolves.toBeUndefined();
  });
});
