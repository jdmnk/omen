"use client";

import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/models/api.models";
import { getBaseUrl } from "../api";

export function useEventByIdQuery(eventId: string | undefined) {
  return useQuery<Event | null>({
    queryKey: ["event-by-id", eventId],
    queryFn: async () => {
      const response = await fetch(`${getBaseUrl()}/events/${eventId}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        // Event not found is not an error, just return null
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText}`);
      }

      const data = (await response.json()) as Event;
      return data;
    },
    enabled: !!eventId && eventId.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
