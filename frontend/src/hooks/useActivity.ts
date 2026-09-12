import { useQuery } from "@tanstack/react-query";
import { activityApi } from "../lib/api";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: () => activityApi.list(20),
  });
}
