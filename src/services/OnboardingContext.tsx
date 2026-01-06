import React, { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { OnboardingDraft } from "../types/onboarding";
import { defaultDraft } from "../types/onboarding";

type Ctx = {
  draft: OnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
  reset: () => void;
};

const OnboardingContext = createContext<Ctx | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      reset: () => setDraft(defaultDraft),
    }),
    [draft]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
