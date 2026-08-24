import React, { useState } from "react";
import { Modal, Input, Textarea, Select, Button } from "@/components/ui/Primitives";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { NoteCategory } from "@/types";
import { nowISO } from "@/utils/helpers";

export function NoteQuickModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("personal");

  function handleSave() {
    if (!title.trim()) return;
    add("notes", { title: title.trim(), content, category, tags: [], pinned: false, archived: false, favorite: false, createdAt: nowISO(), updatedAt: nowISO() });
    logHistory(add, { type: "note_created", title: title.trim(), relatedType: "note" });
    push("Note created", "success");
    setTitle(""); setContent(""); setCategory("personal");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New note">
      <div className="flex flex-col gap-3">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
          <option value="school">School</option><option value="robotics">Robotics</option><option value="coding">Coding</option>
          <option value="projects">Projects</option><option value="ideas">Ideas</option><option value="personal">Personal</option><option value="research">Research</option>
        </Select>
        <Textarea rows={5} placeholder="Write something..." value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Create note</Button>
        </div>
      </div>
    </Modal>
  );
}
