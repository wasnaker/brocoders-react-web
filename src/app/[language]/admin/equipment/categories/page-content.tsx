"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { CategoriesPage } from "@wasnaker/module-equipment";

function Categories() {
  return <CategoriesPage />;
}
export default withPageRequiredAuth(Categories, {
  permission: "read:equipment",
});
