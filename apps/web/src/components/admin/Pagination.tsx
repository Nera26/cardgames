'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
    showingFrom?: number;
    showingTo?: number;
    totalItems?: number;
    itemName?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showingFrom,
    showingTo,
    totalItems,
    itemName = 'items',
}: PaginationProps) {
    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-between mt-6">
            {showingFrom && showingTo && totalItems ? (
                <p className="text-sm text-text-secondary">
                    Showing {showingFrom} to {showingTo} of {totalItems} {itemName}
                </p>
            ) : (
                <div />
            )}
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-card-bg hover:bg-hover-bg border border-border-dark px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange?.(page)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${page === currentPage
                                ? 'bg-accent-yellow text-black'
                                : 'bg-card-bg hover:bg-hover-bg border border-border-dark'
                            }`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-card-bg hover:bg-hover-bg border border-border-dark px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
