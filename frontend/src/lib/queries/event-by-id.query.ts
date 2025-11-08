"use client";

import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/models/api.models";
import { getBaseUrl } from "../api";

type EventResponse = {
  event: Event;
};

export function useEventByIdQuery(eventId: string | undefined) {
  return useQuery<Event>({
    queryKey: ["event-by-id", eventId],
    queryFn: async () => {
      const response = await fetch(`${getBaseUrl()}/events/${eventId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText}`);
      }

      const data = (await response.json()) as EventResponse;
      return data.event;
    },
    enabled: !!eventId && eventId.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
