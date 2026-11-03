"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetPermissionsListQuery,
  permissionsQueryKeys,
} from "./queries/queries";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Permission } from "@/services/api/types/permission";
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

function Actions({ permission }: { permission: Permission }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchPermissionDelete = useDeletePermissionsService();
  const queryClient = useQueryClient();
  const { t: tPermissions } = useTranslation("admin-panel-permissions");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: tPermissions("admin-panel-permissions:confirm.delete.title"),
      message: tPermissions("admin-panel-permissions:confirm.delete.message"),
    });

    if (!isConfirmed) return;

    const searchParams = new URLSearchParams(window.location.search);
    const searchParamsFilter = searchParams.get("filter");
    const searchParamsSort = searchParams.get("sort");
    let filter: PermissionFilterType | undefined;
    let sort: PermissionSortType | undefined = {
      order: SortEnum.DESC,
      orderBy: "id",
    };

    if (searchParamsFilter) filter = JSON.parse(searchParamsFilter);
    if (searchParamsSort) sort = JSON.parse(searchParamsSort);

    const queryKey = permissionsQueryKeys.list().sub.by({ sort, filter }).key;
    const previousData = queryClient.getQueryData<
      InfiniteData<{ nextPage: number; data: Permission[] }>
    >(queryKey);

    await queryClient.cancelQueries({
      queryKey: permissionsQueryKeys.list().key,
    });

    if (previousData) {
      queryClient.setQueryData(queryKey, {
        ...previousData,
        pages: previousData.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => item.id !== permission.id),
        })),
      });
    }

    await fetchPermissionDelete({ id: permission.id });
  };

  return (
    <div className="inline-flex items-center">
      <Button asChild size="sm" className="rounded-e-none">
        <Link href={`/admin/permissions/edit/${permission.id}`}>
          {tPermissions("admin-panel-permissions:actions.edit")}
        </Link>
      </Button>
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
  const [sorting, setSorting] = useState<SortingState>(() => {
    const value = searchParams.get("sort");
    const sort = value
      ? (JSON.parse(value) as { order: SortEnum; orderBy: PermissionKeys })
      : { order: SortEnum.DESC, orderBy: "id" as PermissionKeys };

    return [{ id: sort.orderBy, desc: sort.order === SortEnum.DESC }];
  });

  const currentSort = sorting[0];
  const order = currentSort?.desc ? SortEnum.DESC : SortEnum.ASC;
  const orderBy = (currentSort?.id ?? "id") as PermissionKeys;

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const active = next[0];
      if (!active) return;

      const nextOrder = active.desc ? SortEnum.DESC : SortEnum.ASC;
      const nextOrderBy = active.id as PermissionKeys;
      const params = new URLSearchParams(window.location.search);
      params.set(
        "sort",
        JSON.stringify({ order: nextOrder, orderBy: nextOrderBy })
      );
      setSorting(next);
      router.push(window.location.pathname + "?" + params.toString());
    },
    [router, sorting]
  );

  const filter = useMemo(() => {
    const value = searchParams.get("filter");
    return value ? (JSON.parse(value) as PermissionFilterType) : undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPermissionsListQuery({
      filter,
      sort: {
        order,
        orderBy: (orderBy === "name" ? "name" : "id") as PermissionSortType["orderBy"],
      },
    });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 500;
    if (nearBottom) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const result = useMemo(
    () => (data?.pages.flatMap((page) => page?.data) as Permission[]) ?? [],
    [data]
  );

  const columns = useMemo<ColumnDef<Permission>[]>(
    () => [
      {
        accessorKey: "id",
        header: tPermissions("admin-panel-permissions:table.column1"),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "name",
        header: tPermissions("admin-panel-permissions:table.column2"),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "description",
        header: tPermissions("admin-panel-permissions:table.column3"),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Actions permission={row.original} />
        ),
      },
    ],
    [tPermissions]
  );

  const table = useReactTable({
    data: result,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: handleSortingChange,
  });

  return (
    <div className="page-content--wide">
      <div className="page-content--body">
        <div className="page-header--split admin-list-page-header">
          <h3 className="page-title">
            {tPermissions("admin-panel-permissions:title")}
          </h3>
          <div className="page-header__actions">
            <Button asChild>
              <Link href="/admin/permissions/create">
                {tPermissions("admin-panel-permissions:actions.create")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="table-shell">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp className="size-4" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-4" />
                            ) : (
                              <ChevronsUpDown className="size-4 opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
              {isFetchingNextPage && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-3">
                    <div className="table-shell__progress">
                      <div className="table-shell__progress-bar animate-progress-bar" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Permissions, { roles: [RoleEnum.ADMIN] });
