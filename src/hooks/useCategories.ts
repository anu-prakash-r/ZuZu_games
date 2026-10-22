import { useCallback, useEffect, useState } from "react";

import { fetchCategories, type Category } from "@/api/products";
import { useAuth } from "@/context/AuthContext";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(enabled = true): UseCategoriesResult {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategories(token);
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch]);

  return { categories, isLoading, error, refetch };
}
