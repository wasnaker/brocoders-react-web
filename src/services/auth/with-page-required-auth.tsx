"use client";
import { useRouter } from "next/navigation";
import useAuth from "./use-auth";
import React, { FunctionComponent, useEffect } from "react";
import useLanguage from "../i18n/use-language";
import { RoleEnum } from "../api/types/role";

type PropsType = {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type OptionsType = {
  roles: RoleEnum[];
};

function withPageRequiredAuth(
  Component: FunctionComponent<PropsType>,
  options?: OptionsType
) {
  return function WithPageRequiredAuth(props: PropsType) {
    const { user, isLoaded } = useAuth();
    const router = useRouter();
    const language = useLanguage();

    // A page without an explicit role restriction is available to every
    // authenticated account, including module-owned roles (Customer, etc.).
    // Role restrictions remain opt-in for pages that explicitly declare them.
    const allRoles = user?.roles?.length
      ? user.roles
      : user?.role
        ? [user.role]
        : [];
    const hasRequiredRole =
      !options?.roles?.length ||
      allRoles.some((role) => options.roles.includes(Number(role.id)));

    useEffect(() => {
      if (!isLoaded || (user && hasRequiredRole)) return;

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
    }, [user, isLoaded, hasRequiredRole, router, language]);

    return user && hasRequiredRole ? <Component {...props} /> : null;
  };
}

export default withPageRequiredAuth;
