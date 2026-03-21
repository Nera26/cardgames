'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTableSchema, CreateTableDto, GameVariantDisplayNames, TurnTimeDisplayNames, BettingLimitDisplayNames } from '@poker/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faChevronDown, faChevronUp, faCog, faLock, faEye, faEyeSlash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface CreateTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [buyInTouched, setBuyInTouched] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        control,
        getValues,
    } = useForm<CreateTableDto>({
        resolver: zodResolver(CreateTableSchema) as any,
        defaultValues: {
            variant: 'TEXAS_HOLDEM',
            maxSeats: 9,
            smallBlind: 1,
            bigBlind: 2,
            minBuyIn: 80,
            maxBuyIn: 200,
            name: '',
            ante: 0,
            turnTime: 30,
            timeBank: 60,
            isStraddleAllowed: false,
            password: null,
            rakePercent: 0,
            rakeCap: 0,
            // Omaha Protocol
            holeCardsCount: 2,
            bettingLimit: 'NO_LIMIT',
        }
    });

    // Watch fields for conditional logic
    const bigBlind = useWatch({ control, name: 'bigBlind' });
    const minBuyIn = useWatch({ control, name: 'minBuyIn' });
    const maxBuyIn = useWatch({ control, name: 'maxBuyIn' });
    const variant = useWatch({ control, name: 'variant' });
    const holeCardsCount = useWatch({ control, name: 'holeCardsCount' });
    const maxSeats = useWatch({ control, name: 'maxSeats' });

    // Determine if Omaha
    const isOmaha = variant === 'OMAHA';

    // Deck Math Constraint: 5/6-card Omaha cannot have 9 players
    // 52 cards - 5 community = 47 cards available
    // 9 players × 6 cards = 54 cards needed > 47 available = IMPOSSIBLE
    const needsDeckConstraint = isOmaha && (holeCardsCount === 5 || holeCardsCount === 6);
    const isNineMaxDisabled = needsDeckConstraint;

    // Auto-switch to 6-Max if 9-Max selected and constraint kicks in
    useEffect(() => {
        if (isNineMaxDisabled && maxSeats === 9) {
            setValue('maxSeats', 6);
        }
    }, [isNineMaxDisabled, maxSeats, setValue]);

    // Auto-set Omaha defaults when switching variants
    useEffect(() => {
        if (isOmaha) {
            // Omaha defaults: 4 hole cards, Pot Limit
            if (holeCardsCount === 2) {
                setValue('holeCardsCount', 4);
            }
            setValue('bettingLimit', 'POT_LIMIT');
        } else {
            // Texas/AoF: 2 hole cards, No Limit
            setValue('holeCardsCount', 2);
            setValue('bettingLimit', 'NO_LIMIT');
        }
    }, [isOmaha, setValue, holeCardsCount]);

    // Calculate BB hints
    const minBBHint = bigBlind > 0 ? Math.round(bigBlind * 40) : 0;
    const maxBBHint = bigBlind > 0 ? Math.round(bigBlind * 100) : 0;

    // Smart Buy-In: Auto-calculate min/max based on Big Blind (only if untouched)
    useEffect(() => {
        if (bigBlind && bigBlind > 0 && !buyInTouched) {
            setValue('minBuyIn', minBBHint);
            setValue('maxBuyIn', maxBBHint);
        }
    }, [bigBlind, setValue, buyInTouched, minBBHint, maxBBHint]);

    // Check if buy-ins are invalid
    const buyInError = minBuyIn > maxBuyIn;

    const mutation = useMutation({
        mutationFn: async (data: CreateTableDto) => {
            const response = await api.post('/game/tables', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Table created successfully');
            reset();
            setShowAdvanced(false);
            setBuyInTouched(false);
            onSuccess();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create table');
        }
    });

    if (!isOpen) return null;

    const onSubmit = (data: CreateTableDto) => {
        mutation.mutate(data);
    };

    // Shared input classes using design system
    const inputBaseClasses = "w-full bg-surface border border-border-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all duration-200";
    const labelClasses = "block text-sm font-medium text-text-secondary mb-2";
    const errorClasses = "text-danger-red text-xs mt-1.5";

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl border border-border-dark overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header with Gold Accent */}
                <div className="relative px-6 py-5 border-b border-border-dark bg-gradient-to-r from-surface to-surface-hover">
                    {/* Gold accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-yellow to-transparent" />

                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-text-primary">Create New Table</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-danger-red/20 transition-all duration-200 flex items-center justify-center"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

                    {/* Table Name */}
                    <div>
                        <label className={labelClasses}>Table Name</label>
                        <input
                            {...register('name')}
                            className={inputBaseClasses}
                            placeholder="e.g. High Rollers Lounge"
                        />
                        {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
                    </div>

                    {/* Game Variant */}
                    <div>
                        <label className={labelClasses}>Game Type</label>
                        <select
                            {...register('variant')}
                            className={`${inputBaseClasses} cursor-pointer`}
                        >
                            {Object.entries(GameVariantDisplayNames).map(([value, label]) => (
                                <option key={value} value={value} className="bg-surface text-text-primary">{label}</option>
                            ))}
                        </select>
                        {errors.variant && <p className={errorClasses}>{errors.variant.message}</p>}
                    </div>

                    {/* Omaha: Hole Cards Selector (Conditional) */}
                    {isOmaha && (
                        <div className="animate-fade-in">
                            <label className={labelClasses}>
                                Hole Cards
                                <span className="text-xs text-accent-yellow ml-2">(PLO Variant)</span>
                            </label>
                            <div className="flex gap-3">
                                {[4, 5, 6].map((cards) => (
                                    <label key={cards} className="flex-1 cursor-pointer group">
                                        <input
                                            type="radio"
                                            value={cards}
                                            checked={holeCardsCount === cards}
                                            onChange={() => setValue('holeCardsCount', cards)}
                                            className="peer sr-only"
                                        />
                                        <div className="text-center py-3 rounded-xl border border-border-dark bg-surface text-text-secondary font-semibold transition-all duration-200
                                            peer-checked:bg-accent-yellow/10 peer-checked:border-accent-yellow peer-checked:text-accent-yellow peer-checked:shadow-[0_0_15px_rgba(255,215,0,0.15)]
                                            group-hover:border-text-secondary/30 group-hover:bg-surface-hover">
                                            PLO-{cards}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {/* Betting Limit Display (Omaha = Pot Limit) */}
                            <p className="text-xs text-text-secondary mt-2">
                                Betting: <span className="text-accent-green font-semibold">Pot Limit</span>
                            </p>
                        </div>
                    )}

                    {/* Max Seats - Premium Radio Buttons with Deck Math */}
                    <div>
                        <label className={labelClasses}>Max Seats</label>
                        <div className="flex gap-3">
                            {[4, 6, 9].map((seats) => {
                                const isDisabled = seats === 9 && isNineMaxDisabled;
                                return (
                                    <label
                                        key={seats}
                                        className={`flex-1 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}
                                    >
                                        <input
                                            type="radio"
                                            value={seats}
                                            {...register('maxSeats')}
                                            disabled={isDisabled}
                                            className="peer sr-only"
                                        />
                                        <div className={`text-center py-3 rounded-xl border border-border-dark bg-surface text-text-secondary font-semibold transition-all duration-200
                                            ${isDisabled
                                                ? 'bg-surface/50 text-text-secondary/50 cursor-not-allowed'
                                                : 'peer-checked:bg-accent-yellow/10 peer-checked:border-accent-yellow peer-checked:text-accent-yellow peer-checked:shadow-[0_0_15px_rgba(255,215,0,0.15)] group-hover:border-text-secondary/30 group-hover:bg-surface-hover'
                                            }`}>
                                            {seats}-Max
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        {/* Deck Math Warning */}
                        {isNineMaxDisabled && (
                            <p className="text-xs text-accent-yellow mt-2 flex items-center gap-1.5 animate-fade-in">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                9-Max unavailable for PLO-{holeCardsCount} (deck constraint)
                            </p>
                        )}
                        {errors.maxSeats && <p className={errorClasses}>{errors.maxSeats.message}</p>}
                    </div>

                    {/* Blinds Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Small Blind</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('smallBlind')}
                                    className={`${inputBaseClasses} pl-8`}
                                />
                            </div>
                            {errors.smallBlind && <p className={errorClasses}>{errors.smallBlind.message}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Big Blind</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('bigBlind')}
                                    className={`${inputBaseClasses} pl-8`}
                                />
                            </div>
                            {errors.bigBlind && <p className={errorClasses}>{errors.bigBlind.message}</p>}
                        </div>
                    </div>

                    {/* Buy-In Range Row - with Smart Hints */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                Min Buy-In
                                <span className="text-xs text-accent-yellow ml-2">(40 BB: ${minBBHint})</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold">$</span>
                                <input
                                    type="number"
                                    step="1"
                                    {...register('minBuyIn', {
                                        onChange: () => setBuyInTouched(true)
                                    })}
                                    className={`${inputBaseClasses} pl-8 ${buyInError ? 'border-danger-red focus:border-danger-red focus:ring-danger-red/50' : ''}`}
                                />
                            </div>
                            {errors.minBuyIn && <p className={errorClasses}>{errors.minBuyIn.message}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>
                                Max Buy-In
                                <span className="text-xs text-accent-yellow ml-2">(100 BB: ${maxBBHint})</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold">$</span>
                                <input
                                    type="number"
                                    step="1"
                                    {...register('maxBuyIn', {
                                        onChange: () => setBuyInTouched(true)
                                    })}
                                    className={`${inputBaseClasses} pl-8 ${buyInError ? 'border-danger-red focus:border-danger-red focus:ring-danger-red/50' : ''}`}
                                />
                            </div>
                            {errors.maxBuyIn && <p className={errorClasses}>{errors.maxBuyIn.message}</p>}
                            {buyInError && <p className={errorClasses}>Max must be ≥ Min</p>}
                        </div>
                    </div>

                    {/* Advanced Settings Accordion */}
                    <div className="border-t border-border-dark pt-5">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all duration-200 group"
                        >
                            <span className="flex items-center gap-3 text-sm font-semibold">
                                <FontAwesomeIcon icon={faCog} className="text-accent-yellow group-hover:animate-pulse" />
                                Advanced Options
                            </span>
                            <FontAwesomeIcon
                                icon={showAdvanced ? faChevronUp : faChevronDown}
                                className="text-xs transition-transform duration-200"
                            />
                        </button>

                        {/* Advanced Settings Content */}
                        {showAdvanced && (
                            <div className="mt-4 space-y-5 p-5 bg-background/50 rounded-xl border border-border-dark animate-fade-in">

                                {/* Game Pace */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Game Pace</label>
                                    <select
                                        {...register('turnTime')}
                                        className={`${inputBaseClasses} py-2.5 text-sm`}
                                    >
                                        {Object.entries(TurnTimeDisplayNames).map(([value, label]) => (
                                            <option key={value} value={value} className="bg-surface">{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time Bank */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                                        Time Bank
                                        <span className="text-xs text-accent-yellow ml-2">(Reserve seconds)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="10"
                                            min="0"
                                            {...register('timeBank')}
                                            className={`${inputBaseClasses} py-2.5 text-sm pr-10`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">sec</span>
                                    </div>
                                </div>

                                {/* Rake Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Rake %</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                {...register('rakePercent')}
                                                className={`${inputBaseClasses} py-2.5 text-sm pr-10`}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Rake Cap</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold text-sm">$</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                {...register('rakeCap')}
                                                className={`${inputBaseClasses} py-2.5 text-sm pl-8`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Ante */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Ante</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-yellow font-semibold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('ante')}
                                            className={`${inputBaseClasses} py-2.5 text-sm pl-8`}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Straddle Toggle - Premium Style */}
                                <div className="flex items-center justify-between py-2 px-4 bg-surface rounded-xl border border-border-dark">
                                    <label className="text-sm font-medium text-text-secondary">Allow Straddle</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register('isStraddleAllowed')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-surface-hover rounded-full peer 
                                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                                            after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                                            after:bg-text-secondary after:rounded-full after:h-5 after:w-5 after:transition-all 
                                            peer-checked:bg-accent-green peer-checked:after:bg-white
                                            peer-focus:ring-2 peer-focus:ring-accent-green/30" />
                                    </label>
                                </div>

                                {/* Password (Private Table) */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                                        <FontAwesomeIcon icon={faLock} className="mr-2 text-accent-yellow" />
                                        Private Table Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password')}
                                            className={`${inputBaseClasses} py-2.5 text-sm pr-12`}
                                            placeholder="Leave empty for public"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hidden fields for Omaha Protocol */}
                    <input type="hidden" {...register('holeCardsCount')} />
                    <input type="hidden" {...register('bettingLimit')} />

                    {/* Footer Actions */}
                    <div className="pt-5 flex justify-end gap-3 border-t border-border-dark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || buyInError}
                            className="px-8 py-3 bg-gold-gradient text-background rounded-xl font-bold shadow-lg shadow-accent-yellow/20 
                                hover:shadow-accent-yellow/40 hover:scale-[1.02] transition-all duration-200 
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-accent-yellow/20
                                flex items-center gap-2"
                        >
                            {mutation.isPending && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                            Create Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
