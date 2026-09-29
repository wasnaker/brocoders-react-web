"use client";

import { Button } from "@/components/ui/button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetPermissionService,
  usePatchPermissionService,
} from "@/services/api/services/permissions";
import { useParams } from "next/navigation";
import { RoleEnum } from "@/services/api/types/role";

type EditPermissionFormData = {
  name: string;
  description: string;
};

const useValidationEditPermissionSchema = () => {
  const { t } = useTranslation("admin-panel-permissions-edit");

  return yup.object().shape({
    name: yup
      .string()
      .required(
        t("admin-panel-permissions-edit:inputs.name.validation.required")
      ),
    description: yup.string().default(""),
  });
};

function EditPermissionFormActions() {
  const { t } = useTranslation("admin-panel-permissions-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-permissions-edit:actions.submit")}
    </Button>
  );
}

function FormEditPermission() {
  const params = useParams<{ id: string }>();
  const permissionId = params.id;
  const fetchGetPermission = useGetPermissionService();
  const fetchPatchPermission = usePatchPermissionService();
  const { t } = useTranslation("admin-panel-permissions-edit");
  const validationSchema = useValidationEditPermissionSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditPermissionFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const isNameDirty = methods.getFieldState("name").isDirty;
    const { data, status } = await fetchPatchPermission({
      id: permissionId,
      data: {
        ...formData,
        name: isNameDirty ? formData.name : undefined,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditPermissionFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-permissions-edit:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-permissions-edit:alerts.permission.success"),
        {
          variant: "success",
        }
      );
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: permission } = await fetchGetPermission({
        id: permissionId,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          name: permission?.name ?? "",
          description: permission?.description ?? "",
        });
      }
    };

    getInitialDataForEdit();
  }, [permissionId, reset, fetchGetPermission]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form onSubmit={onSubmit}>
          <div className="mt-6 mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h1 className="text-xl font-semibold">
                {t("admin-panel-permissions-edit:title")}
              </h1>
            </div>

            <div className="col-span-12">
              <FormTextInput<EditPermissionFormData>
                name="name"
                testId="permission-name"
                autoComplete="permission-name"
                label={t("admin-panel-permissions-edit:inputs.name.label")}
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditPermissionFormData>
                name="description"
                testId="permission-description"
                autoComplete="permission-description"
                label={t(
                  "admin-panel-permissions-edit:inputs.description.label"
                )}
              />
            </div>

            <div className="col-span-12">
              <EditPermissionFormActions />
              <span className="ms-2">
                <Button asChild variant="secondary">
                  <Link href="/admin-panel/permissions">
                    {t("admin-panel-permissions-edit:actions.cancel")}
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

function EditPermission() {
  return <FormEditPermission />;
}

export default withPageRequiredAuth(EditPermission, {
  roles: [RoleEnum.ADMIN],
});
