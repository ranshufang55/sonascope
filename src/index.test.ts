import { describe, it, expect } from 'vitest';
import { describe as describeLib, NAME, VERSION } from './index.js';

describe('smoke', () => {
  it('reports the library name and version', () => {
    expect(NAME).toBe('sonascope');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(describeLib()).toBe(`sonascope v${VERSION}`);
  });
});
