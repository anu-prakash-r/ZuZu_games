import { useCallback, useEffect, useState } from "react";

import { fetchTables, type ApiTable } from "@/api/tables";
import { useAuth } from "@/context/AuthContext";

interface UseTablesResult {
  tables: ApiTable[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Loads rooms/tables with the logged-in user's token. */
export function useTables(enabled = true): UseTablesResult {
  const { token } = useAuth();
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTables(token);
      console.log("[tables]", data);
      setTables(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tables.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch]);

  return { tables, isLoading, error, refetch };
}
