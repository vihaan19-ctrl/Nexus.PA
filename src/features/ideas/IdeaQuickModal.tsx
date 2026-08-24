import React, { useState } from "react";
import { Modal, Input, Textarea, Select, Button } from "@/components/ui/Primitives";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { IdeaCategory } from "@/types";
import { nowISO } from "@/utils/helpers";

export function IdeaQuickModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("random");

  function handleSave() {
    if (!title.trim()) return;
    add("ideas", { title: title.trim(), description: description.trim() || undefined, category, tags: [], status: "idea", createdAt: nowISO() });
    push("Idea captured", "success");
    setTitle(""); setDescription("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New idea">
      <div className="flex flex-col gap-3">
        <Input placeholder="Your idea" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Select value={category} onChange={(e) => setCategory(e.target.value as IdeaCategory)}>
          <option value="robotics">Robotics</option><option value="coding">Coding</option><option value="websites">Websites</option>
          <option value="business">Business</option><option value="random">Random</option>
        </Select>
        <Textarea rows={3} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Capture idea</Button>
        </div>
      </div>
    </Modal>
  );
}
