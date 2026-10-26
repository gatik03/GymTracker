"use client";

import { useDeferredValue, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Exercise, useExercises } from "@/hooks/useExercises";

interface ExercisePickerProps {
  value: number;
  selectedName: string;
  onChange: (exercise: Exercise) => void;
}

export function ExercisePicker({ value, selectedName, onChange }: ExercisePickerProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredSearch = useDeferredValue(search);
  const query = useExercises({ search: deferredSearch, page, pageSize: 20 });
  const exercises = query.data?.results ?? [];

  const choose = (exercise: Exercise) => {
    input.current?.focus();
    onChange(exercise);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative space-y-2" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">Exercise</label>
      <Input
        ref={input}
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && exercises[activeIndex] ? `${id}-option-${exercises[activeIndex].id}` : undefined}
        autoComplete="off"
        placeholder="Search or choose an exercise"
        value={open ? search : selectedName}
        onFocus={() => { if (!open) { setSearch(""); setPage(1); setActiveIndex(-1); setOpen(true); } }}
        onClick={() => { if (!open) { setSearch(""); setPage(1); setActiveIndex(-1); setOpen(true); } }}
        onChange={(event) => { setSearch(event.target.value); setPage(1); setActiveIndex(-1); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const next = event.key === "ArrowDown" ? Math.min(activeIndex + 1, exercises.length - 1) : Math.max(activeIndex - 1, 0);
            setActiveIndex(next);
            document.getElementById(`${id}-option-${exercises[next]?.id}`)?.scrollIntoView({ block: "nearest" });
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            if (exercises[activeIndex]) choose(exercises[activeIndex]);
          }
        }}
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
          <p role="status" className="px-2 py-2 text-xs text-muted-foreground">
            {query.isFetching || search !== deferredSearch ? "Searching…" : query.isError ? "The exercise library could not be loaded." : `${query.data?.count ?? 0} matching exercises`}
          </p>
          <div id={`${id}-options`} role="listbox" aria-label="Exercises" className="max-h-56 overflow-y-auto">
            {exercises.map((exercise, index) => (
              <button key={exercise.id} id={`${id}-option-${exercise.id}`} type="button" role="option" aria-selected={value === exercise.id} tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(exercise)} className={`flex min-h-11 w-full flex-col justify-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${activeIndex === index || value === exercise.id ? "bg-muted text-primary" : "text-foreground"}`}>
                <span>{exercise.name}</span><span className="text-xs capitalize text-muted-foreground">{exercise.muscle_group.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
          {query.isError ? <Button type="button" variant="outline" onClick={() => void query.refetch()}>Retry</Button> : exercises.length === 0 && !query.isFetching ? <p className="p-2 text-sm text-muted-foreground">No matches. Try another name or create a custom exercise.</p> : null}
          {query.data && query.data.count > 20 ? (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
              <Button type="button" variant="outline" disabled={page === 1 || query.isFetching} onClick={() => { setPage(page - 1); setActiveIndex(-1); }}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(query.data.count / 20)}</span>
              <Button type="button" variant="outline" disabled={!query.data.next || query.isFetching} onClick={() => { setPage(page + 1); setActiveIndex(-1); }}>Next</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
