import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: number;
};

export function StatCard({ icon, tone, label, value }: StatCardProps) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-md ${tone}`}
        >
          {icon}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}