
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DaySchedule, TimeSlot, SlotStatus, ClientBooking, BookingStatus } from './types';
import { sql } from './db';

// Generate slots every 15 minutes from 09:00 to 22:00
const generateDefaultSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString().padStart(2, '0');
        const minStr = minute.toString().padStart(2, '0');
        const timeStr = `${hourStr}:${minStr}`;
        const id = `${hourStr}${minStr}`;
        
        let status: SlotStatus = 'Open';
        if (hour <= 11) status = 'Prime';
        else if (hour >= 17) status = 'Peak';
        
        slots.push({
            id,
            time: timeStr,
            status,
            isAvailable: true
        });
    }
  }
  return slots;
};

interface BookingContextType {
  schedules: DaySchedule[];
  bookings: ClientBooking[];
  addBooking: (booking: ClientBooking) => void;
  deleteBooking: (bookingId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  getBookingsForDate: (date: string) => ClientBooking[];
  getClientVisitCount: (phone: string) => number;
  toggleSlotAvailability: (date: string, slotId: string) => void;
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
  isAuthenticated: boolean;
  authenticate: (pin: string) => boolean;
  logout: () => void;
  getFormattedDate: (dateStr: string) => { day: string; month: string; weekday: string };
  getReferralBalance: (phone: string) => { count: number; percentage: number };
  redeemReferralRewards: (phone: string) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  
  const [isAdminMode, setAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initialize Data
  useEffect(() => {
    const initData = async () => {
      const storedBlocked = localStorage.getItem('daryl_blocked_slots');
      if (storedBlocked) {
        setBlockedSlots(new Set(JSON.parse(storedBlocked)));
      }

      let loadedBookings: ClientBooking[] = [];
      
      if (sql) {
        try {
          const result = await sql`SELECT * FROM bookings ORDER BY date ASC`;
          if (result && result.length > 0) {
            loadedBookings = result.map((row: any) => ({
              id: row.id,
              date: row.date,
              slotId: row.slot_id,
              time: row.time,
              service: typeof row.service === 'string' ? JSON.parse(row.service) : row.service,
              client: typeof row.client === 'string' ? JSON.parse(row.client) : row.client,
              status: row.status || 'pending',
              // Restore referral fields usually stored in client JSON or implicitly
              referrerPhone: row.referrer_phone || (typeof row.client === 'string' ? JSON.parse(row.client).referrerPhone : row.client.referrerPhone),
              referralClaimed: row.referral_claimed || (typeof row.client === 'string' ? JSON.parse(row.client).referralClaimed : row.client.referralClaimed)
            }));
          }
        } catch (error) {
          console.warn("DB connection failed, falling back to local storage");
        }
      }

      if (loadedBookings.length === 0) {
        const localBookings = localStorage.getItem('daryl_bookings');
        if (localBookings) {
          loadedBookings = JSON.parse(localBookings);
        }
      }

      setBookings(loadedBookings);
      setIsInitialized(true);
    };

    initData();
  }, []);

  // 2. Generate Schedules
  useEffect(() => {
    if (!isInitialized) return;

    const nextDays: DaySchedule[] = [];
    const today = new Date();
    
    for (let i = 0; i < 28; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const defaultSlots = generateDefaultSlots();
      const mergedSlots = defaultSlots.map(slot => ({
        ...slot,
        isAvailable: !blockedSlots.has(`${dateString}_${slot.id}`)
      }));

      nextDays.push({
        date: dateString,
        slots: mergedSlots
      });
    }
    setSchedules(nextDays);
  }, [blockedSlots, isInitialized]);

  // 3. Persist Data
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('daryl_bookings', JSON.stringify(bookings));
    localStorage.setItem('daryl_blocked_slots', JSON.stringify(Array.from(blockedSlots)));
  }, [bookings, blockedSlots, isInitialized]);


  // --- Actions ---

  const addBooking = async (booking: ClientBooking) => {
    // Ensure referrer data is stored in the client object for JSON fallback
    const bookingToSave = {
        ...booking,
        client: {
            ...booking.client,
            referrerPhone: booking.referrerPhone,
            referralClaimed: false
        }
    };

    setBookings(prev => [...prev, bookingToSave]);

    if (sql) {
      try {
        await sql`
          INSERT INTO bookings (id, date, slot_id, time, service, client, status)
          VALUES (
            ${bookingToSave.id}, 
            ${bookingToSave.date}, 
            ${bookingToSave.slotId}, 
            ${bookingToSave.time}, 
            ${JSON.stringify(bookingToSave.service)}, 
            ${JSON.stringify(bookingToSave.client)},
            ${bookingToSave.status}
          )
        `;
      } catch (e) { console.error(e); }
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    if (sql) {
      try { await sql`DELETE FROM bookings WHERE id = ${bookingId}`; } catch (e) { console.error(e); }
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    if (sql) {
        try { await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`; } catch (e) { console.error(e); }
    }
  };

  const toggleSlotAvailability = (date: string, slotId: string) => {
    const key = `${date}_${slotId}`;
    setBlockedSlots(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getBookingsForDate = (date: string) => {
    return bookings.filter(b => b.date === date);
  };

  const getClientVisitCount = (phone: string) => {
    const cleanPhone = (p: string) => p.replace(/\D/g, '');
    const target = cleanPhone(phone);
    if (!target) return 0;
    return bookings.filter(b => 
      (b.status === 'confirmed' || b.status === 'walk-in' || b.status === 'pending') && 
      cleanPhone(b.client.phone) === target
    ).length;
  };

  // --- REFERRAL SYSTEM ---
  
  const getReferralBalance = (phone: string) => {
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const target = cleanPhone(phone);
      
      if (!target) return { count: 0, percentage: 0 };

      // Find bookings where referrerPhone matches target, status is confirmed, and claimed is false
      // Note: We check b.client.referrerPhone or b.referrerPhone depending on how it was saved
      const eligibleReferrals = bookings.filter(b => {
          const bookingReferrer = b.referrerPhone || (b.client as any).referrerPhone;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          
          if (!bookingReferrer) return false;
          
          return (
              cleanPhone(bookingReferrer) === target && // Referred by this user
              b.status === 'confirmed' && // Booking was completed
              !isClaimed // Reward not yet used
          );
      });

      const count = eligibleReferrals.length;
      return {
          count,
          percentage: Math.min(count * 10, 100)
      };
  };

  const redeemReferralRewards = async (phone: string) => {
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const target = cleanPhone(phone);
      
      // Identify IDs to update
      const bookingsToUpdate = bookings.filter(b => {
          const bookingReferrer = b.referrerPhone || (b.client as any).referrerPhone;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          
          return (
              bookingReferrer && 
              cleanPhone(bookingReferrer) === target && 
              b.status === 'confirmed' && 
              !isClaimed
          );
      });

      if (bookingsToUpdate.length === 0) return;

      // Update State
      setBookings(prev => prev.map(b => {
          if (bookingsToUpdate.find(upd => upd.id === b.id)) {
              return { 
                  ...b, 
                  referralClaimed: true,
                  client: { ...b.client, referralClaimed: true } as any
              };
          }
          return b;
      }));

      // Update DB (Approximation for demo: Updating the client JSON blob)
      if (sql) {
          for (const b of bookingsToUpdate) {
               const updatedClient = { ...b.client, referralClaimed: true };
               try {
                   await sql`UPDATE bookings SET client = ${JSON.stringify(updatedClient)} WHERE id = ${b.id}`;
               } catch(e) { console.error(e); }
          }
      }
  };

  const authenticate = (pin: string) => {
    if (pin === '1397') {
        setIsAuthenticated(true);
        return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminMode(false);
  }

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
      deleteBooking,
      updateBookingStatus,
      getBookingsForDate,
      getClientVisitCount,
      toggleSlotAvailability, 
      isAdminMode, 
      setAdminMode,
      isAuthenticated,
      authenticate,
      logout,
      getFormattedDate,
      getReferralBalance,
      redeemReferralRewards
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
