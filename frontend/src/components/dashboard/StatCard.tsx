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
      className="
        p-6
        transition-all
        hover:scale-[1.02]
        hover:shadow-xl
      "
    >
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </Card>
  );
}
