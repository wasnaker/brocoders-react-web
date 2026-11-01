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
import { buildUrl } from "@/services/routing/url-builder";

type LinkProps = ComponentProps<typeof NextLink> & {
  ref?: Ref<HTMLAnchorElement>;
};

function resolveInternalPath(pathname: string, language: string): string {
  // buildUrl itself recognizes both canonical admin routes and legacy
  // /{language}/admin-panel routes, so every internal link shares one policy.
  return buildUrl(pathname, {
    locale: language,
    isPublic: true,
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
