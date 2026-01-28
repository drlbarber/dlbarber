
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
  // Referral System Updates
  getReferralBalance: (phone: string) => { count: number; creditAmount: number; code: string | null };
  redeemReferralRewards: (phone: string, targetBookingId: string) => Promise<void>;
  applyLoyaltyFreeCut: (bookingId: string) => Promise<void>;
  registerAffiliateCode: (phone: string, code: string) => Promise<boolean>;
  getAffiliateCode: (phone: string) => string | null;
  isDbConnected: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  // Mapping: Code (key) -> Phone (value)
  const [affiliateCodes, setAffiliateCodes] = useState<Record<string, string>>({}); 

  // PERSISTENCE ADMIN : Check localStorage on init
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('daryl_admin_session') === 'true';
    }
    return false;
  });

  // If authenticated on load, default to Admin Mode true so he sees calendar immediately
  const [isAdminMode, setAdminMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('daryl_admin_session') === 'true';
      }
      return false;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initialize Data & DB Structure
  useEffect(() => {
    const initData = async () => {
      let dbLoaded = false;
      
      // Load Local Data first (Fast render)
      try {
        const storedBlocked = localStorage.getItem('daryl_blocked_slots');
        if (storedBlocked) {
            const parsed = JSON.parse(storedBlocked);
            if (Array.isArray(parsed)) setBlockedSlots(new Set(parsed));
        }
        
        const storedAffiliates = localStorage.getItem('daryl_affiliates');
        if (storedAffiliates) {
            const parsed = JSON.parse(storedAffiliates);
            if (parsed && typeof parsed === 'object') setAffiliateCodes(parsed);
        }
      } catch (e) { console.error("Local load error", e); }

      // DB INITIALIZATION & LOADING
      if (sql) {
        try {
          // A. Create Tables if they don't exist (Auto-Migration)
          await sql`
            CREATE TABLE IF NOT EXISTS bookings (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              slot_id TEXT NOT NULL,
              time TEXT NOT NULL,
              service TEXT NOT NULL,
              client TEXT NOT NULL,
              status TEXT NOT NULL,
              used_referral_code TEXT,
              referral_claimed BOOLEAN DEFAULT FALSE
            )
          `;
          
          await sql`
            CREATE TABLE IF NOT EXISTS affiliates (
              phone TEXT PRIMARY KEY,
              code TEXT UNIQUE NOT NULL
            )
          `;

          // B. Load Bookings from DB
          const result = await sql`SELECT * FROM bookings ORDER BY date ASC`;
          if (result) {
            const loadedBookings = result.map((row: any) => {
              // Parse JSON stored as TEXT
              const clientObj = typeof row.client === 'string' ? JSON.parse(row.client) : row.client;
              const serviceObj = typeof row.service === 'string' ? JSON.parse(row.service) : row.service;
              
              return {
                id: row.id,
                date: row.date,
                slotId: row.slot_id,
                time: row.time,
                service: serviceObj,
                client: clientObj,
                status: row.status || 'pending',
                usedReferralCode: row.used_referral_code || clientObj.usedReferralCode,
                referralClaimed: row.referral_claimed || clientObj.referralClaimed
              };
            });
            setBookings(loadedBookings);
            dbLoaded = true;
            setIsDbConnected(true);
            console.log("Bookings loaded from DB:", loadedBookings.length);
          }

          // C. Load Affiliates from DB
          const affiliatesResult = await sql`SELECT phone, code FROM affiliates`;
          if (affiliatesResult) {
            const dbAffiliates: Record<string, string> = {};
            affiliatesResult.forEach((row: any) => {
                dbAffiliates[row.code] = row.phone;
            });
            setAffiliateCodes(prev => ({ ...prev, ...dbAffiliates }));
            console.log("Affiliates loaded from DB");
          }

        } catch (error) {
          console.warn("DB Connection failed. Falling back to LocalStorage.", error);
          setIsDbConnected(false);
          // Fallback handled below
        }
      }

      // Fallback: If DB failed or is null, load bookings from LocalStorage
      if (!dbLoaded) {
        const localBookings = localStorage.getItem('daryl_bookings');
        if (localBookings) {
          try { 
              const parsed = JSON.parse(localBookings);
              if (Array.isArray(parsed)) setBookings(parsed); 
          } catch (e) {}
        }
      }

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

  // 3. Persist Data (Local Backup always runs)
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('daryl_bookings', JSON.stringify(bookings));
    localStorage.setItem('daryl_blocked_slots', JSON.stringify(Array.from(blockedSlots)));
    localStorage.setItem('daryl_affiliates', JSON.stringify(affiliateCodes));
  }, [bookings, blockedSlots, affiliateCodes, isInitialized]);


  // --- Actions ---

  const addBooking = async (booking: ClientBooking) => {
    // Save usedReferralCode in the client blob for backup
    const bookingToSave = {
        ...booking,
        client: {
            ...booking.client,
            usedReferralCode: booking.usedReferralCode,
            referralClaimed: false
        }
    };

    // Optimistic Update (Immediate UI response)
    setBookings(prev => [...prev, bookingToSave]);

    if (sql) {
      try {
        await sql`
          INSERT INTO bookings (id, date, slot_id, time, service, client, status, used_referral_code, referral_claimed)
          VALUES (
            ${bookingToSave.id}, 
            ${bookingToSave.date}, 
            ${bookingToSave.slotId}, 
            ${bookingToSave.time}, 
            ${JSON.stringify(bookingToSave.service)}, 
            ${JSON.stringify(bookingToSave.client)},
            ${bookingToSave.status},
            ${bookingToSave.usedReferralCode || null},
            ${false}
          )
        `;
      } catch (e) { console.error("SQL Error AddBooking:", e); }
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

  // --- REFERRAL SYSTEM V2 (Codes) ---
  
  const registerAffiliateCode = async (phone: string, code: string): Promise<boolean> => {
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanCode = code.toUpperCase().trim();

      // Check if code exists locally first
      if (affiliateCodes[cleanCode] && affiliateCodes[cleanCode] !== cleanPhone) {
          return false; // Code taken
      }

      // Optimistic Update
      setAffiliateCodes(prev => ({
          ...prev,
          [cleanCode]: cleanPhone
      }));

      // DB Insert
      if (sql) {
          try {
              await sql`INSERT INTO affiliates (phone, code) VALUES (${cleanPhone}, ${cleanCode})`;
          } catch (e) {
              console.error("SQL Error RegisterAffiliate:", e);
              // Rollback optimistic update if needed, but for now we rely on DB constraints
              return false;
          }
      }
      
      return true;
  };

  const getAffiliateCode = (phone: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      return Object.keys(affiliateCodes).find(key => affiliateCodes[key] === cleanPhone) || null;
  };

  const getReferralBalance = (phone: string) => {
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const targetPhone = cleanPhone(phone);
      
      // 1. Find the code owned by this user
      const myCode = getAffiliateCode(targetPhone);

      if (!myCode) return { count: 0, creditAmount: 0, code: null };

      // 2. Find bookings that USED this code
      const eligibleReferrals = bookings.filter(b => {
          const usedCode = b.usedReferralCode || (b.client as any).usedReferralCode;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          
          if (!usedCode) return false;
          
          return (
              usedCode === myCode && // Used MY code
              b.status === 'confirmed' && // Booking completed
              !isClaimed // Not yet redeemed
          );
      });

      const count = eligibleReferrals.length;
      // UPDATE: 3 EUR per referral instead of percentage
      const creditAmount = count * 3; 

      return {
          count,
          creditAmount,
          code: myCode
      };
  };

  const applyLoyaltyFreeCut = async (bookingId: string) => {
      const targetBooking = bookings.find(b => b.id === bookingId);
      if (!targetBooking) return;

      const updatedService = { 
          ...targetBooking.service, 
          name: `${targetBooking.service.name} (FIDÉLITÉ 8e)`,
          price: '0 €'
      };

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, service: updatedService } : b));

      if (sql) {
          try {
             // Update JSON stored as text
             await sql`UPDATE bookings SET service = ${JSON.stringify(updatedService)} WHERE id = ${bookingId}`;
          } catch(e) { console.error("SQL Error ApplyLoyalty:", e); }
      }
  };

  const redeemReferralRewards = async (phone: string, targetBookingId: string) => {
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const targetPhone = cleanPhone(phone);
      
      // 1. Identify current booking to update (The one getting the discount)
      const targetBooking = bookings.find(b => b.id === targetBookingId);
      if (!targetBooking) return;

      const myCode = getAffiliateCode(targetPhone);
      if (!myCode) return;

      // 2. Identify Referral IDs to burn (The sources of the discount)
      const availableReferrals = bookings.filter(b => {
          const usedCode = b.usedReferralCode || (b.client as any).usedReferralCode;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          return (
              usedCode === myCode &&
              b.status === 'confirmed' && 
              !isClaimed
          );
      });

      if (availableReferrals.length === 0) return;

      // UPDATE LOGIC: Burn just enough referrals to cover price, or all of them if not enough
      const currentPrice = parseInt(targetBooking.service.price.replace(/[^0-9]/g, '')) || 0;
      
      // Cost of referral point = 3 EUR
      const referralValue = 3;
      
      // Calculate how many referrals are needed to cover the price
      const referralsNeeded = Math.ceil(currentPrice / referralValue);
      
      // Burn max available or needed
      const referralsToBurn = availableReferrals.slice(0, referralsNeeded);
      
      const discountAmount = referralsToBurn.length * referralValue;
      
      // Calculate new price
      const newPriceValue = Math.max(0, currentPrice - discountAmount);
      const newPriceString = `${newPriceValue.toFixed(0)} €`;
      const suffix = newPriceValue === 0 ? '(OFFERT PARRAIN)' : `(-${discountAmount}€)`;

      // 3. Update State
      setBookings(prev => prev.map(b => {
          // If this is one of the referral sources, mark as claimed
          if (referralsToBurn.find(upd => upd.id === b.id)) {
              return { 
                  ...b, 
                  referralClaimed: true,
                  client: { ...b.client, referralClaimed: true } as any
              };
          }
          // If this is the booking receiving the discount, update service price
          if (b.id === targetBookingId) {
             return {
                 ...b,
                 service: {
                     ...b.service,
                     name: `${b.service.name} ${suffix}`,
                     price: newPriceString
                 }
             }
          }
          return b;
      }));

      // 4. Update DB
      if (sql) {
          // Burn points
          for (const b of referralsToBurn) {
               const updatedClient = { ...b.client, referralClaimed: true };
               try {
                   // Update both column and JSON for safety
                   await sql`UPDATE bookings SET referral_claimed = TRUE, client = ${JSON.stringify(updatedClient)} WHERE id = ${b.id}`;
               } catch(e) { console.error("SQL Error BurnReferral:", e); }
          }
          // Apply discount to target booking
          const updatedService = { 
              ...targetBooking.service, 
              name: `${targetBooking.service.name} ${suffix}`,
              price: newPriceString
          };
          try {
             await sql`UPDATE bookings SET service = ${JSON.stringify(updatedService)} WHERE id = ${targetBookingId}`;
          } catch(e) { console.error("SQL Error ApplyDiscount:", e); }
      }
  };

  const authenticate = (pin: string) => {
    if (pin === '1397') {
        setIsAuthenticated(true);
        localStorage.setItem('daryl_admin_session', 'true');
        return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminMode(false);
    localStorage.removeItem('daryl_admin_session');
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
      redeemReferralRewards,
      applyLoyaltyFreeCut,
      registerAffiliateCode,
      getAffiliateCode,
      isDbConnected
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
