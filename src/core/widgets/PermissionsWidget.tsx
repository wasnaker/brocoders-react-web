"use client";

import { useQuery } from "@tanstack/react-query";
import { useGetPermissionsService } from "@/services/api/services/permissions";
import type { Permission } from "@/services/api/types/permission";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

/** Widget: 5 permission terbaru. */
export function PermissionsWidget() {
  const fetch = useGetPermissionsService();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "widget", "permissions"],
    queryFn: async () => {
      const { status, data } = await fetch({ page: 1, limit: 5 });
      if (status === HTTP_CODES_ENUM.OK) {
        return data.data;
      }
      throw new Error("Gagal memuat permission");
    },
  });

  if (isLoading) {
    return <p className="widget-list__meta animate-pulse">Memuat...</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Gagal memuat permission.</p>;
  }
  if (!data?.length) {
    return <p className="widget-list__meta">Belum ada permission.</p>;
  }

  return (
    <ul className="widget-list">
      {data.map((permission: Permission) => (
        <li key={permission.id} className="widget-list__row">
          <code className="truncate font-mono text-sm text-primary">
            {permission.name}
          </code>
          {permission.description ? (
            <span className="widget-list__meta">{permission.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
