import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import { addBoost } from '@/sim/boost';
import { createKart } from '@/sim/kart';

describe('boost meter', () => {
  it('never exceeds capacity after repeated addBoost and never goes negative', () => {
    const kart = createKart();
    for (let i = 0; i < 100; i++) addBoost(kart, TUNING.pickupBoost);
    expect(kart.boost).toBe(TUNING.boostCapacity);
    addBoost(kart, -1000);
    expect(kart.boost).toBe(0);
  });
});
