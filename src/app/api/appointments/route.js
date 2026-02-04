import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import { notifyAdmins } from '@/lib/notification';

// GET - Fetch appointments (user gets their own, admin gets all)
export async function GET(request) {
    try {
        await dbConnect();

        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let appointments;
        if (userRole === 'sub-admin' || userRole === 'super-admin') {
            // Admins see all appointments
            appointments = await Appointment.find().sort({ createdAt: -1 });
        } else {
            // Users see only their appointments
            appointments = await Appointment.find({ userId }).sort({ createdAt: -1 });
        }

        return NextResponse.json({ appointments });
    } catch (error) {
        console.error('Fetch appointments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new appointment
export async function POST(request) {
    try {
        await dbConnect();

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, type, startTime, endTime, duration, name, email, phone } = body;

        // Validation
        if (!title || !type || !startTime || !endTime || !duration || !name || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check for overlapping appointments (approved or pending)
        const overlap = await Appointment.findOne({
            status: { $in: ['pending', 'approved'] },
            $or: [
                { startTime: { $lt: end, $gte: start } },
                { endTime: { $gt: start, $lte: end } },
                { startTime: { $lte: start }, endTime: { $gte: end } },
            ],
        });

        if (overlap) {
            return NextResponse.json(
                { error: 'This time slot is already booked or pending' },
                { status: 409 }
            );
        }

        // Create appointment
        const appointment = await Appointment.create({
            userId,
            title,
            description,
            type,
            startTime: start,
            endTime: end,
            duration,
            name,
            email,
            phone,
            status: 'pending',
        });

        // Create notification for user
        await Notification.create({
            userId,
            type: 'booking_submitted',
            title: 'Appointment Submitted',
            message: `Your appointment "${title}" has been submitted and is pending approval.`,
            relatedAppointment: appointment._id,
        });

        // Notify admins
        await notifyAdmins({
            type: 'booking_submitted',
            title: 'New Appointment Request',
            message: `New appointment request from ${name}: "${title}" at ${start.toLocaleString()}`,
            relatedAppointment: appointment._id.toString(),
        });

        return NextResponse.json(
            { message: 'Appointment created successfully', appointment },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create appointment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
