import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TodayPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Overview</CardTitle>
          <CardDescription>Your daily activities and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No activities logged yet. Start tracking your day!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

