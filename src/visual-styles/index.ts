import { z } from 'zod';

/** Available visual looks for character images. IDs are stable API values. */
export interface VisualStyle {
  id: string;
  name: string;
  description: string;
  sampleImageUrl: string;
}
export interface VisualStyleGroup {
  id: string;
  name: string;
  styles: VisualStyle[];
}

const sample = (id: string) => `/art-styles/${id}.png`;
export const visualStyleGroups: VisualStyleGroup[] = [
  {
    id: 'photoreal-live-action-looks',
    name: 'Photoreal / Live-Action Looks',
    styles: [
      {
        id: 'modern-cinematic',
        name: 'Modern Cinematic',
        description:
          'clean digital cinema, shallow depth of field, filmic contrast',
        sampleImageUrl: sample('modern-cinematic'),
      },
      {
        id: 'naturalistic',
        name: 'Naturalistic',
        description: 'soft available overcast light, true-to-life color',
        sampleImageUrl: sample('naturalistic'),
      },
      {
        id: 'high-key',
        name: 'High-Key',
        description: 'bright airy exposure, soft shadows, low contrast',
        sampleImageUrl: sample('high-key'),
      },
      {
        id: 'low-key-chiaroscuro',
        name: 'Low-Key / Chiaroscuro',
        description: 'deep shadows and dramatic single-source illumination',
        sampleImageUrl: sample('low-key-chiaroscuro'),
      },
      {
        id: 'hyperreal',
        name: 'Hyperreal',
        description: 'ultra-detailed, heightened clarity and crisp textures',
        sampleImageUrl: sample('hyperreal'),
      },
    ],
  },
  {
    id: 'film-stock-photographic-processes',
    name: 'Film Stock & Photographic Processes',
    styles: [
      {
        id: 'black-white',
        name: 'Black & White',
        description: 'rich monochrome silver gelatin photograph',
        sampleImageUrl: sample('black-white'),
      },
      {
        id: 'sepia-antique',
        name: 'Sepia / Antique',
        description: 'warm antique sepia print with gentle age marks',
        sampleImageUrl: sample('sepia-antique'),
      },
      {
        id: 'technicolor',
        name: 'Technicolor',
        description: 'lush saturated three-strip Technicolor film palette',
        sampleImageUrl: sample('technicolor'),
      },
      {
        id: 'kodachrome',
        name: 'Kodachrome',
        description: 'warm vintage color reversal film, fine grain',
        sampleImageUrl: sample('kodachrome'),
      },
      {
        id: 'cinestill-halation',
        name: 'CineStill / Halation',
        description: 'cinematic film with glowing red highlight halation',
        sampleImageUrl: sample('cinestill-halation'),
      },
      {
        id: 'cross-processed',
        name: 'Cross-Processed',
        description: 'surreal shifted colors of cross-processed film',
        sampleImageUrl: sample('cross-processed'),
      },
      {
        id: 'bleach-bypass',
        name: 'Bleach Bypass',
        description: 'desaturated high-contrast silvery film',
        sampleImageUrl: sample('bleach-bypass'),
      },
      {
        id: 'infrared',
        name: 'Infrared',
        description: 'surreal infrared photograph with pale white foliage',
        sampleImageUrl: sample('infrared'),
      },
      {
        id: 'daguerreotype-tintype',
        name: 'Daguerreotype / Tintype',
        description: '1850s metallic wet-plate photograph, historical texture',
        sampleImageUrl: sample('daguerreotype-tintype'),
      },
      {
        id: 'autochrome',
        name: 'Autochrome',
        description: 'early color photograph, dreamy soft grain',
        sampleImageUrl: sample('autochrome'),
      },
      {
        id: 'lomography',
        name: 'Lomography',
        description: 'lo-fi vignette and subtle light leaks',
        sampleImageUrl: sample('lomography'),
      },
      {
        id: 'polaroid',
        name: 'Polaroid',
        description: 'faded instant-film look and white instant-film border',
        sampleImageUrl: sample('polaroid'),
      },
      {
        id: 'vhs-analog-video',
        name: 'VHS / Analog Video',
        description: 'analog video scanlines, chroma bleed, tracking artifacts',
        sampleImageUrl: sample('vhs-analog-video'),
      },
      {
        id: 'silent-era-film',
        name: 'Silent-Era Film',
        description: 'flickered high-contrast black-and-white cinema frame',
        sampleImageUrl: sample('silent-era-film'),
      },
    ],
  },
  {
    id: 'color-grade-genre-palettes',
    name: 'Color-Grade / Genre Palettes',
    styles: [
      {
        id: 'blockbuster-teal-orange',
        name: 'Blockbuster (Teal & Orange)',
        description: 'cinematic teal shadows and orange highlights',
        sampleImageUrl: sample('blockbuster-teal-orange'),
      },
      {
        id: 'neon-noir-cyberpunk',
        name: 'Neon Noir / Cyberpunk',
        description: 'wet neon city, moody futuristic night palette',
        sampleImageUrl: sample('neon-noir-cyberpunk'),
      },
      {
        id: 'desaturated-gritty',
        name: 'Desaturated Gritty',
        description: 'muted bleak color, rough texture',
        sampleImageUrl: sample('desaturated-gritty'),
      },
      {
        id: 'golden-hour',
        name: 'Golden Hour',
        description: 'warm glowing late-afternoon sunlight',
        sampleImageUrl: sample('golden-hour'),
      },
      {
        id: 'horror',
        name: 'Horror',
        description: 'sickly green cast and deep crushed blacks',
        sampleImageUrl: sample('horror'),
      },
      {
        id: 'wes-anderson',
        name: 'Wes Anderson',
        description:
          'symmetrical pastel storybook cinematography, precise centered composition',
        sampleImageUrl: sample('wes-anderson'),
      },
      {
        id: 'vaporwave',
        name: 'Vaporwave',
        description: 'pink and cyan retro-surreal color palette',
        sampleImageUrl: sample('vaporwave'),
      },
    ],
  },
  {
    id: 'painting-drawing-mediums',
    name: 'Painting & Drawing Mediums',
    styles: [
      {
        id: 'oil-painting',
        name: 'Oil Painting',
        description: 'visible oil brushwork and impasto texture',
        sampleImageUrl: sample('oil-painting'),
      },
      {
        id: 'watercolor',
        name: 'Watercolor',
        description: 'transparent soft washes and bleeding edges',
        sampleImageUrl: sample('watercolor'),
      },
      {
        id: 'gouache',
        name: 'Gouache',
        description: 'matte opaque flat painterly shapes',
        sampleImageUrl: sample('gouache'),
      },
      {
        id: 'impressionist',
        name: 'Impressionist',
        description: 'broken color and luminous light-driven brushwork',
        sampleImageUrl: sample('impressionist'),
      },
      {
        id: 'ink-wash-sumi-e',
        name: 'Ink Wash (Sumi-e)',
        description: 'minimal gestural black ink wash on textured paper',
        sampleImageUrl: sample('ink-wash-sumi-e'),
      },
      {
        id: 'charcoal',
        name: 'Charcoal',
        description: 'smudged monochrome charcoal drawing',
        sampleImageUrl: sample('charcoal'),
      },
      {
        id: 'pencil-sketch',
        name: 'Pencil Sketch',
        description: 'graphite shading and cross-hatched detail',
        sampleImageUrl: sample('pencil-sketch'),
      },
      {
        id: 'pastel',
        name: 'Pastel',
        description: 'soft chalky pastel pigment on paper',
        sampleImageUrl: sample('pastel'),
      },
      {
        id: 'ukiyo-e-woodblock',
        name: 'Ukiyo-e Woodblock',
        description: 'Japanese woodblock flat planes and clear outlines',
        sampleImageUrl: sample('ukiyo-e-woodblock'),
      },
      {
        id: 'art-nouveau-deco-poster',
        name: 'Art Nouveau / Deco Poster',
        description: 'ornate graphic vintage poster with decorative geometry',
        sampleImageUrl: sample('art-nouveau-deco-poster'),
      },
      {
        id: 'pop-art',
        name: 'Pop Art',
        description: 'bold flat colors and Ben-Day dots',
        sampleImageUrl: sample('pop-art'),
      },
      {
        id: 'matte-painting-concept-art',
        name: 'Matte Painting / Concept Art',
        description: 'cinematic painted city vista and atmosphere',
        sampleImageUrl: sample('matte-painting-concept-art'),
      },
    ],
  },
  {
    id: 'illustration-comic',
    name: 'Illustration / Comic',
    styles: [
      {
        id: 'comic-book',
        name: 'Comic Book',
        description: 'ink outlines, halftone texture, vibrant cel color',
        sampleImageUrl: sample('comic-book'),
      },
      {
        id: 'graphic-novel-ink',
        name: 'Graphic Novel Ink',
        description: 'heavy black ink and limited color palette',
        sampleImageUrl: sample('graphic-novel-ink'),
      },
      {
        id: 'ligne-claire',
        name: 'Ligne Claire',
        description: 'clean uniform outlines and flat clear colors',
        sampleImageUrl: sample('ligne-claire'),
      },
      {
        id: 'noir-ink-sin-city',
        name: 'Noir Ink (Sin City)',
        description: 'stark black and white ink with a single red accent',
        sampleImageUrl: sample('noir-ink-sin-city'),
      },
      {
        id: 'line-art',
        name: 'Line Art',
        description: 'pure fine contour drawing on white',
        sampleImageUrl: sample('line-art'),
      },
      {
        id: 'children-s-picture-book',
        name: "Children's Picture Book",
        description: 'gentle textured whimsical illustration',
        sampleImageUrl: sample('children-s-picture-book'),
      },
      {
        id: 'flat-vector',
        name: 'Flat Vector',
        description: 'minimal geometric flat-color vector-style illustration',
        sampleImageUrl: sample('flat-vector'),
      },
    ],
  },
  {
    id: 'animation-looks',
    name: 'Animation Looks',
    styles: [
      {
        id: 'classic-cel-anime-90s-ova',
        name: 'Classic Cel Anime (90s OVA)',
        description: 'hand-painted 1990s original-video-animation cel look',
        sampleImageUrl: sample('classic-cel-anime-90s-ova'),
      },
      {
        id: 'modern-anime-shinkai',
        name: 'Modern Anime (Shinkai)',
        description: 'lush detailed anime sky, luminous city, lens flare',
        sampleImageUrl: sample('modern-anime-shinkai'),
      },
      {
        id: 'ghibli-esque',
        name: 'Ghibli-esque',
        description: 'soft warm painterly hand-drawn animation',
        sampleImageUrl: sample('ghibli-esque'),
      },
      {
        id: 'retro-anime-80s-akira',
        name: 'Retro Anime (80s Akira)',
        description: 'detailed dark neon 1980s anime cel look',
        sampleImageUrl: sample('retro-anime-80s-akira'),
      },
      {
        id: 'chibi',
        name: 'Chibi',
        description: 'cute super-deformed characters and simplified city',
        sampleImageUrl: sample('chibi'),
      },
      {
        id: '3d-pixar-dreamworks',
        name: '3D (Pixar/DreamWorks)',
        description: 'rounded stylized feature-animation 3D rendering',
        sampleImageUrl: sample('3d-pixar-dreamworks'),
      },
      {
        id: 'cel-shaded-3d-spider-verse',
        name: 'Cel-Shaded 3D (Spider-Verse)',
        description: '3D forms with comic ink outlines and halftone',
        sampleImageUrl: sample('cel-shaded-3d-spider-verse'),
      },
      {
        id: 'painterly-3d-arcane',
        name: 'Painterly 3D (Arcane)',
        description: 'hand-finished textured painterly 3D animation',
        sampleImageUrl: sample('painterly-3d-arcane'),
      },
      {
        id: 'toon-shaded-3d',
        name: 'Toon-Shaded 3D',
        description: 'bold outlines and flat-shaded 3D forms',
        sampleImageUrl: sample('toon-shaded-3d'),
      },
      {
        id: 'rubber-hose',
        name: 'Rubber Hose',
        description: '1930s black-and-white bendy cartoon',
        sampleImageUrl: sample('rubber-hose'),
      },
      {
        id: 'upa-mid-century-flat',
        name: 'UPA / Mid-Century Flat',
        description: '1950s mid-century modern flat animation',
        sampleImageUrl: sample('upa-mid-century-flat'),
      },
      {
        id: 'pixel-art',
        name: 'Pixel Art',
        description: 'detailed retro-game pixel-art sprite scene',
        sampleImageUrl: sample('pixel-art'),
      },
    ],
  },
  {
    id: 'stop-motion-by-material',
    name: 'Stop-Motion — by Material',
    styles: [
      {
        id: 'clay-plasticine-aardman',
        name: 'Clay / Plasticine (Aardman)',
        description:
          'fingerprinted soft clay stop-motion puppets and buildings',
        sampleImageUrl: sample('clay-plasticine-aardman'),
      },
      {
        id: 'silicone-puppet-armature-laika',
        name: 'Silicone Puppet + Armature (Laika)',
        description: 'tactile detailed silicone stop-motion puppets',
        sampleImageUrl: sample('silicone-puppet-armature-laika'),
      },
      {
        id: 'felt-fabric-needle-felted',
        name: 'Felt / Fabric / Needle-Felted',
        description: 'fuzzy handmade felt puppets and fabric city',
        sampleImageUrl: sample('felt-fabric-needle-felted'),
      },
      {
        id: 'wood-marionette',
        name: 'Wood / Marionette',
        description: 'carved wooden jointed marionettes and grainy set',
        sampleImageUrl: sample('wood-marionette'),
      },
      {
        id: 'paper-cutout',
        name: 'Paper Cutout',
        description: 'flat layered paper cutout animation',
        sampleImageUrl: sample('paper-cutout'),
      },
      {
        id: 'papercraft-origami',
        name: 'Papercraft / Origami',
        description: 'dimensional folded paper models',
        sampleImageUrl: sample('papercraft-origami'),
      },
      {
        id: 'silhouette-shadow',
        name: 'Silhouette / Shadow',
        description: 'backlit black shadow-puppet scene',
        sampleImageUrl: sample('silhouette-shadow'),
      },
      {
        id: 'brick-lego',
        name: 'Brick / LEGO',
        description: 'plastic brick construction with visible studs',
        sampleImageUrl: sample('brick-lego'),
      },
      {
        id: 'pixilation',
        name: 'Pixilation',
        description: 'real humans posed frame-by-frame stop-motion effect',
        sampleImageUrl: sample('pixilation'),
      },
      {
        id: 'sand-on-glass',
        name: 'Sand-on-Glass',
        description: 'flowing backlit sand drawing on glass',
        sampleImageUrl: sample('sand-on-glass'),
      },
    ],
  },
];

export const visualStyleIds = new Set(
  visualStyleGroups.flatMap((group) => group.styles.map((style) => style.id))
);
export const visualStyleIdSchema = z
  .string()
  .refine((id) => visualStyleIds.has(id), 'Unknown art style');

export const visualStyleById = (id: string) =>
  visualStyleGroups
    .flatMap((group) => group.styles)
    .find((style) => style.id === id);
