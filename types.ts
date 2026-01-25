export interface Haircut {
  id: number;
  title: string;
  category: string;
  image: string;
}

export interface BookingForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export type SlotStatus = 'Prime' | 'Open' | 'Peak' | 'Booked';

export interface TimeSlot {
  id: string;
  time: string;
  status: SlotStatus;
  isAvailable: boolean;
}

export interface DaySchedule {
  date: string; // ISO Date String YYYY-MM-DD
  slots: TimeSlot[];
}

export interface ServiceItem {
  id: string;
  name: string;
  duration: string;
  price: string;
  note?: string;
}

export interface ServiceCategory {
  category: string;
  items: ServiceItem[];
}

export interface ClientBooking {
  id: string;
  date: string;
  slotId: string;
  time: string;
  service: ServiceItem;
  client: BookingForm;
}
