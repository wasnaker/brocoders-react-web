import Languages from "lucide-react/dist/esm/icons/languages";
import Palette from "lucide-react/dist/esm/icons/palette";
import Settings2 from "lucide-react/dist/esm/icons/settings-2";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import UsersRound from "lucide-react/dist/esm/icons/users-round";
import { defineModuleManifest } from "@/core/modules/types";
import { RolesTab } from "../tabs/RolesTab";

export default defineModuleManifest({
  alias: "core-settings",
  settingsTabs: [
    {
      slug: "general",
      label: { namespace: "settings", key: "tabs.general" },
      position: 10,
      icon: SlidersHorizontal,
      content: {
        kind: "fields",
        fields: [
          {
            key: "general.appName",
            label: { namespace: "settings", key: "fields.appName.label" },
            type: "text",
            defaultValue: "Boilerplate",
          },
          {
            key: "general.defaultLanguage",
            label: {
              namespace: "settings",
              key: "fields.defaultLanguage.label",
            },
            type: "select",
            defaultValue: "id",
            options: [
              { value: "en" },
              { value: "id" },
              { value: "ko" },
              { value: "ja" },
              { value: "zh" },
            ],
          },
        ],
      },
    },
    {
      slug: "appearance",
      label: { namespace: "settings", key: "tabs.appearance" },
      position: 20,
      icon: Palette,
      content: {
        kind: "fields",
        fields: [
          {
            key: "appearance.theme",
            label: { namespace: "settings", key: "fields.theme.label" },
            type: "select",
            defaultValue: "system",
            options: [
              { value: "light" },
              { value: "dark" },
              { value: "system" },
            ],
          },
        ],
      },
    },
    {
      slug: "language",
      label: { namespace: "settings", key: "tabs.language" },
      position: 30,
      icon: Languages,
      content: {
        kind: "fields",
        fields: [
          {
            key: "language.default",
            label: {
              namespace: "settings",
              key: "fields.defaultLanguage.label",
            },
            type: "select",
            defaultValue: "id",
            options: [
              { value: "en" },
              { value: "id" },
              { value: "ko" },
              { value: "ja" },
              { value: "zh" },
            ],
          },
        ],
      },
    },
    {
      slug: "roles",
      label: { namespace: "settings", key: "tabs.roles" },
      position: 90,
      icon: UsersRound,
      content: { kind: "component", component: RolesTab },
    },
    {
      slug: "misc",
      label: { namespace: "settings", key: "tabs.misc" },
      position: 100,
      icon: Settings2,
      content: {
        kind: "fields",
        fields: [
          {
            key: "misc.defaultPageSize",
            label: {
              namespace: "settings",
              key: "fields.defaultPageSize.label",
            },
            help: { namespace: "settings", key: "fields.defaultPageSize.help" },
            type: "select",
            defaultValue: 20,
            options: [
              { value: "10" },
              { value: "20" },
              { value: "50" },
              { value: "100" },
            ],
          },
          {
            key: "misc.maxApiLimit",
            label: { namespace: "settings", key: "fields.maxApiLimit.label" },
            help: { namespace: "settings", key: "fields.maxApiLimit.help" },
            type: "select",
            defaultValue: 50,
            options: [
              { value: "50" },
              { value: "100" },
              { value: "500" },
              { value: "1000" },
            ],
          },
          {
            key: "misc.dashboardWidgetsEnabled",
            label: {
              namespace: "settings",
              key: "fields.dashboardWidgetsEnabled.label",
            },
            help: {
              namespace: "settings",
              key: "fields.dashboardWidgetsEnabled.help",
            },
            type: "boolean",
            defaultValue: true,
          },
          {
            key: "misc.staleTimeSeconds",
            label: {
              namespace: "settings",
              key: "fields.staleTimeSeconds.label",
            },
            help: {
              namespace: "settings",
              key: "fields.staleTimeSeconds.help",
            },
            type: "select",
            defaultValue: 60,
            options: [{ value: "30" }, { value: "60" }, { value: "300" }],
          },
        ],
      },
    },
  ],
});
