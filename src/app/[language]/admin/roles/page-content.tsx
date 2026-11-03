"use client";

import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import TableComponents from "@/components/table/table-components";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { TableVirtuoso } from "react-virtuoso";
import { RoleEnum, type Role } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { useMemo } from "react";
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

  const result = useMemo<Role[]>(() => data ?? [], [data]);

  return (
    <div className="page-content--wide">
      <div className="page-content--body">
        <div className="page-header--split admin-list-page-header">
          <h3 className="page-title">{t("admin-panel-roles:title")}</h3>
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
                <TableHead style={{ width: 240 }}>
                  {t("admin-panel-roles:table.column1")}
                </TableHead>
                <TableHead style={{ width: 160 }}>
                  {t("admin-panel-roles:table.column2")}
                </TableHead>
                <TableHead style={{ width: 180 }}></TableHead>
              </TableRow>
            )}
            itemContent={(_index, role) => (
              <>
                <TableCell style={{ width: 240 }}>{role.name ?? "-"}</TableCell>
                <TableCell style={{ width: 160 }}>
                  {role.permissions?.length ?? 0}
                </TableCell>
                <TableCell style={{ width: 180 }}>
                  <Actions role={role} />
                </TableCell>
              </>
            )}
          />
        </div>

        {!isLoading && result.length === 0 && (
          <div className="empty-state">
            {t("admin-panel-roles:alerts.roles.empty")}
          </div>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Roles, { roles: [RoleEnum.ADMIN] });
