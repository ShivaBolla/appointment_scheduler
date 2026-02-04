import User from '@/models/User';
import Notification from '@/models/Notification';

export async function notifyAdmins({
    type,
    title,
    message,
    relatedAppointment,
}) {
    try {
        const admins = await User.find({ role: { $in: ['sub-admin', 'super-admin'] } });

        const notifications = admins.map(admin => ({
            userId: admin._id,
            type,
            title,
            message,
            relatedAppointment,
            read: false,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Failed to notify admins:', error);
    }
}
