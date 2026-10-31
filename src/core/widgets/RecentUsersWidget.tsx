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
    return <p className="widget-list__meta animate-pulse">Memuat...</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Gagal memuat user.</p>;
  }
  if (!data?.length) {
    return <p className="widget-list__meta">Belum ada user.</p>;
  }

  return (
    <ul className="widget-list">
      {data.map((user: User) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <li key={user.id} className="widget-list__row">
            <div className="widget-list__avatar">
              {(name || user.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="widget-list__details">
              <p className="widget-list__name">{name || user.email}</p>
              <p className="widget-list__meta">{user.email}</p>
            </div>
            {user.role?.name ? (
              <span className="widget-list__badge">{user.role.name}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
