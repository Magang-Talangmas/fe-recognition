"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  CalendarCheck,
Pencil,
  ClipboardCheck,
  Camera,
  Check,
  X,
  ImageOff,
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
import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
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
  photo: string | null;
  permission: {
    id: string;
    type: string;
    status: string;
    reason?: string | null;
    photo?: string | null;
    photoUrl?: string | null;
  } | null;
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

type IzinForm = {
  employeeId: string;
  employeeName: string;
  date: string;
  type: string;
  reason: string;
  photo: File | null;
};

type PermissionDetail = {
  id: string;
  type: string;
  status: string;
  reason?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
};

const izinTypes = ["Sakit", "Izin", "Cuti", "Lainnya"];

function permissionStatusLabel(status: string): string {
  if (status === "APPROVED") return "Disetujui";
  if (status === "REJECTED") return "Ditolak";
  return "Menunggu";
}

function isPermissionPending(status: string): boolean {
  return status !== "APPROVED" && status !== "REJECTED";
}

function isCheckInPhoto(url: string | null): boolean {
  if (!url) return false;
  return !url.includes("employee_faces");
}

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
  const [izinOpen, setIzinOpen] = useState(false);
  const [izinForm, setIzinForm] = useState<IzinForm | null>(null);
  const [izinSaving, setIzinSaving] = useState(false);
  const [izinError, setIzinError] = useState("");
  const [previewItem, setPreviewItem] = useState<DailyAttendanceItem | null>(null);
  const [permissionItem, setPermissionItem] =
    useState<DailyAttendanceItem | null>(null);
  const [reviewPhotoFailed, setReviewPhotoFailed] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
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
    toast.success(
      `Catatan kehadiran ${editing.employeeName} (${editing.date}) diperbaiki`,
      {
        description: `Check-in ${editing.checkIn || "-"} · Check-out ${editing.checkOut || "-"}`,
      },
    );
    setEditing(null);
  }

  function openIzin(item: DailyAttendanceItem) {
    setIzinForm({
      employeeId: item.employeeId,
      employeeName: item.name,
      date: daily?.date ?? date,
      type: izinTypes[0],
      reason: "",
      photo: null,
    });
    setIzinError("");
    setIzinOpen(true);
  }

  function openPermissionDetail(item: DailyAttendanceItem) {
    setPermissionItem(item);
    setReviewPhotoFailed(false);
    if (!item.permission) return;
    apiFetch<PermissionDetail>(
      `/v1/attendance/permissions/${item.permission.id}`,
    )
      .then((detail) => {
        setPermissionItem((prev) => {
          if (!prev?.permission) return prev;
          return {
            ...prev,
            permission: {
              ...prev.permission,
              ...detail,
              photo:
                detail.photo ??
                detail.photoUrl ??
                prev.permission.photo ??
                null,
              reason:
                detail.reason ??
                prev.permission.reason ??
                "Tidak ada keterangan",
            },
          };
        });
      })
      .catch((err) => {
        console.error("Gagal mengambil detail perizinan:", err);
      });
  }

  async function submitIzin(e: React.FormEvent) {
    e.preventDefault();
    if (!izinForm) return;
    setIzinSaving(true);
    setIzinError("");
    try {
      const body = new FormData();
      body.append("employeeId", izinForm.employeeId);
      body.append("date", izinForm.date);
      body.append("type", izinForm.type);
      body.append("reason", izinForm.reason);
      if (izinForm.photo) body.append("photo", izinForm.photo);

      await apiFetch("/v1/attendance/permissions", {
        method: "POST",
        body,
      });
      toast.success(
        `Izin ${izinForm.type} untuk ${izinForm.employeeName} berhasil diajukan`,
      );
      setIzinOpen(false);
    } catch (err) {
      console.error("Gagal mengajukan izin:", err);
      setIzinError(err instanceof Error ? err.message : "Gagal mengajukan izin");
    } finally {
      setIzinSaving(false);
    }
  }

  async function reviewPermission(
    item: DailyAttendanceItem,
    status: "APPROVED" | "REJECTED",
  ) {
    const permission = item.permission;
    if (!permission) return;
    setReviewingId(permission.id);
    try {
      await apiFetch(`/v1/attendance/permissions/${permission.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setDaily((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === item.id && i.permission
                  ? { ...i, permission: { ...i.permission, status } }
                  : i,
              ),
            }
          : prev,
      );
      setPermissionItem((prev) =>
        prev && prev.id === item.id && prev.permission
          ? { ...prev, permission: { ...prev.permission, status } }
          : prev,
      );
      toast.success(
        `Perizinan ${item.name} ${
          status === "APPROVED" ? "disetujui" : "ditolak"
        }`,
      );
    } catch (err) {
      console.error("Gagal memproses perizinan:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memproses perizinan",
      );
    } finally {
      setReviewingId(null);
    }
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
              <TableHead>Foto</TableHead>
              <TableHead>Izin</TableHead>
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
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  Memuat data kehadiran...
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
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
                    <TableCell>
                      {isCheckInPhoto(item.photo) ? (
                        <button
                          type="button"
                          title="Lihat foto"
                          className="cursor-pointer rounded-full"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Avatar className="size-9">
                            <AvatarImage src={item.photo!} alt={item.name} />
                          </Avatar>
                        </button>
                      ) : (
                        <span className="block size-9" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.permission ? (
                        <button
                          type="button"
                          className="cursor-pointer"
                          title="Lihat detail perizinan"
                          onClick={() => openPermissionDetail(item)}
                        >
                          <Badge
                            variant={
                              item.permission.status === "APPROVED"
                                ? "secondary"
                                : item.permission.status === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {item.permission.type} ·{" "}
                            {permissionStatusLabel(item.permission.status)}
                          </Badge>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Ajukan izin"
                          onClick={() => openIzin(item)}
                        >
                          <ClipboardCheck />
                        </Button>
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

      <Dialog open={izinOpen} onOpenChange={setIzinOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajukan Izin</DialogTitle>
            <DialogDescription>
              Ajukan izin untuk {izinForm?.employeeName} ({izinForm?.employeeId})
              pada {izinForm?.date}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitIzin} className="flex flex-col gap-4">
            {izinError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {izinError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="i-type">Jenis Izin</Label>
                <select
                  id="i-type"
                  value={izinForm?.type ?? izinTypes[0]}
                  onChange={(e) =>
                    setIzinForm((prev) =>
                      prev ? { ...prev, type: e.target.value } : prev,
                    )
                  }
                  className="h-10 cursor-pointer rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-ring"
                >
                  {izinTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="i-date">Tanggal</Label>
                <Input
                  id="i-date"
                  type="date"
                  value={izinForm?.date ?? todayLocal()}
                  onChange={(e) =>
                    setIzinForm((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="i-reason">Alasan</Label>
              <Input
                id="i-reason"
                required
                value={izinForm?.reason ?? ""}
                onChange={(e) =>
                  setIzinForm((prev) =>
                    prev ? { ...prev, reason: e.target.value } : prev,
                  )
                }
                placeholder="contoh: Sakit dengan surat dokter"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Bukti Foto</Label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground hover:bg-muted/50">
                <Camera className="size-5" />
                {izinForm?.photo
                  ? izinForm.photo.name
                  : "Klik untuk unggah bukti foto izin"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setIzinForm((prev) => (prev ? { ...prev, photo: f } : prev));
                  }}
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setIzinOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={izinSaving}
              >
                {izinSaving ? "Mengirim..." : "Ajukan Izin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!permissionItem}
        onOpenChange={() => setPermissionItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Perizinan</DialogTitle>
            <DialogDescription>
              Perizinan {permissionItem?.name} ({permissionItem?.employeeId}) —{" "}
              {daily?.date ?? date}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Kategori</Label>
              <div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium">
                {permissionItem?.permission?.type ?? "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Alasan Izin</Label>
              <p className="min-h-20 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                {permissionItem?.permission?.reason || "Tidak ada keterangan"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bukti Foto</Label>
              {(() => {
                const photo =
                  permissionItem?.permission?.photo ??
                  permissionItem?.permission?.photoUrl ??
                  (permissionItem?.photo &&
                  isCheckInPhoto(permissionItem.photo)
                    ? permissionItem.photo
                    : null);
                if (!photo) {
                  return (
                    <div className="flex h-36 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                      Tidak ada foto
                    </div>
                  );
                }
                if (reviewPhotoFailed) {
                  return (
                    <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                      <ImageOff className="size-6" />
                      Foto tidak tersedia
                    </div>
                  );
                }
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt="Bukti foto izin"
                    className="max-h-72 w-full rounded-lg border border-border object-cover"
                    onError={() => setReviewPhotoFailed(true)}
                  />
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            {permissionItem?.permission &&
              isPermissionPending(permissionItem.permission.status) && (
                <>
                  <Button
                    className="cursor-pointer"
                    disabled={reviewingId === permissionItem.permission.id}
                    onClick={() =>
                      reviewPermission(permissionItem, "APPROVED")
                    }
                  >
                    <Check />
                    Setujui
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    disabled={reviewingId === permissionItem.permission.id}
                    onClick={() =>
                      reviewPermission(permissionItem, "REJECTED")
                    }
                  >
                    <X />
                    Tolak
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto Kehadiran</DialogTitle>
            <DialogDescription>
              Foto {previewItem?.name} ({previewItem?.employeeId}) —{" "}
              {daily?.date ?? date}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {isCheckInPhoto(previewItem?.photo ?? null) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewItem!.photo!}
                alt={`Foto ${previewItem!.name}`}
                className="max-h-96 w-full rounded-lg border border-border object-cover"
              />
            )}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{previewItem?.permission?.type ?? "Hadir"}</Badge>
              <Badge variant={previewItem?.permission?.status === "APPROVED" ? "secondary" : previewItem?.permission?.status === "REJECTED" ? "destructive" : "outline"}>
                {previewItem?.permission?.status
                  ? permissionStatusLabel(previewItem.permission.status)
                  : "—"}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setPreviewItem(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
