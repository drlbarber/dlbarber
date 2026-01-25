import React, { useState, useMemo } from 'react';
import { useBooking } from '../BookingContext';
import { X, Shield, Calendar, Clock, User, Phone, Mail, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientBooking, SlotStatus } from '../types';

export const AdminInterface = () => {
  const { 
    schedules, 
    toggleSlotAvailability, 
    updateSlotStatus, 
    isAdminMode, 
    setAdminMode, 
    getBookingsForDate,
    getFormattedDate 
  } = useBooking();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState<ClientBooking | null>(null);

  if (!isAdminMode) return null;

  // Calendar Logic
  const generateCalendarDays = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Add empty slots for days before start of month
    let startDay = firstDayOfMonth.getDay(); 
    if (startDay === 0) startDay = 7; // Make Sunday (0) the last day (7)
    for (let i = 1; i < startDay; i++) {
        days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const d = new Date(year, month, i);
        // Adjust for timezone offset to get simple YYYY-MM-DD
        const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        days.push(dateStr);
    }
    
    return days;
  };

  const calendarDays = useMemo(() => generateCalendarDays(selectedDate), [selectedDate]);

  const changeMonth = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const currentSchedule = schedules.find(s => s.date === selectedDate);
  const currentBookings = getBookingsForDate(selectedDate);

  const getDayBookingsCount = (dateStr: string) => {
    return getBookingsForDate(dateStr).length;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center font-mono animate-fade-in text-white">
      {/* Admin Header */}
      <div className="w-full max-w-4xl px-6 py-4 flex justify-between items-center border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-full border border-red-500/20">
                <Shield className="w-4 h-4 text-red-500" />
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-wider uppercase">Admin Console</h2>
                <span className="text-[10px] text-gray-500">v1.1.0 // Schedule Manager</span>
            </div>
        </div>
        <button 
            onClick={() => setAdminMode(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
            <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT: Calendar View */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-[#0a0a0a]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-apple-blue" />
                    {new Date(selectedDate).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h3>
                <div className="flex gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="text-[10px] text-gray-500 py-2">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dateStr, idx) => {
                    if (!dateStr) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    
                    const isSelected = dateStr === selectedDate;
                    const bookingsCount = getDayBookingsCount(dateStr);
                    const dayNum = parseInt(dateStr.split('-')[2]);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                                aspect-square rounded-sm flex flex-col items-center justify-center relative transition-all
                                ${isSelected ? 'bg-apple-blue text-white shadow-lg scale-105 z-10' : 'bg-white/5 text-gray-400 hover:bg-white/10'}
                                ${isToday && !isSelected ? 'border border-apple-blue/50' : ''}
                            `}
                        >
                            <span className="text-sm font-bold">{dayNum}</span>
                            {bookingsCount > 0 && (
                                <div className="flex gap-0.5 mt-1">
                                    {Array.from({length: Math.min(bookingsCount, 3)}).map((_, i) => (
                                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-auto pt-6 text-[10px] text-gray-500 flex gap-4">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Booked</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-white/5 border border-apple-blue/50 rounded-sm"></div> Today</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-apple-blue rounded-sm"></div> Selected</div>
            </div>
        </div>

        {/* RIGHT: Day Details */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto relative">
             <div className="flex justify-between items-end mb-6 sticky top-0 bg-black/90 pb-4 border-b border-white/10 z-10 backdrop-blur">
                 <div>
                    <h3 className="text-xs uppercase text-gray-500 mb-1">Schedule Details</h3>
                    <h2 className="text-2xl font-bold text-white">
                        {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                 </div>
                 <div className="text-right">
                     <span className="text-xl font-bold text-green-500">{currentBookings.length}</span>
                     <span className="text-[10px] text-gray-500 block uppercase">Bookings</span>
                 </div>
            </div>

            <div className="space-y-3">
                {currentSchedule?.slots.map((slot) => {
                    const booking = currentBookings.find(b => b.slotId === slot.id);
                    
                    return (
                        <div 
                            key={slot.id} 
                            className={`
                                p-4 border rounded-sm flex items-center justify-between transition-all duration-300 relative overflow-hidden
                                ${booking 
                                    ? 'border-green-500/30 bg-green-500/10' 
                                    : (slot.isAvailable ? 'border-white/10 bg-white/5' : 'border-red-900/30 bg-red-900/10 opacity-60')}
                            `}
                        >
                            {booking && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                            
                            <div className="flex items-center gap-4">
                                <span className="font-space font-bold w-12">{slot.time}</span>
                                
                                {booking ? (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{booking.client.firstName} {booking.client.lastName}</span>
                                        <span className="text-[10px] text-green-400 truncate max-w-[120px]">{booking.service.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleSlotAvailability(selectedDate, slot.id)}
                                            className={`
                                                w-8 h-4 rounded-full relative transition-colors duration-300
                                                ${slot.isAvailable ? 'bg-gray-600' : 'bg-red-900'}
                                            `}
                                        >
                                            <div className={`
                                                absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-300 bg-white
                                                ${slot.isAvailable ? 'translate-x-4' : 'translate-x-0'}
                                            `} />
                                        </button>
                                        <span className="text-[10px] text-gray-500 uppercase">{slot.isAvailable ? 'Open' : 'Closed'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {booking ? (
                                    <button 
                                        onClick={() => setSelectedBooking(booking)}
                                        className="px-3 py-1.5 bg-green-500 text-black text-[10px] font-bold uppercase rounded hover:bg-white transition-colors"
                                    >
                                        Details
                                    </button>
                                ) : (
                                     ['Prime', 'Peak'].map((status) => (
                                         <button
                                            key={status}
                                            onClick={() => updateSlotStatus(selectedDate, slot.id, status as SlotStatus)}
                                            disabled={!slot.isAvailable}
                                            className={`
                                                px-2 py-1 text-[9px] uppercase tracking-wider border rounded transition-colors
                                                ${slot.status === status 
                                                    ? 'bg-white text-black border-white' 
                                                    : 'text-gray-500 border-gray-800 hover:border-gray-600'}
                                                ${!slot.isAvailable && 'opacity-20 pointer-events-none'}
                                            `}
                                         >
                                            {status}
                                         </button>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-[#111] border border-white/20 p-8 rounded-sm max-w-md w-full relative shadow-2xl">
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                  >
                      <X className="w-6 h-6" />
                  </button>

                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-apple-blue/20 rounded-full flex items-center justify-center mx-auto mb-4 text-apple-blue border border-apple-blue/40">
                          <User className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{selectedBooking.client.firstName} {selectedBooking.client.lastName}</h3>
                      <p className="text-gray-500 text-sm">Client Details</p>
                  </div>

                  <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/5">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                              <p className="text-[10px] uppercase text-gray-500">Date & Time</p>
                              <p className="text-white font-mono">{selectedBooking.date} @ {selectedBooking.time}</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/5">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                              <p className="text-[10px] uppercase text-gray-500">Service</p>
                              <p className="text-white font-bold">{selectedBooking.service.name}</p>
                              <p className="text-xs text-apple-blue">{selectedBooking.service.duration} • {selectedBooking.service.price}</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <a href={`tel:${selectedBooking.client.phone}`} className="flex flex-col items-center justify-center p-4 bg-white/5 rounded border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                            <Phone className="w-5 h-5 text-green-500 mb-2" />
                            <p className="text-xs text-white">{selectedBooking.client.phone}</p>
                        </a>
                        <a href={`mailto:${selectedBooking.client.email}`} className="flex flex-col items-center justify-center p-4 bg-white/5 rounded border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                            <Mail className="w-5 h-5 text-apple-blue mb-2" />
                            <p className="text-xs text-white truncate w-full text-center">{selectedBooking.client.email || 'N/A'}</p>
                        </a>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Footer */}
      <div className="w-full max-w-4xl px-6 py-3 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 bg-black">
         <span>ADMIN_MODE_ACTIVE // {new Date().toLocaleTimeString()}</span>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>LIVE DATABASE</span>
         </div>
      </div>
    </div>
  );
};
