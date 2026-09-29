import { defineModuleManifest } from "@/core/modules/types";
import { RolesTab } from "./tabs/RolesTab";

export default defineModuleManifest({
  alias: "core-settings",
  settingsTabs: [
    {
      slug: "general",
      label: { namespace: "settings", key: "tabs.general" },
      position: 10,
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
      content: { kind: "component", component: RolesTab },
    },
  ],
});
