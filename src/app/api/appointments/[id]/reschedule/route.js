import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import { notifyAdmins } from '@/lib/notification';

export async function PATCH(
    request,
    { params }
) {
    try {
        const resolvedParams = await params;
        await dbConnect();

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = resolvedParams;
        const { newStartTime, reason } = await request.json();

        if (!newStartTime) {
            return NextResponse.json({ error: 'New start time is required' }, { status: 400 });
        }

        const appointment = await Appointment.findOne({ _id: id, userId });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
            return NextResponse.json(
                { error: 'Appointment is already cancelled or rejected' },
                { status: 400 }
            );
        }

        // Update appointment status and reschedule details
        appointment.status = 'reschedule_requested';
        appointment.rescheduleRequestedTime = new Date(newStartTime);
        appointment.rescheduleReason = reason;
        await appointment.save();

        // Notify admins of request
        await notifyAdmins({
            type: 'reschedule_request',
            title: 'Reschedule Requested',
            message: `Reschedule requested for "${appointment.title}" to ${new Date(newStartTime).toLocaleString()}. Reason: ${reason}`,
            relatedAppointment: appointment._id.toString(),
        });

        return NextResponse.json({
            message: 'Reschedule request submitted successfully',
            appointment,
        });
    } catch (error) {
        console.error('Reschedule request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
