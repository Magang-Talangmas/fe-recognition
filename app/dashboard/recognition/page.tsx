"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanFace, Search, BadgeCheck, UserX } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";

type Detection = {
  id: string;
  employee: string;
  camera: string;
  timestamp: string;
  confidence: number;
  status: "Verified" | "Unknown";
};

const initialDetections: Detection[] = [
  { id: "REC-0001", employee: "Andi Pratama", camera: "CAM-01", timestamp: "2026-08-03 08:02:11", confidence: 96.4, status: "Verified" },
  { id: "REC-0002", employee: "Siti Rahma", camera: "CAM-02", timestamp: "2026-08-03 08:05:33", confidence: 95.1, status: "Verified" },
  { id: "REC-0003", employee: "Budi Santoso", camera: "CAM-03", timestamp: "2026-08-03 08:11:04", confidence: 92.8, status: "Verified" },
  { id: "REC-0004", employee: "Tidak dikenal", camera: "CAM-01", timestamp: "2026-08-03 08:14:52", confidence: 41.3, status: "Unknown" },
  { id: "REC-0005", employee: "Dewi Lestari", camera: "CAM-02", timestamp: "2026-08-03 08:17:20", confidence: 94.7, status: "Verified" },
  { id: "REC-0006", employee: "Rizky Ananda", camera: "CAM-04", timestamp: "2026-08-03 08:21:09", confidence: 93.2, status: "Verified" },
  { id: "REC-0007", employee: "Tidak dikenal", camera: "CAM-03", timestamp: "2026-08-03 09:03:47", confidence: 38.9, status: "Unknown" },
  { id: "REC-0008", employee: "Lia Kusuma", camera: "CAM-02", timestamp: "2026-08-03 09:10:02", confidence: 95.8, status: "Verified" },
  { id: "REC-0009", employee: "Hendra Wijaya", camera: "CAM-04", timestamp: "2026-08-03 09:24:16", confidence: 91.5, status: "Verified" },
  { id: "REC-0010", employee: "Tidak dikenal", camera: "CAM-01", timestamp: "2026-08-03 09:31:58", confidence: 45.0, status: "Unknown" },
  { id: "REC-0011", employee: "Putri Ayu", camera: "CAM-03", timestamp: "2026-08-03 10:02:44", confidence: 96.1, status: "Verified" },
  { id: "REC-0012", employee: "Fajar Hidayat", camera: "CAM-02", timestamp: "2026-08-03 10:15:21", confidence: 94.0, status: "Verified" },
];

export default function RecognitionPage() {
  const [detections, setDetections] = useState<Detection[]>(initialDetections);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return detections.filter((d) => {
      const matchSearch =
        !q ||
        d.employee.toLowerCase().includes(q) ||
        d.camera.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [detections, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageToUse = Math.min(page, totalPages);
  const paged = filtered.slice((pageToUse - 1) * PAGE_SIZE, pageToUse * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const verifiedCount = detections.filter((d) => d.status === "Verified").length;
  const unknownCount = detections.filter((d) => d.status === "Unknown").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Face Recognition"
        description="Hasil deteksi & pengenalan wajah dari CCTV"
        icon={<ScanFace className="size-6" />}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <BadgeCheck className="size-3" />
            {verifiedCount} Verified
          </Badge>
          <Badge variant="destructive">
            <UserX className="size-3" />
            {unknownCount} Unknown
          </Badge>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari karyawan, kamera, atau ID deteksi..."
            className="h-10 pl-10"
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
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-md border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Deteksi</TableHead>
              <TableHead>Karyawan</TableHead>
              <TableHead>Kamera</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada data deteksi.
                </TableCell>
              </TableRow>
            )}
            {paged.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.id}</TableCell>
                <TableCell className="font-medium">{d.employee}</TableCell>
                <TableCell className="text-muted-foreground">{d.camera}</TableCell>
                <TableCell className="text-muted-foreground">{d.timestamp}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className={`h-full rounded-full ${
                          d.confidence >= 90
                            ? "bg-green-500"
                            : d.confidence >= 70
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, d.confidence)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums">
                      {d.confidence.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={d.status === "Verified" ? "secondary" : "destructive"}>
                    {d.status}
                  </Badge>
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
          itemLabel="deteksi"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
