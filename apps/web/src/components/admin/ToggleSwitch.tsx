'use client';

interface ToggleSwitchProps {
    isOn: boolean;
    onToggle: (value: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export default function ToggleSwitch({
    isOn,
    onToggle,
    label,
    disabled = false,
}: ToggleSwitchProps) {
    return (
        <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={isOn}
                    onChange={(e) => !disabled && onToggle(e.target.checked)}
                    disabled={disabled}
                />
                <div
                    className={`block w-12 h-6 rounded-full transition-colors ${isOn ? 'bg-accent-green' : 'bg-border-dark'
                        }`}
                />
                <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0'
                        }`}
                />
            </div>
            {label && <span className="text-sm font-semibold">{label}</span>}
        </label>
    );
}
