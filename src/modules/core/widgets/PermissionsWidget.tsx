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
    return (
      <p className="animate-pulse text-sm text-muted-foreground">Memuat...</p>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Gagal memuat permission.</p>;
  }
  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada permission.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {data.map((permission: Permission) => (
        <li
          key={permission.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-2.5 transition-colors hover:bg-muted/50"
        >
          <code className="truncate font-mono text-sm text-primary">
            {permission.name}
          </code>
          {permission.description ? (
            <span className="truncate text-xs text-muted-foreground">
              {permission.description}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
