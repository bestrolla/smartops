import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg shadow border border-smartops-gray bg-white">
      <table
        className={`min-w-full divide-y divide-smartops-gray ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-smartops-gray/40 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`bg-white divide-y divide-smartops-gray/30 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-smartops-gray/20 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}

export function TableHeaderCell({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-smartops-dark/60 font-montserrat ${className}`} {...props}>
      {children}
    </th>
  );
} 