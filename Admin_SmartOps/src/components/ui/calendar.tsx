import React from 'react';
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: SelectSingleEventHandler;
  className?: string;
  disabled?: (date: Date) => boolean;
  modifiers?: Record<string, (date: Date) => boolean>;
  modifiersStyles?: Record<string, React.CSSProperties>;
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className = '',
  disabled,
  modifiers,
  modifiersStyles,
  ...props
}: CalendarProps) {
  return (
    <div className={`p-3 ${className}`}>
      <DayPicker
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        locale={es}
        disabled={disabled}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        showOutsideDays={true}
        className="font-montserrat"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium text-smartops-dark",
          nav: "space-x-1 flex items-center",
          nav_button: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-smartops-gray bg-smartops-white hover:bg-smartops-gray/20 h-7 w-7 p-0",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-smartops-dark/60 rounded-md w-12 font-normal text-base",
          row: "flex w-full mt-2",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-smartops-blue/10 [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          day: "inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 h-12 w-12 p-0 font-normal aria-selected:bg-gradient-to-r aria-selected:from-smartops-blue aria-selected:to-smartops-purple aria-selected:text-white hover:bg-smartops-gray/20 hover:text-smartops-dark",
          day_selected: "bg-gradient-to-r from-smartops-blue to-smartops-purple text-white hover:bg-gradient-to-r hover:from-smartops-blue hover:to-smartops-purple hover:text-white focus:bg-gradient-to-r focus:from-smartops-blue focus:to-smartops-purple focus:text-white",
          day_today: "bg-smartops-gray/20 text-smartops-dark font-semibold",
          day_outside: "text-smartops-dark/30 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-smartops-dark/30 opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
} 