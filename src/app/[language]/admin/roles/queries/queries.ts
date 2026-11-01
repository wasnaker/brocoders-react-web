import {
  useGetRoleService,
  useGetRolesService,
} from "@/services/api/services/roles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Role } from "@/services/api/types/role";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useQuery } from "@tanstack/react-query";

export const rolesQueryKeys = createQueryKeys(["roles"], {
  list: () => ({
    key: [],
  }),
  detail: (id: Role["id"]) => ({
    key: [id],
  }),
});

/**
 * `GET /v1/roles` mengembalikan array datar (bukan paginasi), jadi `useQuery`
 * sudah cukup — `useInfiniteQuery` hanya relevan untuk endpoint list yang
 * memakai `InfinityPaginationResponseDto` seperti `/v1/permissions`.
 */
export const useGetRolesQuery = () => {
  const fetch = useGetRolesService();

  const query = useQuery({
    queryKey: rolesQueryKeys.list().key,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch(undefined, { signal });

      if (status === HTTP_CODES_ENUM.OK) {
        return data;
      }
    },
    gcTime: 0,
  });

  return query;
};

export const useGetRoleQuery = (id: Role["id"]) => {
  const fetch = useGetRoleService();

  const query = useQuery({
    queryKey: rolesQueryKeys.detail(id).key,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetch({ id }, { signal });

      if (status === HTTP_CODES_ENUM.OK) {
        return data;
      }
    },
    gcTime: 0,
  });

  return query;
};
