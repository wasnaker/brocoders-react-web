import { defineModuleManifest } from "@/core/modules/types";
import MapPin from "lucide-react/dist/esm/icons/map-pin";

/**
 * Manifest modul Region.
 *
 * Modul ini menyediakan halaman admin di /admin/region.
 * String UI memakai namespace "module-region" (lihat
 * src/services/i18n/locales/<lang>/module-region.json).
 */
export default defineModuleManifest({
  alias: "region",
  menu: [
    {
      slug: "region",
      label: { namespace: "module-region", key: "menu" },
      href: "/admin/region",
      position: 60,
      permission: "read:user",
      icon: MapPin,
    },
  ],
});
