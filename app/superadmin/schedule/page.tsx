"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  Coffee,
  LogIn,
  LogOut,
  Timer,
  CalendarDays,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { TableState } from "@/components/table-state";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Schedule = {
  id: string;
  scheduleCode: string;
  name: string;
  workDays: string[];
  checkInTime: string;
  checkOutTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
  toleranceMinutes: number;
  createdAt?: string;
  updatedAt?: string;
};

const weekdays = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const emptyForm: Omit<Schedule, "id"> = {
  scheduleCode: "",
  name: "",
  workDays: [],
  checkInTime: "08:00",
  checkOutTime: "17:00",
  breakStartTime: "12:00",
  breakEndTime: "13:00",
  toleranceMinutes: 15,
};

function daysLabel(days: string[]): string {
  if (days.length === 0) return "-";
  return weekdays.filter((w) => days.includes(w)).join(", ");
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Schedule[]>("/v1/schedules");
        if (!active) return;
        setSchedules(data ?? []);
      } catch (err) {
        console.error("Gagal mengambil jadwal kerja:", err);
        if (active) setSchedules([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setForm({
      scheduleCode: s.scheduleCode,
      name: s.name,
      workDays: s.workDays,
      checkInTime: s.checkInTime,
      checkOutTime: s.checkOutTime,
      breakStartTime: s.breakStartTime ?? "",
      breakEndTime: s.breakEndTime ?? "",
      toleranceMinutes: s.toleranceMinutes,
    });
    setFormError("");
    setFormOpen(true);
  }

  function toggleDay(day: string) {
    setForm((prev) => {
      const exists = prev.workDays.includes(day);
      const next = exists
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day];
      return { ...prev, workDays: weekdays.filter((w) => next.includes(w)) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = {
        scheduleCode: form.scheduleCode,
        name: form.name,
        workDays: form.workDays,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        breakStartTime: form.breakStartTime || null,
        breakEndTime: form.breakEndTime || null,
        toleranceMinutes: form.toleranceMinutes,
      };
      if (editing) {
        await apiFetch(`/v1/schedules/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(`Jadwal ${form.name} berhasil diperbarui`);
      } else {
        await apiFetch("/v1/schedules", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`Jadwal ${form.name} berhasil ditambahkan`);
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan jadwal"
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/v1/schedules/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`Jadwal ${deleteTarget.name} berhasil dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus jadwal");
    }
  }

  function updateField<K extends keyof Omit<Schedule, "id">>(
    key: K,
    value: string | string[] | number
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Work Schedule"
        description="Atur jadwal kerja yang diikuti sistem pengenalan wajah"
        icon={<CalendarRange className="size-6" />}
      >
        <Button className="cursor-pointer" onClick={openAdd}>
          <Plus />
          Tambah Jadwal
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jadwal</TableHead>
              <TableHead className="hidden md:table-cell">Hari Kerja</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Istirahat</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="hidden lg:table-cell">Toleransi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              loading={loading}
              empty={schedules.length === 0}
              colSpan={7}
              loadingText="Memuat jadwal kerja..."
              emptyText="Belum ada jadwal kerja."
            />
            {!loading &&
              schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.scheduleCode || s.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      <CalendarDays className="size-3" />
                      {daysLabel(s.workDays)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <LogIn className="size-3.5 text-green-600" />
                      {s.checkInTime}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Coffee className="size-3.5 text-amber-600" />
                      {s.breakStartTime ?? "-"} - {s.breakEndTime ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <LogOut className="size-3.5 text-red-500" />
                      {s.checkOutTime}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="size-3.5" />
                      {s.toleranceMinutes} menit
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Hapus"
                        onClick={() => setDeleteTarget(s)}
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
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl py-8">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Jadwal" : "Tambah Jadwal"}
            </DialogTitle>
            <DialogDescription>
              Tentukan hari kerja & jam kerja untuk shift ini.
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
                <Label htmlFor="s-code">Kode Jadwal</Label>
                <Input
                  id="s-code"
                  required
                  value={form.scheduleCode}
                  onChange={(e) => updateField("scheduleCode", e.target.value)}
                  placeholder="contoh: SHIFT-A"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-name">Nama Jadwal</Label>
                <Input
                  id="s-name"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="contoh: Shift Pagi"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const active = form.workDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-in">Check In</Label>
                <Input
                  id="s-in"
                  type="time"
                  required
                  value={form.checkInTime}
                  onChange={(e) => updateField("checkInTime", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-out">Check Out</Label>
                <Input
                  id="s-out"
                  type="time"
                  required
                  value={form.checkOutTime}
                  onChange={(e) => updateField("checkOutTime", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-bs">Istirahat Mulai</Label>
                <Input
                  id="s-bs"
                  type="time"
                  value={form.breakStartTime ?? ""}
                  onChange={(e) =>
                    updateField("breakStartTime", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-be">Istirahat Selesai</Label>
                <Input
                  id="s-be"
                  type="time"
                  value={form.breakEndTime ?? ""}
                  onChange={(e) => updateField("breakEndTime", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-tol">Toleransi Terlambat (menit)</Label>
                <Input
                  id="s-tol"
                  type="number"
                  min={0}
                  value={form.toleranceMinutes}
                  onChange={(e) =>
                    updateField("toleranceMinutes", Number(e.target.value))
                  }
                />
              </div>
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
        noun="Jadwal"
        name={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
