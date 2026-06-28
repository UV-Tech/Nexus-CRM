import type { AutomationGraph, GraphNode } from "./types";
import { SPEC_BY_TYPE, LEAD_SOURCES } from "./catalog";

export interface GenerateResult {
  name: string;
  graph: AutomationGraph;
  notes: string[];
}

// A local, rule-based "agent" that turns a natural-language description into an
// automation graph. No external API — deterministic keyword matching. Designed
// so a real LLM (Claude) can replace this later behind the same interface.
export function generateAutomation(description: string): GenerateResult {
  const text = description.toLowerCase();
  const notes: string[] = [];
  const nodes: GraphNode[] = [];
  let x = 80;
  const y = 160;
  let idc = 0;
  const nextId = () => `n${++idc}`;

  const detectSource = () =>
    LEAD_SOURCES.find((s) => s !== "any" && text.includes(s)) ?? "any";

  const push = (type: string, config: Record<string, unknown>) => {
    const node: GraphNode = {
      id: nextId(),
      type,
      position: { x, y },
      data: { config },
    };
    nodes.push(node);
    x += 260;
    return node;
  };

  // ---- Trigger -------------------------------------------------------------
  if (text.includes("won") || text.includes("closed")) {
    push("trigger.stage_changed", {});
    notes.push("Pick the target stage on the trigger (e.g. Won).");
  } else if (text.includes("assigned")) {
    push("trigger.lead_assigned", {});
  } else {
    const source = detectSource();
    push("trigger.lead_created", { source });
    if (source !== "any") {
      notes.push(`Trigger filtered to source "${source}".`);
    }
  }

  // ---- Optional condition --------------------------------------------------
  const amountMatch = text.match(/(?:over|above|more than|>)\s*\$?\s*([\d,]+)/);
  if (amountMatch) {
    const amount = Number(amountMatch[1].replace(/,/g, ""));
    push("condition.value_gt", { amount });
  }

  // ---- Actions (in mentioned order, deduped) -------------------------------
  const actions: { type: string; config: Record<string, unknown> }[] = [];
  const want = (kw: string[]) => kw.some((k) => text.includes(k));

  if (want(["assign"])) actions.push({ type: "action.assign", config: {} });
  if (want(["move", "stage", "pipeline"]))
    actions.push({ type: "action.move_stage", config: {} });
  if (want(["whatsapp", "wa message", "whats app"]))
    actions.push({ type: "action.send_whatsapp", config: {} });
  if (want(["email", "mail"]))
    actions.push({ type: "action.send_email", config: {} });
  if (want(["note", "log", "comment"]))
    actions.push({ type: "action.add_note", config: { text: "" } });
  if (want(["notify", "alert", "slack", "ping"]))
    actions.push({ type: "action.notify", config: {} });

  // Fallback so the automation always does something.
  if (actions.length === 0) {
    actions.push({
      type: "action.add_note",
      config: { text: "Review this new lead" },
    });
  }

  for (const a of actions) {
    const spec = SPEC_BY_TYPE[a.type];
    push(a.type, a.config);
    if (spec?.pendingIntegration) {
      notes.push(
        `"${spec.label}" needs its channel connected in Integrations before it can run.`
      );
    }
  }

  // ---- Wire nodes linearly -------------------------------------------------
  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}`,
    source: n.id,
    target: nodes[i + 1].id,
  }));

  // ---- Name ----------------------------------------------------------------
  const name =
    description.trim().split(/\s+/).slice(0, 6).join(" ") || "New automation";

  return { name: name.charAt(0).toUpperCase() + name.slice(1), graph: { nodes, edges }, notes };
}
