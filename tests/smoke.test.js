import { describe, it, expect } from 'vitest';
import { VERSION } from '@shared/index';

describe('Smoke Test', () => {
  it('should have a version', () => {
    expect(VERSION).toBeDefined();
  });

  it('should work with aliases', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
