"use client";

import { useMemo, useState } from "react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type ReportRow = {
  code: string;
  label: string;
  present: number;
  late: number;
  absent: number;
  unknown: number;
};

const reportTypes = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "employee", label: "Per Karyawan" },
  { value: "recognition", label: "Histori Pengenalan" },
  { value: "unknown", label: "Deteksi Tidak Dikenal" },
];

const mockRows: Record<string, ReportRow[]> = {
  daily: [
    { code: "Sen, 03 Agt 2026", label: "Senin", present: 96, late: 4, absent: 2, unknown: 1 },
    { code: "Sel, 02 Agt 2026", label: "Selasa", present: 98, late: 2, absent: 0, unknown: 2 },
    { code: "Sab, 01 Agt 2026", label: "Sabtu", present: 88, late: 3, absent: 5, unknown: 3 },
  ],
  weekly: [
    { code: "W1", label: "Minggu 1 - Juli", present: 480, late: 15, absent: 12, unknown: 6 },
    { code: "W2", label: "Minggu 2 - Juli", present: 495, late: 10, absent: 8, unknown: 4 },
    { code: "W3", label: "Minggu 3 - Juli", present: 470, late: 18, absent: 15, unknown: 9 },
  ],
  monthly: [
    { code: "Jul 2026", label: "Juli", present: 1895, late: 61, absent: 42, unknown: 23 },
    { code: "Jun 2026", label: "Juni", present: 1830, late: 55, absent: 50, unknown: 19 },
    { code: "Mei 2026", label: "Mei", present: 1901, late: 58, absent: 38, unknown: 21 },
  ],
  employee: [
    { code: "EMP-001", label: "Andi Pratama", present: 22, late: 1, absent: 0, unknown: 0 },
    { code: "EMP-002", label: "Siti Rahma", present: 22, late: 0, absent: 0, unknown: 0 },
    { code: "EMP-003", label: "Budi Santoso", present: 20, late: 3, absent: 2, unknown: 0 },
  ],
  recognition: [
    { code: "REC-01", label: "338 deteksi", present: 98, late: 0, absent: 0, unknown: 0 },
    { code: "REC-02", label: "312 deteksi", present: 99, late: 0, absent: 0, unknown: 0 },
  ],
  unknown: [
    { code: "UN-001", label: "CAM-01", present: 0, late: 0, absent: 0, unknown: 12 },
    { code: "UN-002", label: "CAM-03", present: 0, late: 0, absent: 0, unknown: 7 },
  ],
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-31");

  const rows = useMemo(
    () => mockRows[reportType] ?? [],
    [reportType]
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        present: acc.present + r.present,
        late: acc.late + r.late,
        absent: acc.absent + r.absent,
        unknown: acc.unknown + r.unknown,
      }),
      { present: 0, late: 0, absent: 0, unknown: 0 }
    );
  }, [rows]);

  function handleExport() {
    const headers = ["Kode", "Keterangan", "Hadir", "Terlambat", "Absen", "Tidak Dikenal"];
    const data = rows.map((r) => [r.code, r.label, r.present, r.late, r.absent, r.unknown]);
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
          <Select value={reportType} onValueChange={(v) => setReportType(v ?? "monthly")}>
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
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-fit bg-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="r-end">Tanggal Akhir</Label>
          <Input
            id="r-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 w-fit bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<UserCheck className="size-5" />} tone="text-green-600 bg-green-100" label="Hadir" value={totals.present} />
        <StatCard icon={<Clock4 className="size-5" />} tone="text-amber-600 bg-amber-100" label="Terlambat" value={totals.late} />
        <StatCard icon={<UserX className="size-5" />} tone="text-red-600 bg-red-100" label="Absen" value={totals.absent} />
        <StatCard icon={<Users className="size-5" />} tone="text-purple-600 bg-purple-100" label="Tidak Dikenal" value={totals.unknown} />
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
              <TableHead>Tidak Dikenal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada data untuk laporan ini.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.code}>
                <TableCell className="font-medium">{r.code}</TableCell>
                <TableCell className="text-muted-foreground">{r.label}</TableCell>
                <TableCell>{r.present}</TableCell>
                <TableCell>
                  {r.late > 0 ? (
                    <Badge variant="outline">{r.late}</Badge>
                  ) : (
                    r.late
                  )}
                </TableCell>
                <TableCell>{r.absent}</TableCell>
                <TableCell>{r.unknown}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type StatProps = {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: number;
};

function StatCard({ icon, tone, label, value }: StatProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-9 items-center justify-center rounded-md ${tone}`}>
          {icon}
        </div>
        <span className="text-2xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}
