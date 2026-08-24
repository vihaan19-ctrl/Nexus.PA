import React, { useMemo, useState } from "react";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, Button, Input, Textarea, Select, EmptyState, Modal } from "@/components/ui/Primitives";
import { Note, NoteCategory } from "@/types";
import { nowISO, formatDate, classNames } from "@/utils/helpers";
import { Plus, Pin, Star, Archive, Trash2, Search } from "lucide-react";

const categories: NoteCategory[] = ["school", "robotics", "coding", "projects", "ideas", "personal", "research"];

export function NotesPage() {
  const { data, add, update, remove } = useNexus();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Note | null | undefined>(undefined);

  const filtered = useMemo(() => {
    let notes = data.notes.filter((n) => n.archived === showArchived);
    if (categoryFilter) notes = notes.filter((n) => n.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      notes = notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
    }
    return notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.notes, categoryFilter, query, showArchived]);

  function createNote() {
    const id = add("notes", { title: "Untitled note", content: "", tags: [], category: "personal", pinned: false, archived: false, favorite: false, createdAt: nowISO(), updatedAt: nowISO() });
    logHistory(add, { type: "note_created", title: "Untitled note", relatedType: "note" });
    setEditing(data.notes.find((n) => n.id === id) || { id, title: "Untitled note", content: "", tags: [], category: "personal", pinned: false, archived: false, favorite: false, createdAt: nowISO(), updatedAt: nowISO() } as Note);
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{filtered.length} notes</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={createNote}>New note</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <Input className="pl-7" placeholder="Search notes..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Any category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button size="sm" variant={showArchived ? "primary" : "outline"} onClick={() => setShowArchived((s) => !s)}>{showArchived ? "Showing archived" : "Show archived"}</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No notes yet." subtitle="Capture ideas, cheat sheets, and research here." action={<Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={createNote}>New note</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => setEditing(n)}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <Badge>{n.category}</Badge>
                <div className="flex gap-1 text-[var(--color-text-faint)]">
                  {n.pinned && <Pin size={12} className="fill-current text-[var(--color-accent)]" />}
                  {n.favorite && <Star size={12} className="fill-current text-[var(--color-medium)]" />}
                </div>
              </div>
              <p className="mb-1 truncate text-sm font-semibold">{n.title}</p>
              <p className="line-clamp-3 whitespace-pre-line text-xs text-[var(--color-text-dim)]">{n.content || "Empty note"}</p>
              <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">Updated {formatDate(n.updatedAt.slice(0, 10))}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title="Note" wide>
        {editing && (
          <div className="flex flex-col gap-3">
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as NoteCategory })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} placeholder="Tags, comma separated" />
            </div>
            <Textarea rows={10} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder="Write in markdown..." />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant={editing.pinned ? "primary" : "secondary"} icon={<Pin size={13} />} onClick={() => setEditing({ ...editing, pinned: !editing.pinned })}>Pin</Button>
                <Button size="sm" variant={editing.favorite ? "primary" : "secondary"} icon={<Star size={13} />} onClick={() => setEditing({ ...editing, favorite: !editing.favorite })}>Favorite</Button>
                <Button size="sm" variant="secondary" icon={<Archive size={13} />} onClick={() => setEditing({ ...editing, archived: !editing.archived })}>{editing.archived ? "Unarchive" : "Archive"}</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => { remove("notes", editing.id); push("Note deleted"); setEditing(undefined); }}>Delete</Button>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  update("notes", editing.id, { ...editing, updatedAt: nowISO() });
                  push("Note saved", "success");
                  setEditing(undefined);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
