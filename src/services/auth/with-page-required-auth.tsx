"use client";
import { useRouter } from "next/navigation";
import useAuth from "./use-auth";
import React, { FunctionComponent, useEffect } from "react";
import useLanguage from "../i18n/use-language";
import { can } from "@/core/modules/can";

type PropsType = {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type OptionsType = {
  permission?: string;
  /** Optional database role IDs retained for legacy protected pages. */
  roles?: readonly (number | string)[];
};

function withPageRequiredAuth(
  Component: FunctionComponent<PropsType>,
  options?: OptionsType
) {
  return function WithPageRequiredAuth(props: PropsType) {
    const { user, isLoaded } = useAuth();
    const router = useRouter();
    const language = useLanguage();

    const assignedRoles = user?.roles?.length
      ? user.roles
      : user?.role
        ? [user.role]
        : [];
    const hasRequiredRole =
      !options?.roles?.length ||
      assignedRoles.some((role) =>
        options.roles?.some((requiredRole) => Number(requiredRole) === Number(role.id))
      );
    const hasAccess =
      (!options?.permission || can(options.permission, user)) && hasRequiredRole;

    useEffect(() => {
      if (!isLoaded || (user && hasAccess)) return;

      const currentLocation = window.location.toString();
      const returnToPath =
        currentLocation.replace(new URL(currentLocation).origin, "") ||
        `/${language}`;
      const params = new URLSearchParams({
        returnTo: returnToPath,
      });

      const redirectTo = user
        ? `/${language}`
        : `/${language}/sign-in?${params.toString()}`;
      router.replace(redirectTo);
    }, [user, isLoaded, hasAccess, router, language]);

    return user && hasAccess ? <Component {...props} /> : null;
  };
}

export default withPageRequiredAuth;
