"use client";

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import {
  Language,
  StoreLanguageActionsContext,
  StoreLanguageContext,
} from "./store-language-context";
import { cookieName, fallbackLanguage } from "./config";

type StoreLanguageProviderProps = PropsWithChildren<{
  initialLanguage?: string;
}>;

function StoreLanguageProvider({
  children,
  initialLanguage = fallbackLanguage,
}: StoreLanguageProviderProps) {
  // The server and first client render receive the same language from proxy
  // headers. Read/write cookies only after hydration to avoid mismatches.
  const [language, setLanguageRaw] = useState<Language>(initialLanguage);

  useEffect(() => {
    // URL locale (public) or proxy-resolved preference (admin) is the
    // authoritative value for this render; normalize stale/invalid cookies.
    Cookies.set(cookieName, initialLanguage);
  }, [initialLanguage]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    const normalizedLanguage = nextLanguage ?? fallbackLanguage;
    Cookies.set(cookieName, normalizedLanguage);
    setLanguageRaw(normalizedLanguage);
  }, []);

  const contextValue = useMemo(() => ({ language }), [language]);
  const contextActionsValue = useMemo(
    () => ({ setLanguage }),
    [setLanguage]
  );

  return (
    <StoreLanguageContext.Provider value={contextValue}>
      <StoreLanguageActionsContext.Provider value={contextActionsValue}>
        {children}
      </StoreLanguageActionsContext.Provider>
    </StoreLanguageContext.Provider>
  );
}

export default StoreLanguageProvider;
