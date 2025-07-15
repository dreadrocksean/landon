import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";

import useAuth from "@/hooks/useAuth";
import useShows from "@/hooks/useShows";
import ShowModal from "@/app/calendar/ShowModal";

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { shows, fetchShows } = useShows();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  //   useEffect(() => {
  //     if (!isAuthenticated) {
  //       router.push("/login");
  //     } else {
  //       fetchShows();
  //     }
  //   }, [isAuthenticated]);

  const events = useMemo(() => {
    return shows.map((show: any) => ({
      id: show.id,
      title: show.title,
      start: new Date(show.scheduledStart),
      end: new Date(show.scheduledStop),
      ...show,
    }));
  }, [shows]);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
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
        views={["month", "week", "day"]}
      />

      <ShowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        slot={selectedSlot}
        event={selectedEvent}
      />
    </div>
  );
};

export default CalendarPage;
