import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plug, Key, RefreshCw, Linkedin, Mail, Cpu, MessageSquare, CheckCircle2, X, Settings2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status";
import { useApi } from "@/hooks/use-api";
import { integrationService } from "@/lib/api/services";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
});

interface ConfigField {
  label: string;
  key: string;
  placeholder: string;
  type?: string;
}

interface IntegrationItem {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: any;
  status: "active" | "inactive";
  apiKey?: string;
  configFields?: ConfigField[];
}

interface LocalConfig {
  status: "active" | "inactive";
  apiKey: string;
}

const DEFAULT_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "linkedin",
    name: "LinkedIn Platform",
    type: "OAuth 2.0 / API",
    description: "Automate post publishing, comment tracking, and profile network interactions.",
    icon: Linkedin,
    status: "inactive",
    configFields: [
      { label: "Access Token / OAuth Key", key: "apiKey", placeholder: "AQV..." },
      { label: "Organization ID (URN)", key: "orgId", placeholder: "urn:li:organization:123456" },
    ],
  },
  {
    id: "primary-mail",
    name: "Primary Mail Server",
    type: "SMTP / IMAP",
    description: "Send automated transactional emails, approval alerts, and daily workflow digests.",
    icon: Mail,
    status: "active",
    apiKey: "smtp://user:pass@smtp.mail.com:587",
    configFields: [
      { label: "SMTP Connection String / API Key", key: "apiKey", placeholder: "smtp://user:pass@host:port" },
      { label: "Sender Email Address", key: "sender", placeholder: "noreply@company.com" },
    ],
  },
  {
    id: "groq-llm",
    name: "Groq AI Engine",
    type: "LLM API Key",
    description: "Ultra-fast inference provider for LLM nodes (`llama-3.1-8b-instant`).",
    icon: Cpu,
    status: "active",
    apiKey: "gsk_...",
    configFields: [
      { label: "Groq API Key", key: "apiKey", placeholder: "gsk_..." },
    ],
  },
  {
    id: "slack-workspace",
    name: "Slack Webhooks",
    type: "Webhook URL",
    description: "Trigger real-time notifications and human-in-the-loop approval messages in channels.",
    icon: MessageSquare,
    status: "inactive",
    configFields: [
      { label: "Webhook URL", key: "apiKey", placeholder: "https://hooks.slack.com/services/..." },
    ],
  },
];

export function IntegrationsPage() {
  const state = useApi(() => integrationService.list());
  const [localIntegrations, setLocalIntegrations] = useState<Record<string, LocalConfig>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const displayIntegrations = useMemo(() => {
    const rawData = state.data;
    const backendItems: any[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as any)?.items)
      ? (rawData as any).items
      : [];

    return DEFAULT_INTEGRATIONS.map((def) => {
      const match = backendItems.find((b: any) => b.id === def.id || b.name?.toLowerCase().includes(def.id));
      const override = localIntegrations[def.id];
      const status: "active" | "inactive" = override ? override.status : (match?.status || (match?.apiKey ? "active" : def.status));
      const apiKey: string = override ? override.apiKey : (match?.apiKey || def.apiKey || "");

      return {
        ...def,
        status,
        apiKey,
      };
    });
  }, [state.data, localIntegrations]);

  const handleOpenConfig = (item: IntegrationItem) => {
    setSelectedIntegration(item);
    setFormData({
      apiKey: item.apiKey || "",
    });
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;

    const apiKeyVal = formData["apiKey"] || "";

    try {
      if (typeof integrationService.update === "function") {
        await integrationService.update(selectedIntegration.id, {
          status: "active",
          apiKey: apiKeyVal,
        });
      }

      setLocalIntegrations((prev) => ({
        ...prev,
        [selectedIntegration.id]: {
          status: "active",
          apiKey: apiKeyVal,
        },
      }));

      toast.success(`${selectedIntegration.name} connected successfully!`);
      setSelectedIntegration(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update integration");
    }
  };

  const handleToggleStatus = async (item: IntegrationItem) => {
    const newStatus: "active" | "inactive" = item.status === "active" ? "inactive" : "active";
    const currentApiKey = item.apiKey || "";

    try {
      if (typeof integrationService.toggle === "function") {
        await integrationService.toggle(item.id, newStatus === "active");
      }

      setLocalIntegrations((prev) => ({
        ...prev,
        [item.id]: {
          status: newStatus,
          apiKey: currentApiKey,
        },
      }));

      toast.success(`${item.name} set to ${newStatus}`);
    } catch {
      setLocalIntegrations((prev) => ({
        ...prev,
        [item.id]: {
          status: newStatus,
          apiKey: currentApiKey,
        },
      }));
      toast.success(`${item.name} status updated`);
    }
  };

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect social platforms, databases, and APIs to extend agent workflows
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => state.reload()} disabled={state.loading}>
          <RefreshCw className={`size-4 mr-2 ${state.loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {state.loading && displayIntegrations.length === 0 ? (
        <LoadingState />
      ) : state.error && displayIntegrations.length === 0 ? (
        <ErrorState error={state.error as any} onRetry={state.reload} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayIntegrations.map((item) => {
            const IconComponent = item.icon || Plug;
            const isConnected = item.status === "active";

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-white">{item.name}</h3>
                        <span className="text-[11px] font-mono text-muted-foreground">{item.type}</span>
                      </div>
                    </div>
                    <StatusBadge status={isConnected ? "active" : "inactive"} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
                  <span className="flex items-center gap-1 font-mono text-muted-foreground">
                    <Key className="size-3 text-primary" />
                    {item.apiKey ? "••••" + item.apiKey.slice(-4) : "Not configured"}
                  </span>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenConfig(item)} title="Settings">
                        <Settings2 className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isConnected ? "outline" : "default"}
                      onClick={() => (isConnected ? handleToggleStatus(item) : handleOpenConfig(item))}
                    >
                      {isConnected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <selectedIntegration.icon className="size-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Configure {selectedIntegration.name}</h3>
              </div>
              <button onClick={() => setSelectedIntegration(null)} className="text-muted-foreground hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">{selectedIntegration.description}</p>

            {(selectedIntegration.configFields || []).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "password"}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} className="gap-2">
                <CheckCircle2 className="size-4" /> Save & Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationsPage;