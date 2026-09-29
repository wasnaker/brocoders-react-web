"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import {
  useGetPermissionsListQuery,
  permissionsQueryKeys,
} from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import TableComponents from "@/components/table/table-components";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Permission } from "@/services/api/types/permission";
import Link from "@/components/link";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDeletePermissionsService } from "@/services/api/services/permissions";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PermissionFilterType,
  PermissionSortType,
} from "./permission-filter-types";
import { SortEnum } from "@/services/api/types/sort-type";

type PermissionKeys = keyof Permission;

function TableSortCellWrapper(
  props: PropsWithChildren<{
    width?: number;
    orderBy: PermissionKeys;
    order: SortEnum;
    column: PermissionKeys;
    handleRequestSort: (
      event: MouseEvent<HTMLButtonElement>,
      property: PermissionKeys
    ) => void;
  }>
) {
  const isActive = props.orderBy === props.column;

  return (
    <TableHead style={{ width: props.width }}>
      <button
        type="button"
        onClick={(event) => props.handleRequestSort(event, props.column)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      >
        {props.children}
        {isActive ? (
          props.order === SortEnum.ASC ? (
            <ArrowUp className="size-4" />
          ) : (
            <ArrowDown className="size-4" />
          )
        ) : (
          <ChevronsUpDown className="size-4 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

function Actions({ permission }: { permission: Permission }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchPermissionDelete = useDeletePermissionsService();
  const queryClient = useQueryClient();
  const canDelete = true; // Permissions can always be deleted (no self-delete restriction like users)
  const { t: tPermissions } = useTranslation("admin-panel-permissions");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: tPermissions("admin-panel-permissions:confirm.delete.title"),
      message: tPermissions("admin-panel-permissions:confirm.delete.message"),
    });

    if (isConfirmed) {
      const searchParams = new URLSearchParams(window.location.search);
      const searchParamsFilter = searchParams.get("filter");
      const searchParamsSort = searchParams.get("sort");

      let filter: PermissionFilterType | undefined = undefined;
      let sort: PermissionSortType | undefined = {
        order: SortEnum.DESC,
        orderBy: "id",
      };

      if (searchParamsFilter) {
        filter = JSON.parse(searchParamsFilter);
      }
      if (searchParamsSort) {
        sort = JSON.parse(searchParamsSort);
      }

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: Permission[] }>
      >(permissionsQueryKeys.list().sub.by({ sort, filter }).key);

      await queryClient.cancelQueries({
        queryKey: permissionsQueryKeys.list().key,
      });

      const newData = {
        ...previousData,
        pages: previousData?.pages.map(
          (page: { nextPage: number; data: Permission[] }) => ({
            ...page,
            data: page?.data.filter((item) => item.id !== permission.id),
          })
        ),
      };

      queryClient.setQueryData(
        permissionsQueryKeys.list().sub.by({ sort, filter }).key,
        newData
      );

      await fetchPermissionDelete({
        id: permission.id,
      });
    }
  };

  const editButton = (
    <Button asChild size="sm" className={canDelete ? "rounded-e-none" : ""}>
      <Link href={`/admin-panel/permissions/edit/${permission.id}`}>
        {tPermissions("admin-panel-permissions:actions.edit")}
      </Link>
    </Button>
  );

  if (!canDelete) {
    return editButton;
  }

  return (
    <div className="inline-flex items-center">
      {editButton}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            aria-label="more actions"
            className="rounded-s-none border-s border-s-primary-foreground/20 px-2"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            {tPermissions("admin-panel-permissions:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Permissions() {
  const { t: tPermissions } = useTranslation("admin-panel-permissions");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: PermissionKeys;
  }>(() => {
    const searchParamsSort = searchParams.get("sort");
    if (searchParamsSort) {
      return JSON.parse(searchParamsSort);
    }
    return { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (
    event: MouseEvent<HTMLButtonElement>,
    property: PermissionKeys
  ) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const searchParams = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    const newOrderBy = property;
    searchParams.set(
      "sort",
      JSON.stringify({ order: newOrder, orderBy: newOrderBy })
    );
    setSort({
      order: newOrder,
      orderBy: newOrderBy,
    });
    router.push(window.location.pathname + "?" + searchParams.toString());
  };

  const filter = useMemo(() => {
    const searchParamsFilter = searchParams.get("filter");
    if (searchParamsFilter) {
      return JSON.parse(searchParamsFilter) as PermissionFilterType;
    }

    return undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPermissionsListQuery({
      filter,
      sort: {
        order,
        orderBy: (orderBy === "name"
          ? "name"
          : "id") as PermissionSortType["orderBy"],
      },
    });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const result =
      (data?.pages.flatMap((page) => page?.data) as Permission[]) ??
      ([] as Permission[]);

    return result;
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4">
      <div className="flex flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-3xl font-semibold">
            {tPermissions("admin-panel-permissions:title")}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Link href="/admin-panel/permissions/create">
                {tPermissions("admin-panel-permissions:actions.create")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-2 overflow-x-auto overflow-y-hidden rounded-md border bg-card">
          <TableVirtuoso
            data={result}
            components={TableComponents}
            endReached={handleScroll}
            overscan={20}
            useWindowScroll
            increaseViewportBy={400}
            fixedHeaderContent={() => (
              <>
                <TableRow>
                  <TableHead style={{ width: 80 }}></TableHead>
                  <TableSortCellWrapper
                    width={100}
                    orderBy={orderBy}
                    order={order}
                    column="id"
                    handleRequestSort={handleRequestSort}
                  >
                    {tPermissions("admin-panel-permissions:table.column1")}
                  </TableSortCellWrapper>
                  <TableHead style={{ width: 200 }}>
                    {tPermissions("admin-panel-permissions:table.column2")}
                  </TableHead>
                  <TableSortCellWrapper
                    orderBy={orderBy}
                    order={order}
                    column="description"
                    handleRequestSort={handleRequestSort}
                  >
                    {tPermissions("admin-panel-permissions:table.column3")}
                  </TableSortCellWrapper>
                  <TableHead style={{ width: 130 }}></TableHead>
                </TableRow>
                {isFetchingNextPage && (
                  <TableRow>
                    <TableHead colSpan={4} className="p-0">
                      <div className="h-1 w-full overflow-hidden bg-primary/20">
                        <div className="animate-progress-bar h-full w-full origin-left bg-primary" />
                      </div>
                    </TableHead>
                  </TableRow>
                )}
              </>
            )}
            itemContent={(_index, permission) => {
              return (
                <>
                  <TableCell style={{ width: 80 }}>{permission.id}</TableCell>
                  <TableCell style={{ width: 200 }}>
                    {permission.name}
                  </TableCell>
                  <TableCell style={{ width: 200 }}>
                    {permission.description ?? "-"}
                  </TableCell>
                  <TableCell style={{ width: 130 }}>
                    {!!permission && <Actions permission={permission} />}
                  </TableCell>
                </>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Permissions, { roles: [RoleEnum.ADMIN] });
