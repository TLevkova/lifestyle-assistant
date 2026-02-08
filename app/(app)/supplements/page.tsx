"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { db, generateId, getCurrentTimestamp } from "@/lib/db";
import type { Supplement as SupplementType } from "@/lib/db/schema";
import { PageContainer } from "@/components/ui/page-container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyList } from "@/components/ui/empty-list";

export default function SupplementsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplementType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const supplements = useLiveQuery(() =>
    db.supplements.orderBy("updatedAt").reverse().toArray()
  );

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError("Name is required");
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = getCurrentTimestamp();
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      updatedAt: now,
    };

    try {
      if (editing) {
        await db.supplements.update(editing.id, payload);
        toast.success("Supplement updated");
      } else {
        await db.supplements.add({
          id: generateId(),
          ...payload,
          createdAt: now,
        });
        toast.success("Supplement added");
      }
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setNameError(null);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (s: SupplementType) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? "");
    setShowForm(true);
  };

  const handleDelete = async (s: SupplementType) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try {
      await db.supplements.delete(s.id);
      toast.success("Supplement removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const catalogList = supplements ?? [];

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Catalog</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={showForm}
        >
          Add supplement
        </Button>
      </div>

      {showForm && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{editing ? "Edit supplement" : "Add supplement"}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sup-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="sup-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="e.g. Vitamin D"
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="sup-desc" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="sup-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dose, timing, notes..."
                  rows={2}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit">
                {editing ? "Update" : "Add"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {supplements === undefined ? (
        <Card className="mt-4">
          <CardContent className="py-10 text-center">
            <p className="text-base text-muted-foreground">Loading catalog...</p>
          </CardContent>
        </Card>
      ) : catalogList.length === 0 && !showForm ? (
        <EmptyList
          message="No supplements in catalog. Add your first one."
          actionLabel="Add supplement"
          onAction={() => {
            resetForm();
            setShowForm(true);
          }}
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {catalogList.map((s) => (
            <Card key={s.id} className="flex flex-row items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">{s.name}</p>
                {s.description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(s)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(s)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
