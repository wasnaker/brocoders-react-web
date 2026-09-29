"use client";

import { ProfileShell } from "@/core/shells/ProfileShell";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useAuth from "@/services/auth/use-auth";

function ProfilePage() {
  const { user } = useAuth();
  return <ProfileShell user={user} />;
}

export default withPageRequiredAuth(ProfilePage);
