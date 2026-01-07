"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { db, generateId, getCurrentTimestamp } from "@/lib/db";
import type { Recipe, RecipeMeasurement } from "@/lib/db/schema";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyList } from "@/components/ui/empty-list";

interface RecipeFormData {
  name: string;
  totalCalories: string;
  totalProtein: string;
  totalCarbs: string;
  totalFat: string;
  description: string;
  imageUrl: string;
  measurements: RecipeMeasurement[];
}

interface RecipeFormErrors {
  name?: string;
  totalCalories?: string;
  totalProtein?: string;
  totalCarbs?: string;
  totalFat?: string;
}

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EFood Image%3C/text%3E%3C/svg%3E";

export default function FoodPage() {
  // UI state only - not caching recipe data
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    totalCalories: "",
    totalProtein: "",
    totalCarbs: "",
    totalFat: "",
    description: "",
    imageUrl: "",
    measurements: [],
  });
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [newMeasurement, setNewMeasurement] = useState({
    productName: "",
    quantity: "",
    unit: "g",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Always fetch from IndexedDB (backend) - no frontend caching
  // useLiveQuery automatically updates when IndexedDB changes
  // Recipes are never cached in React state, always read from IndexedDB
  const recipes = useLiveQuery(() => {
    return db.recipes
      .orderBy("updatedAt")
      .reverse()
      .toArray();
  });

  const validateForm = (): boolean => {
    const newErrors: RecipeFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    const calories = parseFloat(formData.totalCalories);
    if (!formData.totalCalories.trim()) {
      newErrors.totalCalories = "Total calories is required";
    } else if (isNaN(calories) || calories < 0) {
      newErrors.totalCalories = "Must be a number >= 0";
    }

    const protein = formData.totalProtein.trim()
      ? parseFloat(formData.totalProtein)
      : null;
    if (protein !== null && (isNaN(protein) || protein < 0)) {
      newErrors.totalProtein = "Must be a number >= 0";
    }

    const carbs = formData.totalCarbs.trim()
      ? parseFloat(formData.totalCarbs)
      : null;
    if (carbs !== null && (isNaN(carbs) || carbs < 0)) {
      newErrors.totalCarbs = "Must be a number >= 0";
    }

    const fat = formData.totalFat.trim()
      ? parseFloat(formData.totalFat)
      : null;
    if (fat !== null && (isNaN(fat) || fat < 0)) {
      newErrors.totalFat = "Must be a number >= 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData({ ...formData, imageUrl: result });
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleAddMeasurement = () => {
    if (!newMeasurement.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const quantity = parseFloat(newMeasurement.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Quantity must be a number > 0");
      return;
    }

    setFormData({
      ...formData,
      measurements: [
        ...formData.measurements,
        {
          productName: newMeasurement.productName.trim(),
          quantity,
          unit: newMeasurement.unit.trim() || "g",
        },
      ],
    });

    setNewMeasurement({
      productName: "",
      quantity: "",
      unit: "g",
    });
  };

  const handleRemoveMeasurement = (index: number) => {
    setFormData({
      ...formData,
      measurements: formData.measurements.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const now = getCurrentTimestamp();
      const recipeData: Omit<Recipe, "id" | "createdAt" | "updatedAt"> = {
        name: formData.name.trim(),
        totalCalories: parseFloat(formData.totalCalories),
        totalProtein: formData.totalProtein.trim()
          ? parseFloat(formData.totalProtein)
          : undefined,
        totalCarbs: formData.totalCarbs.trim()
          ? parseFloat(formData.totalCarbs)
          : undefined,
        totalFat: formData.totalFat.trim()
          ? parseFloat(formData.totalFat)
          : undefined,
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        measurements: formData.measurements.length > 0 ? formData.measurements : undefined,
      };

      // Persist directly to IndexedDB (backend) - no frontend caching
      if (editingRecipe) {
        await db.recipes.update(editingRecipe.id, {
          ...recipeData,
          updatedAt: now,
        });
      } else {
        await db.recipes.add({
          id: generateId(),
          ...recipeData,
          createdAt: now,
          updatedAt: now,
        });
      }

      // useLiveQuery will automatically update from IndexedDB after the write completes
      resetForm();
      toast.success(editingRecipe ? "Food updated successfully" : "Food added successfully");
    } catch (error) {
      toast.error("Failed to save food item");
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      totalCalories: recipe.totalCalories?.toString() ?? "",
      totalProtein: recipe.totalProtein?.toString() ?? "",
      totalCarbs: recipe.totalCarbs?.toString() ?? "",
      totalFat: recipe.totalFat?.toString() ?? "",
      description: recipe.description ?? "",
      imageUrl: recipe.imageUrl ?? "",
      measurements: recipe.measurements ?? [],
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (recipe: Recipe) => {
    if (
      window.confirm(`Are you sure you want to delete "${recipe.name}"?`)
    ) {
      try {
        // Delete directly from IndexedDB (backend) - no frontend caching
        await db.recipes.delete(recipe.id);
        // useLiveQuery will automatically update from IndexedDB
        toast.success("Food deleted successfully");
      } catch (error) {
        toast.error("Failed to delete food item");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      totalCalories: "",
      totalProtein: "",
      totalCarbs: "",
      totalFat: "",
      description: "",
      imageUrl: "",
      measurements: [],
    });
    setNewMeasurement({
      productName: "",
      quantity: "",
      unit: "g",
    });
    setErrors({});
    setEditingRecipe(null);
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  const handleCloseView = () => {
    setViewingRecipe(null);
  };

  const handleEditFromView = (recipe: Recipe) => {
    setViewingRecipe(null);
    handleEdit(recipe);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingRecipe) {
        handleCloseView();
      }
    };

    if (viewingRecipe) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [viewingRecipe]);

  const formatMacros = (recipe: Recipe): string => {
    const parts: string[] = [];
    if (recipe.totalProtein !== undefined) {
      parts.push(`Protein: ${recipe.totalProtein}g`);
    }
    if (recipe.totalCarbs !== undefined) {
      parts.push(`Carbs: ${recipe.totalCarbs}g`);
    }
    if (recipe.totalFat !== undefined) {
      parts.push(`Fat: ${recipe.totalFat}g`);
    }
    return parts.length > 0 ? parts.join(" · ") : "";
  };

  const formatMacrosDetailed = (recipe: Recipe) => {
    const macros: Array<{ label: string; value: number }> = [];
    if (recipe.totalProtein !== undefined) {
      macros.push({ label: "Protein", value: recipe.totalProtein });
    }
    if (recipe.totalCarbs !== undefined) {
      macros.push({ label: "Carbs", value: recipe.totalCarbs });
    }
    if (recipe.totalFat !== undefined) {
      macros.push({ label: "Fat", value: recipe.totalFat });
    }
    return macros;
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Food Items</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={showForm}
        >
          Add food
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRecipe ? "Edit Food" : "Add Food"}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image (optional)</label>
                <div className="space-y-2">
                  <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-input">
                    <img
                      src={formData.imageUrl || DEFAULT_IMAGE}
                      alt="Food preview"
                      className="h-48 w-full object-cover sm:h-64"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Image
                    </Button>
                    {formData.imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Chicken Breast"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalCalories" className="text-sm font-medium">
                  Total Calories <span className="text-destructive">*</span>
                </label>
                <Input
                  id="totalCalories"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.totalCalories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalCalories: e.target.value,
                    })
                  }
                  placeholder="e.g., 165"
                  className={errors.totalCalories ? "border-destructive" : ""}
                />
                {errors.totalCalories && (
                  <p className="text-sm text-destructive">
                    {errors.totalCalories}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalProtein" className="text-sm font-medium">
                  Total Protein (optional)
                </label>
                <Input
                  id="totalProtein"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.totalProtein}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalProtein: e.target.value,
                    })
                  }
                  placeholder="e.g., 31"
                  className={errors.totalProtein ? "border-destructive" : ""}
                />
                {errors.totalProtein && (
                  <p className="text-sm text-destructive">
                    {errors.totalProtein}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalCarbs" className="text-sm font-medium">
                  Total Carbs (optional)
                </label>
                <Input
                  id="totalCarbs"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.totalCarbs}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalCarbs: e.target.value,
                    })
                  }
                  placeholder="e.g., 0"
                  className={errors.totalCarbs ? "border-destructive" : ""}
                />
                {errors.totalCarbs && (
                  <p className="text-sm text-destructive">
                    {errors.totalCarbs}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalFat" className="text-sm font-medium">
                  Total Fat (optional)
                </label>
                <Input
                  id="totalFat"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.totalFat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalFat: e.target.value,
                    })
                  }
                  placeholder="e.g., 3.6"
                  className={errors.totalFat ? "border-destructive" : ""}
                />
                {errors.totalFat && (
                  <p className="text-sm text-destructive">{errors.totalFat}</p>
                )}
              </div>

              {/* Measurements */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Measurements (optional)</label>
                <div className="space-y-2">
                  {formData.measurements.map((measurement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md border border-input bg-muted p-2"
                    >
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{measurement.quantity}</span>
                        <span className="mx-1 text-muted-foreground">{measurement.unit}</span>
                        <span className="text-text">{measurement.productName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMeasurement(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Product name"
                      value={newMeasurement.productName}
                      onChange={(e) =>
                        setNewMeasurement({
                          ...newMeasurement,
                          productName: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Quantity"
                      value={newMeasurement.quantity}
                      onChange={(e) =>
                        setNewMeasurement({
                          ...newMeasurement,
                          quantity: e.target.value,
                        })
                      }
                      className="w-24"
                    />
                    <Input
                      placeholder="Unit (g, ml, etc.)"
                      value={newMeasurement.unit}
                      onChange={(e) =>
                        setNewMeasurement({
                          ...newMeasurement,
                          unit: e.target.value,
                        })
                      }
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddMeasurement}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Preparation Instructions (optional)
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter recipe preparation steps..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit">
                {editingRecipe ? "Update" : "Add"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {recipes === undefined ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-base text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : recipes.length === 0 ? (
        <EmptyList
          message="No food items yet. Add your first one!"
          actionLabel="Add food"
          onAction={() => {
            resetForm();
            setShowForm(true);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                onClick={() => handleViewRecipe(recipe)}
              >
                {/* Hero Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={DEFAULT_IMAGE}
                      alt={recipe.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {/* Hover Overlay with Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(recipe);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(recipe);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Tile Content */}
                <CardContent className="p-4">
                  <CardTitle className="mb-2 truncate text-lg">
                    {recipe.name}
                  </CardTitle>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-text">
                      {recipe.totalCalories} kcal
                    </p>
                    {formatMacros(recipe) && (
                      <p className="text-xs text-muted-foreground">
                        {formatMacros(recipe)}
                      </p>
                    )}
                  </div>
                  {/* Quick info badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {recipe.measurements && recipe.measurements.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {recipe.measurements.length} ingredient
                        {recipe.measurements.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {recipe.description && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Has instructions
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recipe Detail Modal */}
          {viewingRecipe && (
            <div
              className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 pb-20 sm:items-center sm:pb-4 sm:pt-4 sm:px-4"
              onClick={handleCloseView}
            >
              <Card
                className="relative flex h-[calc(100vh-5rem)] w-full max-h-[calc(100vh-5rem)] flex-col overflow-hidden sm:h-auto sm:max-w-3xl sm:max-h-[calc(100vh-2rem)] lg:max-w-4xl sm:rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseView}
                  className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-2 shadow-lg transition-colors hover:bg-background sm:right-4 sm:top-4"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                {/* Hero Image - Fixed height */}
                <div className="relative w-full shrink-0 overflow-hidden">
                  {viewingRecipe.imageUrl ? (
                    <img
                      src={viewingRecipe.imageUrl}
                      alt={viewingRecipe.name}
                      className="h-48 w-full object-cover sm:h-64 lg:h-80"
                    />
                  ) : (
                    <img
                      src={DEFAULT_IMAGE}
                      alt={viewingRecipe.name}
                      className="h-48 w-full object-cover sm:h-64 lg:h-80"
                    />
                  )}
                </div>

                {/* Scrollable Content Area */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                  <CardHeader className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
                    <CardTitle className="text-xl sm:text-2xl">{viewingRecipe.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6">
                  {/* Nutrition Info */}
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold sm:text-lg">Nutrition</h3>
                    <div className="rounded-lg border border-input bg-muted p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Calories</span>
                          <span className="text-lg font-semibold">
                            {viewingRecipe.totalCalories} kcal
                          </span>
                        </div>
                        {formatMacrosDetailed(viewingRecipe).length > 0 && (
                          <div className="pt-3 border-t border-input">
                            <div className="flex flex-wrap gap-4">
                              {formatMacrosDetailed(viewingRecipe).map((macro, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text">
                                    {macro.label}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {macro.value}g
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Measurements/Ingredients */}
                  {viewingRecipe.measurements &&
                    viewingRecipe.measurements.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold sm:text-lg">Ingredients</h3>
                        <div className="space-y-2">
                          {viewingRecipe.measurements.map((measurement, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-lg border border-input bg-muted p-2.5 sm:gap-3 sm:p-3"
                            >
                              <span className="text-base font-semibold">
                                {measurement.quantity}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {measurement.unit}
                              </span>
                              <span className="flex-1 text-base text-text">
                                {measurement.productName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Description/Preparation */}
                  {viewingRecipe.description && (
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold sm:text-lg">Preparation</h3>
                      <div className="rounded-lg border border-input bg-muted p-3 sm:p-4">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {viewingRecipe.description}
                        </p>
                      </div>
                    </div>
                  )}
                  </CardContent>

                  {/* Footer - Fixed at bottom of scrollable area */}
                  <CardFooter className="shrink-0 border-t border-input bg-muted/50 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex w-full gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleEditFromView(viewingRecipe)}
                        className="flex-1"
                      >
                        Edit Recipe
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleCloseView();
                          handleDelete(viewingRecipe);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
