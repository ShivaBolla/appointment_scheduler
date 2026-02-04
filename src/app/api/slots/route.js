import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import BlockedSlot from '@/models/BlockedSlot';

const WORKING_HOURS = {
    start: 9,
    end: 17,
    slotDuration: 30,
    workDays: [1, 2, 3, 4, 5],
};

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        const durationParam = searchParams.get('duration');

        if (!dateParam) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        const date = new Date(dateParam);
        const duration = parseInt(durationParam || '30');

        const dayOfWeek = date.getDay();
        if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
            return NextResponse.json({ slots: [], message: 'Not a working day' });
        }

        const slots = [];
        const startOfDay = new Date(date);
        startOfDay.setHours(WORKING_HOURS.start, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(WORKING_HOURS.end, 0, 0, 0);

        const bookedAppointments = await Appointment.find({
            status: { $in: ['pending', 'approved'] },
            startTime: { $gte: startOfDay, $lt: endOfDay },
        });

        const blockedSlots = await BlockedSlot.find({
            startTime: { $gte: startOfDay, $lt: endOfDay },
        });

        let currentSlot = new Date(startOfDay);
        while (currentSlot.getTime() + duration * 60 * 1000 <= endOfDay.getTime()) {
            const slotEnd = new Date(currentSlot.getTime() + duration * 60 * 1000);

            const isBooked = bookedAppointments.some(apt => {
                const aptStart = new Date(apt.startTime);
                const aptEnd = new Date(apt.endTime);
                return (currentSlot < aptEnd && slotEnd > aptStart);
            });

            const isBlocked = blockedSlots.some(blocked => {
                const blockedStart = new Date(blocked.startTime);
                const blockedEnd = new Date(blocked.endTime);
                return (currentSlot < blockedEnd && slotEnd > blockedStart);
            });

            const isPast = currentSlot < new Date();

            slots.push({
                startTime: currentSlot.toISOString(),
                endTime: slotEnd.toISOString(),
                available: !isBooked && !isBlocked && !isPast,
                isPast,
                isBlocked,
                isBooked,
            });

            currentSlot = slotEnd;
        }

        return NextResponse.json({
            slots,
            workingHours: WORKING_HOURS,
            date: date.toISOString().split('T')[0],
        });
    } catch (error) {
        console.error('Fetch slots error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
