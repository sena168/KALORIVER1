import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import { MenuItemWithMeta, useMenuData } from "@/hooks/useMenuData";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

type AdminTab = "overview" | "edit" | "tools";

const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const { categories, isLoading, updateItem, deleteItem, setOrder, addItem } = useMenuData({ includeHidden: true });

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || "makanan-utama");

  const [editingItem, setEditingItem] = useState<MenuItemWithMeta | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCalories, setEditCalories] = useState("0");
  const [editHidden, setEditHidden] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [draftOrders, setDraftOrders] = useState<Record<string, string[]>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!categories.find((cat) => cat.id === activeCategory) && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const stats = useMemo(() => {
    const allItems = categories.flatMap((category) => category.items);
    const totalItems = allItems.length;
    const totalCategories = categories.length;

    const low = allItems.filter((item) => item.calories <= 150).length;
    const medium = allItems.filter((item) => item.calories >= 151 && item.calories <= 500).length;
    const high = allItems.filter((item) => item.calories >= 501).length;

    const hiddenItems = allItems.filter((item) => item.hidden);
    const hiddenLow = hiddenItems.filter((item) => item.calories <= 150).length;
    const hiddenMedium = hiddenItems.filter((item) => item.calories >= 151 && item.calories <= 500).length;
    const hiddenHigh = hiddenItems.filter((item) => item.calories >= 501).length;

    const hiddenByCategory = categories.map((category) => ({
      id: category.id,
      label: category.label,
      count: category.items.filter((item) => item.hidden).length,
    }));

    return {
      totalItems,
      totalCategories,
      low,
      medium,
      high,
      hiddenTotal: hiddenItems.length,
      hiddenLow,
      hiddenMedium,
      hiddenHigh,
      hiddenByCategory,
    };
  }, [categories]);

  const savedActiveItems = useMemo(() => {
    const category = categories.find((cat) => cat.id === activeCategory);
    return category?.items ?? [];
  }, [categories, activeCategory]);

  const activeItems = useMemo(() => {
    const order = draftOrders[activeCategory];
    if (!order || order.length === 0) return savedActiveItems;
    const byId = new Map(savedActiveItems.map((item) => [item.id, item]));
    const ordered = order.map((id) => byId.get(id)).filter(Boolean) as MenuItemWithMeta[];
    const remaining = savedActiveItems.filter((item) => !order.includes(item.id));
    return [...ordered, ...remaining];
  }, [draftOrders, savedActiveItems, activeCategory]);

  const isOrderDirty = useMemo(() => {
    const draft = draftOrders[activeCategory];
    if (!draft) return false;
    const saved = savedActiveItems.map((item) => item.id);
    if (draft.length !== saved.length) return true;
    return draft.some((id, index) => id !== saved[index]);
  }, [draftOrders, savedActiveItems, activeCategory]);

  const openEdit = (item: MenuItemWithMeta) => {
    setEditingItem(item);
    setIsAddMode(false);
    setEditName(item.name);
    setEditCalories(String(item.calories));
    setEditHidden(Boolean(item.hidden));
    setImagePreview(item.imagePath);
    setImageDataUrl(item.imagePath.startsWith("data:") ? item.imagePath : undefined);
    setImageError(null);
  };

  const openAdd = () => {
    setEditingItem(null);
    setIsAddMode(true);
    setEditName("");
    setEditCalories("");
    setEditHidden(false);
    setImagePreview("");
    setImageDataUrl(undefined);
    setImageError(null);
  };

  const closeEdit = () => {
    setEditingItem(null);
    setIsAddMode(false);
    setImageError(null);
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImageError("Format gambar harus PNG atau JPG.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Ukuran gambar maksimal 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImagePreview(result);
      setImageDataUrl(result);
      setImageError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (isAddMode) {
      const trimmedName = editName.trim();
      const calories = Number(editCalories);

      if (!trimmedName) {
        setImageError("Nama wajib diisi.");
        return;
      }

      if (Number.isNaN(calories) || calories < 0) {
        setImageError("Kalori harus angka 0 atau lebih.");
        return;
      }

      if (!imageDataUrl) {
        setImageError("Gambar wajib diunggah.");
        return;
      }

      const categoryId = activeCategory;
      const created = await addItem({
        name: trimmedName,
        calories,
        imagePath: imageDataUrl,
        hidden: editHidden,
        categoryId,
      });

      const currentIds = activeItems.map((item) => item.id);
      const selectedIndex = selectedItemId ? currentIds.indexOf(selectedItemId) : -1;
      const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : 0;
      const nextOrder = [...currentIds];
      nextOrder.splice(insertIndex, 0, created.id);
      await setOrder({ categoryId, order: nextOrder });

      setSelectedItemId(created.id);
      closeEdit();
      return;
    }

    if (!editingItem) return;
    const calories = Number(editCalories);
    if (Number.isNaN(calories) || calories < 0) {
      setImageError("Kalori harus angka 0 atau lebih.");
      return;
    }

    const patch: {
      name?: string;
      calories?: number;
      hidden?: boolean;
      imagePath?: string;
    } = {
      name: editName.trim() || editingItem.name,
      calories,
      hidden: editHidden,
    };

    if (imageDataUrl) {
      patch.imagePath = imageDataUrl;
    }

    await updateItem({ id: editingItem.id, patch });

    closeEdit();
  };

  const handleDragStart = (itemId: string) => {
    setDraggedId(itemId);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = activeItems.map((item) => item.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...ids];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, draggedId);
    setDraftOrders((prev) => ({
      ...prev,
      [activeCategory]: next,
    }));
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleSaveOrder = async () => {
    const draft = draftOrders[activeCategory];
    if (!draft) return;
    await setOrder({ categoryId: activeCategory, order: draft });
    setDraftOrders((prev) => {
      const next = { ...prev };
      delete next[activeCategory];
      return next;
    });
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    const confirmed = window.confirm("Hapus menu ini?");
    if (!confirmed) return;
    await deleteItem(editingItem.id);
    closeEdit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img
            src="/santo-yusup.png"
            alt="Loading"
            className="w-20 h-20 mx-auto rounded-xl animate-pulse mb-4"
          />
          <p className="text-muted-foreground text-tv-body">Memuat... (Admin Auth)</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img
            src="/santo-yusup.png"
            alt="Loading"
            className="w-20 h-20 mx-auto rounded-xl animate-pulse mb-4"
          />
          <p className="text-muted-foreground text-tv-body">Memuat... (Admin Data)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header />

      <div className="fixed top-16 md:top-20 lg:top-24 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 md:gap-4 py-3 md:py-4">
            {(["overview", "edit", "tools"] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg text-tv-body font-medium transition-all duration-200 touch-target",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                {tab === "overview" ? "Overview" : tab === "edit" ? "Edit" : "Tools"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex flex-col flex-1 min-h-0 mt-[8.5rem] md:mt-[10rem] lg:mt-[12rem]">
        {activeTab === "overview" && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="container mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">Total Menu Items</p>
                  <p className="text-tv-title font-bold text-primary">{stats.totalItems}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">Total Kategori</p>
                  <p className="text-tv-title font-bold text-primary">{stats.totalCategories}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">Hidden Items</p>
                  <p className="text-tv-title font-bold text-primary">{stats.hiddenTotal}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">Low Calorie (0-150)</p>
                  <p className="text-tv-title font-bold text-foreground">{stats.low}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">Medium Calorie (151-500)</p>
                  <p className="text-tv-title font-bold text-foreground">{stats.medium}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                  <p className="text-tv-small text-muted-foreground">High Calorie (501+)</p>
                  <p className="text-tv-title font-bold text-foreground">{stats.high}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                <p className="text-tv-subtitle font-semibold text-foreground mb-4">Hidden Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-tv-small text-muted-foreground">Hidden Low</p>
                    <p className="text-tv-body font-semibold">{stats.hiddenLow}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-tv-small text-muted-foreground">Hidden Medium</p>
                    <p className="text-tv-body font-semibold">{stats.hiddenMedium}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-tv-small text-muted-foreground">Hidden High</p>
                    <p className="text-tv-body font-semibold">{stats.hiddenHigh}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {stats.hiddenByCategory.map((category) => (
                    <div key={category.id} className="bg-muted rounded-lg p-4">
                      <p className="text-tv-small text-muted-foreground">Hidden {category.label}</p>
                      <p className="text-tv-body font-semibold">{category.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="bg-background border-b border-border">
              <div className="container mx-auto px-4">
                <div className="flex gap-2 md:gap-4 py-3 md:py-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg text-tv-body font-medium transition-all duration-200 touch-target",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                        activeCategory === category.id
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div className="container mx-auto">
                <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4 md:gap-5 lg:gap-6 pb-4">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onClick={() => setSelectedItemId(item.id)}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropTargetId(item.id);
                      }}
                      onDragLeave={() => setDropTargetId(null)}
                      onDrop={() => handleDrop(item.id)}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDropTargetId(null);
                      }}
                      className={cn(
                        "bg-card rounded-xl p-4 md:p-6 lg:p-7 transition-all duration-200 min-h-[9.5rem] md:min-h-[11rem] lg:min-h-[12.5rem]",
                        "border border-border shadow-md hover:shadow-lg",
                        item.hidden && "border-dashed border-muted-foreground/60 opacity-70",
                        (dropTargetId === item.id || selectedItemId === item.id) && "border-t-4 border-yellow-400",
                      )}
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={item.imagePath}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[0.95rem] sm:text-[1rem] md:text-[1.05rem] min-[1400px]:text-tv-subtitle font-semibold text-foreground line-clamp-2">
                              {item.name}
                            </h3>
                            {item.hidden && (
                              <span className="text-xs uppercase tracking-wide bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[0.9rem] sm:text-[0.95rem] md:text-[1rem] min-[1400px]:text-tv-body text-muted-foreground mt-2">
                            {item.calories} kkal
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => {
                if (isOrderDirty) {
                  handleSaveOrder();
                } else {
                  openAdd();
                }
              }}
              className="fixed bottom-6 right-6 z-50 touch-target text-tv-body font-medium px-6 md:px-8 shadow-lg"
            >
              {isOrderDirty ? "Atur" : "Tambahkan"}
            </Button>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-tv-body text-muted-foreground">Tools akan ditambahkan nanti.</p>
          </div>
        )}
      </main>

      {(editingItem || isAddMode) && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-tv-subtitle font-semibold text-foreground">
                  {isAddMode ? "Tambahkan Menu" : "Edit Menu"}
                </h2>
                {!isAddMode && editingItem && (
                  <p className="text-tv-small text-muted-foreground">{editingItem.name}</p>
                )}
              </div>
              <Button variant="ghost" onClick={closeEdit}>Tutup</Button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-tv-small text-muted-foreground">Nama</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                />
              </label>

              <label className="block">
                <span className="text-tv-small text-muted-foreground">Kalori</span>
                <input
                  type="number"
                  min={0}
                  value={editCalories}
                  onChange={(event) => setEditCalories(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                />
              </label>

              <label className="block">
                <span className="text-tv-small text-muted-foreground">
                  Gambar (PNG/JPG, max 1MB){isAddMode ? " - wajib" : ""}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleImageChange}
                  className="mt-2 w-full text-sm text-muted-foreground"
                />
              </label>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No Image</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant={editHidden ? "secondary" : "outline"}
                  onClick={() => setEditHidden((prev) => !prev)}
                >
                  {editHidden ? "Show" : "Hide"}
                </Button>
              </div>

              {imageError && <p className="text-sm text-destructive">{imageError}</p>}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              {!isAddMode && (
                <Button variant="destructive" onClick={handleDelete}>
                  Hapus
                </Button>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeEdit}>Batal</Button>
                <Button onClick={handleSave}>Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
