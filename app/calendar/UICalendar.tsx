"use client";

import { useState } from "react";
import {
  Calendar,
  momentLocalizer,
  SlotInfo,
  Event as RBCEvent,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import ShowModal from "./ShowModal";

const localizer = momentLocalizer(moment);

export interface ShowEvent {
  id?: string;
  title?: string;
  start: Date;
  end: Date;
  [key: string]: any;
}

export default function CalendarPage() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | ShowEvent | null>(
    null
  );

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setModalOpen(true);
  };

  return (
    <div className="p-4">
      <Calendar
        selectable
        localizer={localizer}
        events={[]} // Replace with your Firestore shows
        startAccessor="start"
        endAccessor="end"
        style={{ height: "80vh" }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event: RBCEvent) => {
          setSelectedSlot(event as ShowEvent);
          setModalOpen(true);
        }}
      />

      <ShowModal
        isOpen={modalOpen}
        initialData={selectedSlot}
        onClose={() => setModalOpen(false)}
        onSave={(newShow: ShowEvent) => {
          // Handle Firestore add/update
        }}
        onDelete={(showId: string) => {
          // Handle Firestore delete
        }}
      />
    </div>
  );
}
