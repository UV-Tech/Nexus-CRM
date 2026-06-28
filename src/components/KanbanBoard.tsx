"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateLeadStage } from "@/app/(app)/leads/actions";

interface KanbanStage {
  id: string;
  name: string;
  color: string;
}

interface KanbanLead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  value: number | null;
  stage_id: string | null;
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function KanbanBoard({
  stages,
  leads: initialLeads,
}: {
  stages: KanbanStage[];
  leads: KanbanLead[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function moveTo(leadId: string, stageId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === stageId) return;

    // Optimistic update; persist in the background.
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage_id: stageId } : l))
    );
    startTransition(async () => {
      await updateLeadStage(leadId, stageId);
    });
  }

  return (
    <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage_id === stage.id);
        const total = stageLeads.reduce(
          (sum, l) => sum + (Number(l.value) || 0),
          0
        );
        const isOver = overStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOverStage(null);
              if (dragId) moveTo(dragId, stage.id);
              setDragId(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-white transition-colors ${
              isOver ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium text-slate-800">{stage.name}</span>
                <span className="text-xs text-slate-400">
                  {stageLeads.length}
                </span>
              </div>
              <span className="text-xs text-slate-400">{fmtMoney(total)}</span>
            </div>

            <div className="flex min-h-[60px] flex-col gap-2 p-3">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab rounded-lg border border-slate-200 p-3 hover:border-brand-300 active:cursor-grabbing ${
                    dragId === lead.id ? "opacity-50" : ""
                  }`}
                >
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-slate-900 hover:text-brand-600"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {lead.company || lead.email || lead.phone || "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {fmtMoney(Number(lead.value) || 0)}
                  </p>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  גררו לכאן
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
