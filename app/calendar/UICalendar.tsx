"use client";

import { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import ShowModal from "./ShowModal";

const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelectSlot = (slotInfo) => {
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
        onSelectEvent={(event) => {
          setSelectedSlot(event);
          setModalOpen(true);
        }}
      />

      <ShowModal
        isOpen={modalOpen}
        initialData={selectedSlot}
        onClose={() => setModalOpen(false)}
        onSave={(newShow) => {
          // Handle Firestore add/update
        }}
        onDelete={(showId) => {
          // Handle Firestore delete
        }}
      />
    </div>
  );
}
