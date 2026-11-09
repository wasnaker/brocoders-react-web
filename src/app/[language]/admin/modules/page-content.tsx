"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { type ModuleLifecycleAction } from "@/services/api/services/modules";
import { type Module } from "@/services/api/types/module";
import { useTranslation } from "@/services/i18n/client";
import { useMemo } from "react";
import {
  useGetModulesQuery,
  useGetModuleLifecycleQuery,
  useModuleLifecycleMutation,
} from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function Modules() {
  const { t } = useTranslation("admin-panel-modules");
  const { data, isLoading } = useGetModulesQuery();
  const lifecycleQuery = useGetModuleLifecycleQuery();
  const lifecycleMutation = useModuleLifecycleMutation();

  const result = useMemo<Module[]>(() => data ?? [], [data]);
  const lifecycleRecords = lifecycleQuery.data ?? [];

  const runLifecycleAction = (
    moduleId: string,
    action: ModuleLifecycleAction
  ) => {
    lifecycleMutation.mutate({ id: moduleId, action });
  };

  return (
    <div className="page-content--wide">
      <div className="page-content--body space-y-8">
        <section>
          <div className="page-header--split admin-list-page-header">
            <h3 className="page-title">{t("admin-panel-modules:title")}</h3>
          </div>

          <div className="table-shell">
            <TableVirtuoso
              data={result}
              components={TableComponents}
              overscan={20}
              useWindowScroll
              increaseViewportBy={400}
              fixedHeaderContent={() => (
                <TableRow>
                  <TableHead style={{ width: 200 }}>
                    {t("admin-panel-modules:table.column1")}
                  </TableHead>
                  <TableHead style={{ width: 140 }}>
                    {t("admin-panel-modules:table.column2")}
                  </TableHead>
                  <TableHead style={{ width: 200 }}>
                    {t("admin-panel-modules:table.column3")}
                  </TableHead>
                  <TableHead>{t("admin-panel-modules:table.column4")}</TableHead>
                </TableRow>
              )}
              itemContent={(_index, module) => (
                <>
                  <TableCell style={{ width: 200 }}>
                    {module.name ?? "-"}
                  </TableCell>
                  <TableCell style={{ width: 140 }}>
                    {module.version ?? "-"}
                  </TableCell>
                  <TableCell style={{ width: 200 }}>
                    {module.alias ?? "-"}
                  </TableCell>
                  <TableCell>{module.description ?? "-"}</TableCell>
                </>
              )}
            />
          </div>

          {!isLoading && result.length === 0 && (
            <div className="empty-state">
              {t("admin-panel-modules:alerts.empty")}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold">Lifecycle modul backend</h4>
              <p className="text-sm text-muted-foreground">
                Install, aktifkan, nonaktifkan, atau uninstall modul. Data modul
                tetap dipertahankan saat uninstall.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => lifecycleQuery.refetch()}
              disabled={lifecycleQuery.isFetching}
            >
              Muat ulang
            </Button>
          </div>

          {lifecycleQuery.error && (
            <p className="text-sm text-destructive" role="alert">
              {lifecycleQuery.error.message}
            </p>
          )}
          {lifecycleMutation.error && (
            <p className="text-sm text-destructive" role="alert">
              {lifecycleMutation.error.message}
            </p>
          )}
          {lifecycleQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Memuat status lifecycle modul...
            </p>
          ) : (
            <div className="table-shell overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Module</th>
                    <th className="px-4 py-3 font-medium">Versi</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lifecycleRecords.map((record) => {
                    const transitioning = [
                      "installing",
                      "activating",
                      "deactivating",
                      "uninstalling",
                    ].includes(record.status);
                    return (
                      <tr key={record.moduleId} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{record.moduleId}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.packageName}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {record.version}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs">
                            {record.status}
                          </span>
                          {record.lastError && (
                            <p className="mt-1 max-w-sm text-xs text-destructive">
                              {record.lastError}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {record.status === "uninstalled" ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  runLifecycleAction(record.moduleId, "install")
                                }
                                disabled={transitioning || lifecycleMutation.isPending}
                              >
                                Install
                              </Button>
                            ) : (
                              <>
                                {record.status !== "active" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                      runLifecycleAction(record.moduleId, "activate")
                                    }
                                    disabled={
                                      transitioning || lifecycleMutation.isPending
                                    }
                                  >
                                    Aktifkan
                                  </Button>
                                )}
                                {record.status === "active" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      runLifecycleAction(record.moduleId, "deactivate")
                                    }
                                    disabled={
                                      transitioning || lifecycleMutation.isPending
                                    }
                                  >
                                    Nonaktifkan
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    runLifecycleAction(record.moduleId, "uninstall")
                                  }
                                  disabled={
                                    transitioning || lifecycleMutation.isPending
                                  }
                                >
                                  Uninstall
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {lifecycleRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Belum ada status lifecycle modul.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Modules, {
  permission: "read:admin",
  roles: [1],
});
