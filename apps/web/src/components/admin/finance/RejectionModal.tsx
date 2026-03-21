import React, { useState } from 'react';
import AdminModal from '@/components/admin/AdminModal';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export default function RejectionModal({ isOpen, onClose, onConfirm }: RejectionModalProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        onConfirm(reason);
        setReason(''); // Reset after confirm
        onClose();
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <AdminModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Rejection Reason"
            maxWidth="md"
        >
            <div className="space-y-4">
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm h-20 focus:border-accent-yellow focus:outline-none resize-none"
                />
                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-danger-red hover:bg-red-600 py-2 rounded-xl font-semibold"
                    >
                        Confirm Rejection
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 bg-hover-bg hover:bg-gray-600 py-2 rounded-xl font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </AdminModal>
    );
}
