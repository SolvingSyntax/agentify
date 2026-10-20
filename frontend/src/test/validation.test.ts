import { describe, expect, it } from "vitest";
import { validateAgent, validateWorkflowGraph } from "@/lib/validation";

const node = (id: string, agent: string | null = "a1") => ({ id, position: { x: 0, y: 0 }, data: { label: id, agent_id: agent, inputs: {}, requires_approval: false } });

describe("workflow validation", () => {
  it("rejects empty workflow", () => expect(validateWorkflowGraph([], [])).toContain("Add at least one step."));
  it("rejects step without agent", () => expect(validateWorkflowGraph([node("s", null)], []).length).toBe(1));
  it("detects cycles", () => expect(validateWorkflowGraph([node("a"), node("b")], [{ id: "1", source: "a", target: "b" }, { id: "2", source: "b", target: "a" }]).some((e) => e.includes("cycle"))).toBe(true));
  it("accepts a valid chain", () => expect(validateWorkflowGraph([node("a"), node("b")], [{ id: "1", source: "a", target: "b" }])).toEqual([]));
});
describe("agent validation", () => {
  it("requires name, instructions, provider, model", () => expect(Object.keys(validateAgent({ name: "", description: "", instructions: "", provider: "", model: "", tools: [] })).sort()).toEqual(["instructions", "model", "name", "provider"]));
});
