"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import FormTextInput from "@/components/form/text-input/form-text-input";
import FormSelectInput from "@/components/form/select/form-select";
import FormCheckboxBooleanInput from "@/components/form/checkbox-boolean/form-checkbox-boolean";
import { useTranslation } from "@/services/i18n/client";
import { useSnackbar } from "@/hooks/use-snackbar";
import { FieldDef, FieldOption, I18nLabel } from "@/core/modules/types";
import {
  SettingsPatchItem,
  SettingsResponse,
  useGetSettingsService,
  usePatchSettingsService,
} from "@/services/api/services/settings";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

type SettingsFormValue =
  | string
  | boolean
  | FieldOption
  | FieldOption[]
  | undefined;

type SettingsFormValues = Record<string, SettingsFormValue>;

function resolveLabel(label: I18nLabel, t: (key: string) => string): string {
  if (typeof label === "string") return label;
  return t(`${label.namespace}:${label.key}`);
}

function resolveOption(
  field: FieldDef,
  raw: string | undefined
): FieldOption | undefined {
  if (raw === undefined || raw === "") return undefined;
  return field.options?.find((option) => option.value === raw);
}

function resolveMultiOptions(
  field: FieldDef,
  raw: string | undefined
): FieldOption[] {
  if (raw === undefined || raw === "") return [];
  try {
    const values: string[] = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values
      .map((v) => field.options?.find((o) => o.value === v))
      .filter((o): o is FieldOption => o !== undefined);
  } catch {
    return [];
  }
}

function normalizeValue(field: FieldDef, value: SettingsFormValue): string {
  switch (field.type) {
    case "boolean":
      return String(value === true);
    case "select":
      return (value as FieldOption | undefined)?.value ?? "";
    case "multiselect":
      return JSON.stringify(
        (value as FieldOption[] | undefined)?.map((o) => o.value) ?? []
      );
    default:
      return String(value ?? "");
  }
}

function buildDefaultValues(
  fields: FieldDef[],
  settingsByKey: Map<string, SettingsResponse[number]>
): SettingsFormValues {
  const result: SettingsFormValues = {};

  for (const field of fields) {
    const dbRow = settingsByKey.get(field.key);
    const raw = dbRow?.value;

    switch (field.type) {
      case "boolean": {
        const source = raw !== undefined ? raw : field.defaultValue;
        result[field.key] = source === true || source === "true";
        break;
      }
      case "select": {
        const source = raw !== undefined ? raw : field.defaultValue;
        result[field.key] = resolveOption(field, String(source ?? ""));
        break;
      }
      case "multiselect": {
        const source = raw !== undefined ? raw : field.defaultValue;
        result[field.key] = resolveMultiOptions(field, String(source ?? ""));
        break;
      }
      default: {
        const source = raw !== undefined ? raw : field.defaultValue;
        result[field.key] = String(source ?? "");
        break;
      }
    }
  }

  return result;
}

function SettingsFieldsTabInner({
  group,
  fields,
}: {
  group: string;
  fields: FieldDef[];
}) {
  const { t } = useTranslation("settings");
  const { enqueueSnackbar } = useSnackbar();
  const fetchGetSettings = useGetSettingsService();
  const fetchPatchSettings = usePatchSettingsService();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SettingsResponse>({
    queryKey: ["settings", group],
    queryFn: async ({ signal }) => {
      const response = await fetchGetSettings({ group }, { signal });

      if (response.status === HTTP_CODES_ENUM.OK) {
        return response.data;
      }

      return [];
    },
    enabled: !!group,
  });

  const settingsByKey = useMemo(() => {
    const map = new Map<string, SettingsResponse[number]>();
    for (const row of data ?? []) {
      map.set(row.key, row);
    }
    return map;
  }, [data]);

  const defaultValues = useMemo(
    () => buildDefaultValues(fields, settingsByKey),
    [fields, settingsByKey]
  );

  const initialValuesRef = useRef<SettingsFormValues | null>(null);

  const methods = useForm<SettingsFormValues>({
    defaultValues,
  });

  const { reset, handleSubmit } = methods;
  const { isSubmitting } = useFormState({ control: methods.control });

  useEffect(() => {
    reset(defaultValues);
    initialValuesRef.current = defaultValues;
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (formValues) => {
    const initial = initialValuesRef.current;
    if (!initial) return;

    const items: SettingsPatchItem[] = [];

    for (const field of fields) {
      const initialValue = initial[field.key];
      const currentValue = formValues[field.key];

      if (
        normalizeValue(field, initialValue) ===
        normalizeValue(field, currentValue)
      ) {
        continue;
      }

      let value = "";

      switch (field.type) {
        case "boolean":
          value = String(currentValue === true);
          break;
        case "select":
          value = (currentValue as FieldOption | undefined)?.value ?? "";
          break;
        case "multiselect":
          value = JSON.stringify(
            (currentValue as FieldOption[] | undefined)?.map((o) => o.value) ??
              []
          );
          break;
        default:
          value = String(currentValue ?? "");
      }

      items.push({
        key: field.key,
        value,
        type: field.type,
        group,
        moduleAlias: null,
      });
    }

    if (items.length === 0) {
      enqueueSnackbar(t("settings:saved"), { variant: "success" });
      return;
    }

    const { status } = await fetchPatchSettings({ items });

    if (status === HTTP_CODES_ENUM.OK) {
      enqueueSnackbar(t("settings:saved"), { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  });

  if (isLoading) {
    return (
      <div className="empty-state__skeleton">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="form__error">{error.message || t("settings:error")}</p>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="form" autoComplete="settings">
        <div className="form__fields">
          {fields.map((field) => {
            const label = resolveLabel(field.label, t);
            const key = field.key;

            let fieldElement: React.ReactNode = null;

            switch (field.type) {
              case "textarea":
                fieldElement = (
                  <FormTextInput<SettingsFormValues>
                    name={key}
                    label={label}
                    multiline
                  />
                );
                break;
              case "boolean":
                fieldElement = (
                  <FormCheckboxBooleanInput<SettingsFormValues>
                    name={key}
                    label={label}
                  />
                );
                break;
              case "select":
              case "multiselect":
                fieldElement = (
                  <FormSelectInput<SettingsFormValues, FieldOption>
                    name={key}
                    label={label}
                    keyValue="value"
                    options={field.options ?? []}
                    renderOption={(option) => {
                      if (!option.label) return option.value;
                      return resolveLabel(option.label, t);
                    }}
                  />
                );
                break;
              default:
                fieldElement = (
                  <FormTextInput<SettingsFormValues>
                    name={key}
                    label={label}
                    type={field.type === "number" ? "number" : "text"}
                  />
                );
            }

            return (
              <div key={key} className="form-field">
                {fieldElement}
                {field.help ? (
                  <p className="form-field__help">
                    {resolveLabel(field.help, t)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="form__actions">
          <Button type="submit" disabled={isSubmitting}>
            {t("settings:submit")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export function SettingsFieldsTab({
  group,
  fields,
}: {
  group: string;
  fields: FieldDef[];
}) {
  return (
    <Suspense
      fallback={
        <div className="empty-state__skeleton">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      }
    >
      <SettingsFieldsTabInner group={group} fields={fields} />
    </Suspense>
  );
}

export default SettingsFieldsTab;
