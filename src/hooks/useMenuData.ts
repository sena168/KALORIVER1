import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/integrations/firebase/client";

export type MenuItemWithMeta = {
  id: string;
  name: string;
  calories: number;
  imagePath: string;
  category: string;
  hidden?: boolean;
};

export type MenuCategoryWithMeta = {
  id: string;
  label: string;
  items: MenuItemWithMeta[];
};

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const fetchMenu = async (includeHidden: boolean) => {
  const headers = includeHidden ? await getAuthHeaders() : {};
  const res = await fetch(includeHidden ? "/api/admin/menu" : "/api/menu", {
    headers,
  });
  if (!res.ok) throw new Error("Failed to load menu");
  const data = await res.json();
  return data.categories as MenuCategoryWithMeta[];
};

export const useMenuData = (options?: { includeHidden?: boolean }) => {
  const includeHidden = options?.includeHidden ?? false;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["menu", includeHidden],
    queryFn: () => fetchMenu(includeHidden),
  });

  if (query.error) {
    console.error("Menu query error:", query.error);
  }

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      calories: number;
      imagePath: string;
      hidden?: boolean;
      categoryId: string;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create item");
      const data = await res.json();
      return data.item as MenuItemWithMeta;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: { name?: string; calories?: number; imagePath?: string; hidden?: boolean };
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/menu/items/${payload.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload.patch),
      });
      if (!res.ok) throw new Error("Failed to update item");
      const data = await res.json();
      return data.item as MenuItemWithMeta;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete item");
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const orderMutation = useMutation({
    mutationFn: async (payload: { categoryId: string; order: string[] }) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/menu/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    setOrder: orderMutation.mutateAsync,
  };
};
