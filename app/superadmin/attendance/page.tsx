"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, CalendarCheck, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiFetchFull } from "@/lib/api";
import * as XLSX from "xlsx-js-style";

type AttendanceItem = {
  id: string;
  externalEventId: string | null;
  employeeId: string | null;
  cameraId: string;
  eventType: string;
  similarity: number | null;
  timestamp: string;
  confirmationStatus: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string | null;
    position: string | null;
  } | null;
};

type DailyAttendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string;
};

type DailyBuilder = Omit<DailyAttendance, "workingHours"> & {
  checkInTs: number;
  checkOutTs: number;
};

type Override = { checkIn: string | null; checkOut: string | null };

type EditForm = {
  key: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
};

function calcWorkingHours(
  checkIn: string | null,
  checkOut: string | null,
): string {
  if (!checkIn || !checkOut) return "—";
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}j ${mins % 60}m`;
}

function toDaily(records: AttendanceItem[]): DailyAttendance[] {
  const map = new Map<string, DailyBuilder>();
  for (const r of records) {
    const ts = new Date(r.timestamp).getTime();
    if (Number.isNaN(ts)) continue;
    const d = new Date(r.timestamp);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const key = `${r.employeeId ?? "unknown"}-${date}`;
    const cur = map.get(key) ?? {
      id: r.id,
      employeeId: r.employeeId ?? "",
      employeeName: r.employee?.name ?? "—",
      date,
      checkIn: null,
      checkOut: null,
      checkInTs: Number.POSITIVE_INFINITY,
      checkOutTs: Number.NEGATIVE_INFINITY,
    };
    if (r.eventType === "CHECK_IN" && ts < cur.checkInTs) {
      cur.checkIn = time;
      cur.checkInTs = ts;
    }
    if (r.eventType === "CHECK_OUT" && ts > cur.checkOutTs) {
      cur.checkOut = time;
      cur.checkOutTs = ts;
    }
    map.set(key, cur);
  }

  return Array.from(map.values()).map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    date: r.date,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    workingHours: calcWorkingHours(r.checkIn, r.checkOut),
  }));
}

export default function AttendancePage() {
  const [events, setEvents] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const PAGE_SIZE = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("employee_id", debouncedSearch);
        if (startDate) params.set("start_date", `${startDate}T00:00:00.000Z`);
        if (endDate) params.set("end_date", `${endDate}T23:59:59.999Z`);
        params.set("limit", "100");
        const res = await apiFetchFull<AttendanceItem[]>(
          `/v1/attendance?${params.toString()}`,
        );
        if (!active) return;
        setEvents(res.data ?? []);
      } catch (err) {
        console.error("Gagal mengambil data absensi:", err);
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedSearch, startDate, endDate]);

  const summaries = useMemo(() => {
    const list = toDaily(events);
    list.sort(
      (a, b) =>
        b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName),
    );
    return list;
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(summaries.length / PAGE_SIZE));
  const pageToUse = Math.min(page, totalPages);
  const paged = summaries.slice(
    (pageToUse - 1) * PAGE_SIZE,
    pageToUse * PAGE_SIZE,
  );
  const start = summaries.length === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, summaries.length);

  function keyOf(r: DailyAttendance): string {
    return `${r.employeeId}-${r.date}`;
  }

  function effective(r: DailyAttendance) {
    const ov = overrides[keyOf(r)];
    const checkIn = ov?.checkIn ?? r.checkIn;
    const checkOut = ov?.checkOut ?? r.checkOut;
    return {
      checkIn,
      checkOut,
      workingHours: ov ? calcWorkingHours(checkIn, checkOut) : r.workingHours,
    };
  }

  function openEdit(r: DailyAttendance) {
    const ov = overrides[keyOf(r)];
    setEditing({
      key: keyOf(r),
      employeeName: r.employeeName,
      date: r.date,
      checkIn: ov?.checkIn ?? r.checkIn ?? "",
      checkOut: ov?.checkOut ?? r.checkOut ?? "",
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
      "Tanggal",
      "Check In",
      "Check Out",
      "Jam Kerja",
    ];
    const rows = summaries.map((r) => {
      const { checkIn, checkOut, workingHours } = effective(r);
      return [
        r.employeeName,
        r.employeeId,
        r.date,
        checkIn ?? "-",
        checkOut ?? "-",
        workingHours,
      ];
    });

    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
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
    XLSX.writeFile(wb, `laporan-attendance-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Pantau kehadiran karyawan hari ini & histori"
        icon={<CalendarCheck className="size-6" />}
      >
        <Button className="cursor-pointer" onClick={handleExport}>
          <Download />
          Ekspor Laporan
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
            placeholder="Cari employee ID..."
            className="h-10 bg-white pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-fit bg-white"
          />
          <span className="text-sm text-muted-foreground">s.d.</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-fit bg-white"
          />
        </div>
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
            {!loading && paged.length === 0 && (
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
              paged.map((r) => {
                const { checkIn, checkOut, workingHours } = effective(r);
                return (
                  <TableRow key={`${r.id}-${r.date}`}>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{r.employeeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.employeeId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.date}
                    </TableCell>
                    <TableCell>{checkIn ?? "—"}</TableCell>
                    <TableCell>{checkOut ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {workingHours}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Perbaiki catatan"
                          onClick={() => openEdit(r)}
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
          total={summaries.length}
          start={start}
          end={end}
          itemLabel="catatan"
          onPageChange={setPage}
        />
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perbaiki Catatan Kehadiran</DialogTitle>
            <DialogDescription>
              Perbaiki jam kehadiran untuk {editing?.employeeName} ({editing?.date}).
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
