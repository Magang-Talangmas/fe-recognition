"use client";

import { useState } from "react";
import {
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  Clock3,
  Coffee,
  LogIn,
  LogOut,
  Timer,
  CalendarDays,
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

type Schedule = {
  id: string;
  name: string;
  workingDays: string;
  checkIn: string;
  breakStart: string;
  breakEnd: string;
  checkOut: string;
  lateTolerance: number;
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

const initialSchedules: Schedule[] = [
  {
    id: "SCH-01",
    name: "Shift Kantor",
    workingDays: "Senin - Jumat",
    checkIn: "08:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    checkOut: "17:00",
    lateTolerance: 15,
  },
  {
    id: "SCH-02",
    name: "Shift Produksi",
    workingDays: "Senin - Sabtu",
    checkIn: "07:30",
    breakStart: "11:30",
    breakEnd: "12:30",
    checkOut: "16:30",
    lateTolerance: 10,
  },
  {
    id: "SCH-03",
    name: "Shift Security",
    workingDays: "Senin - Minggu",
    checkIn: "19:00",
    breakStart: "23:00",
    breakEnd: "00:00",
    checkOut: "07:00",
    lateTolerance: 5,
  },
];

const emptyForm: Omit<Schedule, "id"> = {
  name: "",
  workingDays: "",
  checkIn: "08:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  checkOut: "17:00",
  lateTolerance: 15,
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setForm({ ...s });
    setFormOpen(true);
  }

  function toggleDay(day: string) {
    setForm((prev) => {
      const days = prev.workingDays
        ? prev.workingDays.split(", ")
        : [];
      const exists = days.includes(day);
      const next = exists
        ? days.filter((d) => d !== day)
        : [...days, day];
      const ordered = weekdays.filter((w) => next.includes(w));
      return { ...prev, workingDays: ordered.join(", ") };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s))
      );
    } else {
      const nextId = `SCH-${String(schedules.length + 1).padStart(2, "0")}`;
      setSchedules((prev) => [{ id: nextId, ...form }, ...prev]);
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function updateField<K extends keyof Omit<Schedule, "id">>(
    key: K,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CalendarRange className="size-6" />
            Work Schedule
          </h1>
          <p className="text-sm text-muted-foreground">
            Atur jadwal kerja yang diikuti sistem pengenalan wajah
          </p>
        </div>
        <Button className="cursor-pointer" onClick={openAdd}>
          <Plus />
          Tambah Jadwal
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
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
            {schedules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Belum ada jadwal kerja.
                </TableCell>
              </TableRow>
            )}
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.id}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">
                    <CalendarDays className="size-3" />
                    {s.workingDays}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <LogIn className="size-3.5 text-green-600" />
                    {s.checkIn}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Coffee className="size-3.5 text-amber-600" />
                    {s.breakStart} - {s.breakEnd}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <LogOut className="size-3.5 text-red-500" />
                    {s.checkOut}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="size-3.5" />
                    {s.lateTolerance} menit
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="s-name">Nama Jadwal</Label>
              <Input
                id="s-name"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="contoh: Shift Kantor"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const active = form.workingDays
                    .split(", ")
                    .includes(day);
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
                  value={form.checkIn}
                  onChange={(e) => updateField("checkIn", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-out">Check Out</Label>
                <Input
                  id="s-out"
                  type="time"
                  required
                  value={form.checkOut}
                  onChange={(e) => updateField("checkOut", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-bs">Istirahat Mulai</Label>
                <Input
                  id="s-bs"
                  type="time"
                  value={form.breakStart}
                  onChange={(e) => updateField("breakStart", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-be">Istirahat Selesai</Label>
                <Input
                  id="s-be"
                  type="time"
                  value={form.breakEnd}
                  onChange={(e) => updateField("breakEnd", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-tol">Toleransi Terlambat (menit)</Label>
                <Input
                  id="s-tol"
                  type="number"
                  min={0}
                  value={form.lateTolerance}
                  onChange={(e) =>
                    updateField("lateTolerance", e.target.value)
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
            <DialogTitle>Hapus Jadwal?</DialogTitle>
            <DialogDescription>
              Jadwal{" "}
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