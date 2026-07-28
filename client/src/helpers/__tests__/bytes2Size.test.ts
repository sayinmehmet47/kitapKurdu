import { describe, expect, it } from 'vitest';
import bytes2Size from '../bytes2Size';

describe('bytes2Size', () => {
  it('returns "0.0 Bytes" for zero bytes', () => {
    expect(bytes2Size(0)).toBe('0.0 Bytes');
  });

  it('returns bytes for values below 1024', () => {
    expect(bytes2Size(1)).toBe('1.0 Bytes');
    expect(bytes2Size(500)).toBe('500.0 Bytes');
    expect(bytes2Size(1023)).toBe('1023.0 Bytes');
  });

  it('returns KB for values at and above 1024', () => {
    expect(bytes2Size(1024)).toBe('1.0 KB');
    expect(bytes2Size(1536)).toBe('1.5 KB');
    expect(bytes2Size(2048)).toBe('2.0 KB');
  });

  it('returns MB for values at and above 1048576', () => {
    expect(bytes2Size(1048576)).toBe('1.0 MB');
    expect(bytes2Size(2 * 1048576)).toBe('2.0 MB');
  });

  it('returns GB for values at and above 1073741824', () => {
    expect(bytes2Size(1073741824)).toBe('1.0 GB');
  });
});
