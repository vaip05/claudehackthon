export type Flow = 'none' | 'light' | 'medium' | 'heavy';

export type Symptom =
  | 'cramps'
  | 'acne'
  | 'bloating'
  | 'fatigue'
  | 'pain_sex'
  | 'pain_bowel'
  | 'mood'
  | 'headache'
  | 'hair_growth';

export type DayLog = {
  date: string; // YYYY-MM-DD
  flow?: Flow;
  pain?: 0 | 1 | 2 | 3;
  symptoms?: Symptom[];
  missed?: boolean; // an expected period that didn't come
};

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
export type Focus = 'general' | 'pmos' | 'endo';
export type InsightFlag = 'irregular' | 'painful_periods' | 'deep_pain' | 'androgen';
