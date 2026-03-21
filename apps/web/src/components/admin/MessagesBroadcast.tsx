'use client';

import { useState } from 'react';

interface Message {
    id: string;
    username: string;
    preview: string;
    status: 'unread' | 'read';
}

const messages: Message[] = [
    { id: '1', username: 'Mike_P', preview: 'Need help with withdrawal...', status: 'unread' },
    { id: '2', username: 'Sarah_K', preview: 'Tournament question...', status: 'read' },
];

export default function MessagesBroadcast() {
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const handleSendBroadcast = () => {
        if (broadcastMessage.trim()) {
            console.log('Broadcasting:', broadcastMessage);
            setBroadcastMessage('');
            alert('Broadcast sent to all players!');
        }
    };

    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Messages &amp; Broadcast</h3>
            <div className="space-y-3">
                {messages.map((message) => (
                    <div key={message.id} className="p-3 bg-primary-bg rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className={`w-2 h-2 rounded-full ${message.status === 'unread' ? 'bg-accent-yellow' : 'bg-accent-green'
                                    }`}
                            />
                            <span className="text-sm font-semibold">{message.username}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{message.preview}</p>
                        <button className="text-accent-blue text-xs mt-1 hover:underline">
                            Reply
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 space-y-2">
                <input
                    type="text"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Broadcast message..."
                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                />
                <button
                    onClick={handleSendBroadcast}
                    className="w-full bg-accent-yellow hover:bg-yellow-500 text-black py-2 rounded-xl font-semibold transition-colors"
                >
                    Send Broadcast
                </button>
            </div>
        </div>
    );
}
