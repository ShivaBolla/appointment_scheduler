import mongoose, { Schema } from 'mongoose';

const AppointmentSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        type: {
            type: String,
            enum: ['online', 'offline'],
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
            enum: [
                15, 30, 60, 90, 120,
            ], // Allowed durations in minutes
        },
        status: {
            type: String,
            enum: [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'completed',
                'cancellation_requested',
                'reschedule_requested',
            ],
            default: 'pending',
        },
        meetingLink: {
            type: String,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        cancellationReason: {
            type: String,
            trim: true,
        },
        rescheduleRequestedTime: {
            type: Date,
        },
        rescheduleReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
AppointmentSchema.index({ userId: 1, status: 1 });
AppointmentSchema.index({ startTime: 1, endTime: 1 });
AppointmentSchema.index({ status: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

export default Appointment;
