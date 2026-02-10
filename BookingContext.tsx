
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  addBooking: (booking: ClientBooking) => Promise<void>;
  deleteBooking: (bookingId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  getBookingsForDate: (date: string) => ClientBooking[];
  getClientVisitCount: (phone: string) => number;
  toggleSlotAvailability: (date: string, slotId: string) => Promise<void>;
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
  dbError: string | null;
  initializeDb: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  
  // DB Status
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Mapping: Code (key) -> Phone (value)
  const [affiliateCodes, setAffiliateCodes] = useState<Record<string, string>>({}); 

  // PERSISTENCE ADMIN : Check localStorage on init
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('daryl_admin_session') === 'true';
    }
    return false;
  });

  const [isAdminMode, setAdminMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('daryl_admin_session') === 'true';
      }
      return false;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // --- CORE DATA LOADING FUNCTION ---
  const loadDataFromDb = useCallback(async () => {
    if (!sql) return;

    try {
        // 1. Load Bookings
        const result = await sql`SELECT * FROM bookings WHERE is_archived = FALSE ORDER BY date ASC`;
        if (result) {
            const loadedBookings = result.map((row: any) => {
              // Handle potential double stringification or direct object
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
        }

        // 2. Load Affiliates
        const affiliatesResult = await sql`SELECT phone, code FROM affiliates`;
        if (affiliatesResult) {
            const dbAffiliates: Record<string, string> = {};
            affiliatesResult.forEach((row: any) => {
                dbAffiliates[row.code] = row.phone;
            });
            setAffiliateCodes(prev => ({ ...prev, ...dbAffiliates }));
        }

        // 3. Load Blocked Slots
        const blockedResult = await sql`SELECT date, slot_id FROM blocked_slots`;
        if (blockedResult) {
             const dbBlocked = new Set<string>();
             blockedResult.forEach((row: any) => {
                 dbBlocked.add(`${row.date}_${row.slot_id}`);
             });
             setBlockedSlots(dbBlocked);
        }

        setIsDbConnected(true);
        if (dbError) setDbError(null); // Clear previous errors on success

    } catch (error: any) {
        console.error("Data Load Error:", error);
        // Only set global error if it's a hard failure that affects usage, 
        // otherwise silent retry is better for UX
        if (!isDbConnected) setDbError(error.message); 
    }
  }, [sql, isDbConnected, dbError]);

  // --- POLLING FOR DATA SYNC ---
  useEffect(() => {
    if (isDbConnected && isInitialized) {
        // Poll every 15 seconds to keep data fresh
        const intervalId = setInterval(() => {
            loadDataFromDb();
        }, 15000);
        return () => clearInterval(intervalId);
    }
  }, [isDbConnected, isInitialized, loadDataFromDb]);


  // --- DB INITIALIZATION LOGIC ---
  const initializeDb = async () => {
      if (!sql) {
          console.warn("SQL Client not available");
          setDbError("Client SQL non initialisé (vérifiez db.ts)");
          return;
      }

      try {
          console.log("Attempting to connect to Neon DB...");
          setDbError(null);

          // 1. Test Simple Query
          await sql`SELECT 1`;
          console.log("Connection successful (SELECT 1)");

          // 2. Create Tables
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
              referral_claimed BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              is_archived BOOLEAN DEFAULT FALSE
            )
          `;
          
          await sql`
            CREATE TABLE IF NOT EXISTS affiliates (
              phone TEXT PRIMARY KEY,
              code TEXT UNIQUE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `;

          await sql`
            CREATE TABLE IF NOT EXISTS blocked_slots (
              date TEXT NOT NULL,
              slot_id TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (date, slot_id)
            )
          `;
          console.log("Tables created/verified.");

          // 3. Migrate Columns
          try {
             await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`;
             await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE`;
             
             // Indexes
             await sql`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`;
             await sql`CREATE INDEX IF NOT EXISTS idx_bookings_referral ON bookings(used_referral_code)`;
             await sql`CREATE INDEX IF NOT EXISTS idx_blocked_slots_lookup ON blocked_slots(date, slot_id)`;
          } catch (migrationError) {
             console.warn("Migration warning:", migrationError);
          }

          // 4. Initial Data Load
          await loadDataFromDb();

      } catch (error: any) {
          console.error("DB Init Failed:", error);
          setDbError(error.message || "Erreur de connexion DB");
          setIsDbConnected(false);
          loadLocalFallback();
      }
  };

  const loadLocalFallback = () => {
    try {
        const localBookings = localStorage.getItem('daryl_bookings');
        if (localBookings) {
            const parsed = JSON.parse(localBookings);
            if (Array.isArray(parsed)) setBookings(parsed); 
        }
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
    } catch (e) {}
  };

  // 1. Trigger Init on Mount
  useEffect(() => {
    initializeDb().then(() => setIsInitialized(true));
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

  // 3. Persist Data Local Backup
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('daryl_bookings', JSON.stringify(bookings));
    localStorage.setItem('daryl_blocked_slots', JSON.stringify(Array.from(blockedSlots)));
    localStorage.setItem('daryl_affiliates', JSON.stringify(affiliateCodes));
  }, [bookings, blockedSlots, affiliateCodes, isInitialized]);


  // --- Actions ---

  const addBooking = async (booking: ClientBooking) => {
    // Optimistic UI Update
    const bookingToSave = {
        ...booking,
        client: {
            ...booking.client,
            usedReferralCode: booking.usedReferralCode,
            referralClaimed: false
        }
    };
    setBookings(prev => [...prev, bookingToSave]);

    if (sql && isDbConnected) {
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
      } catch (e: any) { 
          console.error("SQL Error AddBooking:", e);
          setDbError("Erreur sauvegarde réservation: " + e.message);
          alert("Erreur réseau: La réservation n'a pas pu être sauvegardée sur le serveur. Vérifiez votre connexion.");
          // Rollback state if desired, or let local persistence handle it temporarily
      }
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    if (sql && isDbConnected) {
      try { await sql`UPDATE bookings SET is_archived = TRUE WHERE id = ${bookingId}`; } 
      catch (e: any) { setDbError("Erreur suppression: " + e.message); }
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    if (sql && isDbConnected) {
        try { await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`; } 
        catch (e: any) { setDbError("Erreur maj status: " + e.message); }
    }
  };

  const toggleSlotAvailability = async (date: string, slotId: string) => {
    const key = `${date}_${slotId}`;
    let action: 'block' | 'unblock' = 'block';

    if (blockedSlots.has(key)) action = 'unblock';

    setBlockedSlots(prev => {
      const next = new Set(prev);
      if (action === 'unblock') next.delete(key);
      else next.add(key);
      return next;
    });

    if (sql && isDbConnected) {
        try {
            if (action === 'block') {
                 await sql`INSERT INTO blocked_slots (date, slot_id) VALUES (${date}, ${slotId}) ON CONFLICT DO NOTHING`;
            } else {
                 await sql`DELETE FROM blocked_slots WHERE date = ${date} AND slot_id = ${slotId}`;
            }
        } catch (e: any) { setDbError("Erreur blocage créneau: " + e.message); }
    }
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

      if (affiliateCodes[cleanCode] && affiliateCodes[cleanCode] !== cleanPhone) {
          return false; 
      }

      setAffiliateCodes(prev => ({ ...prev, [cleanCode]: cleanPhone }));

      if (sql && isDbConnected) {
          try {
              await sql`INSERT INTO affiliates (phone, code) VALUES (${cleanPhone}, ${cleanCode})`;
          } catch (e) { return false; }
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
      
      const myCode = getAffiliateCode(targetPhone);
      if (!myCode) return { count: 0, creditAmount: 0, code: null };

      const eligibleReferrals = bookings.filter(b => {
          const usedCode = b.usedReferralCode || (b.client as any).usedReferralCode;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          return (usedCode === myCode && b.status === 'confirmed' && !isClaimed);
      });

      const count = eligibleReferrals.length;
      const creditAmount = count * 3; 

      return { count, creditAmount, code: myCode };
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

      if (sql && isDbConnected) {
          try { await sql`UPDATE bookings SET service = ${JSON.stringify(updatedService)} WHERE id = ${bookingId}`; }
          catch(e) {}
      }
  };

  const redeemReferralRewards = async (phone: string, targetBookingId: string) => {
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const targetPhone = cleanPhone(phone);
      
      const targetBooking = bookings.find(b => b.id === targetBookingId);
      if (!targetBooking) return;

      const myCode = getAffiliateCode(targetPhone);
      if (!myCode) return;

      const availableReferrals = bookings.filter(b => {
          const usedCode = b.usedReferralCode || (b.client as any).usedReferralCode;
          const isClaimed = b.referralClaimed || (b.client as any).referralClaimed;
          return (usedCode === myCode && b.status === 'confirmed' && !isClaimed);
      });

      if (availableReferrals.length === 0) return;

      const currentPrice = parseInt(targetBooking.service.price.replace(/[^0-9]/g, '')) || 0;
      const referralValue = 3;
      const referralsNeeded = Math.ceil(currentPrice / referralValue);
      const referralsToBurn = availableReferrals.slice(0, referralsNeeded);
      const discountAmount = referralsToBurn.length * referralValue;
      
      const newPriceValue = Math.max(0, currentPrice - discountAmount);
      const newPriceString = `${newPriceValue.toFixed(0)} €`;
      const suffix = newPriceValue === 0 ? '(OFFERT PARRAIN)' : `(-${discountAmount}€)`;

      setBookings(prev => prev.map(b => {
          if (referralsToBurn.find(upd => upd.id === b.id)) {
              return { ...b, referralClaimed: true, client: { ...b.client, referralClaimed: true } as any };
          }
          if (b.id === targetBookingId) {
             return { ...b, service: { ...b.service, name: `${b.service.name} ${suffix}`, price: newPriceString } }
          }
          return b;
      }));

      if (sql && isDbConnected) {
          for (const b of referralsToBurn) {
               const updatedClient = { ...b.client, referralClaimed: true };
               try { await sql`UPDATE bookings SET referral_claimed = TRUE, client = ${JSON.stringify(updatedClient)} WHERE id = ${b.id}`; } catch(e) {}
          }
          const updatedService = { ...targetBooking.service, name: `${targetBooking.service.name} ${suffix}`, price: newPriceString };
          try { await sql`UPDATE bookings SET service = ${JSON.stringify(updatedService)} WHERE id = ${targetBookingId}`; } catch(e) {}
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
      isDbConnected,
      dbError,
      initializeDb,
      refreshData: loadDataFromDb
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
