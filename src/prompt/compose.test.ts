import { describe, it, expect } from 'vitest';
import { composePrompt, composeLipClause } from './index.js';
import { EMPTY_FACE_SPEC, normalizeLegacyHairStyle } from '../face/index.js';
import { sampleFaceSpec } from '../test/index.js';
import { generationParamsSchema } from '../generation/index.js';

describe('composePrompt', () => {
  it('describes the measured eye aperture explicitly', () => {
    const p = composePrompt({ eyeOpeningRatioPercent: 27, lidType: 'double' });
    expect(p).toContain('27% of its width');
    expect(p).toContain('horizontally elongated eye aperture');
    expect(p).toContain('double eyelids');
  });
  it('puts explicit measurements in the image prompt', () => {
    const prompt = composePrompt({
      mouthWidthMm: 62,
      upperVermilionHeightMm: 7.5,
      lowerVermilionHeightMm: 12.5,
      philtrumLengthMm: 20,
    });
    expect(prompt).toContain('62 mm mouth width');
    expect(prompt).toContain('7.5 mm upper vermilion height');
    expect(prompt).toContain('12.5 mm lower vermilion height');
    expect(prompt).toContain('20 mm philtrum length');
  });
  it('states every cast lip axis explicitly for image rendering', () => {
    const clause = composeLipClause({
      mouthWidth: 'wide',
      lipFullness: 'thin',
      vermilionHeight: 'thin',
      lipRatio: 'fuller-lower',
      cupidsBow: 'flat',
      philtrumLength: 'long',
      philtrumDepth: 'shallow',
      lipProjection: 'flat',
      mouthCorners: 'downturned',
    });
    for (const detail of [
      'wide mouth',
      'thin lips',
      'thin vermilion margin',
      'fuller lower lip',
      'flat cupid',
      'long philtrum',
      'shallow philtrum',
      'flat lip profile',
      'downturned mouth corners',
    ])
      expect(clause).toContain(detail);
  });
  it('produces a sensible prompt for the empty spec', () => {
    const p = composePrompt(EMPTY_FACE_SPEC);
    expect(p).toContain('Naturalistic style');
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

  it('uses the selected art style without a conflicting realism instruction', () => {
    const p = composePrompt(sampleFaceSpec(), { artStyle: 'watercolor' });
    expect(p).toContain(
      'Watercolor style: transparent soft washes and bleeding edges'
    );
    expect(p).not.toContain('photorealistic');
    expect(p).not.toContain('Documentary realism');
  });

  it('renders discrete hair length and style', () => {
    const p = composePrompt({
      hairLength: 'very-long',
      hairStyle: 'braids',
      hairTexture: 'coily',
    });
    expect(p).toContain('very long hair');
    expect(p).toContain('hair in braids');
    expect(p).toContain('tightly coiled hair');
  });

  it('preserves old free-text hair details when loading a saved character', () => {
    const spec = normalizeLegacyHairStyle({
      hairStyle: 'neat low bun with waist-length hair' as never,
    });
    expect(spec.hairStyle).toBe('bun');
    expect(spec.hairLength).toBe('very-long');
    expect(spec.extraNotes).toContain('neat low bun with waist-length hair');
  });

  it('defaults to Naturalistic and rejects unknown art styles', () => {
    expect(generationParamsSchema.parse({}).artStyle).toBe('naturalistic');
    expect(
      generationParamsSchema.safeParse({ artStyle: 'unknown-style' }).success
    ).toBe(false);
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
