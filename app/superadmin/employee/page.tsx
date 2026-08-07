"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ScanFace,
  UserRound,
  ToggleLeft,
  ToggleRight,
  XIcon,
  CircleAlert,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  department: string | null;
  status: "Active" | "Inactive";
  faceRegistered: boolean;
  joinedAt: string | null;
  photos: string[] | null;
};

type EmployeeListData = {
  items: Employee[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

type FormPhoto = {
  url: string;
  file?: File;
};

const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

type EmployeeForm = {
  name: string;
  email: string;
  password: string;
  position: string;
  department: string;
  status: "Active" | "Inactive";
  joinedAt: string;
  photos: FormPhoto[];
};

const emptyForm: EmployeeForm = {
  name: "",
  email: "",
  password: "",
  position: "",
  department: "",
  status: "Active",
  joinedAt: new Date().toISOString().slice(0, 10),
  photos: [],
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const PAGE_SIZE = 10;

  const pageToUse = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, total);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (deptFilter !== "all") params.set("department", deptFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        params.set("page", String(pageToUse));
        params.set("per_page", String(PAGE_SIZE));
        const data = await apiFetch<EmployeeListData>(
          `/v1/employees?${params.toString()}`,
        );
        if (!active) return;
        setEmployees(data?.items ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(Math.max(1, data?.total_pages ?? 1));
      } catch (err) {
        console.error("Gagal mengambil data karyawan:", err);
        if (active) {
          setEmployees([]);
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
  }, [debouncedSearch, deptFilter, statusFilter, pageToUse, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setFormError("");
    setForm({
      name: emp.name,
      email: emp.email ?? "",
      password: "",
      position: emp.position ?? "",
      department: emp.department ?? "",
      status: emp.status,
      joinedAt: emp.joinedAt ?? "",
      photos: (emp.photos ?? []).map((url) => ({ url })),
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password && form.password.length < 6) {
      setFormError("Password minimal 6 karakter");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      if (form.email) body.append("email", form.email);
      if (form.password) body.append("password", form.password);
      body.append("position", form.position);
      body.append("department", form.department);
      body.append("status", form.status);
      if (form.joinedAt) body.append("joinedAt", form.joinedAt);
      if (editing) {
        const keptUrls = form.photos
          .filter((p) => !p.file)
          .map((p) => p.url);
        body.append("photoUrls", JSON.stringify(keptUrls));
      }
      form.photos.forEach((p) => {
        if (p.file) body.append("photos", p.file);
      });

      if (editing) {
        await apiFetch(`/v1/employees/${editing.id}`, { method: "PUT", body });
      } else {
        await apiFetch("/v1/employees", { method: "POST", body });
      }
      toast.success(
        editing
          ? `Data ${form.name} berhasil diperbarui`
          : `Karyawan ${form.name} berhasil ditambahkan`,
      );
      setFormOpen(false);
      refresh();
    } catch (err) {
      console.error("Gagal menyimpan karyawan:", err);
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan karyawan",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(emp: Employee) {
    try {
      const res = await apiFetch<{ status: "Active" | "Inactive" }>(
        `/v1/employees/${emp.id}/status`,
        { method: "PATCH" },
      );
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: res.status } : e)),
      );
      toast.success(`Status ${emp.name} diubah menjadi ${res.status}`);
    } catch (err) {
      console.error("Gagal mengubah status:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status",
      );
    }
  }

  async function toggleFace(emp: Employee) {
    try {
      const res = await apiFetch<{ faceRegistered: boolean }>(
        `/v1/employees/${emp.id}/face`,
        { method: "PATCH" },
      );
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id ? { ...e, faceRegistered: res.faceRegistered } : e,
        ),
      );
      toast.success(
        `Wajah ${emp.name} ${res.faceRegistered ? "terdaftar" : "dihapus dari pendaftaran"}`,
      );
    } catch (err) {
      console.error("Gagal mengubah status wajah:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status wajah",
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/v1/employees/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`Karyawan ${deleteTarget.name} berhasil dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      console.error("Gagal menghapus karyawan:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus karyawan",
      );
    }
  }

  function updateField<K extends keyof EmployeeForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const room = MAX_PHOTOS - form.photos.length;
    if (room <= 0) return;
    const tooBig = files.find((f) => f.size > MAX_PHOTO_SIZE);
    if (tooBig) {
      toast.error(
        `Foto "${tooBig.name}" melebihi batas maksimal ${
          MAX_PHOTO_SIZE / (1024 * 1024)
        }MB per file`,
      );
      e.target.value = "";
      return;
    }
    const added = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .map((f) => ({
        url: URL.createObjectURL(f),
        file: f,
      }));
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...added] }));
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee"
        description="Kelola akun karyawan & data pengenalan wajah"
      >
        <Button className="cursor-pointer" onClick={openAdd}>
          <Plus />
          Tambah Karyawan
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
            placeholder="Cari nama, email, atau ID karyawan..."
            className="h-10 pl-10"
          />
        </div>
        <Select
          value={deptFilter}
          onValueChange={(v) => {
            setDeptFilter(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10">
            <span className="flex flex-1 items-center text-left">
              {deptFilter === "all" ? "Semua Departemen" : deptFilter}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Departemen</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10">
            <span className="flex flex-1 items-center text-left">
              {statusFilter === "all" ? "Semua Status" : statusFilter}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead className="hidden md:table-cell">Departemen</TableHead>
              <TableHead>Wajah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  Memuat data karyawan...
                </TableCell>
              </TableRow>
            )}
            {!loading && (employees ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  Tidak ada data karyawan.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              (employees ?? []).map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {emp.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {emp.department}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleFace(emp)}
                      title="Klik untuk ubah status wajah"
                      className="cursor-pointer"
                    >
                      {emp.faceRegistered ? (
                        <Badge variant="secondary">
                          <ScanFace /> Terdaftar
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <ScanFace /> Belum
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        emp.status === "Active" ? "secondary" : "outline"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit"
                        onClick={() => openEdit(emp)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={
                          emp.status === "Active" ? "Nonaktifkan" : "Aktifkan"
                        }
                        onClick={() => toggleStatus(emp)}
                      >
                        {emp.status === "Active" ? (
                          <ToggleRight className="text-green-600" />
                        ) : (
                          <ToggleLeft />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Hapus"
                        onClick={() => setDeleteTarget(emp)}
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
          itemLabel="karyawan"
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl py-8">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Karyawan" : "Tambah Karyawan"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi karyawan di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {formError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-name">Nama Lengkap</Label>
                <Input
                  id="f-name"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-email">Email</Label>
                <Input
                  id="f-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-position">Posisi</Label>
                <Input
                  id="f-position"
                  required
                  value={form.position}
                  onChange={(e) => updateField("position", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-password">Password</Label>
                <Input
                  id="f-password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder={
                    editing
                      ? "Kosongkan jika tidak diubah"
                      : "Minimal 6 karakter"
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Departemen</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => updateField("department", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    updateField(
                      "status",
                      (v ?? "Active") as "Active" | "Inactive",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-joined">Tanggal Bergabung</Label>
                <Input
                  id="f-joined"
                  type="date"
                  value={form.joinedAt}
                  onChange={(e) => updateField("joinedAt", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Foto Wajah (3 foto)</Label>
              <div className="flex flex-wrap gap-3">
                {form.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative size-20 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={p.url}
                      alt={`Foto wajah ${i + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white"
                      aria-label="Hapus foto"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                ))}
                {Array.from({
                  length: Math.max(0, MAX_PHOTOS - form.photos.length),
                }).map((_, i) => (
                  <label
                    key={`add-${i}`}
                    className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-5" />
                    <span className="text-[10px]">Tambah</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotos}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Unggah 3 foto pengenalan wajah untuk pendaftaran.
              </p>
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
                {saving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Karyawan?</DialogTitle>
            <DialogDescription>
              Karyawan{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
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
