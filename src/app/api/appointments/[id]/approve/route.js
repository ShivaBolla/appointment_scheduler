import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';


// PATCH - Approve appointment
export async function PATCH(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;
        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'sub-admin' && userRole !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { meetingLink } = body;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.status !== 'pending') {
            return NextResponse.json(
                { error: 'Only pending appointments can be approved' },
                { status: 400 }
            );
        }

        appointment.status = 'approved';
        if (meetingLink) {
            appointment.meetingLink = meetingLink;
        }
        await appointment.save();

        // Notify the user
        await Notification.create({
            userId: appointment.userId,
            type: 'booking_approved',
            title: 'Appointment Approved',
            message: `Your appointment "${appointment.title}" has been approved!${meetingLink ? ' Meeting link has been added.' : ''}`,
            relatedAppointment: appointment._id,
        });

        return NextResponse.json({ message: 'Appointment approved', appointment });
    } catch (error) {
        console.error('Approve appointment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
