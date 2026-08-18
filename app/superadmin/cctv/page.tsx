"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Plus,
  Pencil,
  Trash2,
  Video,
  VideoOff,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Search,
  CircleAlert,
  RefreshCw,
  Wifi,
  WifiOff,
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { TableState } from "@/components/table-state";
import { apiFetch } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { toast } from "sonner";

type Cctv = {
  id: string;
  cameraId: string;
  name: string;
  location: string;
  rtspUrl: string | null;
  online: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type CctvSyncResult = {
  engine_status: "ONLINE" | "OFFLINE";
  camera_source: string;
  cameraId: string;
  created: number;
  updated: number;
  marked_offline: number;
};

type CctvListData = {
  items: Cctv[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

const emptyForm = {
  name: "",
  location: "",
  rtspUrl: "",
};

export default function CctvPage() {
  const [cctvs, setCctvs] = useState<Cctv[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cctv | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Cctv | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CctvSyncResult | null>(null);
  const PAGE_SIZE = 10;

  const pageToUse = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, total);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (statusFilter !== "all") params.set("status", statusFilter);
        params.set("page", String(pageToUse));
        params.set("per_page", String(PAGE_SIZE));
        const data = await apiFetch<CctvListData>(
          `/v1/cctv?${params.toString()}`,
        );
        if (!active) return;
        setCctvs(data?.items ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(Math.max(1, data?.total_pages ?? 1));
      } catch (err) {
        console.error("Gagal mengambil data CCTV:", err);
        if (active) {
          setCctvs([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedSearch, statusFilter, pageToUse, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  useRealtime(["camera_online", "camera_offline"], refresh);

  useAutoRefresh(refresh);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(c: Cctv) {
    setEditing(c);
    setForm({ name: c.name, location: c.location, rtspUrl: c.rtspUrl ?? "" });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = {
        name: form.name,
        location: form.location,
        rtspUrl: form.rtspUrl,
      };
      if (editing) {
        await apiFetch(`/v1/cctv/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success(`CCTV ${form.name} berhasil diperbarui`);
      } else {
        await apiFetch("/v1/cctv", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`CCTV ${form.name} berhasil ditambahkan`);
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      console.error("Gagal menyimpan CCTV:", err);
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan CCTV");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(c: Cctv) {
    try {
      const res = await apiFetch<Cctv>(`/v1/cctv/${c.id}/enabled`, {
        method: "PATCH",
      });
      setCctvs((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, enabled: res.enabled } : x)),
      );
      toast.success(
        `${c.name} ${res.enabled ? "diaktifkan" : "dinonaktifkan"}`,
      );
    } catch (err) {
      console.error("Gagal mengubah status CCTV:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status CCTV",
      );
    }
  }

  async function toggleOnline(c: Cctv) {
    try {
      const res = await apiFetch<Cctv>(`/v1/cctv/${c.id}/status`, {
        method: "PATCH",
      });
      setCctvs((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, online: res.online } : x)),
      );
      toast.success(`${c.name} sekarang ${res.online ? "online" : "offline"}`);
    } catch (err) {
      console.error("Gagal mengubah status online CCTV:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mengubah status online CCTV",
      );
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await apiFetch<CctvSyncResult>("/v1/cctv/sync", {
        method: "POST",
      });
      setSyncResult(res);
      refresh();
      toast.success("Sinkronisasi ML engine selesai");
    } catch (err) {
      console.error("Gagal sinkronisasi ML engine:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal sinkronisasi ML engine",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/v1/cctv/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`CCTV ${deleteTarget.name} berhasil dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      console.error("Gagal menghapus CCTV:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus CCTV");
    }
  }

  function updateField<K extends keyof typeof emptyForm>(
    key: K,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const onlineCount = cctvs.filter((c) => c.online).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CCTV"
        description="Kelola perangkat kamera pengenalan wajah"
        icon={<Camera className="size-6" />}
      >
        <Button
          variant="secondary"
          className="cursor-pointer"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <Bot className="text-primary" />
          )}
          {syncing ? "Menyinkronkan..." : "Sinkronisasi ML"}
        </Button>
        <Button className="cursor-pointer" onClick={openAdd}>
          <Plus />
          Tambah CCTV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, lokasi, atau ID kamera..."
            className="h-10 pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 cursor-pointer rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-ring"
        >
          <option value="all">Semua Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <span className="text-sm text-muted-foreground">
          {onlineCount} online / {cctvs.length - onlineCount} offline
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kamera</TableHead>
              <TableHead className="hidden md:table-cell">Lokasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              loading={loading}
              empty={cctvs.length === 0}
              colSpan={5}
              loadingText="Memuat data CCTV..."
              emptyText="Tidak ada data kamera."
            />
            {!loading &&
              cctvs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${
                          c.enabled && c.online
                            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-500/15"
                        }`}
                      >
                        {c.enabled && c.online ? (
                          <Video className="size-4" />
                        ) : (
                          <VideoOff className="size-4" />
                        )}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.cameraId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {c.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={c.online ? "secondary" : "outline"}>
                        {c.online ? "Online" : "Offline"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={c.online ? "Tandai offline" : "Tandai online"}
                        onClick={() => toggleOnline(c)}
                      >
                        {c.online ? (
                          <Wifi className="text-green-600" />
                        ) : (
                          <WifiOff className="text-zinc-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={c.enabled ? "Nonaktifkan" : "Aktifkan"}
                      onClick={() => toggleEnabled(c)}
                    >
                      {c.enabled ? (
                        <ToggleRight className="text-green-600" />
                      ) : (
                        <ToggleLeft className="text-zinc-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Hapus"
                        onClick={() => setDeleteTarget(c)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <DataTablePagination
          page={pageToUse}
          pageCount={totalPages}
          total={total}
          start={start}
          end={end}
          itemLabel="kamera"
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit CCTV" : "Tambah CCTV"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi kamera di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
            {formError && (
              <div className="flex min-w-0 items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  {formError}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-name">Nama Kamera</Label>
              <Input
                id="c-name"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="contoh: Pintu Masuk"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-loc">Lokasi</Label>
              <Input
                id="c-loc"
                required
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="contoh: Lantai 1 - Lobby"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-rtsp">RTSP URL</Label>
              <Input
                id="c-rtsp"
                required
                value={form.rtspUrl}
                onChange={(e) => updateField("rtspUrl", e.target.value)}
                placeholder="contoh: rtsp://user:pass@192.168.1.101:554"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={saving}
              >
                {editing ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        noun="Kamera"
        name={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
      />

      <Dialog open={!!syncResult} onOpenChange={() => setSyncResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Hasil Sinkronisasi ML
            </DialogTitle>
            <DialogDescription>
              Ringkasan sinkronisasi kamera dengan ML engine.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  syncResult?.engine_status === "ONLINE"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                }`}
              >
                {syncResult?.engine_status === "ONLINE" ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <XCircle className="size-5" />
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">Status ML Engine</span>
                <span
                  className={`text-sm ${
                    syncResult?.engine_status === "ONLINE"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {syncResult?.engine_status === "ONLINE"
                    ? "Online — siap memproses wajah"
                    : "Offline — periksa koneksi ML engine"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Video className="size-3.5 shrink-0" />
                  Sumber Kamera
                </span>
                <span className="break-all text-sm font-medium">
                  {syncResult?.camera_source}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Camera className="size-3.5" />
                  Camera ID
                </span>
                <span className="text-sm font-medium">
                  {syncResult?.cameraId}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PlusCircle className="size-3.5" />
                  Dibuat
                </span>
                <span className="text-sm font-medium">
                  {syncResult?.created}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpCircle className="size-3.5" />
                  Diperbarui
                </span>
                <span className="text-sm font-medium">
                  {syncResult?.updated}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownCircle className="size-3.5" />
                  Ditandai Offline
                </span>
                <span
                  className={`text-sm font-medium ${
                    (syncResult?.marked_offline ?? 0) > 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}
                >
                  {syncResult?.marked_offline}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setSyncResult(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
