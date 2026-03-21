export const BETTING_PRESETS = [
    { label: 'Min', value: 'min' },
    { label: '50%', value: 0.5 },
    { label: 'Pot', value: 'pot' },
    { label: 'All-In', value: 'all-in' },
] as const;

export const GAME_CONSTANTS = {
    DEFAULT_MIN_RAISE: 40,
    DEFAULT_CALL_AMOUNT: 20,
    ACTION_TIMEOUT_MS: 300,
};
