import { Save } from "lucide-react";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/store/ui-store";

const groups = [
  {
    title: "General",
    fields: [
      ["Application Name", "NeuraX AI"],
      ["Logo", "/logo.svg"],
      ["Theme", "Dark"],
      ["Version", "2.8.4"],
    ],
  },
  {
    title: "Integrations",
    fields: [
      ["SMTP", "smtp.neurax.ai"],
      ["Firebase", "neurax-production"],
      ["Google Login", "Enabled"],
      ["JWT", "HS512 rotated"],
    ],
  },
  {
    title: "Infrastructure",
    fields: [
      ["PostgreSQL", "postgres://primary:5432"],
      ["Ollama URL", "http://ollama:11434"],
      ["API URL", "https://api.neurax.ai"],
      ["Maintenance Mode", "Off"],
    ],
  },
];

export function SettingsPage() {
  const { addToast } = useUiStore();
  return (
    <Page
      title="Settings"
      description="Configure application identity, theme, SMTP, Firebase, Google Login, JWT, PostgreSQL, Ollama URL, API URL, maintenance mode, version, and about details."
      actions={
        <Button onClick={() => addToast({ title: "Settings saved", description: "Configuration is ready for REST API persistence.", variant: "success" })}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.fields.map(([label, value]) => (
                <label key={label} className="block">
                  <span className="mb-2 block text-sm text-slate-400">{label}</span>
                  <Input defaultValue={value} />
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>NeuraX AI Admin Console for monitoring users, AI workloads, subscriptions, infrastructure, API traffic, storage, and audit logs.</p>
          <Badge variant="primary">Production-ready shell</Badge>
        </CardContent>
      </Card>
    </Page>
  );
}
