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
    <Card className="p-6">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-bold">
        {value}
      </h3>
    </Card>
  );
}
