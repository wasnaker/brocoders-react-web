"use client";

import { useQuery } from "@tanstack/react-query";
import { useGetUsersService } from "@/services/api/services/users";
import type { User } from "@/services/api/types/user";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

/** Widget: 5 user terbaru. */
export function RecentUsersWidget() {
  const fetch = useGetUsersService();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "widget", "recent-users"],
    queryFn: async () => {
      const { status, data } = await fetch({ page: 1, limit: 5 });
      if (status === HTTP_CODES_ENUM.OK) {
        return data.data;
      }
      throw new Error("Gagal memuat user");
    },
  });

  if (isLoading) {
    return (
      <p className="animate-pulse text-sm text-muted-foreground">Memuat...</p>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Gagal memuat user.</p>;
  }
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Belum ada user.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((user: User) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <li
            key={user.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
              {(name || user.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {name || user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            {user.role?.name ? (
              <span className="inline-flex shrink-0 items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {user.role.name}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
