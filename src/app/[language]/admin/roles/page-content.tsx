"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { type Role } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { useGetRolesQuery } from "./queries/queries";

function Actions({ role }: { role: Role }) {
  const { t } = useTranslation("admin-panel-roles");

  return (
    <Button asChild size="sm">
      <Link href={`/admin/roles/edit/${role.id}`}>
        {t("admin-panel-roles:actions.editPermissions")}
      </Link>
    </Button>
  );
}

function Roles() {
  const { t } = useTranslation("admin-panel-roles");
  const { data, isLoading } = useGetRolesQuery();
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("admin-panel-roles:table.column1"),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name ?? "-"}
          </span>
        ),
      },
      {
        id: "permissionsCount",
        accessorFn: (role) => role.permissions?.length ?? 0,
        header: t("admin-panel-roles:table.column2"),
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableGlobalFilter: false,
        header: "",
        cell: ({ row }) => <Actions role={row.original} />,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: (value) => {
      setGlobalFilter(String(value ?? ""));
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    state: { globalFilter, pagination },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  const pageCount = table.getPageCount();

  return (
    <div className="page-content--wide">
      <div className="page-content--body">
        <div className="page-header--split admin-list-page-header">
          <h3 className="page-title">{t("admin-panel-roles:title")}</h3>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-sm">
            <Input
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="Cari…"
              aria-label="Search roles"
              className="h-9"
            />
          </div>
        </div>

        <div className="table-shell">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("admin-panel-roles:alerts.roles.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="small-table-pagination flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              {table.getFilteredRowModel().rows.length === 0
                ? "0"
                : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}`}{" "}
              dari {table.getFilteredRowModel().rows.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                ‹ Prev
              </Button>
              <span className="min-w-[2rem] text-center tabular-nums">
                {pageCount === 0 ? 0 : pagination.pageIndex + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next ›
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Roles, { permission: "read:role" });
