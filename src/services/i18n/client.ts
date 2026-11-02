"use client";

import i18next, { type TFunction } from "i18next";
import { useEffect, useState } from "react";
import {
  initReactI18next,
  useTranslation as useTranslationOriginal,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getOptions, languages } from "./config";
import useStoreLanguage from "./use-store-language";
import useStoreLanguageActions from "./use-store-language-actions";
import useLanguage from "./use-language";
import { runsOnServerSide } from "../runs-on-server-side/runs-on-server-side";
import { moduleLocaleResources } from "@/generated/module-locales";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) => {
        const moduleResource = moduleLocaleResources.find(
          (item) => item.language === language && item.namespace === namespace
        );
        return moduleResource
          ? Promise.resolve(moduleResource.resource)
          : import(`./locales/${language}/${namespace}.json`);
      }
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // Let detect the language on client side
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    preload: runsOnServerSide ? languages : [],
  })
  .then(() => {
    for (const { language, namespace, resource } of moduleLocaleResources) {
      i18next.addResourceBundle(
        language,
        namespace,
        resource,
        true,
        true
      );
    }
  });

let hasHydrated = false;
const suspendedNamespaces = new Set<string>();

function canSuspendOn(namespace: string) {
  if (!hasHydrated) return true;

  const key = `${i18next.resolvedLanguage}|${namespace}`;

  if (suspendedNamespaces.has(key)) return false;

  suspendedNamespaces.add(key);

  return true;
}

/**
 * Wrap the `t` function to auto-load namespaces for cross-namespace keys.
 * Keys in format "namespace:key" will trigger loading of "namespace" if not
 * already loaded. This allows components subscribed to one namespace (e.g.,
 * "common") to translate keys from other namespaces (e.g., "module-post:menu")
 * without manually calling `loadNamespaces`.
 */
function wrapTWithNamespaceLoading(
  t: TFunction,
  i18n: ReturnType<typeof useTranslationOriginal>["i18n"]
): TFunction {
  const wrapped = (
    key: string | string[],
    options?: Record<string, unknown>
  ) => {
    // Detect cross-namespace key format: "namespace:key"
    const keyStr = Array.isArray(key) ? key[0] : key;
    const colonIndex = keyStr.indexOf(":");
    if (colonIndex > 0) {
      const ns = keyStr.slice(0, colonIndex);
      const lang = i18n.resolvedLanguage;
      // Only load if not the default namespace and not already loaded
      if (lang && ns !== "common" && !i18n.hasResourceBundle(lang, ns)) {
        // Fire-and-forget: load the namespace for current language
        i18n.loadNamespaces(ns).catch(() => {
          // Silently ignore load failures; original t() will return key as fallback
        });
      }
    }
    return t(key, options);
  };
  return wrapped as TFunction;
}

export function useTranslation(namespace: string | string[], options?: object) {
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const primary = namespaces[0] ?? "common";
  const language = useLanguage();
  const { language: cookies } = useStoreLanguage();
  const { setLanguage: setCookie } = useStoreLanguageActions();
  const { i18n, t } = useTranslationOriginal<typeof namespaces>(namespaces, {
    ...options,
    useSuspense: runsOnServerSide || canSuspendOn(primary),
  });
  const originalInstance = { i18n, t };

  // Wrap t to auto-load cross-namespace keys
  const wrappedT = wrapTWithNamespaceLoading(t, i18n);

  if (runsOnServerSide && language && i18n.resolvedLanguage !== language) {
    i18n.changeLanguage(language);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [activeLanguage, setActiveLanguage] = useState(i18n.resolvedLanguage);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      hasHydrated = true;
    }, []);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (activeLanguage === i18n.resolvedLanguage) return;
      setActiveLanguage(i18n.resolvedLanguage);
    }, [activeLanguage, i18n.resolvedLanguage]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!language || i18n.resolvedLanguage === language) return;
      i18n.changeLanguage(language);
    }, [language, i18n]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (cookies === language) return;
      setCookie(language);
    }, [language, cookies, setCookie]);
  }

  return { ...originalInstance, t: wrappedT };
}
