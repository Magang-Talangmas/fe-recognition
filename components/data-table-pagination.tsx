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
        {Array.from({ length: pageCount }).map((_, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className={`cursor-pointer ${
              page === i + 1 ? "bg-primary text-primary-foreground" : ""
            }`}
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
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