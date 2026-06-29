import { describe, it, expect } from 'vitest';

describe('DinarFlow Basic Calculations', () => {
  it('should successfully calculate basic fees', () => {
    const calculateFee = (amount: number, tier: 'TIER_1' | 'TIER_2' | 'TIER_3') => {
      if (tier === 'TIER_1') return amount * 0.01;
      if (tier === 'TIER_2') return amount * 0.005;
      return amount * 0.002;
    };

    expect(calculateFee(1000, 'TIER_1')).toBe(10);
    expect(calculateFee(1000, 'TIER_2')).toBe(5);
    expect(calculateFee(1000, 'TIER_3')).toBe(2);
  });
});
