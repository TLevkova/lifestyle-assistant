import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";

export default function WorkoutsPage() {
  return (
    <PageContainer>
      <EmptyState message="Workout tracking coming soon..." />
    </PageContainer>
  );
}

