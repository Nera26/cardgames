import React, { useState, useEffect, useRef } from 'react';
import { UserResponse } from '@poker/shared';
import { AvatarSelector } from './AvatarSelector';
import { AVATARS, AvatarId, getAvatarUrl } from '@/config/avatars';
import { convertToWebP } from '@/utils/imageCompressor';
import api from '@/lib/api';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Partial<UserResponse>;
    onSave: (data: any) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        avatarUrl: '',
        avatarId: 'avatar_1',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        iban: '',
    });

    // Custom avatar upload state
    const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || '',
                avatarUrl: user.avatarUrl || '',
                avatarId: user.avatarId || 'avatar_1',
                bankName: user.bankName || '',
                accountNumber: user.accountNumber || '',
                accountHolderName: user.accountHolderName || '',
                iban: user.iban || '',
            });
            setWebpBlob(null);
            setPreviewUrl(null);
            setUploadError(null);
        }
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle file selection → compress to WebP
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file');
            return;
        }

        setIsCompressing(true);
        setUploadError(null);

        try {
            const blob = await convertToWebP(file);

            // Check compressed size (500KB max)
            if (blob.size > 500_000) {
                setUploadError('Image too large even after compression. Try a smaller image.');
                setIsCompressing(false);
                return;
            }

            setWebpBlob(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (err) {
            console.error('Compression failed:', err);
            setUploadError('Failed to process image. Try a different file.');
        } finally {
            setIsCompressing(false);
        }
    };

    // Remove custom avatar, revert to persona
    const clearCustomAvatar = () => {
        setWebpBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setUploadError(null);
    };

    // Get the currently displayed avatar
    const displayAvatar = previewUrl || (formData.avatarUrl?.startsWith('/api/') || formData.avatarUrl?.startsWith('http')
        ? formData.avatarUrl
        : null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Step 1: Upload custom avatar if one is staged
            if (webpBlob) {
                const fd = new FormData();
                fd.append('avatar', webpBlob, 'avatar.webp');
                await api.post('/users/me/avatar', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            // Step 2: Save other profile fields
            const submitData = {
                ...formData,
                avatarUrl: webpBlob ? undefined : formData.avatarUrl, // Don't overwrite if just uploaded
            };
            await onSave(submitData);
        } catch (err) {
            console.error('Failed to save profile:', err);
            setUploadError('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 fade-in-modal">
            <div className="bg-card-bg rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border-dark flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-danger-red">
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* ══════ Avatar Upload Section ══════ */}
                    <div className="space-y-4">
                        <label className="block text-subtext text-text-secondary mb-2">Profile Avatar</label>

                        <div className="flex items-center gap-6">
                            {/* Avatar Preview Circle */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border-dark bg-surface">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={displayAvatar || getAvatarUrl(formData.avatarId)}
                                        alt="Avatar preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {isCompressing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                        <div className="w-6 h-6 border-2 border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp, image/gif"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2.5 rounded-xl bg-surface border border-border-dark/30 text-text-secondary hover:text-accent-yellow hover:border-accent-yellow/30 transition-all text-sm font-semibold flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-camera text-xs"></i>
                                    Upload Custom Photo
                                </button>

                                {webpBlob && (
                                    <button
                                        type="button"
                                        onClick={clearCustomAvatar}
                                        className="px-3 py-1.5 text-xs text-danger-red/70 hover:text-danger-red transition-colors"
                                    >
                                        <i className="fa-solid fa-trash-can mr-1"></i>
                                        Remove
                                    </button>
                                )}

                                <p className="text-text-secondary/50 text-[10px]">
                                    Auto-cropped to 256×256 WebP • Max 500KB
                                </p>

                                {uploadError && (
                                    <p className="text-danger-red text-xs">{uploadError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══════ Persona Grid Fallback ══════ */}
                    {!webpBlob && !displayAvatar && (
                        <div className="space-y-2 pt-2">
                            <label className="block text-subtext text-text-secondary/60 text-xs">Or choose a persona</label>
                            <AvatarSelector
                                currentAvatarId={formData.avatarId}
                                onSelect={(id) => setFormData(prev => ({ ...prev, avatarId: id }))}
                            />
                        </div>
                    )}

                    {/* Basic Info Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-dark">
                        {/* Username */}
                        <div>
                            <label className="block text-subtext text-text-secondary mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Email */}
                        <div>
                            <label className="block text-subtext text-text-secondary mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                            />
                        </div>
                    </div>

                    {/* Bank Details Section */}
                    <div className="border-t border-border-dark pt-4">
                        <h3 className="text-lg font-bold text-accent-blue mb-4">Bank Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bank Name */}
                            <div>
                                <label className="block text-subtext text-text-secondary mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    name="bankName"
                                    placeholder="e.g. Chase, HSBC"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                                />
                            </div>

                            {/* Account Holder Name */}
                            <div>
                                <label className="block text-subtext text-text-secondary mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    name="accountHolderName"
                                    placeholder="e.g. John Doe"
                                    value={formData.accountHolderName}
                                    onChange={handleChange}
                                    className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                                />
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block text-subtext text-text-secondary mb-1">Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    placeholder="Account Number"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                                />
                            </div>

                            {/* IBAN */}
                            <div>
                                <label className="block text-subtext text-text-secondary mb-1">IBAN / SWIFT</label>
                                <input
                                    type="text"
                                    name="iban"
                                    placeholder="DE89..."
                                    value={formData.iban}
                                    onChange={handleChange}
                                    className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow placeholder-text-secondary text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="border-t border-border-dark pt-4">
                        <label className="block text-subtext text-text-secondary mb-1">Bio (200 characters max)</label>
                        <textarea
                            name="bio"
                            maxLength={200}
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow resize-none h-24"
                        ></textarea>
                        <div className="text-right text-xs text-text-secondary mt-1">{formData.bio.length}/200</div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 text-text-secondary hover:text-accent-yellow"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isCompressing}
                            className="py-2 px-6 bg-accent-green text-white font-bold rounded-xl hover-glow-green transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
