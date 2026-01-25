import React, { createContext, useContext, useState, useEffect } from 'react';
import { DaySchedule, TimeSlot, SlotStatus, ClientBooking } from './types';

// Default slots generation helper
const generateDefaultSlots = (): TimeSlot[] => [
  { id: '0900', time: '09:00', status: 'Prime', isAvailable: true },
  { id: '1000', time: '10:00', status: 'Prime', isAvailable: true },
  { id: '1100', time: '11:00', status: 'Open', isAvailable: true },
  { id: '1300', time: '13:00', status: 'Open', isAvailable: true },
  { id: '1400', time: '14:00', status: 'Open', isAvailable: true },
  { id: '1500', time: '15:00', status: 'Open', isAvailable: true },
  { id: '1600', time: '16:00', status: 'Peak', isAvailable: true },
  { id: '1700', time: '17:00', status: 'Peak', isAvailable: true },
  { id: '1800', time: '18:00', status: 'Peak', isAvailable: true },
  { id: '1900', time: '19:00', status: 'Peak', isAvailable: true },
];

interface BookingContextType {
  schedules: DaySchedule[];
  bookings: ClientBooking[];
  addBooking: (booking: ClientBooking) => void;
  getBookingsForDate: (date: string) => ClientBooking[];
  toggleSlotAvailability: (date: string, slotId: string) => void;
  updateSlotStatus: (date: string, slotId: string, status: SlotStatus) => void;
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
  getFormattedDate: (dateStr: string) => { day: string; month: string; weekday: string };
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [isAdminMode, setAdminMode] = useState(false);

  useEffect(() => {
    // Generate next 14 days
    const nextDays: DaySchedule[] = [];
    const today = new Date();
    
    for (let i = 0; i < 28; i++) { // Increased range for calendar view
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      nextDays.push({
        date: dateString,
        slots: generateDefaultSlots()
      });
    }
    setSchedules(nextDays);

    // Add a mock booking for demonstration
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const mockDateStr = tomorrow.toISOString().split('T')[0];
    
    setBookings([{
        id: 'mock-1',
        date: mockDateStr,
        slotId: '1000',
        time: '10:00',
        service: { id: 'c3', name: 'Coupe homme', duration: '20min', price: '15 €' },
        client: { firstName: 'Thomas', lastName: 'Anderson', phone: '06 00 00 00 00', email: 'neo@matrix.com' }
    }]);
  }, []);

  const addBooking = (booking: ClientBooking) => {
    setBookings(prev => [...prev, booking]);
  };

  const getBookingsForDate = (date: string) => {
    return bookings.filter(b => b.date === date);
  };

  const toggleSlotAvailability = (dateStr: string, slotId: string) => {
    setSchedules(prev => prev.map(day => {
      if (day.date === dateStr) {
        return {
          ...day,
          slots: day.slots.map(slot => 
            slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
          )
        };
      }
      return day;
    }));
  };

  const updateSlotStatus = (dateStr: string, slotId: string, status: SlotStatus) => {
    setSchedules(prev => prev.map(day => {
        if (day.date === dateStr) {
            return {
                ...day,
                slots: day.slots.map(slot =>
                    slot.id === slotId ? { ...slot, status } : slot
                )
            };
        }
        return day;
    }));
  };

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()],
      weekday: days[date.getDay()]
    };
  };

  return (
    <BookingContext.Provider value={{ 
      schedules, 
      bookings,
      addBooking,
      getBookingsForDate,
      toggleSlotAvailability, 
      updateSlotStatus, 
      isAdminMode, 
      setAdminMode,
      getFormattedDate
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within a BookingProvider');
  return context;
};
