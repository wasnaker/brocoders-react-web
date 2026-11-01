"use client";

import useLanguage from "@/services/i18n/use-language";
import {
  LeavePageActionsContext,
  LeavePageContext,
} from "@/services/leave-page/leave-page-context";
// Need for leave page logic
// eslint-disable-next-line no-restricted-imports
import NextLink from "next/link";
import { ComponentProps, Ref, useContext } from "react";
import { languages } from "@/services/i18n/config";
import { buildUrl } from "@/services/routing/url-builder";

type LinkProps = ComponentProps<typeof NextLink> & {
  ref?: Ref<HTMLAnchorElement>;
};

function isAdminDestination(pathname: string): boolean {
  const segments = pathname.split(/[/?#]/)[0].split("/").filter(Boolean);
  if (segments[0] === "admin") return true;
  return (
    segments.length > 1 &&
    languages.some((language) => language === segments[0]) &&
    segments[1] === "admin"
  );
}

function resolveInternalPath(pathname: string, language: string): string {
  return buildUrl(pathname, {
    locale: language,
    isPublic: !isAdminDestination(pathname),
  });
}

function resolveHref(
  href: ComponentProps<typeof NextLink>["href"],
  language: string
): ComponentProps<typeof NextLink>["href"] {
  if (typeof href === "string") {
    if (!href.startsWith("/") || href.startsWith("//")) return href;
    return resolveInternalPath(href, language);
  }

  if (href && typeof href === "object" && "pathname" in href) {
    const pathname = href.pathname;
    if (
      typeof pathname !== "string" ||
      !pathname.startsWith("/") ||
      pathname.startsWith("//")
    ) {
      return href;
    }

    return {
      ...href,
      pathname: resolveInternalPath(pathname, language),
    };
  }

  return href;
}

function Link(props: LinkProps) {
  const language = useLanguage();
  const { isLeavePage } = useContext(LeavePageContext);
  const { setLeavePage, openModal } = useContext(LeavePageActionsContext);
  const href = resolveHref(props.href, language);

  return (
    <NextLink
      ref={props.ref}
      {...props}
      href={href}
      onClick={(e) => {
        if (isLeavePage) {
          e.preventDefault();
          setLeavePage({
            [props.replace ? "replace" : "push"]: href,
          });
          openModal();
        } else {
          props.onClick?.(e);
        }
      }}
    />
  );
}

export default Link;
