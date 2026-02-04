'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const DURATIONS = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
];

export default function BookAppointmentPage() {
    const { user, token } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Validation state
    const [formErrors, setFormErrors] = useState({
        title: '',
        name: '',
        email: '',
        phone: '',
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'online',
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
    });

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (selectedDate && selectedDuration) {
            fetchSlots();
        }
    }, [selectedDate, selectedDuration]);

    const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const response = await fetch(
                `/api/slots?date=${selectedDate}&duration=${selectedDuration}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            setSlots(data.slots || []);
        } catch (err) {
            setError('Failed to load available slots');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const validateStep2 = () => {
        let isValid = true;
        const errors = { title: '', name: '', email: '', phone: '' };

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
            isValid = false;
        } else if (formData.title.length < 3) {
            errors.title = 'Title must be at least 3 characters';
            isValid = false;
        }

        setFormErrors(prev => ({ ...prev, ...errors }));
        return isValid;
    };

    const validateStep3 = () => {
        let isValid = true;
        const errors = { ...formErrors, name: '', email: '', phone: '' };

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
            isValid = false;
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
            isValid = false;
        }

        if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
            errors.phone = 'Invalid phone number format';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleNextStep = () => {
        if (step === 2) {
            if (validateStep2()) setStep(3);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !validateStep3()) return;

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    startTime: selectedSlot.startTime,
                    endTime: selectedSlot.endTime,
                    duration: selectedDuration,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to book appointment');
            }

            router.push('/dashboard/user');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to book appointment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-2">Book an Appointment</h1>
            <p className="text-muted-foreground mb-8">Select your preferred date and time</p>

            {/* Progress Steps */}
            <div className="flex items-center mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all border ${step >= s
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border'
                                }`}
                        >
                            {s}
                        </div>
                        {s < 3 && (
                            <div className={`w-16 h-px mx-2 ${step > s ? 'bg-primary' : 'bg-border'}`} />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm mb-6 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Step 1: Select Date & Duration */}
            {step === 1 && (
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Select Date & Duration</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={today}
                                className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Duration</label>
                            <select
                                value={selectedDuration}
                                onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                {DURATIONS.map((d) => (
                                    <option key={d.value} value={d.value}>
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-muted-foreground mb-3">Available Time Slots</label>
                            {isLoadingSlots ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 bg-muted/10 rounded-xl">No slots available for this date</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {slots.map((slot, index) => (
                                        <button
                                            key={index}
                                            onClick={() => slot.available && setSelectedSlot(slot)}
                                            disabled={!slot.available}
                                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedSlot?.startTime === slot.startTime
                                                ? 'bg-primary text-primary-foreground border-primary shadow-md transform scale-105'
                                                : slot.available
                                                    ? 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/10'
                                                    : 'bg-muted/20 text-muted-foreground border-transparent cursor-not-allowed opacity-50'
                                                }`}
                                        >
                                            {formatTime(slot.startTime)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleNextStep}
                                disabled={!selectedSlot}
                                className="mt-8 w-full py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Appointment Details */}
            {step === 2 && (
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Appointment Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                                }}
                                placeholder="e.g., Consultation, Meeting"
                                className={`w-full px-4 py-3 bg-muted/20 border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${formErrors.title ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                                    }`}
                                required
                            />
                            {formErrors.title && <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of what you'd like to discuss..."
                                rows={3}
                                className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Appointment Type</label>
                            <div className="flex space-x-4">
                                {['online', 'offline'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-all border ${formData.type === type
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background text-muted-foreground border-border hover:bg-muted/10'
                                            }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4 mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3.5 px-4 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNextStep}
                            className="flex-1 py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Contact Info & Confirm */}
            {step === 3 && (
                <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Confirm Booking</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Your Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                                }}
                                className={`w-full px-4 py-3 bg-muted/20 border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                                    }`}
                                required
                            />
                            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                                }}
                                className={`w-full px-4 py-3 bg-muted/20 border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                                    }`}
                                required
                            />
                            {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Phone (optional)</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => {
                                    setFormData({ ...formData, phone: e.target.value });
                                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                                }}
                                className={`w-full px-4 py-3 bg-muted/20 border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                                    }`}
                            />
                            {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
                        </div>

                        {/* Summary */}
                        <div className="mt-6 p-4 bg-muted/20 rounded-xl border border-border">
                            <h3 className="text-sm font-medium text-foreground mb-3">Booking Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="text-foreground font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="text-foreground font-medium">{selectedSlot && `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="text-foreground font-medium">{selectedDuration} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="text-foreground font-medium capitalize">{formData.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Title</span>
                                    <span className="text-foreground font-medium">{formData.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4 mt-8">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3.5 px-4 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm"
                        >
                            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
