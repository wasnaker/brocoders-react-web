import { FileEntity } from "./file-entity";
import { Role } from "./role";

export enum UserProviderEnum {
  EMAIL = "email",
  GOOGLE = "google",
}

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: FileEntity;
  provider?: UserProviderEnum;
  socialId?: string;
  language?: string | null;
  /** Legacy single role retained during API migration. */
  role?: Role;
  /** Canonical role assignments. */
  roles?: Role[];
};
