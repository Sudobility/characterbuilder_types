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

  it('renders the new eye sub-dials', () => {
    const p = composePrompt({
      lidCrease: 'triple',
      orbitalDepth: 'deep',
      lashLength: 'long',
      lashDensity: 'dense',
    });
    expect(p).toContain('triple upper-lid crease');
    expect(p).toContain('deep-set eyes recessed under the brow');
    expect(p).toContain('long lashes');
    expect(p).toContain('thick, dense lashes');
  });

  it('omits unremarkable neutral values', () => {
    const p = composePrompt({ skullHeight: 'medium', jowls: 'none' });
    // "medium"/"none" neutrals map to empty phrases and must not appear.
    expect(p).not.toContain('vaulted');
    expect(p).not.toContain('jowls');
  });

  it('renders facial hair as its own sentence and never shows clean-shaven', () => {
    expect(composePrompt({ facialHair: 'full-beard' })).toContain(
      'Facial hair: a full beard.'
    );
    expect(composePrompt({ facialHair: 'clean-shaven' })).not.toContain(
      'clean-shaven'
    );
  });

  it('folds facial-hair density/color into the sentence', () => {
    const p = composePrompt({
      facialHair: 'full-beard',
      facialHairDensity: 'full',
      facialHairColor: 'dark-brown',
    });
    expect(p).toContain(
      'Facial hair: a full beard, dense facial-hair growth, dark brown in color.'
    );
  });

  it('suppresses facial-hair density/color when clean-shaven', () => {
    const p = composePrompt({
      facialHair: 'clean-shaven',
      facialHairDensity: 'patchy',
      facialHairColor: 'grey',
    });
    expect(p).not.toContain('facial-hair growth');
    expect(p).not.toContain('in color');
  });

  it('lists wrinkle locations', () => {
    const p = composePrompt({
      wrinkleLevel: 'deep',
      wrinkleAreas: ['forehead', 'crows-feet'],
    });
    expect(p).toContain('deep wrinkles');
    expect(p).toContain('lines around the forehead, crows feet');
  });
});
