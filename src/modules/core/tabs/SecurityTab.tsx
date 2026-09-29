"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import FormTextInput from "@/components/form/text-input/form-text-input";
import Link from "@/components/link";
import { useAuthPatchMeService } from "@/services/api/services/auth";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { UserProviderEnum } from "@/services/api/types/user";

type EditProfileChangeEmailFormData = {
  email: string;
  emailConfirmation: string;
};

type EditProfileChangePasswordFormData = {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
};

const useValidationChangeEmailSchema = () => {
  const { t } = useTranslation("profile");
  const { user } = useAuth();

  return yup.object().shape({
    email: yup
      .string()
      .notOneOf(
        [user?.email],
        t("profile:inputs.email.validation.currentEmail")
      )
      .email(t("profile:inputs.email.validation.email"))
      .required(t("profile:inputs.email.validation.required")),
    emailConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("email")],
        t("profile:inputs.emailConfirmation.validation.match")
      )
      .required(t("profile:inputs.emailConfirmation.validation.required")),
  });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    oldPassword: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    password: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("profile:inputs.passwordConfirmation.validation.match")
      )
      .required(t("profile:inputs.passwordConfirmation.validation.required")),
  });
};

function ChangeEmailFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-email">
      {t("profile:actions.submit")}
    </Button>
  );
}

function ChangePasswordFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-password">
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormChangeEmail() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangeEmailSchema();
  const { user } = useAuth();

  const methods = useForm<EditProfileChangeEmailFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      emailConfirmation: "",
    },
  });

  const { handleSubmit, reset, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      email: formData.email,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileChangeEmailFormData>
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
      reset();

      enqueueSnackbar(t("profile:alerts.email.success"), {
        variant: "success",
        autoHideDuration: 15000,
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form onSubmit={onSubmit}>
          <div className="mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title2")}</h2>
            </div>
            <div className="col-span-12">
              <p>{user?.email}</p>
            </div>
            <div className="col-span-12">
              <FormTextInput<EditProfileChangeEmailFormData>
                name="email"
                label={t("profile:inputs.email.label")}
                type="email"
                testId="email"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangeEmailFormData>
                name="emailConfirmation"
                label={t("profile:inputs.emailConfirmation.label")}
                type="email"
                testId="email-confirmation"
              />
            </div>

            <div className="col-span-12">
              <ChangeEmailFormActions />
              <span className="ms-2">
                <Button
                  asChild
                  variant="secondary"
                  data-testid="cancel-edit-email"
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

function FormChangePassword() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileChangePasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      password: formData.password,
      oldPassword: formData.oldPassword,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<
          keyof EditProfileChangePasswordFormData
        >
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
      reset();

      enqueueSnackbar(t("profile:alerts.password.success"), {
        variant: "success",
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form onSubmit={onSubmit}>
          <div className="mb-4 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title3")}</h2>
            </div>
            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="oldPassword"
                label={t("profile:inputs.oldPassword.label")}
                type="password"
                testId="old-password"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="password"
                label={t("profile:inputs.password.label")}
                type="password"
                testId="new-password"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="passwordConfirmation"
                label={t("profile:inputs.passwordConfirmation.label")}
                type="password"
                testId="password-confirmation"
              />
            </div>

            <div className="col-span-12">
              <ChangePasswordFormActions />
              <span className="ms-2">
                <Button
                  asChild
                  variant="secondary"
                  data-testid="cancel-edit-password"
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

function FormChangeEmailWrapper() {
  const { user } = useAuth();

  return user?.provider === UserProviderEnum.EMAIL ? <FormChangeEmail /> : null;
}

function FormChangePasswordWrapper() {
  const { user } = useAuth();

  return user?.provider === UserProviderEnum.EMAIL ? (
    <FormChangePassword />
  ) : null;
}

export function SecurityTab() {
  return (
    <>
      <FormChangeEmailWrapper />
      <FormChangePasswordWrapper />
    </>
  );
}

export default SecurityTab;
