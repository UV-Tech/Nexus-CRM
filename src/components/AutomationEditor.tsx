"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  NODE_SPECS,
  SPEC_BY_TYPE,
  LEAD_SOURCES,
  specsByCategory,
  type ConfigField,
} from "@/lib/automations/catalog";
import { saveAutomation, toggleAutomation } from "@/app/(app)/automations/actions";
import type { Automation } from "@/lib/automations/types";

interface Options {
  stages: { id: string; name: string }[];
  members: { id: string; name: string }[];
  fields: { key: string; label: string }[];
}

const CATEGORY_STYLES: Record<string, string> = {
  trigger: "border-brand-400 bg-brand-50",
  condition: "border-amber-400 bg-amber-50",
  action: "border-emerald-400 bg-emerald-50",
};

// Hebrew display labels for node categories. The keys are the internal
// category type values (must stay English) — only the labels are translated.
const CATEGORY_LABELS: Record<"trigger" | "condition" | "action", string> = {
  trigger: "טריגרים",
  condition: "תנאים",
  action: "פעולות",
};

function CrmNode({ data, selected }: NodeProps) {
  const specType = (data as { specType: string }).specType;
  const spec = SPEC_BY_TYPE[specType];
  if (!spec) return null;

  return (
    <div
      className={`min-w-[170px] rounded-xl border-2 px-3 py-2 shadow-sm ${
        CATEGORY_STYLES[spec.category]
      } ${selected ? "ring-2 ring-brand-300" : ""}`}
    >
      {spec.category !== "trigger" && (
        <Handle type="target" position={Position.Left} />
      )}
      <div className="flex items-center gap-2">
        <span className="text-lg">{spec.emoji}</span>
        <span className="text-sm font-medium text-slate-800">{spec.label}</span>
      </div>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
        {spec.category}
        {spec.pendingIntegration ? " · דורש אינטגרציה" : ""}
      </p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { crm: CrmNode };

function toFlowNodes(a: Automation): Node[] {
  return (a.graph?.nodes ?? []).map((n) => ({
    id: n.id,
    type: "crm",
    position: n.position,
    data: { specType: n.type, config: n.data?.config ?? {} },
  }));
}

function toFlowEdges(a: Automation): Edge[] {
  return (a.graph?.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
}

function EditorInner({
  automation,
  options,
}: {
  automation: Automation;
  options: Options;
}) {
  const [name, setName] = useState(automation.name);
  const [enabled, setEnabled] = useState(automation.enabled);
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(automation));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(automation));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Seed the id counter past any node ids already in the saved graph so newly
  // added nodes never collide with loaded ones (e.g. "node-1").
  const [idc, setIdc] = useState(() => {
    let max = 0;
    for (const n of automation.graph?.nodes ?? []) {
      const m = /^node-(\d+)$/.exec(n.id);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max + 1;
  });

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge({ ...c, id: `e-${c.source}-${c.target}-${eds.length}` }, eds)
      ),
    [setEdges]
  );

  function addNode(specType: string) {
    const id = `node-${idc}`;
    setIdc((n) => n + 1);
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "crm",
        position: { x: 120 + (nds.length % 4) * 60, y: 80 + nds.length * 70 },
        data: { specType, config: {} },
      },
    ]);
  }

  function setConfig(nodeId: string, key: string, value: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                config: { ...(n.data as { config: object }).config, [key]: value },
              },
            }
          : n
      )
    );
  }

  function removeNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedId(null);
  }

  async function save() {
    setSaving(true);
    const graph = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as { specType: string }).specType,
        position: n.position,
        data: { config: (n.data as { config: Record<string, unknown> }).config },
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
    await saveAutomation(automation.id, name, graph);
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedSpec = selected
    ? SPEC_BY_TYPE[(selected.data as { specType: string }).specType]
    : null;

  return (
    <div className="flex min-h-0 flex-1">
      {/* Palette */}
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          הוספת בלוק
        </p>
        {(["trigger", "condition", "action"] as const).map((cat) => (
          <div key={cat} className="mt-3">
            <p className="px-1 text-xs font-medium capitalize text-slate-500">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="mt-1 flex flex-col gap-1">
              {specsByCategory(cat).map((spec) => (
                <button
                  key={spec.type}
                  onClick={() => addNode(spec.type)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-left text-sm hover:border-brand-400 hover:bg-slate-50"
                >
                  <span>{spec.emoji}</span>
                  <span className="text-slate-700">{spec.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Canvas */}
      <div className="relative min-w-0 flex-1">
        {/* Toolbar */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-2 py-1.5 backdrop-blur">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-48 rounded border border-slate-200 px-2 py-1 text-sm font-medium"
          />
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "שומר…" : "שמירה"}
          </button>
          <form action={toggleAutomation}>
            <input type="hidden" name="automation_id" value={automation.id} />
            <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
            <button
              onClick={() => setEnabled((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {enabled ? "פעיל" : "כבוי"}
            </button>
          </form>
          {savedAt && (
            <span className="text-xs text-slate-400">נשמר {savedAt}</span>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              הוסיפו טריגר מהצד כדי להתחיל את התהליך.
            </p>
          </div>
        )}
      </div>

      {/* Config panel */}
      {selected && selectedSpec && (
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {selectedSpec.emoji} {selectedSpec.label}
            </h3>
            <button
              onClick={() => removeNode(selected.id)}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              הסרה
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">{selectedSpec.description}</p>

          <div className="mt-4 flex flex-col gap-3">
            {selectedSpec.config.length === 0 && (
              <p className="text-sm text-slate-400">אין הגדרות לבלוק הזה.</p>
            )}
            {selectedSpec.config.map((field) => (
              <ConfigInput
                key={field.key}
                field={field}
                value={String(
                  (selected.data as { config: Record<string, unknown> }).config[
                    field.key
                  ] ?? ""
                )}
                options={options}
                onChange={(v) => setConfig(selected.id, field.key, v)}
              />
            ))}
          </div>

          {selectedSpec.pendingIntegration && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              הפעולה הזו תרוץ ברגע שהערוץ שלה יחובר במסך האינטגרציות.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

function ConfigInput({
  field,
  value,
  options,
  onChange,
}: {
  field: ConfigField;
  value: string;
  options: Options;
  onChange: (v: string) => void;
}) {
  const cls =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm w-full";

  let control: React.ReactNode;
  if (field.type === "textarea") {
    control = (
      <textarea
        rows={3}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  } else if (field.type === "number") {
    control = (
      <input
        type="number"
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  } else if (field.type === "source" || field.type === "select") {
    const opts =
      field.type === "source" ? LEAD_SOURCES : field.options ?? [];
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "stage") {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">כל שלב / בחרו…</option>
        {options.stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "member") {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">לא משויך</option>
        {options.members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "field") {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">בחרו שדה…</option>
        {options.fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{field.label}</span>
      {control}
    </label>
  );
}

export function AutomationEditor(props: {
  automation: Automation;
  options: Options;
}) {
  // Suppress unused import warning while keeping provider available for hooks.
  void NODE_SPECS;
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
