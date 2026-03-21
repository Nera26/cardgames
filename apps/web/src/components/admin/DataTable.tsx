'use client';

import { ReactNode } from 'react';

export interface Column<T> {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T, index: number) => string | number;
    emptyMessage?: string;
}

export default function DataTable<T extends object>({
    columns,
    data,
    keyExtractor,
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    const getAlignClass = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    return (
        <div className="bg-card-bg rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid gap-4 p-4 border-b border-border-dark bg-hover-bg"
                        style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}
                    >
                        {columns.map((column) => (
                            <div
                                key={column.key}
                                className={`text-sm font-semibold text-text-secondary ${getAlignClass(column.align)}`}
                            >
                                {column.header}
                            </div>
                        ))}
                    </div>

                    {/* Data Rows */}
                    {data.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">
                            {emptyMessage}
                        </div>
                    ) : (
                        data.map((row, index) => (
                            <div
                                key={keyExtractor(row, index)}
                                className="grid gap-4 p-4 border-b border-border-dark hover:bg-hover-bg transition-all items-center"
                                style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}
                            >
                                {columns.map((column) => (
                                    <div
                                        key={column.key}
                                        className={getAlignClass(column.align)}
                                    >
                                        {column.render
                                            ? column.render(row, index)
                                            : String((row as Record<string, unknown>)[column.key] ?? '')
                                        }
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
