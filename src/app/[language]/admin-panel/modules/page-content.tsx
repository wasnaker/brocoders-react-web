"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import { type Module } from "@/services/api/types/module";
import { useTranslation } from "@/services/i18n/client";
import { useMemo } from "react";
import { useGetModulesQuery } from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";

/**
 * Read-only inventory of the registered modules.
 *
 * Modules are compile-time artefacts: the registry is produced by
 * `scripts/generate-module-registry.mjs` at build time by scanning the
 * `module.manifest.ts` of every entry under `src/modules`. There is
 * intentionally NO action column here — no enable/disable toggle, no
 * install/upload, no edit form.
 *
 * Do not add one. Enabling a module, installing one, or changing its
 * manifest is a build-time/deploy-time concern, not a runtime one; the
 * project has explicit non-goals of runtime enable/disable, a module
 * marketplace, and module upload. This page only reports what exists so an
 * admin can confirm which modules the running bundle actually registered.
 *
 * Note on the `version` column: the backend currently returns a uniform
 * "1.0.0" for every module, because `ModuleManifest` on the frontend has
 * no `version` field — it is derived server-side. Treat this column as
 * placeholder data, not a verified version.
 */
function Modules() {
  const { t } = useTranslation("admin-panel-modules");
  const { data, isLoading } = useGetModulesQuery();

  const result = useMemo<Module[]>(() => data ?? [], [data]);

  return (
    <div className="page-content--wide">
      <div className="page-content--body">
        <div className="page-header--split">
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
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Modules, { roles: [RoleEnum.ADMIN] });
