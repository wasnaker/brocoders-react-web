import CircleUser from "lucide-react/dist/esm/icons/circle-user";
import Shield from "lucide-react/dist/esm/icons/shield";
import { defineModuleManifest } from "@/core/modules/types";
import { AccountTab } from "./tabs/AccountTab";
import { SecurityTab } from "./tabs/SecurityTab";

export default defineModuleManifest({
  alias: "core-profile",
  profileTabs: [
    {
      slug: "account",
      label: { namespace: "profile", key: "tabs.account" },
      position: 10,
      icon: CircleUser,
      content: { kind: "component", component: AccountTab },
    },
    {
      slug: "security",
      label: { namespace: "profile", key: "tabs.security" },
      position: 20,
      icon: Shield,
      content: { kind: "component", component: SecurityTab },
    },
  ],
});
