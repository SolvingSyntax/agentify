import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiFetch, getStoredToken } from '../lib/api/client';

export const Route = createFileRoute('/agents')({
  component: AgentsPage,
});

function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testingAgent, setTestingAgent] = useState<any | null>(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Assistant');
  const [model, setModel] = useState('gemini-1.5-pro');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [creating, setCreating] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/agents/');
      setAgents(Array.isArray(res) ? res : res?.items || res?.agents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/agents/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          role,
          model,
          system_prompt: systemPrompt,
          temperature: Number(temperature),
          is_active: true,
        }),
      });

      // Reset Form & Refresh List
      setName('');
      setSystemPrompt('');
      setIsCreateOpen(false);
      await fetchAgents();
    } catch (err: any) {
      alert(`Error creating agent: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleTestAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingAgent || !testPrompt.trim()) return;

    setTestLoading(true);
    setTestResponse('');
    try {
      const res = await apiFetch(`/agents/${testingAgent.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ prompt: testPrompt }),
      });
      setTestResponse(res?.response || res?.output || res?.message || JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResponse(`Test Error: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI agent?')) return;
    try {
      await apiFetch(`/agents/${id}`, { method: 'DELETE' });
      fetchAgents();
    } catch (err: any) {
      alert(`Failed to delete agent: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-8 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
            AI Workforce
          </p>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure, manage, and test specialized Gemini AI workforce agents.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
        >
          <span>+ New Agent</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-sm">
          Loading AI Agents...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : agents.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-800 rounded-2xl bg-[#111726]/50">
          <p className="text-gray-300 font-medium text-base mb-1">No AI Agents Configured</p>
          <p className="text-gray-500 text-xs mb-4">Get started by creating your first specialized Gemini agent.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-6 rounded-2xl bg-[#111726] border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-white">{agent.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      agent.is_active !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}
                  >
                    {agent.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-emerald-400/90 font-mono mb-2">Role: {agent.role || 'Assistant'}</p>
                <p className="text-xs text-gray-400 line-clamp-3 bg-[#182032] p-2.5 rounded-lg border border-gray-800/80">
                  {agent.system_prompt || 'No system prompt specified.'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-mono text-[11px]">{agent.model || 'gemini-1.5-pro'}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setTestingAgent(agent);
                      setTestPrompt('');
                      setTestResponse('');
                    }}
                    className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                  >
                    Test Agent
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-gray-800 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">Create New AI Agent</h2>
            <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Reviewer Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#182032] border border-gray-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#182032] border border-gray-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#182032] border border-gray-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">System Instructions / Prompt</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Define the behavior, rules, and output instructions for this AI agent..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#182032] border border-gray-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Temperature ({temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Agent Drawer / Modal */}
      {testingAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-gray-800 p-6 rounded-2xl w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-lg font-bold">Testing Agent: {testingAgent.name}</h2>
              <button
                onClick={() => setTestingAgent(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTestAgent} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Test Input Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type a query to test how this agent responds..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#182032] border border-gray-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={testLoading}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold disabled:opacity-50"
              >
                {testLoading ? 'Running Gemini AI...' : 'Run Test'}
              </button>
            </form>

            {testResponse && (
              <div className="mt-4 p-4 rounded-xl bg-[#090D16] border border-gray-800 space-y-1">
                <p className="text-[10px] font-mono text-emerald-400 uppercase">Agent Response:</p>
                <pre className="text-xs text-gray-200 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                  {testResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}