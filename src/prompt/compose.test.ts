import { describe, it, expect } from 'vitest';
import { composePrompt } from './index.js';
import { EMPTY_FACE_SPEC } from '../face/index.js';
import { sampleFaceSpec } from '../test/index.js';

describe('composePrompt', () => {
  it('produces a sensible prompt for the empty spec', () => {
    const p = composePrompt(EMPTY_FACE_SPEC);
    expect(p).toContain('photorealistic');
    expect(p).toContain('head-and-shoulders headshot');
    expect(p).toContain('No text');
  });

  it('includes set features and omits unset ones', () => {
    const p = composePrompt(sampleFaceSpec());
    expect(p).toContain('oval face');
    expect(p).toContain('wide-set eyes');
    expect(p).toContain('auburn hair');
    expect(p).toContain('small mole on the right cheek');
    // A feature not set in the sample must not appear.
    expect(p).not.toContain('bulbous nose tip');
  });

  it('honors shot and expression params', () => {
    const p = composePrompt(sampleFaceSpec(), {
      shot: 'full-length',
      expression: 'smile',
    });
    expect(p).toContain('full-length portrait');
    expect(p).toContain('a warm smile');
  });

  it('prefers ageYears over ageBand', () => {
    const p = composePrompt({ ageYears: 42, ageBand: 'twenties', sex: 'male' });
    expect(p).toContain('42-year-old');
    expect(p).not.toContain('twenties');
  });

  it('appends a style note when given', () => {
    const p = composePrompt({}, { styleNote: 'moody rim lighting' });
    expect(p).toContain('moody rim lighting');
  });
});
