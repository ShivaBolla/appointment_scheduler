const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: { type: String, enum: ['user', 'sub-admin', 'super-admin'], default: 'user' }
});

const NotificationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    title: String,
    message: String,
    read: Boolean,
    createdAt: Date
});

const User = mongoose.model('User', UserSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

const fs = require('fs');

async function checkData() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        let output = '';

        output += '\n--- USERS ---\n';
        const users = await User.find({}, 'name email role');
        output += JSON.stringify(users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })), null, 2);

        output += '\n\n--- NOTIFICATIONS ---\n';
        const notifications = await Notification.find({}, 'type title userId read createdAt').sort({ createdAt: -1 });
        if (notifications.length === 0) {
            output += 'No notifications found.';
        } else {
            output += JSON.stringify(notifications.map(n => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title,
                userId: n.userId.toString(),
                read: n.read
            })), null, 2);
        }

        fs.writeFileSync('db_dump.txt', output);
        console.log('Data written to db_dump.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
