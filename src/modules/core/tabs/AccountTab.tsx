"use client";

import { useEffect } from "react";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import FormTextInput from "@/components/form/text-input/form-text-input";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import Link from "@/components/link";
import { useAuthPatchMeService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { FileEntity } from "@/services/api/types/file-entity";

type EditProfileBasicInfoFormData = {
  firstName: string;
  lastName: string;
  photo?: FileEntity;
};

const useValidationBasicInfoSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    firstName: yup
      .string()
      .required(t("profile:inputs.firstName.validation.required")),
    lastName: yup
      .string()
      .required(t("profile:inputs.lastName.validation.required")),
  });
};

function BasicInfoFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-profile">
      {t("profile:actions.submit")}
    </Button>
  );
}

export function AccountTab() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationBasicInfoSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileBasicInfoFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: undefined,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileBasicInfoFormData>
      ).forEach((key) => {
        setError(key, {
          type: "manual",
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      setUser(data);

      enqueueSnackbar(t("profile:alerts.profile.success"), {
        variant: "success",
      });
    }
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      photo: user?.photo,
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form onSubmit={onSubmit}>
          <div className="mt-6 mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title1")}</h2>
            </div>
            <div className="col-span-12">
              <FormAvatarInput<EditProfileBasicInfoFormData>
                name="photo"
                testId="photo"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileBasicInfoFormData>
                name="firstName"
                label={t("profile:inputs.firstName.label")}
                testId="first-name"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileBasicInfoFormData>
                name="lastName"
                label={t("profile:inputs.lastName.label")}
                testId="last-name"
              />
            </div>

            <div className="col-span-12">
              <BasicInfoFormActions />
              <span className="ms-2">
                <Button
                  asChild
                  variant="secondary"
                  data-testid="cancel-edit-profile"
                >
                  <Link href="/profile">{t("profile:actions.cancel")}</Link>
                </Button>
              </span>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

export default AccountTab;
