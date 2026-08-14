import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noun: string;
  name: string;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  noun,
  name,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus {noun}?</DialogTitle>
          <DialogDescription>
            {noun}{" "}
            <span className="font-medium text-foreground">{name}</span> akan
            dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button variant="destructive" className="cursor-pointer" onClick={onConfirm}>
            <Trash2 />
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}