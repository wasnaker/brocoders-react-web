"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { AccountTab } from "@/modules/core/tabs/AccountTab";
import { SecurityTab } from "@/modules/core/tabs/SecurityTab";

function EditProfile() {
  return (
    <>
      <AccountTab />
      <SecurityTab />
    </>
  );
}

export default withPageRequiredAuth(EditProfile);
