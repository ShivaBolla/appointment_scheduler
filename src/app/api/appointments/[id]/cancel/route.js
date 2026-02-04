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
        const { reason } = await request.json();

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

        // Update appointment status and reason
        appointment.status = 'cancellation_requested';
        appointment.cancellationReason = reason;
        await appointment.save();

        // Notify admins of request
        await notifyAdmins({
            type: 'cancellation_request',
            title: 'Cancellation Requested',
            message: `Cancellation requested for "${appointment.title}". Reason: ${reason}`,
            relatedAppointment: appointment._id.toString(),
        });

        return NextResponse.json({
            message: 'Cancellation request submitted successfully',
            appointment,
        });
    } catch (error) {
        console.error('Cancellation request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
