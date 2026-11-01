"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormProvider, useForm, useFormState, useWatch } from "react-hook-form";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import Link from "@/components/link";
import { useSnackbar } from "@/hooks/use-snackbar";
import { usePatchRolePermissionsService } from "@/services/api/services/roles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import type { Permission } from "@/services/api/types/permission";
import { RoleEnum } from "@/services/api/types/role";
import { SortEnum } from "@/services/api/types/sort-type";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import useLeavePage from "@/services/leave-page/use-leave-page";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useGetPermissionsListQuery } from "../../../permissions/queries/queries";
import { useGetRoleQuery, rolesQueryKeys } from "../../queries/queries";

type EditRoleFormData = {
  permissionIds: string[];
};

type PermissionGroup = {
  name: string;
  permissions: Permission[];
};

/**
 * Permission names are `action:resource` (e.g. `create:post`), so the segment
 * before the first `:` makes a stable grouping key. Names without a separator
 * land in `otherGroupName` instead of creating a group per permission.
 */
function groupPermissionsByPrefix(
  permissions: Permission[],
  otherGroupName: string
): PermissionGroup[] {
  const groups = new Map<string, Permission[]>();

  permissions.forEach((permission) => {
    const separatorIndex = permission.name.indexOf(":");
    const groupName =
      separatorIndex === -1
        ? otherGroupName
        : permission.name.slice(0, separatorIndex);
    const group = groups.get(groupName);

    if (group) {
      group.push(permission);
      return;
    }

    groups.set(groupName, [permission]);
  });

  return [...groups.entries()].map(([name, groupPermissions]) => ({
    name,
    permissions: groupPermissions,
  }));
}

function EditRoleFormActions({ isProtected }: { isProtected: boolean }) {
  const { t } = useTranslation("admin-panel-roles");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting || isProtected}>
      {t("admin-panel-roles:form.submit")}
    </Button>
  );
}

function EditRoleForm() {
  const params = useParams<{ id: string }>();
  const roleId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin-panel-roles");
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const fetchPatchRolePermissions = usePatchRolePermissionsService();

  // The admin role must never lose its permissions through this page: emptying
  // it locks every administrator out of the panel. The form is disabled rather
  // than trusted to round-trip whatever is currently selected.
  const isProtected = Number(roleId) === RoleEnum.ADMIN;

  const { data: role, isLoading: isRoleLoading } = useGetRoleQuery(roleId);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPermissionsListQuery({
      sort: { order: SortEnum.ASC, orderBy: "name" },
    });

  // The shared permissions query is an infinite query (10 per page) driven by
  // `endReached` on the list page's virtualised table. A form has no scroll
  // container, so the remaining pages are drained here — otherwise the
  // checklist would only ever show the first ten permissions.
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const permissions = useMemo<Permission[]>(
    () => data?.pages.flatMap((page) => page?.data ?? []) ?? [],
    [data]
  );

  const initialPermissionIds = useMemo(
    () => (role?.permissions ?? []).map((permission) => String(permission.id)),
    [role]
  );

  const methods = useForm<EditRoleFormData>({
    defaultValues: {
      permissionIds: [],
    },
  });

  const { handleSubmit, reset, setValue } = methods;

  useEffect(() => {
    if (!role) {
      return;
    }

    reset({ permissionIds: initialPermissionIds });
  }, [role, initialPermissionIds, reset]);

  const selectedPermissionIds = useWatch({
    control: methods.control,
    name: "permissionIds",
  });

  const permissionGroups = useMemo(
    () =>
      groupPermissionsByPrefix(
        permissions,
        t("admin-panel-roles:form.groupOther")
      ),
    [permissions, t]
  );

  const togglePermission = (permission: Permission) => {
    const id = String(permission.id);
    const currentValue = selectedPermissionIds ?? [];
    const isSelected = currentValue.includes(id);
    const nextValue = isSelected
      ? currentValue.filter((selected) => selected !== id)
      : [...currentValue, id];

    setValue("permissionIds", nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = handleSubmit(async (formData) => {
    if (isProtected) {
      return;
    }

    const isConfirmed = await confirmDialog({
      title: t("admin-panel-roles:confirm.save.title"),
      message: t("admin-panel-roles:confirm.save.message"),
    });

    if (!isConfirmed) {
      return;
    }

    // `Permission["id"]` is typed `number | string`, while the endpoint
    // validates `@IsNumber(undefined, { each: true }) permissionIds: number[]`.
    // Sending the raw id typechecks fine and then fails with 422 at runtime, so
    // the cast happens here — the only place that talks to the API.
    const permissionIds = formData.permissionIds.map((permissionId) =>
      Number(permissionId)
    );

    const { status } = await fetchPatchRolePermissions({
      id: roleId,
      data: { permissionIds },
    });

    if (status === HTTP_CODES_ENUM.OK) {
      await queryClient.invalidateQueries({
        queryKey: rolesQueryKeys.all().key,
      });
      reset({ permissionIds: formData.permissionIds });
      enqueueSnackbar(t("admin-panel-roles:alerts.success.permissions"), {
        variant: "success",
      });
      router.push("/admin/roles");
    }
  });

  if (isRoleLoading) {
    return (
      <div className="empty-state">{t("admin-panel-roles:form.loading")}</div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-3xl px-4">
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-grid form-grid--page">
            <div className="form-grid__cell">
              <h1 className="form-title">
                {t("admin-panel-roles:form.editTitle", {
                  roleName: role?.name ?? "",
                })}
              </h1>
            </div>

            {isProtected && (
              <div
                role="alert"
                className="form-grid__cell alert alert--error p-3"
              >
                <p className="alert__title">
                  {t("admin-panel-roles:form.adminWarning.title")}
                </p>
                <p className="alert__body">
                  {t("admin-panel-roles:form.adminWarning.message")}
                </p>
              </div>
            )}

            <div className="form-grid__cell">
              <Label>{t("admin-panel-roles:form.permissionsLabel")}</Label>
            </div>

            {permissionGroups.length === 0 && (
              <div className="form-grid__cell empty-state">
                {t("admin-panel-roles:alerts.empty.permissions")}
              </div>
            )}

            {permissionGroups.map((group) => (
              <fieldset
                key={group.name}
                className="form-grid__cell form-fieldset"
                disabled={isProtected}
              >
                <legend className="form-fieldset__legend">{group.name}</legend>
                {group.permissions.map((permission) => {
                  const id = `permission-${permission.id}`;

                  return (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={
                          selectedPermissionIds?.includes(
                            String(permission.id)
                          ) ?? false
                        }
                        disabled={isProtected}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      <Label htmlFor={id}>{permission.name}</Label>
                    </div>
                  );
                })}
              </fieldset>
            ))}

            <div className="form-grid__cell">
              <EditRoleFormActions isProtected={isProtected} />
              <span className="ms-2">
                <Button asChild variant="secondary">
                  <Link href="/admin/roles">
                    {t("admin-panel-roles:form.cancel")}
                  </Link>
                </Button>
              </span>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function EditRole() {
  return <EditRoleForm />;
}

export default withPageRequiredAuth(EditRole, { roles: [RoleEnum.ADMIN] });
