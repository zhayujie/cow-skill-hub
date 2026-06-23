/**
 * Node backend: object storage backed by the local filesystem.
 *
 * Object keys (e.g. "skills/web-search.zip") map to files under a configurable
 * root directory. Keys are sanitized to stay within the root.
 */
import type { BlobObject, BlobStore, PutOptions } from './types';

const STORAGE_ROOT = process.env.SKILL_STORAGE_DIR || './data/skills';

function sanitizeKey(key: string): string {
  // Disallow traversal and absolute paths; keep it relative to the root.
  const cleaned = key
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
  if (!cleaned) throw new Error('Invalid blob key');
  return cleaned;
}

export class FsBlobStore implements BlobStore {
  constructor(private root: string = STORAGE_ROOT) {}

  private async paths() {
    const path = await import('node:path');
    return { path };
  }

  private async resolve(key: string): Promise<string> {
    const { path } = await this.paths();
    const safe = sanitizeKey(key);
    return path.join(path.resolve(this.root), safe);
  }

  async get(key: string): Promise<BlobObject | null> {
    const fs = await import('node:fs/promises');
    const filePath = await this.resolve(key);
    try {
      const buf = await fs.readFile(filePath);
      const bytes = new Uint8Array(buf);
      return {
        get body(): ReadableStream {
          return new ReadableStream({
            start(controller) {
              controller.enqueue(bytes);
              controller.close();
            },
          });
        },
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
      throw err;
    }
  }

  async put(key: string, value: Uint8Array | ArrayBuffer, _options?: PutOptions): Promise<void> {
    const fs = await import('node:fs/promises');
    const { path } = await this.paths();
    const filePath = await this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    await fs.writeFile(filePath, bytes);
  }

  async delete(key: string): Promise<void> {
    const fs = await import('node:fs/promises');
    const filePath = await this.resolve(key);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
    }
  }
}
