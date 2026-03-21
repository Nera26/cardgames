'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeadset,
    faUser,
    faPaperPlane,
    faArrowLeft,
    faCircle,
    faClock,
    faExclamationCircle,
    faCheckCircle,
    faSearch,
    faEllipsisV,
    faImage,
    faPaperclip
} from '@fortawesome/free-solid-svg-icons';

interface Message {
    id: string;
    sender: 'user' | 'support';
    text: string;
    time: string;
}

interface Ticket {
    id: string;
    user: string;
    avatar: string;
    subject: string;
    status: 'open' | 'pending' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    lastMessage: string;
    time: string;
    unread: number;
    messages: Message[];
}

// Mock support tickets data
const mockSupportTickets: Ticket[] = [
    {
        id: 'TICKET-001',
        user: 'Mike_P',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
        subject: 'Withdrawal not processed',
        status: 'open',
        priority: 'high',
        lastMessage: 'I submitted a withdrawal 3 days ago but still pending',
        time: '5 min ago',
        unread: 2,
        messages: [
            { id: 'm1', sender: 'user', text: 'Hello, I need help with my withdrawal request.', time: '10:30 AM' },
            { id: 'm2', sender: 'support', text: 'Hi Mike! I\'d be happy to help you with your withdrawal. Could you provide the transaction ID?', time: '10:32 AM' },
            { id: 'm3', sender: 'user', text: 'Sure, the transaction ID is TXN-789456. I submitted a withdrawal 3 days ago but still pending.', time: '10:35 AM' },
            { id: 'm4', sender: 'user', text: 'Can you please check what\'s causing the delay?', time: '10:35 AM' },
        ]
    },
    {
        id: 'TICKET-002',
        user: 'Sarah_K',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        subject: 'Tournament registration issue',
        status: 'pending',
        priority: 'medium',
        lastMessage: 'I can\'t register for the Sunday Million',
        time: '32 min ago',
        unread: 0,
        messages: [
            { id: 'm1', sender: 'user', text: 'I\'m trying to register for the Sunday Million but getting an error.', time: '9:45 AM' },
            { id: 'm2', sender: 'support', text: 'I apologize for the inconvenience. What error message are you seeing?', time: '9:48 AM' },
            { id: 'm3', sender: 'user', text: 'It says "Insufficient balance" but I have $150 in my account and the buy-in is only $100.', time: '9:50 AM' },
            { id: 'm4', sender: 'support', text: 'I see. Let me check your account. It appears $50 is currently locked in a pending deposit bonus. You need $100 unrestricted balance to register.', time: '9:55 AM' },
        ]
    },
    {
        id: 'TICKET-003',
        user: 'John_D',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
        subject: 'Account verification',
        status: 'resolved',
        priority: 'low',
        lastMessage: 'Documents approved, thank you!',
        time: '2 hours ago',
        unread: 0,
        messages: [
            { id: 'm1', sender: 'user', text: 'How do I verify my account?', time: '8:00 AM' },
            { id: 'm2', sender: 'support', text: 'You can submit verification documents through Settings > Verification. We need a government-issued ID and proof of address.', time: '8:05 AM' },
            { id: 'm3', sender: 'user', text: 'I\'ve uploaded my passport and utility bill. How long does verification take?', time: '8:30 AM' },
            { id: 'm4', sender: 'support', text: 'Verification typically takes 24-48 hours. I\'ve prioritized your request - you should receive confirmation within a few hours.', time: '8:35 AM' },
            { id: 'm5', sender: 'user', text: 'Documents approved, thank you!', time: '10:00 AM' },
        ]
    },
    {
        id: 'TICKET-004',
        user: 'Alex_R',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
        subject: 'Bonus not credited',
        status: 'open',
        priority: 'high',
        lastMessage: 'My welcome bonus is missing',
        time: '1 hour ago',
        unread: 1,
        messages: [
            { id: 'm1', sender: 'user', text: 'I made my first deposit of $100 but didn\'t receive the welcome bonus.', time: '9:00 AM' },
            { id: 'm2', sender: 'support', text: 'I\'ll look into this for you right away. Did you use a promo code during deposit?', time: '9:05 AM' },
            { id: 'm3', sender: 'user', text: 'No, I didn\'t know I needed one. The website said first deposit gets 100% match automatically.', time: '9:10 AM' },
        ]
    },
    {
        id: 'TICKET-005',
        user: 'Lisa_M',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
        subject: 'Connection issues during game',
        status: 'pending',
        priority: 'medium',
        lastMessage: 'Lost connection and my hand was folded',
        time: '3 hours ago',
        unread: 0,
        messages: [
            { id: 'm1', sender: 'user', text: 'I was in the middle of a tournament and got disconnected. When I came back, my pocket aces were folded!', time: '7:00 AM' },
            { id: 'm2', sender: 'support', text: 'I\'m sorry to hear that. I can see you were in the $50 GTD at that time. Let me check the hand history.', time: '7:10 AM' },
            { id: 'm3', sender: 'user', text: 'Yes, I had AA in position with a raise in front of me. Perfect spot and I lost it due to your servers!', time: '7:15 AM' },
            { id: 'm4', sender: 'support', text: 'I\'ve reviewed the logs and can confirm there was a brief server issue. I\'ll escalate this for a potential buy-in refund.', time: '7:30 AM' },
        ]
    },
];

export default function SupportPage() {
    const [tickets, setTickets] = useState(mockSupportTickets);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
    const [showMobileChat, setShowMobileChat] = useState(false);

    const filteredTickets = tickets.filter(ticket => {
        if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
        if (searchTerm && !ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const handleSelectTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowMobileChat(true);
        // Mark as read
        setTickets(prev => prev.map(t =>
            t.id === ticket.id ? { ...t, unread: 0 } : t
        ));
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedTicket) return;

        const message: Message = {
            id: `m${Date.now()}`,
            sender: 'support',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setTickets(prev => prev.map(t =>
            t.id === selectedTicket.id
                ? { ...t, messages: [...t.messages, message], lastMessage: newMessage, time: 'Just now' }
                : t
        ));
        setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
        setNewMessage('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'text-accent-green bg-accent-green/20';
            case 'pending': return 'text-accent-yellow bg-accent-yellow/20';
            case 'resolved': return 'text-text-secondary bg-hover-bg';
            default: return 'text-text-secondary bg-hover-bg';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-danger-red';
            case 'medium': return 'text-accent-yellow';
            default: return 'text-accent-green';
        }
    };

    const openTickets = tickets.filter(t => t.status === 'open').length;
    const pendingTickets = tickets.filter(t => t.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Support System</h2>
                    <p className="text-text-secondary">Manage customer tickets and conversations</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-accent-green/20 text-accent-green px-3 py-1 rounded-xl text-sm">
                        <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                        {openTickets} Open
                    </div>
                    <div className="flex items-center gap-2 bg-accent-yellow/20 text-accent-yellow px-3 py-1 rounded-xl text-sm">
                        <span className="w-2 h-2 bg-accent-yellow rounded-full" />
                        {pendingTickets} Pending
                    </div>
                </div>
            </section>

            {/* Master-Detail Layout */}
            <section className="bg-card-bg rounded-2xl shadow-lg overflow-hidden min-h-[600px] flex">
                {/* Ticket List (Left) */}
                <div className={`w-full lg:w-1/3 border-r border-border-dark flex flex-col ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-border-dark space-y-3">
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-primary-bg border border-border-dark rounded-xl pl-10 pr-4 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'open', 'pending', 'resolved'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${statusFilter === status
                                            ? 'bg-accent-blue text-white'
                                            : 'bg-hover-bg text-text-secondary'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredTickets.map((ticket) => (
                            <button
                                key={ticket.id}
                                onClick={() => handleSelectTicket(ticket)}
                                className={`w-full p-4 border-b border-border-dark hover:bg-hover-bg transition-colors text-left ${selectedTicket?.id === ticket.id ? 'bg-hover-bg' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <img src={ticket.avatar} alt="" className="w-10 h-10 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{ticket.user}</span>
                                            <span className="text-text-secondary text-xs">{ticket.time}</span>
                                        </div>
                                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                                        <p className="text-text-secondary text-xs truncate">{ticket.lastMessage}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-xs capitalize ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                                                {ticket.priority}
                                            </span>
                                            {ticket.unread > 0 && (
                                                <span className="ml-auto bg-accent-blue text-white text-xs px-2 py-0.5 rounded-full">
                                                    {ticket.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat View (Right) */}
                <div className={`flex-1 flex flex-col ${!showMobileChat && !selectedTicket ? 'hidden lg:flex' : ''} ${showMobileChat ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border-dark flex items-center gap-3">
                                <button
                                    onClick={() => setShowMobileChat(false)}
                                    className="lg:hidden text-text-secondary hover:text-white"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                </button>
                                <img src={selectedTicket.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-semibold">{selectedTicket.user}</p>
                                    <p className="text-text-secondary text-sm">{selectedTicket.id} • {selectedTicket.subject}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded text-xs capitalize ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                    <button className="text-text-secondary hover:text-white">
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedTicket.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'support' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'support'
                                                ? 'bg-accent-blue text-white rounded-br-none'
                                                : 'bg-hover-bg rounded-bl-none'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-xs mt-1 ${msg.sender === 'support' ? 'text-white/70' : 'text-text-secondary'}`}>
                                                {msg.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-border-dark">
                                <div className="flex items-center gap-3">
                                    <button className="text-text-secondary hover:text-accent-blue transition-colors">
                                        <FontAwesomeIcon icon={faPaperclip} />
                                    </button>
                                    <button className="text-text-secondary hover:text-accent-blue transition-colors">
                                        <FontAwesomeIcon icon={faImage} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-primary-bg border border-border-dark rounded-xl px-4 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="bg-accent-blue hover:shadow-[0_0_20px_rgba(0,123,255,0.3)] disabled:opacity-50 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-text-secondary">
                                <FontAwesomeIcon icon={faHeadset} className="text-6xl mb-4" />
                                <p className="text-lg font-semibold">Select a ticket</p>
                                <p className="text-sm">Choose a conversation from the list to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
