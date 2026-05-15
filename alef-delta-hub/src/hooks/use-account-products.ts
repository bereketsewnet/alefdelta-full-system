import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AccountProduct } from "@/types";

export function useAccountProducts(enabled: boolean = true) {
  return useQuery<AccountProduct[]>({
    queryKey: ['account-products'],
    queryFn: async () => {
      const res = await api.get<{ data: AccountProduct[] }>('/account-products');
      return res.data.data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

