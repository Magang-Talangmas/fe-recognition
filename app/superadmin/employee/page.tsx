"use client";

import { useEffect, useMemo, useState } from "react";
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

type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  status: "Active" | "Inactive";
  faceRegistered: boolean;
  joinedAt: string;
  photos: string[];
};

const initialEmployees: Employee[] = [
  {
    id: "EMP-001",
    name: "Andi Pratama",
    email: "andi@talangmas.co.id",
    position: "Staff IT",
    department: "Information Technology",
    status: "Active",
    faceRegistered: true,
    joinedAt: "2023-02-14",
    photos: [],
  },
  {
    id: "EMP-002",
    name: "Siti Rahma",
    email: "siti@talangmas.co.id",
    position: "HR Manager",
    department: "Human Resources",
    status: "Active",
    faceRegistered: true,
    joinedAt: "2022-08-01",
    photos: [],
  },
  {
    id: "EMP-003",
    name: "Budi Santoso",
    email: "budi@talangmas.co.id",
    position: "Accountant",
    department: "Finance",
    status: "Active",
    faceRegistered: false,
    joinedAt: "2023-11-20",
    photos: [],
  },
  {
    id: "EMP-004",
    name: "Dewi Lestari",
    email: "dewi@talangmas.co.id",
    position: "Marketing Staff",
    department: "Marketing",
    status: "Inactive",
    faceRegistered: true,
    joinedAt: "2021-05-09",
    photos: [],
  },
];

const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
];

const emptyForm: Omit<Employee, "id"> = {
  name: "",
  email: "",
  position: "",
  department: "",
  status: "Active",
  faceRegistered: false,
  joinedAt: new Date().toISOString().slice(0, 10),
  photos: [],
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageToUse = Math.min(page, totalPages);
  const safePage = pageToUse;
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, deptFilter, statusFilter]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({ ...emp });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editing.id ? { ...emp, ...form } : emp)),
      );
    } else {
      const nextId = `EMP-${String(employees.length + 1).padStart(3, "0")}`;
      setEmployees((prev) => [{ id: nextId, ...form }, ...prev]);
    }
    setFormOpen(false);
  }

  function toggleStatus(emp: Employee) {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === emp.id
          ? { ...e, status: e.status === "Active" ? "Inactive" : "Active" }
          : e,
      ),
    );
  }

  function toggleFace(emp: Employee) {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === emp.id ? { ...e, faceRegistered: !e.faceRegistered } : e,
      ),
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const room = 3 - form.photos.length;
    if (room <= 0) return;
    const added = files.slice(0, room).map((f) => URL.createObjectURL(f));
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
      <PageHeader title="Employee" description="Kelola akun karyawan & data pengenalan wajah">
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau ID karyawan..."
            className="h-10 pl-10"
          />
        </div>
        <Select
          value={deptFilter}
          onValueChange={(v) => setDeptFilter(v ?? "all")}
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
          onValueChange={(v) => setStatusFilter(v ?? "all")}
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  Tidak ada data karyawan.
                </TableCell>
              </TableRow>
            )}
            {paged.map((emp) => (
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
                    variant={emp.status === "Active" ? "secondary" : "outline"}
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
          total={filtered.length}
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
                {form.photos.map((src, i) => (
                  <div
                    key={i}
                    className="relative size-20 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={src}
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
                  length: Math.max(0, 3 - form.photos.length),
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
