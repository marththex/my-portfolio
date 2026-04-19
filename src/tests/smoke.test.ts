import { describe, it, expect } from 'vitest';
import { testimonials, type Testimonial } from '../data/testimonials';

describe('testimonials data', () => {
  it('has at least one testimonial', () => {
    expect(testimonials.length).toBeGreaterThan(0);
  });

  it('every entry has required fields', () => {
    for (const t of testimonials) {
      expect(t.quote, `${t.name}: quote missing`).toBeTruthy();
      expect(t.name, `entry missing name`).toBeTruthy();
      expect(t.role, `${t.name}: role missing`).toBeTruthy();
      expect(t.company, `${t.name}: company missing`).toBeTruthy();
      expect(t.initials, `${t.name}: initials missing`).toBeTruthy();
    }
  });

  it('initials match the person name', () => {
    for (const t of testimonials) {
      const parts = t.name.trim().split(/\s+/);
      const first = parts[0][0].toUpperCase();
      const last  = parts[parts.length - 1][0].toUpperCase();
      const expected = `${first}${last}`;
      expect(t.initials, `${t.name}: initials should be ${expected}`).toBe(expected);
    }
  });

  it('satisfies the Testimonial interface shape', () => {
    const required: (keyof Testimonial)[] = ['quote', 'name', 'role', 'company', 'initials'];
    for (const t of testimonials) {
      for (const key of required) {
        expect(key in t, `${t.name} missing key "${key}"`).toBe(true);
      }
    }
  });
});
