import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

type TableStateProps = {
  loading: boolean;
  empty: boolean;
  colSpan: number;
  loadingText?: string;
  emptyText?: string;
};

export function TableState({
  loading,
  empty,
  colSpan,
  loadingText = "Memuat data...",
  emptyText = "Tidak ada data.",
}: TableStateProps) {
  if (!loading && !empty) return null;
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-12 text-center text-muted-foreground"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {loadingText}
          </span>
        ) : (
          emptyText
        )}
      </TableCell>
    </TableRow>
  );
}