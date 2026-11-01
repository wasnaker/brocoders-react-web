"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useProvinces } from "../hooks/use-regions";
import { useCreateRegency, useUpdateRegency } from "../hooks/use-regions";
import { REGENCY_TYPES } from "../types/region";
import type { Regency, Province } from "../types/region";

interface RegencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Regency | null;
  /** Pre-selected provinceId when creating from province detail */
  defaultProvinceId?: Province["id"] | null;
  onSuccess: (savedId: Regency["id"]) => void;
}

interface FormState {
  provinceId: string;
  name: string;
  type: "kabupaten" | "kota";
  isActive: boolean;
}

interface FormErrors {
  provinceId?: string;
  name?: string;
  type?: string;
}

export function RegencyFormDialog({
  open,
  onOpenChange,
  editItem,
  defaultProvinceId,
  onSuccess,
}: RegencyFormDialogProps) {
  const { t } = useTranslation("module-region");
  const createMutation = useCreateRegency();
  const updateMutation = useUpdateRegency();
  const { data: provincesData } = useProvinces(1, 200);

  const isEditing = Boolean(editItem);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<FormState>({
    provinceId: "",
    name: "",
    type: "kabupaten",
    isActive: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setForm({
        provinceId: editItem
          ? String(editItem.provinceId)
          : defaultProvinceId != null
            ? String(defaultProvinceId)
            : "",
        name: editItem?.name ?? "",
        type: editItem?.type ?? "kabupaten",
        isActive: editItem?.isActive ?? true,
      });
      setErrors({});
    }
  }, [open, editItem, defaultProvinceId]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.provinceId) e.provinceId = t("form.validation.required");
    if (!form.name.trim()) e.name = t("form.validation.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      provinceId: Number(form.provinceId),
      name: form.name.trim(),
      type: form.type,
      isActive: form.isActive,
    };

    let savedId: Regency["id"] | undefined;
    if (isEditing && editItem) {
      const result = await updateMutation.mutateAsync({
        id: editItem.id,
        data: payload,
      });
      savedId = result.id;
    } else {
      const result = await createMutation.mutateAsync(payload);
      savedId = result.id;
    }

    onOpenChange(false);
    if (savedId != null) onSuccess(savedId);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const provinces = provincesData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("actions.edit_regency") : t("actions.create_regency")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Province */}
          <div className="space-y-1.5">
            <Label htmlFor="regency-province">
              {t("form.field.province")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.provinceId}
              onValueChange={(v) => setField("provinceId", v)}
            >
              <SelectTrigger
                id="regency-province"
                aria-invalid={Boolean(errors.provinceId)}
              >
                <SelectValue placeholder={t("form.placeholder.province")} />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provinceId && (
              <p className="text-xs text-destructive">{errors.provinceId}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="regency-name">
              {t("form.field.name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="regency-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={t("form.placeholder.name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="regency-type">{t("form.field.type")}</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setField("type", v as "kabupaten" | "kota")}
            >
              <SelectTrigger id="regency-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGENCY_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* isActive */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="regency-active"
              checked={form.isActive}
              onCheckedChange={(v) => setField("isActive", Boolean(v))}
            />
            <Label
              htmlFor="regency-active"
              className="cursor-pointer text-sm font-normal"
            >
              {t("form.field.isActive")}
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}