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
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  if (tabs.length === 0) {
    return (
      <div className="page-content--narrow">
        <div className="empty-state">No profile sections available.</div>
      </div>
    );
  }

  return (
    <div className="page-content--narrow">
      {/* Identity block */}
      <div className="identity-block">
        <div className="identity-block__media">
          <Avatar className="size-40" data-testid="user-icon">
            <AvatarImage src={user?.photo?.path} alt={fullName} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="identity-block__details">
          <h1 className="page-title mb-2" data-testid="user-name">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="page-subtitle mb-4" data-testid="user-email">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Vertical tabs: navigation on the left, content on the right. */}
      <Tabs
        orientation="vertical"
        value={active}
        onValueChange={setActive}
        className="tabs-shell"
      >
        <TabsList variant="line" className="tabs-shell__list">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.slug}
                value={tab.slug}
                className="tabs-shell__trigger"
              >
                {Icon ? <Icon /> : null}
                {resolveLabel(tab.label, t)}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.slug}
            value={tab.slug}
            className="tabs-shell__content"
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
