import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';

export async function PATCH(
    request,
    { params }
) {
    try {
        const resolvedParams = await params;
        await dbConnect();

        const { id } = resolvedParams;
        const { action } = await request.json(); // action: 'confirm_cancel' | 'reject_cancel' | 'confirm_reschedule' | 'reject_reschedule'

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        let notificationMessage = '';
        let notificationTitle = '';
        let notificationType = '';

        if (action === 'confirm_cancel') {
            if (appointment.status !== 'cancellation_requested') {
                return NextResponse.json({ error: 'Invalid status for this action' }, { status: 400 });
            }
            appointment.status = 'cancelled';
            notificationTitle = 'Cancellation Approved';
            notificationMessage = `Your request to cancel "${appointment.title}" has been approved.`;
            notificationType = 'booking_cancelled';
        }
        else if (action === 'reject_cancel') {
            if (appointment.status !== 'cancellation_requested') {
                return NextResponse.json({ error: 'Invalid status for this action' }, { status: 400 });
            }
            appointment.status = 'approved'; // Revert to approved
            notificationTitle = 'Cancellation Rejected';
            notificationMessage = `Your request to cancel "${appointment.title}" has been rejected. The appointment is still scheduled.`;
            notificationType = 'reminder';
        }
        else if (action === 'confirm_reschedule') {
            if (appointment.status !== 'reschedule_requested') {
                return NextResponse.json({ error: 'Invalid status for this action' }, { status: 400 });
            }
            if (!appointment.rescheduleRequestedTime) {
                return NextResponse.json({ error: 'No requested time found' }, { status: 400 });
            }

            // Update start and end time
            // Calculate new end time based on duration
            const newStart = new Date(appointment.rescheduleRequestedTime);
            const newEnd = new Date(newStart.getTime() + appointment.duration * 60000);

            appointment.startTime = newStart;
            appointment.endTime = newEnd;
            appointment.status = 'approved';

            // Clear request fields
            appointment.rescheduleRequestedTime = undefined;
            appointment.rescheduleReason = undefined;

            notificationTitle = 'Reschedule Approved';
            notificationMessage = `Your request to reschedule "${appointment.title}" has been approved. New time: ${newStart.toLocaleString()}`;
            notificationType = 'booking_approved';
        }
        else if (action === 'reject_reschedule') {
            if (appointment.status !== 'reschedule_requested') {
                return NextResponse.json({ error: 'Invalid status for this action' }, { status: 400 });
            }
            appointment.status = 'approved'; // Revert to approved (keep old time)

            // Clear request fields
            appointment.rescheduleRequestedTime = undefined;
            appointment.rescheduleReason = undefined;

            notificationTitle = 'Reschedule Rejected';
            notificationMessage = `Your request to reschedule "${appointment.title}" has been rejected. The appointment remains at the original time.`;
            notificationType = 'reminder';
        }
        else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await appointment.save();

        // Notify user
        await Notification.create({
            userId: appointment.userId,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            relatedAppointment: appointment._id,
        });

        return NextResponse.json({
            message: 'Request processed successfully',
            appointment,
        });
    } catch (error) {
        console.error('Handle request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
