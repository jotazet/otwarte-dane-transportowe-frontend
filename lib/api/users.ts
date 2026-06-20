import type { ApiListResponse } from "@/lib/api/types";
import { normalizeList } from "@/lib/api/types";
import type { AppRole } from "@/lib/auth/roles";

export const USERS_BASE = "/api/users/";

export function userDetailPath(id: number) {
  return `/api/users/${id}/`;
}

export function userResetPasswordPath(id: number) {
  return `/api/users/${id}/reset-password/`;
}

export const USER_ME = "/api/users/me/";
export const USER_ME_CHANGE_EMAIL = "/api/users/me/change-email/";
export const USER_ME_CHANGE_PASSWORD = "/api/users/me/change-password/";

export const ALL_ASSIGNABLE_ROLES: AppRole[] = [
  "Admin",
  "Blogger",
  "Editor",
  "DataProvider",
  "Helper",
];

export type UserRecord = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
};

export type UserDetail = UserRecord;

export type UserWithGeneratedPassword = UserRecord & {
  generated_password?: string;
};

export type CreateUserBody = {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
};

export type UpdateUserBody = {
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  roles?: string[];
};

export type MeProfile = UserRecord;

export type ChangeEmailBody = {
  current_password: string;
  new_email: string;
};

export type ChangePasswordBody = {
  current_password: string;
  new_password: string;
};

export function normalizeUserList(data: ApiListResponse<UserRecord> | null | undefined): UserRecord[] {
  return normalizeList(data);
}
