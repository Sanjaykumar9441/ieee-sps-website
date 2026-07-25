import { useState } from "react";
import EventSelector from "../EventSelector";
import TeamRegistration from "./TeamRegistration";
import IndividualRegistration from "./IndividualRegistration";
import { EventType } from "./types";

export default function Registration() {
  const [selectedEvent, setSelectedEvent] =
    useState<EventType | null>(null);

  if (!selectedEvent) {
    return (
      <EventSelector
        onSelect={(eventId) =>
          setSelectedEvent(eventId as EventType)
        }
      />
    );
  }

  if (selectedEvent === "astroquiz") {
    return (
      <IndividualRegistration
        eventType={selectedEvent}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <TeamRegistration
      eventType={selectedEvent}
      onBack={() => setSelectedEvent(null)}
    />
  );
}