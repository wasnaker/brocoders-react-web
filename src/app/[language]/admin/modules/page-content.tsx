"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { type ModuleLifecycleAction } from "@/services/api/services/modules";
import { type Module } from "@/services/api/types/module";
import { useTranslation } from "@/services/i18n/client";
import { useMemo, useState } from "react";
import {
  useGetModulesQuery,
  useGetModuleLifecycleQuery,
  useModuleLifecycleMutation,
  useGetAuthorizationValidationQuery,
  useGetAuthorizationDiffQuery,
  useGetAuthorizationStateQuery,
  useGetAuthorizationAuditQuery,
  useAuthorizationModuleSyncMutation,
  useAuthorizationSyncAllMutation,
} from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";



function ModuleAuthorizationCard({ moduleId }: { moduleId: string }) {
  const [expanded, setExpanded] = useState(false);
  const diff = useGetAuthorizationDiffQuery(moduleId);
  const state = useGetAuthorizationStateQuery(moduleId);
  const sync = useAuthorizationModuleSyncMutation();
  const preview = diff.data;

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="font-semibold">{moduleId}</h5>
          <p className="mt-1 text-xs text-muted-foreground">
            Manifest {preview?.manifestVersion ?? state.data?.manifestVersion ?? "—"}
            {" · "}
            Sync: {state.data?.syncStatus ?? preview?.lastSync?.status ?? "Belum pernah"}
          </p>
          {(state.data?.lastError || preview?.lastSync?.lastError) && (
            <p className="mt-1 text-xs text-destructive">
              {state.data?.lastError ?? preview?.lastSync?.lastError}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => diff.refetch()}
            disabled={diff.isFetching}
          >
            Preview diff
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => sync.mutate(moduleId)}
            disabled={sync.isPending || !preview?.valid}
          >
            Sync defaults
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Tutup detail" : "Detail"}
          </Button>
        </div>
      </div>

      {diff.error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {diff.error.message}
        </p>
      )}
      {sync.error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {sync.error.message}
        </p>
      )}
      {diff.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Menghitung diff...</p>
      ) : preview?.valid ? (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>Permission: {preview.permissions?.missing.length ?? 0} missing / {preview.permissions?.obsolete.length ?? 0} obsolete</span>
          <span>Role: {preview.roles?.missing.length ?? 0} missing / {preview.roles?.obsolete.length ?? 0} obsolete</span>
          <span>Grant: {preview.grants?.missing.length ?? 0} missing / {preview.grants?.obsolete.length ?? 0} obsolete</span>
          <span>Manual: {preview.preservedAdministratorState?.manualGrantCount ?? 0}</span>
          <span>Deny: {preview.preservedAdministratorState?.denyOverrideCount ?? 0}</span>
        </div>
      ) : preview?.errors?.length ? (
        <ul className="mt-3 list-disc ps-5 text-xs text-destructive">
          {preview.errors.map((error, index) => (
            <li key={`${error.moduleId}-${error.path}-${index}`}>
              {error.moduleId} · {error.path}: {error.message}
            </li>
          ))}
        </ul>
      ) : null}

      {expanded && preview?.valid && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <h6 className="mb-2 text-sm font-semibold">Permissions</h6>
            <p className="text-xs text-muted-foreground">Missing</p>
            <ul className="mb-3 list-disc ps-5 text-xs">
              {(preview.permissions?.missing ?? []).map((item) => (
                <li key={item.key ?? item.name}>{item.key ?? item.name}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Obsolete defaults</p>
            <ul className="list-disc ps-5 text-xs">
              {(preview.permissions?.obsolete ?? []).map((item) => (
                <li key={item.permissionKey}>{item.permissionKey}</li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="mb-2 text-sm font-semibold">Role grants</h6>
            <p className="text-xs text-muted-foreground">Missing</p>
            <ul className="mb-3 list-disc ps-5 text-xs">
              {(preview.grants?.missing ?? []).map((item, index) => (
                <li key={`missing-${index}`}>
                  {item.targetModuleId}:{item.targetRoleKey} ← {item.permissionKey}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Obsolete defaults (only this module's grants)</p>
            <ul className="list-disc ps-5 text-xs">
              {(preview.grants?.obsolete ?? []).map((item, index) => (
                <li key={`obsolete-${index}`}>
                  {item.targetModuleId}:{item.targetRoleKey} ← {item.permissionKey}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}

function Modules() {
  const { t } = useTranslation("admin-panel-modules");
  const { data, isLoading } = useGetModulesQuery();
  const lifecycleQuery = useGetModuleLifecycleQuery();
  const lifecycleMutation = useModuleLifecycleMutation();
  const authorizationValidation = useGetAuthorizationValidationQuery();
  const authorizationAudit = useGetAuthorizationAuditQuery();
  const syncAllAuthorization = useAuthorizationSyncAllMutation();

  const result = useMemo<Module[]>(() => data ?? [], [data]);
  const lifecycleRecords = lifecycleQuery.data ?? [];

  const runLifecycleAction = (
    moduleId: string,
    action: ModuleLifecycleAction
  ) => {
    if (
      action === "uninstall" &&
      !window.confirm(
        "Uninstall modul ini? Registrasi dan assignment modul akan dibersihkan, tetapi data bisnis tetap dipertahankan."
      )
    ) {
      return;
    }
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
                  <TableHead>
                    {t("admin-panel-modules:table.column4")}
                  </TableHead>
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
              <h4 className="text-base font-semibold">
                Lifecycle modul backend
              </h4>
              <p className="text-sm text-muted-foreground">
                Kelola status runtime modul yang sudah tersedia pada deployment.
                Install/uninstall di sini mengelola registrasi lifecycle, bukan
                memasang atau menghapus paket npm. Data bisnis tetap
                dipertahankan.
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
                      <tr
                        key={record.moduleId}
                        className="border-b last:border-0"
                      >
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
                                disabled={
                                  transitioning || lifecycleMutation.isPending
                                }
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
                                      runLifecycleAction(
                                        record.moduleId,
                                        "activate"
                                      )
                                    }
                                    disabled={
                                      transitioning ||
                                      lifecycleMutation.isPending
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
                                      runLifecycleAction(
                                        record.moduleId,
                                        "deactivate"
                                      )
                                    }
                                    disabled={
                                      transitioning ||
                                      lifecycleMutation.isPending
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
                                    runLifecycleAction(
                                      record.moduleId,
                                      "uninstall"
                                    )
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

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold">Authorization Core</h4>
              <p className="text-sm text-muted-foreground">
                Validasi manifest, tinjau perubahan default, lalu sinkronkan per module. Manual grants dan deny overrides administrator dipertahankan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => authorizationValidation.refetch()}
                disabled={authorizationValidation.isFetching}
              >
                Validate all
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (window.confirm("Sinkronkan default authorization untuk seluruh module? Manual grants dan deny overrides tidak dihapus.")) {
                    syncAllAuthorization.mutate();
                  }
                }}
                disabled={syncAllAuthorization.isPending || !authorizationValidation.data?.valid}
              >
                Sync all modules
              </Button>
            </div>
          </div>

          {authorizationValidation.error && (
            <p className="text-sm text-destructive" role="alert">
              {authorizationValidation.error.message}
            </p>
          )}
          {authorizationValidation.data && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className={authorizationValidation.data.valid ? "font-medium text-foreground" : "font-medium text-destructive"}>
                {authorizationValidation.data.valid
                  ? "Semua manifest valid."
                  : `Ditemukan ${authorizationValidation.data.errors.length} masalah manifest.`}
              </p>
              {authorizationValidation.data.errors.length > 0 && (
                <ul className="mt-2 list-disc ps-5 text-xs text-destructive">
                  {authorizationValidation.data.errors.map((error, index) => (
                    <li key={`${error.moduleId}-${error.path}-${index}`}>
                      {error.moduleId} · {error.path}: {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {syncAllAuthorization.error && (
            <p className="text-sm text-destructive" role="alert">
              {syncAllAuthorization.error.message}
            </p>
          )}
          <div className="grid gap-3">
            {result.map((module) => (
              <ModuleAuthorizationCard key={module.id} moduleId={module.id} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h4 className="text-base font-semibold">Authorization audit</h4>
            <p className="text-sm text-muted-foreground">
              100 aktivitas authorization terbaru.
            </p>
          </div>
          {authorizationAudit.error && (
            <p className="text-sm text-destructive" role="alert">
              {authorizationAudit.error.message}
            </p>
          )}
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Module</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {(authorizationAudit.data ?? []).slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs tabular-nums">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{item.moduleId ?? "core"}</td>
                    <td className="px-4 py-3">{item.action}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.entityType} · {item.entityKey ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{item.actorUserId ?? "system"}</td>
                  </tr>
                ))}
                {authorizationAudit.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada audit authorization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Modules, {
  permission: "read:admin",
  roles: [1],
});
