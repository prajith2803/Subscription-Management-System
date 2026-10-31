import React from 'react';
import { cn } from '../../utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found',
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p className="text-sm">Loading records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-4 py-3 font-semibold text-xs uppercase tracking-wider', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'hover:bg-slate-50/80 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={cn('px-4 py-3 text-slate-700', col.className)}>
                  {col.cell ? col.cell(row) : (row as any)[col.accessorKey!]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

