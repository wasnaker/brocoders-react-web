import { headers } from "next/headers";
import { fallbackLanguage, languages } from "./config";

/** Resolve the language selected by proxy for the current server request. */
export async function getRequestLanguage(): Promise<string> {
  const requestHeaders = await headers();
  const language = requestHeaders.get("x-app-language");

  return languages.includes(language as (typeof languages)[number])
    ? language!
    : fallbackLanguage;
}
