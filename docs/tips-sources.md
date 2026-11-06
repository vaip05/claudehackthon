# Tips content: source ledger

What each cited source was checked to support, and what we deliberately did **not** claim.
Source of truth for the content is `cyster/lib/tips.ts`. `npm run check:tips` (in `cyster/`) fails if a tip uses a source that isn't listed there.

Last verified: 6 Nov 2026. 47 tips across 12 cells (3 focuses x 4 phases): 41 cited, 6 intentionally uncited.

**Rule used:** a source goes on a tip only if the source itself supports that tip. Otherwise the tip has no source.

## Sources we cite

| Label in app | What it supports (and where we use it) | Link |
|---|---|---|
| International PCOS Guideline 2023 | Some activity is better than none; 150-300 min/week moderate activity and 2 muscle-strengthening days; no single diet is best and sustainable healthy eating is the aim; benefits of healthy lifestyle even without weight loss; weight stigma harms wellbeing; inositol types/doses can't be recommended and people should tell their clinician about supplements; sleep apnoea is more common in PCOS (ask about snoring and unrefreshing sleep). Used for PMOS tips. | https://academic.oup.com/humrep/article/38/9/1655/7241786 |
| NHS: PMOS | Talking therapy if symptoms affect mood. | https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/ |
| RUH Bath NHS Trust: PCOS and diet | Dietitian leaflet: low-GI / high-fibre carbs with protein, oily fish and plant omega-3. Attributed in the tip text as "a hospital dietitian leaflet", **not** as the guideline. | https://www.ruh.nhs.uk/patients/patient_information/external_leaflets/DTT_PCOS_and_diet.pdf |
| Small studies (Grant 2010, Akdogan 2007) | Two small studies of spearmint tea lowering free testosterone (Akdogan n=21, 5 days; Grant n=42, 30 days). Grant found no change in hirsutism measured by the clinician-rated score. Phrased "some small studies suggest". | https://pubmed.ncbi.nlm.nih.gov/19585478/ |
| ESHRE Endometriosis Guideline 2022 | Symptoms that should prompt doctors to consider endometriosis (painful periods, deep pain during sex, bowel/bladder pain, non-menstrual pelvic pain); symptom diary: ESHRE states no evidence that a diary reduces time to diagnosis, but sees potential benefit in making pain more objective and helping people show their symptoms (guideline statement under Chapter I, signs and symptoms). | https://www.eshre.eu/guidelines-and-legal/guidelines/endometriosis-guideline |
| ESHRE ... (evidence limited) | Same document. Used where the tip says the evidence for diet or exercise in endometriosis is unclear (ESHRE can't recommend a specific non-medical intervention for pain). | same |
| NHS: Period pain | Gentle exercise (walking, yoga, swimming), warm bath or heat pad, cutting down on alcohol, when to see a GP. | https://www.nhs.uk/conditions/period-pain/ |
| NHS: Iron | Iron-rich foods (beans, nuts, dried fruit, fortified cereals); talk to a GP if worried about low iron. | https://www.nhs.uk/conditions/vitamins-and-minerals/iron/ |
| ACOG: Painful periods | Being well rested helps you cope with period discomfort. | https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods |
| ACOG: Premenstrual syndrome | Complex carbs may ease mood symptoms and cravings; small regular meals keep blood sugar stable; regular aerobic exercise (about 30 min most days), not only on symptom days; regular sleep and relaxation. | https://www.acog.org/womens-health/faqs/premenstrual-syndrome |
| Cleveland Clinic: Cycle syncing | Energy tends to be lower during the period and higher around ovulation; add intensity as energy rises. Also notes cycle syncing hasn't been studied clinically. | https://health.clevelandclinic.org/cycle-syncing |
| Cleveland Clinic: Follicular phase | Rising estrogen, clearer skin, more upbeat mood; cramping or bloating just before ovulation. | https://my.clevelandclinic.org/health/body/23953-follicular-phase |
| Cleveland Clinic: Period cravings | Energy needs rise before a period, so extra hunger is expected. | https://health.clevelandclinic.org/period-cravings |
| McNulty et al. 2020 review | Performance differences across the cycle are trivial and vary a lot, so no general phase-based exercise rule. | https://link.springer.com/article/10.1007/s40279-020-01319-3 |

## Things the spec suggested that we did NOT source (and why)

| Spec idea | What we did |
|---|---|
| PMOS: "low-GI carbs, protein with every meal ... Source: Intl PCOS Guideline 2023" | The 2023 guideline says **no single diet composition is better**. So the guideline is cited only for "sustainable balanced eating". Low-GI/high-fibre is cited to the dietitian leaflet and attributed as such. |
| Endometriosis: "anti-inflammatory foods, less red meat, heat, stretches, pacing ... Source: ESHRE 2022" | ESHRE says there isn't enough evidence to recommend any specific diet/exercise for endometriosis pain. Those tips say "may help some people" or "the evidence is unclear". Heat and alcohol are cited to the NHS **period pain** page, not to ESHRE. Red meat is left out (nothing verified). Pacing and stretching tips are uncited. |
| General luteal: "magnesium (dark chocolate, seeds)" | Not included. ACOG says there isn't enough research to recommend magnesium for painful periods, so we use ACOG's carbs/exercise/sleep advice instead. Dark chocolate has no verified support. |
| General phase tips as a "cycle syncing plan" | Cleveland Clinic says cycle syncing hasn't been clinically studied, and McNulty 2020 finds tiny differences. We tell people to follow how they feel, and say so in a tip. |
| Follicular/ovulatory "Eat" tips and a few "Feel" tips | Plain healthy-eating or pacing advice with no specific source. Left uncited on purpose. |

## Open items

- Content is from published guidelines and reputable patient-information pages, but **not clinician-reviewed**. Say this if asked.
- NHS iron page shows a 2020 review date. Re-check before publishing beyond the hackathon.
- Terminology: the 2023 guideline and WHO call it PCOS. The app uses PMOS (the 2025 name). Keep that in mind when quoting.
