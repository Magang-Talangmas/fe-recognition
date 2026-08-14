"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileBarChart,
  Download,
  Users,
  UserCheck,
  Clock4,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";
import { StatCard } from "@/components/stat-card";
import { TableState } from "@/components/table-state";
import { apiFetch } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";

type ReportRow = {
  code: string;
  label: string;
  present: number;
  late: number;
  absent: number;
  permission: number;
  unknown: number;
};

type ReportTotals = {
  present: number;
  late: number;
  absent: number;
  unknown: number;
};

type ReportResult = {
  rows: ReportRow[];
  totals: ReportTotals;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

const reportTypes = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "employee", label: "Per Karyawan" },
  { value: "recognition", label: "Histori Pengenalan" },
  { value: "unknown", label: "Deteksi Tidak Dikenal" },
];

function monthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

export default function ReportsPage() {
  const router = useRouter();
  const { start: initialStart, end: initialEnd } = monthRange();
  const [reportType, setReportType] = useState("monthly");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState<ReportTotals>({
    present: 0,
    late: 0,
    absent: 0,
    unknown: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const PAGE_SIZE = 10;

  const pageToUse = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, total);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("type", reportType);
        params.set("start_date", startDate);
        params.set("end_date", endDate);
        params.set("page", String(pageToUse));
        params.set("per_page", String(PAGE_SIZE));
        const data = await apiFetch<ReportResult>(
          `/v1/reports?${params.toString()}`,
        );
        if (!active) return;
        setRows(data?.rows ?? []);
        setTotals(
          data?.totals ?? { present: 0, late: 0, absent: 0, unknown: 0 },
        );
        setTotal(data?.total ?? 0);
        setTotalPages(Math.max(1, data?.total_pages ?? 1));
      } catch (err) {
        console.error("Gagal mengambil laporan:", err);
        if (active) {
          setRows([]);
          setTotals({ present: 0, late: 0, absent: 0, unknown: 0 });
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
  }, [reportType, startDate, endDate, pageToUse, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  useRealtime(["checkin", "unknown", "recognition"], refresh);

  function handleExport() {
    const headers = [
      "Kode",
      "Keterangan",
      "Hadir",
      "Terlambat",
      "Absen",
      "Izin",
      "Tidak Dikenal",
    ];
    const data = rows.map((r) => [
      r.code,
      r.label,
      r.present,
      r.late,
      r.absent,
      r.permission,
      r.unknown,
    ]);
    const csv = [headers, ...data]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${reportType}-${startDate || "all"}-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Hasilkan laporan kehadiran & pengenalan wajah"
        icon={<FileBarChart className="size-6" />}
      >
        <Button className="cursor-pointer" onClick={handleExport}>
          <Download />
          Ekspor CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-4 rounded-md border border-border/60 bg-card p-4">
        <div className="flex flex-col gap-2">
          <Label>Jenis Laporan</Label>
          <Select
            value={reportType}
            onValueChange={(v) => {
              setReportType(v ?? "monthly");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-56">
              <span className="flex flex-1 items-center text-left">
                {reportTypes.find((t) => t.value === reportType)?.label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="r-start">Tanggal Mulai</Label>
          <Input
            id="r-start"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-fit bg-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="r-end">Tanggal Akhir</Label>
          <Input
            id="r-end"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-fit bg-white"
          />
        </div>
        <Button variant="outline" className="cursor-pointer" onClick={refresh}>
          Muat Ulang
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<UserCheck className="size-5" />}
          tone="text-green-600 bg-green-100"
          label="Hadir"
          value={totals.present}
        />
        <StatCard
          icon={<Clock4 className="size-5" />}
          tone="text-amber-600 bg-amber-100"
          label="Terlambat"
          value={totals.late}
        />
        <StatCard
          icon={<UserX className="size-5" />}
          tone="text-red-600 bg-red-100"
          label="Absen"
          value={totals.absent}
        />
        <StatCard
          icon={<Users className="size-5" />}
          tone="text-purple-600 bg-purple-100"
          label="Tidak Dikenal"
          value={totals.unknown}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Hadir</TableHead>
              <TableHead>Terlambat</TableHead>
              <TableHead>Absen</TableHead>
              <TableHead>Izin</TableHead>
              <TableHead>Tidak Dikenal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              loading={loading}
              empty={rows.length === 0}
              colSpan={7}
              loadingText="Memuat laporan..."
              emptyText="Tidak ada data untuk laporan ini."
            />
            {!loading &&
              rows.map((r) => (
                <TableRow
                  key={r.code}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/superadmin/reports/${r.code}`)}
                >
                  <TableCell className="font-medium">{r.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.label}
                  </TableCell>
                  <TableCell>{r.present}</TableCell>
                  <TableCell>{r.late}</TableCell>
                  <TableCell>{r.absent}</TableCell>
                  <TableCell>{r.permission}</TableCell>
                  <TableCell>{r.unknown}</TableCell>
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
            itemLabel="baris"
            onPageChange={setPage}
          />
      </div>
    </div>
  );
}
