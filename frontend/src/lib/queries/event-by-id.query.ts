"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "./fetch/fetch-event-by-id";
import { Event } from "@/lib/models/api.models";

export function useEventByIdQuery(eventId: string | undefined) {
  return useQuery<Event>({
    queryKey: ["event-by-id", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId && eventId.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
