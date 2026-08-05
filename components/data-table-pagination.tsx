"use client";

import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

function getVisiblePages(
  page: number,
  pageCount: number,
): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = Array.from(
    new Set([1, pageCount, page - 1, page, page + 1]),
  )
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  start,
  end,
  itemLabel,
  onPageChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <span className="text-xs text-muted-foreground">
        Menampilkan {start}-{end} dari {total} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Sebelumnya
        </Button>
        {getVisiblePages(page, pageCount).map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className={`cursor-pointer ${
                page === p ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}