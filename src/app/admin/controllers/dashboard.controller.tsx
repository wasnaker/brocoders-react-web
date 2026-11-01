"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";

export function DashboardController() {
  const { t } = useTranslation("admin");
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data for dashboard
    console.log("Fetching dashboard data...");
    // Implement logic to fetch data
  }, []);

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      {/* Dashboard content */}
    </div>
  );
}