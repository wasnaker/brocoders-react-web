"use client";

import { useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getManifests } from "@/core/modules/registry";
import { resolveTabs } from "@/core/modules/resolve-tabs";
import type { I18nLabel } from "@/core/modules/types";
import type { User } from "@/services/api/types/user";

function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  return typeof label === "string"
    ? label
    : t(`${label.namespace}:${label.key}`);
}

export function ProfileShell({ user }: { user: User | null | undefined }) {
  const { t } = useTranslation("profile");
  const tabs = resolveTabs(getManifests(), "profileTabs", user);
  const [active, setActive] = useState<string | undefined>(
    tabs.length ? tabs[0].slug : undefined
  );
  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  if (tabs.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="py-8 text-center text-muted-foreground">
          No profile sections available.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      {/* Identity block */}
      <div className="flex gap-6 pt-6 pb-4">
        <div>
          <Avatar className="size-40" data-testid="user-icon">
            <AvatarImage
              src={user?.photo?.path}
              alt={user?.firstName + " " + user?.lastName}
            />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow">
          <h1 className="mb-2 text-3xl font-semibold" data-testid="user-name">
            {user?.firstName} {user?.lastName}
          </h1>
          <p
            className="mb-4 text-xl text-muted-foreground"
            data-testid="user-email"
          >
            {user?.email}
          </p>
        </div>
      </div>

      {/* Vertical tabs: navigation on the left, content on the right. */}
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
          <TabsContent
            key={tab.slug}
            value={tab.slug}
            className="min-w-0 flex-1"
          >
            {tab.content.kind === "component" ? (
              <tab.content.component />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
