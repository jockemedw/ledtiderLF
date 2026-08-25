import { describe, it, expect } from 'vitest';
import { signAdminToken, verifyAdminToken } from '../auth.js';

describe('signAdminToken', () => {
  it('returnerar sträng på formen <expiryMs>.<hexHmac>', () => {
    const token = signAdminToken(Date.now() + 1000);
    expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/);
  });
});

describe('verifyAdminToken', () => {
  it('accepterar token som inte gått ut', () => {
    const token = signAdminToken(Date.now() + 60_000);
    expect(verifyAdminToken(token)).toBe(true);
  });

  it('avvisar token som gått ut', () => {
    const token = signAdminToken(Date.now() - 1);
    expect(verifyAdminToken(token)).toBe(false);
  });

  it('avvisar manipulerad signatur', () => {
    const token = signAdminToken(Date.now() + 60_000);
    const [exp, sig] = token.split('.');
    const flipped = sig.slice(0, -1) + (sig.at(-1) === '0' ? '1' : '0');
    expect(verifyAdminToken(`${exp}.${flipped}`)).toBe(false);
  });

  it('avvisar felaktigt format', () => {
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken('ingen-punkt')).toBe(false);
    expect(verifyAdminToken('abc.def')).toBe(false);
  });

});
