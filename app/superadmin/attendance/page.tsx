"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, CalendarCheck, Pencil } from "lucide-react";

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
import { pushNotification } from "@/components/notification-store";
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";
import { apiFetch } from "@/lib/api";
import * as XLSX from "xlsx-js-style";

type DailyAttendanceItem = {
  id: string;
  employeeId: string;
  name: string;
  department: string | null;
  position: string | null;
  employeeStatus: "Active" | "Inactive";
  present: boolean;
  attendanceCount: number;
  confirmationStatus: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
};

type DailyAttendanceResult = {
  date: string;
  total: number;
  activeCount: number;
  presentCount: number;
  absentCount: number;
  items: DailyAttendanceItem[];
};

type Override = { checkIn: string | null; checkOut: string | null };

type EditForm = {
  key: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
};

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function calcWorkingHours(inIso: string | null, outIso: string | null): string {
  if (!inIso || !outIso) return "—";
  const a = new Date(inIso).getTime();
  const b = new Date(outIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return "—";
  let mins = Math.round((b - a) / 60000);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}j ${mins % 60}m`;
}

export default function AttendancePage() {
  const [daily, setDaily] = useState<DailyAttendanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const PAGE_SIZE = 10;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<DailyAttendanceResult>(
          `/v1/attendance/daily?date=${date}`,
        );
        if (!active) return;
        setDaily(res);
      } catch (err) {
        console.error("Gagal mengambil kehadiran harian:", err);
        if (active) setDaily(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [date]);

  const items = useMemo(() => {
    const q = search.toLowerCase();
    const list = daily?.items ?? [];
    if (!q) return list;
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.employeeId.toLowerCase().includes(q),
    );
  }, [daily, search]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageToUse = Math.min(page, totalPages);
  const paged = items.slice((pageToUse - 1) * PAGE_SIZE, pageToUse * PAGE_SIZE);
  const start = items.length === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, items.length);

  function keyOf(item: DailyAttendanceItem): string {
    return `${item.employeeId}-${daily?.date ?? date}`;
  }

  function effective(item: DailyAttendanceItem) {
    const ov = overrides[keyOf(item)];
    const checkIn = ov?.checkIn ?? toTime(item.checkInAt);
    const checkOut = ov?.checkOut ?? toTime(item.checkOutAt);
    return {
      checkIn,
      checkOut,
      workingHours: ov
        ? calcWorkingHours(
            ov.checkIn ? `${date}T${ov.checkIn}` : null,
            ov.checkOut ? `${date}T${ov.checkOut}` : null,
          )
        : calcWorkingHours(item.checkInAt, item.checkOutAt),
    };
  }

  function openEdit(item: DailyAttendanceItem) {
    const ov = overrides[keyOf(item)];
    const cur = effective(item);
    setEditing({
      key: keyOf(item),
      employeeName: item.name,
      date: daily?.date ?? date,
      checkIn: ov?.checkIn ?? (cur.checkIn === "—" ? "" : cur.checkIn),
      checkOut: ov?.checkOut ?? (cur.checkOut === "—" ? "" : cur.checkOut),
    });
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setOverrides((prev) => ({
      ...prev,
      [editing.key]: {
        checkIn: editing.checkIn || null,
        checkOut: editing.checkOut || null,
      },
    }));
    pushNotification({
      type: "checkin",
      title: "Catatan Kehadiran Diperbaiki",
      description: `${editing.employeeName} (${editing.date}) · check-in ${editing.checkIn || "-"} · check-out ${editing.checkOut || "-"}`,
    });
    setEditing(null);
  }

  function handleExport() {
    const headers = [
      "Karyawan",
      "Employee ID",
      "Departemen",
      "Tanggal",
      "Check In",
      "Check Out",
      "Jam Kerja",
      "Status",
    ];
    const rows = items.map((i) => {
      const { checkIn, checkOut, workingHours } = effective(i);
      return [
        i.name,
        i.employeeId,
        i.department ?? "-",
        daily?.date ?? date,
        checkIn === "—" ? "-" : checkIn,
        checkOut === "—" ? "-" : checkOut,
        workingHours,
        i.present ? "Hadir" : "Absen",
      ];
    });

    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];

    const headerCell = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
    };
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      ws[addr] = { ...ws[addr], ...headerCell };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `laporan-attendance-${date}.xlsx`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Daftar kehadiran karyawan harian"
        icon={<CalendarCheck className="size-6" />}
      >
        <div className="flex flex-wrap items-center gap-2">
          {!loading && daily && (
            <>
              <Badge variant="secondary">{daily.presentCount} Hadir</Badge>
              <Badge variant="outline">{daily.absentCount} Absen</Badge>
            </>
          )}
          <Button className="cursor-pointer" onClick={handleExport}>
            <Download />
            Ekspor Laporan
          </Button>
        </div>
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
            placeholder="Cari nama atau employee ID..."
            className="h-10 bg-white pl-10"
          />
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value || todayLocal());
            setPage(1);
          }}
          className="h-10 w-fit bg-white"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="text-right">Jam Kerja</TableHead>
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
                  Memuat data kehadiran...
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  Tidak ada data kehadiran.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              paged.map((item) => {
                const { checkIn, checkOut, workingHours } = effective(item);
                return (
                  <TableRow key={`${item.id}-${daily?.date ?? date}`}>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {daily?.date ?? date}
                    </TableCell>
                    <TableCell>{checkIn}</TableCell>
                    <TableCell>{checkOut}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {workingHours}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Perbaiki catatan"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        <DataTablePagination
          page={pageToUse}
          pageCount={totalPages}
          total={items.length}
          start={start}
          end={end}
          itemLabel="karyawan"
          onPageChange={setPage}
        />
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perbaiki Catatan Kehadiran</DialogTitle>
            <DialogDescription>
              Perbaiki jam kehadiran untuk {editing?.employeeName} (
              {editing?.date}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-in">Check In</Label>
                <Input
                  id="e-in"
                  type="time"
                  value={editing?.checkIn ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, checkIn: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-out">Check Out</Label>
                <Input
                  id="e-out"
                  type="time"
                  value={editing?.checkOut ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, checkOut: e.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
              <Button type="submit" className="cursor-pointer">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
