"use client";

import { Button } from "@/components/ui/button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostPermissionService } from "@/services/api/services/permissions";
import { useRouter } from "next/navigation";
import { RoleEnum } from "@/services/api/types/role";

type CreateFormData = {
  name: string;
  description: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-permissions-create");

  return yup.object().shape({
    name: yup
      .string()
      .required(
        t("admin-panel-permissions-create:inputs.name.validation.required")
      ),
    description: yup.string().default(""),
  });
};

function CreatePermissionFormActions() {
  const { t } = useTranslation("admin-panel-permissions-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-permissions-create:actions.submit")}
    </Button>
  );
}

function FormCreatePermission() {
  const router = useRouter();
  const fetchPostPermission = usePostPermissionService();
  const { t } = useTranslation("admin-panel-permissions-create");
  const validationSchema = useValidationSchema();

  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostPermission(formData);
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-permissions-create:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(
        t("admin-panel-permissions-create:alerts.permission.success"),
        {
          variant: "success",
        }
      );
      router.push("/admin-panel/permissions");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form onSubmit={onSubmit} autoComplete="create-new-permission">
          <div className="mt-6 mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h1 className="text-xl font-semibold">
                {t("admin-panel-permissions-create:title")}
              </h1>
            </div>

            <div className="col-span-12">
              <FormTextInput<CreateFormData>
                name="name"
                testId="permission-name"
                autoComplete="permission-name"
                label={t("admin-panel-permissions-create:inputs.name.label")}
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<CreateFormData>
                name="description"
                testId="permission-description"
                autoComplete="permission-description"
                label={t(
                  "admin-panel-permissions-create:inputs.description.label"
                )}
              />
            </div>

            <div className="col-span-12">
              <CreatePermissionFormActions />
              <span className="ms-2">
                <Button asChild variant="secondary">
                  <Link href="/admin-panel/permissions">
                    {t("admin-panel-permissions-create:actions.cancel")}
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

function CreatePermission() {
  return <FormCreatePermission />;
}

export default withPageRequiredAuth(CreatePermission, {
  roles: [RoleEnum.ADMIN],
});
