// src/pages/Holidays.jsx
// Holiday calendar module: interactive month calendar, FY 2026-27 holiday directory, optional picks, and .ics export.

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Tag } from '../components/Tag.jsx';
import { Table } from '../components/Table.jsx';
import { Calendar } from '../components/Calendar.jsx';
import {
  INITIAL_HOLIDAYS,
  INITIAL_OPTIONAL_PICKS,
  INITIAL_LEAVE_REQUESTS
} from '../data/employee.js';
import { MOCK_LEAVE_REQUESTS } from '../data/mockLeaves.js';
import { formatDate } from '../utils/format.js';

export function Holidays() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);
  const [pickedOptional, setPickedOptional] = useState(INITIAL_OPTIONAL_PICKS);
  const [currentMonth, setCurrentMonth] = useState(10); // 10 = November
  const [currentYear, setCurrentYear] = useState(2026);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const maxOptionalPicks = 2;

  const handlePickOptional = (holidayId) => {
    if (pickedOptional.includes(holidayId)) {
      // Unpick
      setPickedOptional(prev => prev.filter(id => id !== holidayId));
      showToast('Unpicked optional holiday', {
        undoLabel: 'Undo',
        onUndo: () => setPickedOptional(prev => [...prev, holidayId])
      });
    } else {
      // Pick
      if (pickedOptional.length >= maxOptionalPicks) {
        showToast(`Quota reached! You can pick a maximum of ${maxOptionalPicks} optional holidays per financial year.`);
        return;
      }
      setPickedOptional(prev => [...prev, holidayId]);
      showToast('Optional holiday picked and added to your schedule!', {
        undoLabel: 'Undo',
        onUndo: () => setPickedOptional(prev => prev.filter(id => id !== holidayId))
      });
    }
  };

  // Generate and download .ics iCalendar file (Section 17)
  const handleDownloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HRMS India//Employee Holidays//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

    holidays.forEach(h => {
      const cleanDate = h.date.replace(/-/g, '');
      const festName = h.festivalName || h.name;
      const festTitle = h.festival ? `${festName} (${h.festival})` : festName;
      icsContent += `BEGIN:VEVENT\nSUMMARY:${festTitle} - ${h.type} Holiday\nDTSTART;VALUE=DATE:${cleanDate}\nDTEND;VALUE=DATE:${cleanDate}\nDESCRIPTION:${h.description || 'Official holiday observed by HRMS India.'}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Company_Holidays_FY2026_27.ics`;
    link.click();

    showToast('Downloaded Company_Holidays_FY2026_27.ics');
  };

  const filteredHolidays = useMemo(() => {
    if (typeFilter === 'ALL') return holidays;
    return holidays.filter(h => h.type === typeFilter);
  }, [holidays, typeFilter]);

  return (
    <div className="space-y-6">
      {/* 1. HOLCAL WIDGET (Section 17) */}
      <Card
        title="Holiday & Festival Calendar · FY 2026–27"
        subtext="Public holidays, company celebrations, and selected optional festival breaks"
        action={
          <div className="flex items-center gap-2">
            <SecondaryButton size="sm" onClick={handleDownloadICS}>
              <Download className="w-3.5 h-3.5" /> Add to My Calendar (.ics)
            </SecondaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <Calendar
            year={currentYear}
            month={currentMonth}
            holidays={holidays}
            leaveEntries={MOCK_LEAVE_REQUESTS || INITIAL_LEAVE_REQUESTS}
          />
        </div>
      </Card>

      {/* 2. OPTIONAL HOLIDAYS PICKER STRIP */}
      <div className="p-4 rounded-tpl bg-surface2/50 border border-line flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warn" strokeWidth={1.8} />
            <span className="font-semibold text-ink text-sm">
              Optional Festival Entitlement (FY 2026–27)
            </span>
          </div>
          <p className="text-muted text-xs">
            You can pick {maxOptionalPicks} of the listed optional festival holidays per year according to your religious and cultural celebrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-surface border border-line text-xs font-mono text-ink">
            Selected:{' '}
            <strong className="text-accent">
              {pickedOptional.length} of {maxOptionalPicks}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. HOLLIST WIDGET (Section 17) */}
      <Card
        title="Official Festivals & Holidays List · FY 2026–27"
        subtext="April 2026 to March 2027 confirmed schedule with festival names and occasions"
        action={
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface2/60 border border-line/60 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All ({holidays.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('Company')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                typeFilter === 'Company'
                  ? 'bg-accent2/20 text-accent2 font-semibold border border-accent2/40'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Company ({holidays.filter(h => h.type === 'Company').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('Public')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                typeFilter === 'Public'
                  ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Public ({holidays.filter(h => h.type === 'Public').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('Optional')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                typeFilter === 'Optional'
                  ? 'bg-warn/20 text-warn font-semibold border border-warn/40'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Optional ({holidays.filter(h => h.type === 'Optional').length})
            </button>
          </div>
        }
      >
        <Table
          keyField="id"
          columns={[
            {
              header: 'Date & Day',
              key: 'date',
              render: (d, row) => (
                <div className="space-y-0.5 min-w-[110px]">
                  <span className="font-semibold text-ink block">{formatDate(d)}</span>
                  <span className="text-muted text-xs font-mono">{row.day}</span>
                </div>
              )
            },
            {
              header: 'Festival / Holiday Name',
              key: 'name',
              render: (name, row) => (
                <div className="space-y-1 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base shrink-0">🎉</span>
                    <span className="font-bold text-ink text-[13px]">
                      {row.festivalName || name}
                    </span>
                  </div>
                  {row.festival && row.festival !== (row.festivalName || name) && (
                    <div className="text-[11px] text-accent font-medium">
                      {row.festival}
                    </div>
                  )}
                  {row.description && (
                    <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                      {row.description}
                    </p>
                  )}
                </div>
              )
            },
            {
              header: 'Festival Category',
              key: 'category',
              render: (cat, row) => (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface2 text-ink border border-line/60 whitespace-nowrap">
                  {row.category || 'Cultural Festival'}
                </span>
              )
            },
            {
              header: 'Holiday Type',
              key: 'type',
              render: (t) => (
                <Tag
                  color={
                    t === 'Public'
                      ? 'accent'
                      : t === 'Company'
                      ? 'accent2'
                      : 'warn'
                  }
                >
                  {t}
                </Tag>
              )
            },
            {
              header: 'Days Remaining',
              key: 'daysRemaining',
              render: (days) => (
                <span className={`font-mono font-semibold text-xs whitespace-nowrap ${days < 0 ? 'text-muted' : 'text-accent'}`}>
                  {days < 0 ? 'Past' : days === 0 ? 'Today!' : `${days} ${days === 1 ? 'day' : 'days'}`}
                </span>
              )
            },
            {
              header: 'Action / Status',
              key: 'id',
              render: (id, row) => {
                if (row.type !== 'Optional') {
                  return <span className="text-xs text-muted font-medium">Mandatory Off</span>;
                }

                const isPicked = pickedOptional.includes(id);

                return (
                  <button
                    onClick={() => handlePickOptional(id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      isPicked
                        ? 'bg-warn text-bg hover:opacity-90 shadow-sm'
                        : 'border border-line text-muted hover:text-ink hover:border-accent'
                    }`}
                  >
                    {isPicked ? '✓ Picked (Unpick)' : '+ Pick Festival'}
                  </button>
                );
              }
            }
          ]}
          data={filteredHolidays}
        />
      </Card>
    </div>
  );
}

export default Holidays;

