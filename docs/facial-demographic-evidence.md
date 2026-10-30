# Facial trait casting: evidence and limits

The probabilities in `src/casting/weights.ts` are **generation weights**, not
observed population percentages. The app's discrete labels (for example,
`thin`/`medium`/`tall` vermilion) have no millimeter thresholds, and the studies
below report continuous measurements from samples of particular ages, places,
and measurement methods. Converting a study mean into a percentage for an enum
would claim precision the evidence does not provide.

## Findings used for lip tendencies

| Dimension | Primary observation | Casting use |
| --- | --- | --- |
| Age | In 169 Chinese women aged 20–60, mouth width and cutaneous lip height increased, while upper vermilion height decreased with age; several changes became clearer after 40. [Chong et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7984336/) | Modest older-age shifts toward wide mouth, long philtrum, and thin vermilion. |
| Sex | A 3D study of 180 young adults found larger absolute lip dimensions in men, but no sex difference in vermilion-height/mouth-width ratio. [Sforza et al.](https://pubmed.ncbi.nlm.nih.gov/10670889/) A smaller study found wider male vermilion and relatively thinner male upper lip. [Ferrario et al.](https://pubmed.ncbi.nlm.nih.gov/19686918/) | Slight male mouth-width and upper/lower ratio shifts. Removed the old assumption that female lips are categorically fuller. |
| Population | A 3D study of Sudanese adults compared measured vermilion heights and widths with published African American and European cohorts; the averages differ, with substantial within-sample standard deviations. [Sforza et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC8304677/) A Brazilian 3D comparison reported group differences in mouth width and lower vermilion height. [Silva et al.](https://openalex.org/W2593591506) | Modest broad African-ancestry width/vermilion shift; retain overlapping probabilities. |
| East Asian population | A Japanese 3D study found greater vermilion height than its Caucasian American reference. [Three-dimensional anthropometry of the lips](https://cir.nii.ac.jp/crid/1873116917685058048) | Modest East Asian vermilion shift, without assigning a universal phenotype. |
| Fine population structure | 3D measurements in Lithuanian, Polish, and Russian women differed for philtrum width, vermilion height, and lip volume. [Vitosyte et al.](https://pubmed.ncbi.nlm.nih.gov/36006047/) | Do not treat a broad ancestry label as a fixed face; retain leaf populations and overlap. |

No reliable frequency data from these studies supports demographic odds for
Cupid's-bow shape, mouth corners, philtrum depth, or lip projection. Their broad
priors are diversity controls, and demographic modifiers are intentionally absent.
The same evidence limitation applies to many of the older face tables: they
should not be presented as calibrated anthropometric prevalence estimates.

The `Look` setting controls selection for attractive odds; it does not redefine
population prevalence. Lip odds are sharpened less than other traits so that a
Look 4 batch still varies on width, fullness, vermilion height, ratio, and shape.

## Continuous lip fields

The form now accepts mouth width, upper and lower vermilion midline heights, and
philtrum length in millimeters. Those four distances have defined anatomical
landmarks and are reported by the studies above. The schema permits a generous
range that includes ordinary variation and unusual faces. For random casting,
the earlier demographic enum distribution chooses a broad measurement band,
then a value is drawn continuously within that band. The band boundaries are
modeling choices, **not** clinical cutoffs or estimated population quantiles.
Explicit slider values override the derived legacy enum categories. Features
without a stable single distance, such as Cupid's-bow shape or mouth-corner
direction, remain discrete.

## Visible eye opening

`eyeOpeningRatioPercent` is palpebral fissure height divided by width. It
describes the vertical eye aperture independently of overall eye size,
almond/round shape, eyelid crease, and epicanthic fold. A lower value gives a
more horizontally elongated appearance. It is a direct slider when specified
and a continuous random draw otherwise.

A [3D comparison of young Chinese and Caucasian adults](https://pubmed.ncbi.nlm.nih.gov/39839011/)
reported smaller fissure measurements in the Chinese sample, especially among
men. An [Asian eyelid anthropometry study](https://pubmed.ncbi.nlm.nih.gov/18349663/)
reported an adult mean near 8 mm vertically and 27 mm horizontally, while a
[Chinese eyelid aging study](https://pubmed.ncbi.nlm.nih.gov/32896512/) found
decreasing fissure height with age. Imaging protocols and samples differ, so
the code uses a modest, overlapping East Asian shift rather than treating
either study mean as a universal norm. A [3D sample of 97 Malaysian Chinese](https://pubmed.ncbi.nlm.nih.gov/29093554/)
found visible double eyelids in 70.1% of participants; a narrower aperture
must therefore remain possible with either a monolid or a double eyelid.
