import type { Focus, Phase } from './types';

// Tips content. Rules for editing this file:
//  - Every Focus x Phase cell must have 3-4 tips (the TipsMap type + `npm run check:tips` enforce this).
//  - Only set `source` when that source actually supports the tip. Leave it out otherwise.
//    The evidence trail for each source is in docs/tips-sources.md.
//  - Where evidence is limited, say so in `why` ("may help some people"). No strong claims.
//  - `why` is ONE sentence.

export type Tip = { category: 'Eat' | 'Move' | 'Feel'; title: string; why: string; source?: string };
export type TipsMap = Record<Focus, Record<Phase, Tip[]>>;

export const CATEGORIES: Tip['category'][] = ['Eat', 'Move', 'Feel'];
export const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
export const FOCUSES: Focus[] = ['general', 'pmos', 'endo'];

export const FOCUS_LABELS: Record<Focus, string> = {
  general: 'General',
  pmos: 'PMOS',
  endo: 'Endometriosis',
};

/** Short phase descriptions. Source: Cleveland Clinic (cycle syncing + follicular phase pages). */
export const PHASE_BLURBS: Record<Phase, string> = {
  menstrual: 'Estrogen is at its lowest, so energy tends to be lower. Be kind to yourself.',
  follicular: 'Estrogen is rising, and energy and mood often lift.',
  ovulatory: 'Estrogen and testosterone peak, so many people feel more energetic.',
  luteal: 'Progesterone rises, and premenstrual symptoms can show up toward the end.',
};

/** Source label -> link. Only labels listed here may be used in `Tip.source` (checked by `npm run check:tips`). */
const SRC = {
  intlPcos: 'International PCOS Guideline 2023',
  nhsPmos: 'NHS: PMOS',
  ruh: 'RUH Bath NHS Trust: PCOS and diet',
  spearmint: 'Small studies (Grant 2010, Akdoğan 2007)',
  eshre: 'ESHRE Endometriosis Guideline 2022',
  eshreLimited: 'ESHRE Endometriosis Guideline 2022 (evidence limited)',
  nhsPeriodPain: 'NHS: Period pain',
  nhsIron: 'NHS: Iron',
  acogDysmenorrhea: 'ACOG: Painful periods',
  acogPms: 'ACOG: Premenstrual syndrome',
  clevelandSync: 'Cleveland Clinic: Cycle syncing',
  clevelandFollicular: 'Cleveland Clinic: Follicular phase',
  clevelandCravings: 'Cleveland Clinic: Period cravings',
  mcnulty: 'McNulty et al. 2020 review',
} as const;

export const SOURCE_URLS: Record<string, string> = {
  [SRC.intlPcos]: 'https://academic.oup.com/humrep/article/38/9/1655/7241786',
  [SRC.nhsPmos]: 'https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/',
  [SRC.ruh]: 'https://www.ruh.nhs.uk/patients/patient_information/external_leaflets/DTT_PCOS_and_diet.pdf',
  [SRC.spearmint]: 'https://pubmed.ncbi.nlm.nih.gov/19585478/',
  [SRC.eshre]: 'https://www.eshre.eu/guidelines-and-legal/guidelines/endometriosis-guideline',
  [SRC.eshreLimited]: 'https://www.eshre.eu/guidelines-and-legal/guidelines/endometriosis-guideline',
  [SRC.nhsPeriodPain]: 'https://www.nhs.uk/conditions/period-pain/',
  [SRC.nhsIron]: 'https://www.nhs.uk/conditions/vitamins-and-minerals/iron/',
  [SRC.acogDysmenorrhea]: 'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods',
  [SRC.acogPms]: 'https://www.acog.org/womens-health/faqs/premenstrual-syndrome',
  [SRC.clevelandSync]: 'https://health.clevelandclinic.org/cycle-syncing',
  [SRC.clevelandFollicular]: 'https://my.clevelandclinic.org/health/body/23953-follicular-phase',
  [SRC.clevelandCravings]: 'https://health.clevelandclinic.org/period-cravings',
  [SRC.mcnulty]: 'https://link.springer.com/article/10.1007/s40279-020-01319-3',
};

export const TIPS: TipsMap = {
  // ---------------------------------------------------------------- General
  general: {
    menstrual: [
      {
        category: 'Eat',
        title: 'Add iron-rich foods',
        why: 'You lose iron when you bleed, and beans, nuts, dried apricots and fortified cereals are good sources.',
        source: SRC.nhsIron,
      },
      {
        category: 'Move',
        title: 'Keep movement gentle',
        why: 'Walking, stretching, yoga or swimming can ease period pain, and resting instead is a perfectly good choice too.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Feel',
        title: 'Warmth can take the edge off',
        why: 'A warm bath or shower, or a heat pad on your tummy, can help ease period pain.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Feel',
        title: 'Tell someone if pain is too much',
        why: 'The NHS advises seeing a GP if period pain stops you doing your usual activities, or comes with pain during sex or when peeing or pooing.',
        source: SRC.nhsPeriodPain,
      },
    ],
    follicular: [
      {
        category: 'Eat',
        title: 'Keep meals regular and balanced',
        why: 'Regular meals with vegetables, protein and whole grains help keep your energy steady as it starts to rise.',
      },
      {
        category: 'Move',
        title: 'Add a little more intensity',
        why: 'Energy often rises after your period, so cardio or a new class can feel good if you are up for it.',
        source: SRC.clevelandSync,
      },
      {
        category: 'Move',
        title: 'Follow your body, not a rulebook',
        why: 'Reviews find that performance differences between cycle phases are tiny and vary a lot from person to person.',
        source: SRC.mcnulty,
      },
      {
        category: 'Feel',
        title: 'Enjoy the lift in mood',
        why: 'Rising estrogen is linked with clearer skin and a more upbeat mood for many people, so it can be a good time for plans.',
        source: SRC.clevelandFollicular,
      },
    ],
    ovulatory: [
      {
        category: 'Eat',
        title: 'Fuel the extra energy',
        why: 'Regular meals and plenty of water help you keep up with the higher energy many people feel around ovulation.',
      },
      {
        category: 'Move',
        title: 'Use the energy if it is there',
        why: 'Estrogen and testosterone peak around ovulation, so many people feel ready for higher-intensity workouts, though it varies.',
        source: SRC.clevelandSync,
      },
      {
        category: 'Feel',
        title: 'Mid-cycle twinges can be normal',
        why: 'Some people notice cramping or bloating just before ovulation, but sudden or severe pain deserves prompt medical attention.',
        source: SRC.clevelandFollicular,
      },
    ],
    luteal: [
      {
        category: 'Eat',
        title: 'Reach for slow-release carbs',
        why: 'A diet rich in whole grains, beans and lentils may ease mood symptoms and food cravings before your period.',
        source: SRC.acogPms,
      },
      {
        category: 'Eat',
        title: 'Cravings are not a failing',
        why: 'Your body needs more energy before your period, so extra hunger is expected and worth honouring.',
        source: SRC.clevelandCravings,
      },
      {
        category: 'Move',
        title: 'Keep a regular routine',
        why: 'Regular aerobic exercise, such as brisk walking or swimming, lessens PMS symptoms for many people, and about 30 minutes most days is a good goal.',
        source: SRC.acogPms,
      },
      {
        category: 'Feel',
        title: 'Protect sleep and wind down',
        why: 'Going to bed and waking at the same times, plus breathing exercises or yoga, may help with moodiness and fatigue.',
        source: SRC.acogPms,
      },
    ],
  },

  // ------------------------------------------------------------------- PMOS
  pmos: {
    menstrual: [
      {
        category: 'Eat',
        title: 'Include iron-rich foods',
        why: 'If your periods are heavy you are at higher risk of low iron, so add beans, nuts and fortified cereals and ask a GP or dietitian for advice.',
        source: SRC.nhsIron,
      },
      {
        category: 'Move',
        title: 'Some movement beats none',
        why: 'The 2023 guideline says doing some physical activity is better than none, so a short walk counts on low-energy days.',
        source: SRC.intlPcos,
      },
      {
        category: 'Feel',
        title: 'Mention heavy or changing periods',
        why: 'The NHS advises seeing a GP if your periods become heavier, more painful or more irregular.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Feel',
        title: 'Weight stigma is not your fault',
        why: 'The 2023 guideline recognises that many people with PMOS face weight stigma in healthcare and that it harms wellbeing.',
        source: SRC.intlPcos,
      },
    ],
    follicular: [
      {
        category: 'Eat',
        title: 'Aim for sustainable, balanced eating',
        why: 'The 2023 guideline found no single diet works best, so regular healthy meals you can keep up are a good target.',
        source: SRC.intlPcos,
      },
      {
        category: 'Eat',
        title: 'Try wholegrains and high-fibre carbs',
        why: 'A hospital dietitian leaflet suggests low-GI, high-fibre carbs with protein at meals can help steady blood sugar and insulin.',
        source: SRC.ruh,
      },
      {
        category: 'Move',
        title: 'Add strength training',
        why: 'Adults are advised to do muscle-strengthening activity on two non-consecutive days a week alongside aerobic exercise.',
        source: SRC.intlPcos,
      },
      {
        category: 'Feel',
        title: 'Benefits do not depend on weight loss',
        why: 'The guideline notes there are benefits to a healthy lifestyle even without weight loss.',
        source: SRC.intlPcos,
      },
    ],
    ovulatory: [
      {
        category: 'Eat',
        title: 'Include oily fish and omega-3 foods',
        why: 'A hospital dietitian leaflet suggests oily fish, walnuts, chia and flaxseeds as part of a balanced diet for PMOS.',
        source: SRC.ruh,
      },
      {
        category: 'Eat',
        title: 'Check supplements with your doctor',
        why: 'The guideline cannot recommend specific types or doses of inositol, and encourages you to tell your doctor about any supplements you take.',
        source: SRC.intlPcos,
      },
      {
        category: 'Move',
        title: 'Build toward 150 minutes a week',
        why: 'Adults are advised to aim for 150 to 300 minutes of moderate activity a week, spread through the week.',
        source: SRC.intlPcos,
      },
      {
        category: 'Feel',
        title: 'Support for mood is part of care',
        why: 'The NHS suggests talking therapy if symptoms of PMOS are leaving you feeling low or anxious.',
        source: SRC.nhsPmos,
      },
    ],
    luteal: [
      {
        category: 'Eat',
        title: 'Keep blood sugar steady',
        why: 'Smaller, more regular meals with slow-release carbs can help steady blood sugar and ease premenstrual symptoms.',
        source: SRC.acogPms,
      },
      {
        category: 'Eat',
        title: 'Spearmint tea: a gentle experiment',
        why: 'Some small studies suggest spearmint tea may lower free testosterone, but a 30-day trial found no clear change in measured hair growth.',
        source: SRC.spearmint,
      },
      {
        category: 'Move',
        title: 'Stay regular, not extreme',
        why: 'Exercising regularly, not just on symptom days, is what lessens premenstrual symptoms for many people.',
        source: SRC.acogPms,
      },
      {
        category: 'Feel',
        title: 'Notice how rested you feel',
        why: 'Sleep apnoea is more common with PMOS, so mention it to your doctor if you snore and wake unrefreshed.',
        source: SRC.intlPcos,
      },
    ],
  },

  // ----------------------------------------------------------- Endometriosis
  endo: {
    menstrual: [
      {
        category: 'Eat',
        title: 'Cut back on alcohol if you can',
        why: 'The NHS says cutting down on alcohol may help ease period pain.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Move',
        title: 'Gentle movement, if it feels okay',
        why: 'The NHS suggests gentle exercise like walking or yoga for period pain, although ESHRE found the evidence for exercise in endometriosis unclear.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Feel',
        title: 'Heat can soothe',
        why: 'Warm baths and heat pads are a simple way to ease period pain, though studies in endometriosis itself are limited.',
        source: SRC.nhsPeriodPain,
      },
      {
        category: 'Feel',
        title: 'Keep a symptom diary',
        why: 'A diary can help you put your pain into words for a doctor, even though it has not been shown to speed up diagnosis.',
        source: SRC.eshre,
      },
    ],
    follicular: [
      {
        category: 'Eat',
        title: 'Try colourful, plant-rich meals',
        why: 'An anti-inflammatory style of eating may help some people with endometriosis, but ESHRE found the evidence unclear.',
        source: SRC.eshreLimited,
      },
      {
        category: 'Move',
        title: 'Build activity gradually',
        why: 'Regular gentle movement on better days may help some people, though ESHRE could not recommend any specific exercise for endometriosis pain.',
        source: SRC.eshreLimited,
      },
      {
        category: 'Feel',
        title: 'Pace your good days',
        why: 'Doing something you enjoy without overdoing it may make it easier to avoid a pain flare afterwards.',
      },
      {
        category: 'Feel',
        title: 'Your symptoms deserve attention',
        why: 'ESHRE says doctors should consider endometriosis when someone has painful periods, painful sex, or bowel or bladder pain.',
        source: SRC.eshre,
      },
    ],
    ovulatory: [
      {
        category: 'Eat',
        title: 'Add oily fish, nuts and seeds',
        why: 'Some people with endometriosis find these fit well into an anti-inflammatory style of eating, but the research is limited.',
      },
      {
        category: 'Move',
        title: 'Stretch gently',
        why: 'Gentle stretching or a walk is an easy way to stay active through mid-cycle twinges, though it is not proven to treat endometriosis pain.',
      },
      {
        category: 'Feel',
        title: 'Note pain outside your period',
        why: 'Pelvic pain at times other than your period is one of the symptoms ESHRE lists, so jot down when it happens.',
        source: SRC.eshre,
      },
      {
        category: 'Feel',
        title: 'Pain during sex is worth raising',
        why: 'ESHRE lists deep pain during sex as a symptom that should prompt doctors to consider endometriosis, and it is okay to bring it up.',
        source: SRC.eshre,
      },
    ],
    luteal: [
      {
        category: 'Eat',
        title: 'Steady meals with slow carbs',
        why: 'Regular smaller meals and whole grains may help ease premenstrual symptoms such as cravings and low mood.',
        source: SRC.acogPms,
      },
      {
        category: 'Move',
        title: 'Keep gentle routines going',
        why: 'Regular aerobic activity such as walking or swimming lessens premenstrual symptoms for many people, so go at the pace your body allows.',
        source: SRC.acogPms,
      },
      {
        category: 'Feel',
        title: 'Plan lighter days ahead',
        why: 'If pain tends to build before your period, easing your commitments in advance can help you cope.',
      },
      {
        category: 'Feel',
        title: 'Protect your sleep',
        why: 'ACOG notes that being well rested can help you cope with period discomfort.',
        source: SRC.acogDysmenorrhea,
      },
    ],
  },
};

/** Never returns undefined, even if a stale or hand-edited localStorage value slips through. */
export function getTips(focus: Focus, phase: Phase): Tip[] {
  return TIPS[focus]?.[phase] ?? TIPS.general[phase] ?? [];
}

const CATEGORY_QUESTIONS: Record<Tip['category'], string> = {
  Eat: 'What should I eat?',
  Move: 'How should I move my body?',
  Feel: "How can I look after how I'm feeling?",
};

const FOCUS_CONTEXT: Record<Focus, string> = {
  general: '',
  pmos: ' and want tips for PMOS',
  endo: ' and want tips for endometriosis',
};

/** The question pre-filled into Talk, e.g. "I'm in my luteal phase and want tips for PMOS. What should I eat? ..." */
export function askQuestion(tip: Tip, focus: Focus, phase: Phase): string {
  return `I'm in my ${phase} phase${FOCUS_CONTEXT[focus]}. ${CATEGORY_QUESTIONS[tip.category]} I was reading the tip "${tip.title}".`;
}

export function askLink(tip: Tip, focus: Focus, phase: Phase): string {
  return `/talk?q=${encodeURIComponent(askQuestion(tip, focus, phase))}`;
}
