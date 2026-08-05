"use client";

import { useMemo, useState } from "react";
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
import { toast } from "sonner";

type Cctv = {
  id: string;
  name: string;
  location: string;
  ip: string;
  online: boolean;
  enabled: boolean;
};

const initialCctv: Cctv[] = [
  { id: "CAM-01", name: "Pintu Masuk", location: "Lantai 1 - Lobby", ip: "192.168.1.101", online: true, enabled: true },
  { id: "CAM-02", name: "Lobby Utama", location: "Lantai 1 - Lobby", ip: "192.168.1.102", online: true, enabled: true },
  { id: "CAM-03", name: "Ruang Kerja A", location: "Lantai 2 - Area Karyawan", ip: "192.168.1.103", online: true, enabled: true },
  { id: "CAM-04", name: "Ruang Kerja B", location: "Lantai 2 - Area Karyawan", ip: "192.168.1.104", online: true, enabled: true },
  { id: "CAM-05", name: "Cafeteria", location: "Lantai 1 - Kantin", ip: "192.168.1.105", online: false, enabled: true },
  { id: "CAM-06", name: "Pantry", location: "Lantai 2 - Pantry", ip: "192.168.1.106", online: true, enabled: true },
];

const emptyForm: Omit<Cctv, "id"> = {
  name: "",
  location: "",
  ip: "",
  online: true,
  enabled: true,
};

export default function CctvPage() {
  const [cctvs, setCctvs] = useState<Cctv[]>(initialCctv);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cctv | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Cctv | null>(null);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cctvs.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "online" && c.online) ||
        (statusFilter === "offline" && !c.online);
      return matchSearch && matchStatus;
    });
  }, [cctvs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageToUse = Math.min(page, totalPages);
  const paged = filtered.slice((pageToUse - 1) * PAGE_SIZE, pageToUse * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, filtered.length);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: Cctv) {
    setEditing(c);
    setForm({ ...c });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setCctvs((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c))
      );
      toast.success(`CCTV ${editing.name} berhasil diperbarui`);
    } else {
      const nextId = `CAM-${String(cctvs.length + 1).padStart(2, "0")}`;
      setCctvs((prev) => [{ id: nextId, ...form }, ...prev]);
      toast.success(`CCTV ${form.name} berhasil ditambahkan`);
    }
    setFormOpen(false);
  }

  function toggleEnabled(c: Cctv) {
    setCctvs((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, enabled: !x.enabled } : x
      )
    );
    toast.success(`${c.name} ${c.enabled ? "dinonaktifkan" : "diaktifkan"}`);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setCctvs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success(`CCTV ${deleteTarget.name} berhasil dihapus`);
    setDeleteTarget(null);
  }

  function updateField<K extends keyof Omit<Cctv, "id">>(key: K, value: string) {
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
              <TableHead className="hidden lg:table-cell">IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada data kamera.
                </TableCell>
              </TableRow>
            )}
            {paged.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        c.online
                          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-500/15"
                      }`}
                    >
                      {c.online ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {c.location}
                  </span>
                </TableCell>
                <TableCell className="hidden font-mono text-xs lg:table-cell">
                  {c.ip}
                </TableCell>
                <TableCell>
                  <Badge variant={c.online ? "secondary" : "outline"}>
                    {c.online ? "Online" : "Offline"}
                  </Badge>
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
          total={filtered.length}
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <Label htmlFor="c-ip">IP Address</Label>
              <Input
                id="c-ip"
                required
                value={form.ip}
                onChange={(e) => updateField("ip", e.target.value)}
                placeholder="contoh: 192.168.1.101"
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
              <Button type="submit" className="cursor-pointer">
                {editing ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kamera?</DialogTitle>
            <DialogDescription>
              Kamera{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>{" "}
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={confirmDelete}
            >
              <Trash2 />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
