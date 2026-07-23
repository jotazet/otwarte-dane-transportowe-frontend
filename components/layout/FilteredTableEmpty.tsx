import { EmptyState } from "@/components/layout/EmptyState";

export function FilteredTableEmpty({
  hasAnyData,
  error,
  emptyMessage,
  noMatchMessage,
}: {
  hasAnyData: boolean;
  error: string | null;
  emptyMessage: string;
  noMatchMessage: string;
}) {
  if (error) return null;
  return <EmptyState title={hasAnyData ? noMatchMessage : emptyMessage} />;
}
