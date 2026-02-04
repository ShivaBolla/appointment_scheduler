import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'booking_submitted',
                'booking_approved',
                'booking_rejected',
                'booking_cancelled',
                'reminder',
                'cancellation_request',
                'reschedule_request',
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedAppointment: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
        },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
