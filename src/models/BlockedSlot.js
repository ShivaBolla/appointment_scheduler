import mongoose, { Schema } from 'mongoose';

const BlockedSlotSchema = new Schema(
    {
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

BlockedSlotSchema.index({ startTime: 1, endTime: 1 });

const BlockedSlot = mongoose.models.BlockedSlot || mongoose.model('BlockedSlot', BlockedSlotSchema);

export default BlockedSlot;
