"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/services/i18n/client";
import { useProvinces, useProvince, useDeleteProvince } from "../hooks/use-regions";
import { SmallTable, type SmallTableColumn, type DetailTab } from "../components/small-table";
import { ProvinceFormDialog } from "../components/province-form-dialog";
import { ProvinceOverviewTab, ProvinceRegenciesTab } from "../components/province-detail-tab";
import { Button } from "@/components/ui/button";
import PencilIcon from "lucide-react/dist/esm/icons/pencil";
import TrashIcon from "lucide-react/dist/esm/icons/trash";
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right";
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin";
import { Suspense } from "react";
import type { Province } from "../types/region";

const PER_PAGE = 20;

function PageInner() {
  const { t } = useTranslation("module-region");
  const qc = useQueryClient();

  // ── URL hash state (SSR-safe via Suspense) ──────────────────────────────
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize selectedId from hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setSelectedId(hash);
      setShowDetail(true);
    }
  }, []);

  function syncHash(id: number | string | null) {
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        id != null ? `#${id}` : window.location.pathname
      );
    }
  }

  function selectItem(id: number | string) {
    setSelectedId(id);
    setShowDetail(true);
    syncHash(id);
  }

  // ── Dialogs ────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Province | null>(null);

  function openCreateDialog() {
    setEditItem(null);
    setFormOpen(true);
  }

  function openEditDialog(item: Province) {
    setEditItem(item);
    setFormOpen(true);
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteProvince();

  async function handleDelete(id: Province["id"]) {
    if (!window.confirm(t("confirm.delete.message"))) return;
    await deleteMutation.mutateAsync({ id });
    // Clear selection if deleting the selected row
    if (String(selectedId) === String(id)) {
      setSelectedId(null);
      setShowDetail(false);
      syncHash(null);
    }
    setRefreshKey((k) => k + 1);
  }

  // ── Table data ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const { data: provincesData, isLoading } = useProvinces(page, PER_PAGE);
  const provinces = provincesData?.data ?? [];

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns: SmallTableColumn<Province>[] = useMemo(
    () => [
      {
        key: "id",
        label: "#",
        primary: true,
        render: (item) => (
          <span className="font-mono text-muted-foreground">
            {String(item.id)}
          </span>
        ),
      },
      {
        key: "name",
        label: t("table.name"),
        primary: true,
        render: (item) => (
          <span className="font-medium">{item.name}</span>
        ),
      },
      {
        key: "isoCode",
        label: t("table.isoCode"),
        render: (item) => (
          <span className="font-mono text-muted-foreground">
            {item.isoCode ?? "—"}
          </span>
        ),
      },
      {
        key: "coordinates",
        label: t("table.coordinates"),
        render: (item) => {
          if (item.latitude == null || item.longitude == null) return "—";
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </span>
          );
        },
      },
    ],
    [t]
  );

  // ── Tabs ───────────────────────────────────────────────────────────────
  const tabs: DetailTab[] = useMemo(
    () => [
      {
        slug: "overview",
        label: t("detail.overview"),
        position: 0,
      },
      {
        slug: "regencies",
        label: t("detail.regencies"),
        position: 10,
      },
    ],
    [t]
  );

  // ── Custom tab bodies ──────────────────────────────────────────────────
  const customTabBody = useMemo(
    () => ({
      overview: (item: Province) => <ProvinceOverviewTab item={item} />,
      regencies: (item: Province) => <ProvinceRegenciesTab item={item} />,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  // ── Toolbar for detail panel ────────────────────────────────────────────
  function toolbar(item: Province) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          title={t("actions.edit")}
          onClick={() => openEditDialog(item)}
        >
          <PencilIcon className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10"
          title={t("actions.delete")}
          onClick={() => handleDelete(item.id)}
          disabled={deleteMutation.isPending}
        >
          <TrashIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title={showDetail ? t("actions.collapse") : t("actions.expand")}
          onClick={() => {
            setShowDetail((v) => !v);
          }}
        >
          {showDetail ? (
            <ArrowRightIcon className="size-3.5" />
          ) : (
            <ArrowLeftIcon className="size-3.5" />
          )}
        </Button>
      </div>
    );
  }

  function renderHeader(item: Province) {
    return (
      <div className="flex items-center gap-2">
        <MapPinIcon className="size-4 text-primary" />
        <span>{item.name}</span>
        {item.isoCode && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {item.isoCode}
          </span>
        )}
      </div>
    );
  }

  const tableEmptyText = isLoading
    ? t("table.loading")
    : t("table.empty");

  return (
    <div className="page-content--wide">
      <div className="page-content--body">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="page-header--split">
          <div>
            <h1 className="page-title">{t("title")}</h1>
            <p className="page-subtitle">{t("subtitle")}</p>
          </div>
          <div className="page-header__actions">
            <Button onClick={openCreateDialog}>
              {t("actions.create_province")}
            </Button>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <SmallTable<Province>
          items={provinces}
          columns={columns}
          selectedId={selectedId}
          onSelectId={selectItem}
          getItemId={(item) => item.id}
          showDetail={showDetail}
          tabs={tabs}
          customTabBody={customTabBody}
          searchableKeys={["name", "isoCode"]}
          getSearchText={(item) =>
            [item.name, item.isoCode ?? ""].join(" ")
          }
          perPage={PER_PAGE}
          emptyText={tableEmptyText}
          tabEmptyText={t("detail.empty")}
          paginationOfLabel={t("table.of")}
          toolbar={toolbar}
          renderHeader={renderHeader}
          listHeader={
            showDetail ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedId(null);
                  syncHash(null);
                }}
              >
                {t("actions.collapse")}
              </Button>
            ) : undefined
          }
        />

        {/* Pagination controls (for infinity-style next pages) */}
        {provinces.length > 0 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t("actions.prev_page")}
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              {t("table.page", { page, total: provincesData?.hasNextPage ? page + 1 : page })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!provincesData?.hasNextPage}
            >
              {t("actions.next_page")}
            </Button>
          </div>
        )}
      </div>

      {/* ── Create / Edit dialog ──────────────────────────────────────── */}
      <ProvinceFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
        editItem={editItem}
        onSuccess={(savedId) => {
          qc.invalidateQueries({ queryKey: ["region", "provinces"] });
          setRefreshKey((k) => k + 1);
          selectItem(savedId);
        }}
      />
    </div>
  );
}

export function RegionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      <PageInner />
    </Suspense>
  );
}