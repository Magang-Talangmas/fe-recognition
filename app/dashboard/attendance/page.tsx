"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  CalendarCheck,
  Pencil,
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
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Status =
  | "Not Checked In"
  | "Checked In"
  | "Working"
  | "Break"
  | "Tracking Pause"
  | "Checked Out";

type Attendance = {
  id: string;
  employee: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: Status;
  workingHours: string;
};

const statusVariant: Record<
  Status,
  "secondary" | "outline" | "destructive" | "default"
> = {
  "Not Checked In": "destructive",
  "Checked In": "outline",
  Working: "secondary",
  Break: "outline",
  "Tracking Pause": "outline",
  "Checked Out": "secondary",
};

const initialAttendance: Attendance[] = [
  { id: "AT-0001", employee: "Andi Pratama", date: "2026-08-03", checkIn: "08:02", checkOut: "17:05", status: "Working", workingHours: "8j 5m" },
  { id: "AT-0002", employee: "Siti Rahma", date: "2026-08-03", checkIn: "08:05", checkOut: "17:10", status: "Working", workingHours: "8j 2m" },
  { id: "AT-0003", employee: "Budi Santoso", date: "2026-08-03", checkIn: "08:11", checkOut: "", status: "Tracking Pause", workingHours: "7j 20m" },
  { id: "AT-0004", employee: "Dewi Lestari", date: "2026-08-03", checkIn: "09:00", checkOut: "16:30", status: "Checked Out", workingHours: "7j 0m" },
  { id: "AT-0005", employee: "Eko Nugroho", date: "2026-08-03", checkIn: "", checkOut: "", status: "Not Checked In", workingHours: "0j 0m" },
  { id: "AT-0006", employee: "Rina Marlina", date: "2026-08-03", checkIn: "08:20", checkOut: "", status: "Break", workingHours: "3j 40m" },
  { id: "AT-0007", employee: "Fajar Hidayat", date: "2026-08-03", checkIn: "08:01", checkOut: "17:02", status: "Checked Out", workingHours: "8j 10m" },
  { id: "AT-0008", employee: "Rizky Ananda", date: "2026-08-03", checkIn: "08:07", checkOut: "", status: "Working", workingHours: "2j 15m" },
  { id: "AT-0009", employee: "Putri Ayu", date: "2026-08-03", checkIn: "08:30", checkOut: "", status: "Working", workingHours: "1j 55m" },
  { id: "AT-0010", employee: "Hendra Wijaya", date: "2026-08-03", checkIn: "10:05", checkOut: "", status: "Tracking Pause", workingHours: "0j 30m" },
  { id: "AT-0011", employee: "Lia Kusuma", date: "2026-08-03", checkIn: "08:15", checkOut: "", status: "Working", workingHours: "3j 05m" },
  { id: "AT-0012", employee: "Rahmat Fadil", date: "2026-08-03", checkIn: "", checkOut: "", status: "Not Checked In", workingHours: "—" },
];

const statuses: Status[] = [
  "Not Checked In",
  "Checked In",
  "Working",
  "Break",
  "Tracking Pause",
  "Checked Out",
];

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>(initialAttendance);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q || r.employee.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchDate =
        (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchDate && matchStatus;
    });
  }, [records, search, startDate, endDate, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageToUse = Math.min(page, totalPages);
  const paged = filtered.slice((pageToUse - 1) * PAGE_SIZE, pageToUse * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, statusFilter]);

  function handleExport() {
    const headers = [
      "ID",
      "Karyawan",
      "Tanggal",
      "Check In",
      "Check Out",
      "Jam Kerja",
      "Status",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.employee,
      r.date,
      r.checkIn || "-",
      r.checkOut || "-",
      r.workingHours,
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setRecords((prev) =>
      prev.map((r) => (r.id === editing.id ? { ...editing } : r))
    );
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CalendarCheck className="size-6" />
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau kehadiran karyawan hari ini & histori
          </p>
        </div>
        <Button className="cursor-pointer" onClick={handleExport}>
          <Download />
          Ekspor Laporan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau ID karyawan..."
            className="h-10 bg-white pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-fit bg-white"
          />
          <span className="text-sm text-muted-foreground">s.d.</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 w-fit bg-white"
          />
        </div>
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
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Jam Kerja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Tidak ada data kehadiran.
                </TableCell>
              </TableRow>
            )}
            {paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee}</TableCell>
                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                <TableCell>{r.checkIn || "—"}</TableCell>
                <TableCell>{r.checkOut || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.workingHours}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Perbaiki catatan"
                      onClick={() => setEditing(r)}
                    >
                      <Pencil />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <span className="text-xs text-muted-foreground">
            Menampilkan {start}-{end} dari {filtered.length} catatan
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={pageToUse <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className={`cursor-pointer ${
                  pageToUse === i + 1
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={pageToUse >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perbaiki Catatan Kehadiran</DialogTitle>
            <DialogDescription>
              Perbaiki jam kehadiran untuk {editing?.employee}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCorrection} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="c-in">Check In</Label>
                <Input
                  id="c-in"
                  type="time"
                  value={editing?.checkIn ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, checkIn: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="c-out">Check Out</Label>
                <Input
                  id="c-out"
                  type="time"
                  value={editing?.checkOut ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, checkOut: e.target.value } : prev
                    )
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={editing?.status ?? "Working"}
                onValueChange={(v) =>
                  setEditing((prev) =>
                    prev ? { ...prev, status: (v ?? "Working") as Status } : prev
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <span className="flex flex-1 items-center text-left">
                    {editing?.status}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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