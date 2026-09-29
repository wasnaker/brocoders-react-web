import { defineModuleManifest } from "@/core/modules/types";
import { PostActivityTab } from "./tabs/PostActivityTab";

export default defineModuleManifest({
  alias: "post",
  profileTabs: [
    {
      slug: "post-activity",
      label: { namespace: "module-post", key: "tab_activity" },
      position: 30,
      permission: "read:user",
      content: { kind: "component", component: PostActivityTab },
    },
  ],
});
