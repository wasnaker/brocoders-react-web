import { useGetPermissionsService } from "@/services/api/services/permissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  PermissionFilterType,
  PermissionSortType,
} from "../permission-filter-types";

export const permissionsQueryKeys = createQueryKeys(["permissions"], {
  list: () => ({
    key: [],
    sub: {
      by: ({
        sort,
        filter,
      }: {
        filter?: PermissionFilterType | undefined;
        sort?: PermissionSortType | undefined;
      }) => ({
        key: [sort, filter],
      }),
    },
  }),
});

export const useGetPermissionsListQuery = ({
  sort,
  filter,
}: {
  filter?: PermissionFilterType | undefined;
  sort?: PermissionSortType | undefined;
} = {}) => {
  const fetch = useGetPermissionsService();

  const query = useInfiniteQuery({
    queryKey: permissionsQueryKeys.list().sub.by({ sort, filter }).key,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { status, data } = await fetch(
        {
          page: pageParam,
          limit: 10,
          sort: sort ? [sort] : undefined,
        },
        {
          signal,
        }
      );

      if (status === HTTP_CODES_ENUM.OK) {
        return {
          data: data.data,
          nextPage: data.hasNextPage ? pageParam + 1 : undefined,
        };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPage;
    },
    gcTime: 0,
  });

  return query;
};
