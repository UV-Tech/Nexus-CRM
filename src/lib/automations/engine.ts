import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationGraph, GraphNode } from "./types";

export type AutomationEventType =
  | "lead.created"
  | "lead.stage_changed"
  | "lead.assigned";

export interface LeadSnapshot {
  id: string;
  organization_id: string;
  source: string;
  value: number | null;
  stage_id: string | null;
  assigned_to: string | null;
  phone: string | null;
  custom_data: Record<string, unknown>;
}

export interface AutomationEvent {
  type: AutomationEventType;
  lead: LeadSnapshot;
  /** For stage_changed: the stage the lead just moved to. */
  stageId?: string | null;
}

const TRIGGER_FOR: Record<AutomationEventType, string> = {
  "lead.created": "trigger.lead_created",
  "lead.stage_changed": "trigger.stage_changed",
  "lead.assigned": "trigger.lead_assigned",
};

function cfg(node: GraphNode, key: string): string {
  const v = node.data?.config?.[key];
  return v == null ? "" : String(v);
}

function triggerMatches(node: GraphNode, event: AutomationEvent): boolean {
  if (node.type !== TRIGGER_FOR[event.type]) return false;
  if (node.type === "trigger.lead_created") {
    const src = cfg(node, "source");
    return !src || src === "any" || src === event.lead.source;
  }
  if (node.type === "trigger.stage_changed") {
    const want = cfg(node, "stage_id");
    return !want || want === (event.stageId ?? event.lead.stage_id ?? "");
  }
  return true;
}

function conditionPasses(node: GraphNode, lead: LeadSnapshot): boolean {
  switch (node.type) {
    case "condition.source_is": {
      const src = cfg(node, "source");
      return !src || src === "any" || src === lead.source;
    }
    case "condition.value_gt":
      return (Number(lead.value) || 0) > Number(cfg(node, "amount") || 0);
    case "condition.stage_is":
      return (lead.stage_id ?? "") === cfg(node, "stage_id");
    case "condition.field_equals":
      return (
        String(lead.custom_data?.[cfg(node, "field")] ?? "") ===
        cfg(node, "value")
      );
    default:
      return true;
  }
}

// Executes one action node. Returns a short label for the run log. Mutates the
// in-memory lead so later conditions see the change.
async function runAction(
  supabase: SupabaseClient,
  node: GraphNode,
  lead: LeadSnapshot
): Promise<string> {
  switch (node.type) {
    case "action.assign": {
      const member = cfg(node, "member") || null;
      await supabase.from("leads").update({ assigned_to: member }).eq("id", lead.id);
      lead.assigned_to = member;
      return "assigned";
    }
    case "action.move_stage": {
      const stageId = cfg(node, "stage_id") || null;
      await supabase.from("leads").update({ stage_id: stageId }).eq("id", lead.id);
      lead.stage_id = stageId;
      return "moved stage";
    }
    case "action.add_note": {
      await supabase.from("lead_activities").insert({
        organization_id: lead.organization_id,
        lead_id: lead.id,
        type: "note",
        body: cfg(node, "text") || "Automation note",
      });
      return "added note";
    }
    case "action.set_field": {
      const field = cfg(node, "field");
      if (field) {
        const next = { ...lead.custom_data, [field]: cfg(node, "value") };
        await supabase.from("leads").update({ custom_data: next }).eq("id", lead.id);
        lead.custom_data = next;
      }
      return "set field";
    }
    // WhatsApp: drop a queued outbound message into the inbox if we have a
    // phone. Real delivery happens when the WhatsApp API token is wired.
    case "action.send_whatsapp": {
      if (!lead.phone) return "whatsapp skipped (no phone)";
      const { data: convo } = await supabase
        .from("wa_conversations")
        .upsert(
          {
            organization_id: lead.organization_id,
            contact_phone: lead.phone,
            lead_id: lead.id,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,contact_phone" }
        )
        .select("id")
        .single();
      if (convo) {
        await supabase.from("wa_messages").insert({
          organization_id: lead.organization_id,
          conversation_id: convo.id,
          direction: "out",
          body: cfg(node, "template") || "Automated message",
          status: "queued",
        });
      }
      return "queued whatsapp";
    }
    // Other external actions require an integration — recorded, not yet sent.
    case "action.send_email":
    case "action.notify":
      return `pending integration (${node.type})`;
    default:
      return "noop";
  }
}

// Runs all enabled automations for an org against an event. Best-effort:
// failures are logged to automation_runs and never thrown to the caller.
export async function runAutomations(
  supabase: SupabaseClient,
  organizationId: string,
  event: AutomationEvent
): Promise<void> {
  try {
    const { data: automations } = await supabase
      .from("automations")
      .select("id, graph")
      .eq("organization_id", organizationId)
      .eq("enabled", true);

    for (const automation of automations ?? []) {
      const graph = automation.graph as AutomationGraph;
      const nodes = graph?.nodes ?? [];
      const edges = graph?.edges ?? [];
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const children = (id: string) =>
        edges.filter((e) => e.source === id).map((e) => byId.get(e.target)!).filter(Boolean);

      const trigger = nodes.find(
        (n) => n.type.startsWith("trigger.") && triggerMatches(n, event)
      );
      if (!trigger) continue;

      const lead = { ...event.lead, custom_data: { ...event.lead.custom_data } };
      const log: string[] = [];
      const visited = new Set<string>();
      const queue: GraphNode[] = children(trigger.id);

      while (queue.length) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;
        visited.add(node.id);

        if (node.type.startsWith("condition.")) {
          if (!conditionPasses(node, lead)) continue; // prune this branch
          queue.push(...children(node.id));
        } else if (node.type.startsWith("action.")) {
          try {
            log.push(await runAction(supabase, node, lead));
          } catch (e) {
            log.push(`error: ${(e as Error).message}`);
          }
          queue.push(...children(node.id));
        }
      }

      await supabase.from("automation_runs").insert({
        organization_id: organizationId,
        automation_id: automation.id,
        lead_id: event.lead.id,
        status: log.some((l) => l.startsWith("error")) ? "error" : "success",
        detail: log.join(", ") || "no actions",
      });
    }
  } catch {
    // Never let automation processing break the triggering operation.
  }
}
