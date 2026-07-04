import { useState, useEffect, useRef } from 'react';

interface DateTimePickerProps {
  value: string; // ISO string "YYYY-MM-DDTHH:mm:ss" o vacío
  onChange: (isoString: string) => void;
  label?: string;
  required?: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 30];

const pad = (n: number) => String(n).padStart(2, '0');

export default function DateTimePicker({ value, onChange, label, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  const parseValue = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const initialDate = parseValue(value);

  // Internal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [viewMonth, setViewMonth] = useState<number>(initialDate ? initialDate.getMonth() : new Date().getMonth());
  const [viewYear, setViewYear] = useState<number>(initialDate ? initialDate.getFullYear() : new Date().getFullYear());

  const initHour24 = initialDate ? initialDate.getHours() : 0;
  const initMinute = initialDate ? (initialDate.getMinutes() >= 30 ? 30 : 0) : 0;

  const [selectedHour, setSelectedHour] = useState<number>(initHour24);
  const [selectedMinute, setSelectedMinute] = useState<number>(initMinute);

  // Sync internal state if value prop changes
  useEffect(() => {
    const d = parseValue(value);
    if (d) {
      setSelectedDate(d);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes() >= 30 ? 30 : 0);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateDateTime = (
    date: Date | null,
    hour: number,
    minute: number
  ) => {
    if (!date) {
      onChange('');
      return;
    }
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0);
    
    // Format to ISO without Z to preserve local time: YYYY-MM-DDTHH:mm:ss
    const isoString = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(hour)}:${pad(minute)}:00`;
    onChange(isoString);
  };

  const handleDayClick = (day: number, monthOffset: number = 0) => {
    let newYear = viewYear;
    let newMonth = viewMonth + monthOffset;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    const newDate = new Date(newYear, newMonth, day);
    setSelectedDate(newDate);
    if (monthOffset !== 0) {
      setViewMonth(newMonth);
      setViewYear(newYear);
    }
    updateDateTime(newDate, selectedHour, selectedMinute);
  };

  const handleHourClick = (h: number) => {
    setSelectedHour(h);
    if (selectedDate) updateDateTime(selectedDate, h, selectedMinute);
  };

  const handleMinuteClick = (m: number) => {
    setSelectedMinute(m);
    if (selectedDate) updateDateTime(selectedDate, selectedHour, m);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    
    const h24 = today.getHours();
    const min = today.getMinutes() >= 30 ? 30 : 0;
    
    setSelectedHour(h24);
    setSelectedMinute(min);
    
    updateDateTime(today, h24, min);
  };

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth - 1);
    
    const today = new Date();
    const isToday = (d: number, m: number, y: number) => 
      today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
      
    const isSelected = (d: number, m: number, y: number) => 
      selectedDate?.getDate() === d && selectedDate?.getMonth() === m && selectedDate?.getFullYear() === y;

    const cells = [];

    // Prev month days
    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + i + 1;
      cells.push(
        <button
          key={`prev-${day}`}
          type="button"
          onClick={() => handleDayClick(day, -1)}
          className="w-8 h-8 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day, viewMonth, viewYear);
      const isCurrentToday = isToday(day, viewMonth, viewYear);

      cells.push(
        <button
          key={`curr-${day}`}
          type="button"
          onClick={() => handleDayClick(day, 0)}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-lg transition-all ${
            selected
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-500'
              : isCurrentToday
              ? 'text-blue-400 font-bold ring-1 ring-blue-500/50 hover:bg-slate-800'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month days
    const totalCells = cells.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      cells.push(
        <button
          key={`next-${i}`}
          type="button"
          onClick={() => handleDayClick(i, 1)}
          className="w-8 h-8 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {i}
        </button>
      );
    }

    return cells;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Format display string
  const displayValue = selectedDate
    ? `${pad(selectedDate.getDate())}/${pad(selectedDate.getMonth() + 1)}/${selectedDate.getFullYear()} ${pad(selectedHour)}:${pad(selectedMinute)}`
    : '';

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
          {label} {required && '*'}
        </label>
      )}
      
      <div 
        className="relative w-full cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder="Selecciona fecha y hora"
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 cursor-pointer transition-all pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 flex bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-4 gap-6 animate-fade-in-up origin-top-left min-w-[max-content]">
          
          {/* LEFT COLUMN: Calendar */}
          <div className="flex flex-col w-[260px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-200 capitalize">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={prevMonth} className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button type="button" onClick={nextMonth} className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {renderCalendarDays()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <button type="button" onClick={handleClear} className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors">
                Borrar
              </button>
              <button type="button" onClick={handleToday} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Hoy
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Time */}
          <div className="flex gap-2 pl-6 border-l border-slate-800">
            {/* Hours */}
            <div className="flex flex-col items-center h-[260px] overflow-y-auto hide-scrollbar pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900 pb-1 w-full text-center">Hora</span>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  className={`w-10 py-2 text-xs font-medium rounded-lg transition-colors mb-1 ${
                    selectedHour === h
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pad(h)}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center h-[260px] overflow-y-auto hide-scrollbar pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900 pb-1 w-full text-center">Min</span>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteClick(m)}
                  className={`w-10 py-2 text-xs font-medium rounded-lg transition-colors mb-1 ${
                    selectedMinute === m
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>
          
        </div>
      )}
      
      {/* Small style for hiding scrollbar while allowing scrolling */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
