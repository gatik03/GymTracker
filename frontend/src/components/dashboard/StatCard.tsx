import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  value: string;
};

export function StatCard({
  title,
  value,
}: Props) {
  return (
    <Card
      className="border-0 border-l border-border bg-transparent p-4 shadow-none ring-0"
    >
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </Card>
  );
}
