import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  momentLocalizer,
  Event as RBCEvent,
  SlotInfo,
  View,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";

import useAuth from "@/hooks/useAuth";
import useShows from "@/hooks/useShows";
import ShowModal from "@/app/calendar/ShowModal";
import { Show } from "@/lib/schema";

const localizer = momentLocalizer(moment);

interface CalendarEvent extends RBCEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  [key: string]: any;
}

const CalendarPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { shows } = useShows();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login");
  //   } else {
  //     fetchShows();
  //   }
  // }, [isAuthenticated]);

  const events = useMemo<Show[]>(() => {
    return shows.map((show: Show) => ({
      ...show,
    }));
  }, [shows]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setModalOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Show Calendar</h1>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={["month", "week", "day"] as View[]}
      />

      <ShowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default CalendarPage;
