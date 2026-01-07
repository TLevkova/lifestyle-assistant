import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Profile settings coming soon...
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>App settings and data management</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/settings">
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Open Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

