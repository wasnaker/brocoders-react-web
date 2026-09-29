"use client";

import { useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getManifests } from "@/core/modules/registry";
import { resolveTabs } from "@/core/modules/resolve-tabs";
import { SettingsFieldsTab } from "./SettingsFieldsTab";
import type { I18nLabel } from "@/core/modules/types";
import type { User } from "@/services/api/types/user";
import type { ResolvedTab } from "@/core/modules/resolve-tabs";

function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
}

function TabRenderer({ tab }: { tab: ResolvedTab }) {
  switch (tab.content.kind) {
    case "fields":
      return <SettingsFieldsTab group={tab.slug} fields={tab.content.fields} />;
    case "component":
      return <tab.content.component />;
    default:
      return null;
  }
}

export function SettingsShell({ user }: { user: User | null | undefined }) {
  const { t } = useTranslation("settings");
  const tabs = resolveTabs(getManifests(), "settingsTabs", user);
  const [active, setActive] = useState<string | undefined>(
    tabs.length ? tabs[0].slug : undefined
  );

  if (tabs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No settings available.
      </div>
    );
  }

  return (
    <Tabs
      orientation="vertical"
      value={active}
      onValueChange={setActive}
      className="flex w-full gap-6"
    >
      <TabsList
        variant="line"
        className="h-fit w-full max-w-48 flex-col justify-start rounded-none border-r border-border bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.slug}
            value={tab.slug}
            className="w-full justify-start rounded-none border-r-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            {resolveLabel(tab.label, t)}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.slug} value={tab.slug} className="min-w-0 flex-1">
          <TabRenderer tab={tab} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
