import { getBaseUrl } from "@/lib/api";
import { Event } from "@/lib/models/api.models";

type EventResponse = {
  event: Event;
};

export async function fetchEventById(eventId: string): Promise<Event> {
  const response = await fetch(`${getBaseUrl()}/events/${eventId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }

  const data = (await response.json()) as EventResponse;
  return data.event;
}
