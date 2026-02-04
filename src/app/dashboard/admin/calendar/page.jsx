'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminCalendarPage() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, currentDate]);

    const fetchData = async () => {
        try {
            const [apptRes, blockedRes] = await Promise.all([
                fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/blocked-slots', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const apptData = await apptRes.json();
            const blockedData = await blockedRes.json();

            if (apptRes.ok) setAppointments(apptData.appointments);
            if (blockedRes.ok) setBlockedSlots(blockedData.blockedSlots);

        } catch (error) {
            console.error('Failed to fetch calendar data', error);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const navigate = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    // Helper to check if event is on a specific day
    const getEventsForDay = (date) => {
        const dateStr = date.toDateString();

        const dayAppts = appointments.filter(a => new Date(a.startTime).toDateString() === dateStr);
        const dayBlocked = blockedSlots.filter(b => new Date(b.startTime).toDateString() === dateStr);

        return { appointments: dayAppts, blockedSlots: dayBlocked };
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                    <p className="text-muted-foreground">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex space-x-4">
                    <div className="bg-background border border-border rounded-lg p-1 flex">
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setView('day')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Day
                        </button>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => navigate('prev')} className="p-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted/50">
                            &lt;
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted/50 text-sm">
                            Today
                        </button>
                        <button onClick={() => navigate('next')} className="p-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted/50">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-background rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm">
                {/* Calendar Grid Implementation */}
                {view === 'month' && (
                    <div className="grid grid-cols-7 h-full">
                        {/* Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="p-2 text-center text-muted-foreground border-b border-r border-border text-sm last:border-r-0">{d}</div>
                        ))}
                        {/* Days */}
                        {Array.from({ length: 35 }).map((_, i) => {
                            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                            const startDay = firstDayOfMonth.getDay();
                            const daysInMonth = getDaysInMonth(currentDate);

                            const dayNum = i - startDay + 1;
                            const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                            const thisDate = isValidDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum) : null;

                            const events = thisDate ? getEventsForDay(thisDate) : { appointments: [], blockedSlots: [] };

                            return (
                                <div key={i} className={`min-h-[100px] border-b border-r border-border p-2 ${!isValidDay ? 'bg-muted/10' : ''} last:border-r-0`}>
                                    {isValidDay && (
                                        <>
                                            <span className="text-muted-foreground text-xs block mb-1">{dayNum}</span>
                                            <div className="space-y-1">
                                                {events.blockedSlots.map(s => (
                                                    <div key={s._id} className="text-[10px] bg-red-100 text-red-800 px-1 py-0.5 rounded truncate border border-red-200">
                                                        Blocked
                                                    </div>
                                                ))}
                                                {events.appointments.map(a => (
                                                    <div key={a._id} className={`text-[10px] px-1 py-0.5 rounded truncate border ${a.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-primary/20 text-primary border-primary/30'}`}>
                                                        {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {a.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {view === 'day' && (
                    <div className="p-8">
                        <h2 className="text-xl text-foreground mb-4">Agenda for {currentDate.toDateString()}</h2>
                        {(() => {
                            const { appointments: daysAppts, blockedSlots: daysBlocked } = getEventsForDay(currentDate);
                            if (daysAppts.length === 0 && daysBlocked.length === 0) return <p className="text-muted-foreground">No events for this day.</p>;

                            return (
                                <div className="space-y-2">
                                    {daysBlocked.map(s => (
                                        <div key={s._id} className="p-3 bg-red-100 border border-red-200 rounded-lg flex justify-between items-center">
                                            <span className="text-red-700">Blocked: {new Date(s.startTime).toLocaleTimeString()} - {new Date(s.endTime).toLocaleTimeString()}</span>
                                            <span className="text-red-700 text-sm">{s.reason}</span>
                                        </div>
                                    ))}
                                    {daysAppts.map(a => (
                                        <div key={a._id} className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="text-primary font-medium">{a.title}</p>
                                                <p className="text-muted-foreground text-sm">{new Date(a.startTime).toLocaleTimeString()} - {new Date(a.endTime).toLocaleTimeString()}</p>
                                            </div>
                                            <span className="text-muted-foreground text-sm">{a.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
