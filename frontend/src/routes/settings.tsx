import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncBoundary } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi, useMutation } from "@/hooks/use-api";
import { settingsService } from "@/lib/api/services";
import { pageHead } from "@/lib/seo";
import type { AISettings, ProfileSettings, SecuritySettings, WorkspaceSettings } from "@/types/api";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("Settings", "Workspace, AI model, profile and security preferences."),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="All changes are saved to the backend." />
      <Tabs defaultValue="workspace">
        <TabsList className="mb-6 flex-wrap"><TabsTrigger value="workspace">Workspace</TabsTrigger><TabsTrigger value="ai">AI models</TabsTrigger><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="integrations">Integrations</TabsTrigger></TabsList>
        <TabsContent value="workspace"><SettingsForm load={settingsService.workspace} save={settingsService.saveWorkspace}>{(v, set) => <>
          <Field label="Workspace name"><Input value={v.name} onChange={(e) => set({ ...v, name: e.target.value })} required /></Field>
          <Field label="Timezone"><Input value={v.timezone} onChange={(e) => set({ ...v, timezone: e.target.value })} placeholder="Asia/Kolkata" /></Field>
          <Toggle label="Require approval for new workflow steps by default" checked={v.default_approval_required} onChange={(c) => set({ ...v, default_approval_required: c })} />
        </>}</SettingsForm></TabsContent>
        <TabsContent value="ai"><SettingsForm<AISettings> load={settingsService.ai} save={(v) => settingsService.saveAi({ default_provider: v.default_provider, default_model: v.default_model })}>{(v, set) => {
          const models = v.available.find((a) => a.provider === v.default_provider)?.models ?? [];
          return <>
            <Field label="Default provider"><select className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm" value={v.default_provider} onChange={(e) => set({ ...v, default_provider: e.target.value, default_model: "" })}>
              <option value="">Select…</option>{v.available.map((a) => <option key={a.provider}>{a.provider}</option>)}</select></Field>
            <Field label="Default model"><select className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm" value={v.default_model} onChange={(e) => set({ ...v, default_model: e.target.value })} disabled={!models.length}>
              <option value="">Select…</option>{models.map((m) => <option key={m}>{m}</option>)}</select></Field>
            {v.available.length === 0 && <p className="text-xs text-muted-foreground">No providers connected. <Link to="/integrations" className="text-primary hover:underline">Connect one in Integrations</Link>.</p>}
          </>;
        }}</SettingsForm></TabsContent>
        <TabsContent value="profile"><SettingsForm<ProfileSettings> load={settingsService.profile} save={settingsService.saveProfile}>{(v, set) => <>
          <Field label="Full name"><Input value={v.full_name} onChange={(e) => set({ ...v, full_name: e.target.value })} required /></Field>
          <Field label="Email"><Input type="email" value={v.email} onChange={(e) => set({ ...v, email: e.target.value })} required /></Field>
        </>}</SettingsForm></TabsContent>
        <TabsContent value="security"><SettingsForm<SecuritySettings> load={settingsService.security} save={settingsService.saveSecurity}>{(v, set) => <>
          <Toggle label="Multi-factor authentication" checked={v.mfa_enabled} onChange={(c) => set({ ...v, mfa_enabled: c })} />
          <Field label="Session timeout (minutes)"><Input type="number" min={5} max={1440} value={v.session_timeout_minutes} onChange={(e) => set({ ...v, session_timeout_minutes: Number(e.target.value) })} /></Field>
        </>}</SettingsForm></TabsContent>
        <TabsContent value="integrations"><div className="panel p-6 text-sm text-muted-foreground">Integration credentials and connection status are managed on the <Link to="/integrations" className="text-primary hover:underline">Integrations page</Link>.</div></TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><Label asChild><span>{label}</span></Label>{children}</label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

function SettingsForm<T>({ load, save, children }: { load: () => Promise<T>; save: (v: T) => Promise<T>; children: (v: T, set: (v: T) => void) => ReactNode }) {
  const state = useApi(() => load());
  const [draft, setDraft] = useState<T>();
  useEffect(() => { if (state.data) setDraft(state.data); }, [state.data]);
  const m = useMutation(save, { success: "Settings saved", onSuccess: (r) => state.setData(() => r) });
  return (
    <AsyncBoundary state={state} rows={2}>{() => draft === undefined ? null : (
      <form className="panel max-w-xl space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); m.run(draft); }}>
        {children(draft, setDraft)}
        <Button type="submit" disabled={m.pending}>{m.pending && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
      </form>
    )}</AsyncBoundary>
  );
}
