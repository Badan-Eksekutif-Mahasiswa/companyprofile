import { Badge } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProkerStatus } from "@/types";

const VARIANT = { upcoming: "outline", ongoing: "blue", done: "navy" } as const;

/** Badge status proker (PRD 6.5): Akan Datang = abu, Sedang Berjalan = biru, Selesai = gelap. */
export function StatusBadge({ status, onDark, className }: { status: ProkerStatus; onDark?: boolean; className?: string }) {
  return (
    <Badge
      variant={VARIANT[status]}
      dot={status === "ongoing"}
      // Di atas latar navy, badge "Selesai" diberi garis agar tetap terbaca.
      className={cn(onDark && status === "done" && "ring-1 ring-inset ring-white/40", className)}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
