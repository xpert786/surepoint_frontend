export type OnboardingStep = 'company' | 'team' | 'integrations' | 'review';

export const ONBOARDING_STEPS: OnboardingStep[] = ['company', 'team', 'integrations', 'review'];

export const getStepLabel = (step: OnboardingStep): string => {
  const labels: Record<OnboardingStep, string> = {
    company: 'Company & Warehouse Info',
    team: 'Team Setup',
    integrations: 'Integrations',
    review: 'Review & Finish',
  };
  return labels[step];
};

export const getStepPath = (step: OnboardingStep): string => {
  const paths: Record<OnboardingStep, string> = {
    company: '/onboarding/company',
    team: '/onboarding/team',
    integrations: '/onboarding/integrations',
    review: '/onboarding/review',
  };
  return paths[step];
};

