import type { TranslationKeys } from '~/hooks';

export type GuideAudience = 'teacher' | 'admin';

/**
 * How the in-app overlay finds a step's element. Locators are tried in order;
 * every kind resolves through stable attributes or locale keys, so no upstream
 * component needs a guide-specific attribute.
 */
export type GuideLocator = { within?: 'dialog' } & (
  | { testId: string }
  | { id: string }
  | { labelKey: TranslationKeys }
  | { labelPrefixKey: TranslationKeys }
  | { placeholderKey: TranslationKeys }
  | { labelledByKey: TranslationKeys }
  | { role: string; textKey: TranslationKeys }
);

/** Where the step lives in `school-ai-office/guide.html`'s simulated screens. */
export type GuideMock = {
  screen: 'app' | 'share' | 'admin' | 'gcp' | 'env' | 'yaml' | 'login';
  panel?: 'builder' | 'history';
  popover?: 'model' | 'attach' | 'agent';
  target: string;
  where: string;
};

export type GuideStep = {
  textKey: TranslationKeys;
  tipKey?: TranslationKeys;
  /** `null`: nothing stable to highlight; the overlay shows the text only. */
  target: GuideLocator[] | null;
  /** The step happens outside LibreChat (Google Cloud, `.env`, `librechat.yaml`). */
  external?: 'gcp' | 'env' | 'yaml';
  mock: GuideMock;
};

export type SchoolGuide = {
  id: string;
  audience: GuideAudience;
  titleKey: TranslationKeys;
  summaryKey: TranslationKeys;
  /** Demo matcher terms for guide.html; the in-app version lets the agent choose by title. */
  keywords: string[];
  steps: GuideStep[];
};
