import { useCallback, useEffect, useState } from "react";

import { fetchProducts, type Product } from "@/api/products";
import { useAuth } from "@/context/AuthContext";

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads the product catalogue with the logged-in user's token.
 * Pass `enabled=false` (e.g. modal closed) to skip fetching until needed.
 */
export function useProducts(enabled = true): UseProductsResult {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch]);

  return { products, isLoading, error, refetch };
}
