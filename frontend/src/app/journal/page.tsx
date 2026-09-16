"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Save, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  JournalDraft,
  JournalEntry,
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournalEntries,
  useUpdateJournalEntry,
} from "@/hooks/useJournal";

type EditorDraft = JournalDraft & { id: number | null };
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const today = () => new Date().toISOString().slice(0, 10);
const emptyDraft = (): EditorDraft => ({ id: null, date: today(), title: "", content: "" });

export default function JournalPage() {
  const entries = useJournalEntries();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const [draft, setDraft] = useState<EditorDraft>(emptyDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    if (draft.id === null || saveState !== "dirty" || !draft.content.trim()) return;
    const saveTimer = window.setTimeout(() => {
      setSaveState("saving");
      void updateEntry.mutateAsync({
        id: draft.id as number,
        draft: { date: draft.date, title: draft.title, content: draft.content },
      }).then((saved) => {
        setDraft((current) => current.id === saved.id ? { ...saved, id: saved.id } : current);
        setSaveState("saved");
      }).catch(() => setSaveState("error"));
    }, 900);
    return () => window.clearTimeout(saveTimer);
  }, [draft, saveState, updateEntry]);

  const editEntry = (entry: JournalEntry) => {
    setDraft({ id: entry.id, date: entry.date, title: entry.title, content: entry.content });
    setSaveState("saved");
  };

  const updateDraft = (field: keyof JournalDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState("dirty");
  };

  const saveDraft = async () => {
    if (!draft.content.trim()) {
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    try {
      const payload = { date: draft.date, title: draft.title, content: draft.content };
      const saved = draft.id === null
        ? await createEntry.mutateAsync(payload)
        : await updateEntry.mutateAsync({ id: draft.id, draft: payload });
      setDraft({ id: saved.id, date: saved.date, title: saved.title, content: saved.content });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const removeEntry = async () => {
    if (draft.id === null || !window.confirm("Delete this private journal entry?")) return;
    try {
      await deleteEntry.mutateAsync(draft.id);
      setDraft(emptyDraft());
      setSaveState("idle");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Journal</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Write about your day.</h1>
            <p className="mt-2 max-w-xl text-zinc-400">A private place for training notes, wins, struggles, or anything else you want to remember.</p>
          </div>
          <Button
            type="button"
            onClick={() => { setDraft(emptyDraft()); setSaveState("idle"); }}
            className="gap-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> New entry
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
          <section aria-label="Journal entries" className="space-y-3">
            {entries.isLoading ? (
              <Card className="border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">Loading your journal…</Card>
            ) : entries.isError ? (
              <Card className="border-red-500/30 bg-red-500/5 p-6 text-sm text-red-300">Your journal could not be loaded.</Card>
            ) : !entries.data?.length ? (
              <Card className="border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <BookOpen className="mx-auto h-6 w-6 text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-400">Nothing here yet. Write about today.</p>
              </Card>
            ) : entries.data.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => editEntry(entry)}
                className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${draft.id === entry.id ? "border-emerald-500/60 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"}`}
              >
                <time className="text-xs text-zinc-500" dateTime={entry.date}>{new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</time>
                <h2 className="mt-2 font-semibold text-white">{entry.title || "Untitled entry"}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{entry.content}</p>
              </button>
            ))}
          </section>

          <Card className="border-zinc-800 bg-zinc-900/40 p-5 sm:p-7">
            <div className="grid gap-5">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="journal-date" className="text-sm font-medium text-zinc-300">Entry date</label>
                <input id="journal-date" type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="journal-title" className="sr-only">Title</label>
                <input id="journal-title" value={draft.title} maxLength={160} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Title (optional)" className="w-full border-0 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-zinc-600" />
              </div>
              <div>
                <label htmlFor="journal-content" className="sr-only">Journal entry</label>
                <textarea id="journal-content" value={draft.content} maxLength={20000} onChange={(event) => updateDraft("content", event.target.value)} placeholder="What was today like?" className="min-h-80 w-full resize-y border-0 bg-transparent text-base leading-8 text-zinc-200 outline-none placeholder:text-zinc-600" />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p aria-live="polite" className={`text-sm ${saveState === "error" ? "text-red-400" : "text-zinc-500"}`}>
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved just now" : saveState === "error" ? "Could not save. Check the entry and try again." : draft.id ? "Autosave is on" : "Save once to enable autosave"}
                </p>
                <div className="flex gap-2">
                  {draft.id !== null && <Button type="button" variant="destructive" onClick={() => void removeEntry()} disabled={deleteEntry.isPending} aria-label="Delete journal entry"><Trash2 className="h-4 w-4" /></Button>}
                  <Button type="button" onClick={() => void saveDraft()} disabled={saveState === "saving" || !draft.content.trim()} className="gap-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"><Save className="h-4 w-4" /> Save</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
