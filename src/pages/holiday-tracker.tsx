import { type FormEvent, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ChartColumnIncreasing,
  Plus,
  Receipt,
  Upload,
  Check,
  CircleHelp,
  Trash2,
  X,
  Utensils,
  Ticket,
  Car,
  ShoppingBag,
  CircleEllipsis,
  BedDouble,
  Gamepad2,
  SquareParking,
  BatteryCharging,
  Fuel,
  Bus,
  Route,
  CarFront,
  Waves,
  Landmark,
  FerrisWheel,
  Settings,
  Download,
  FileUp,
  DatabaseBackup,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import {
  ACTIVITY_DETAILS,
  TRAVEL_DETAILS,
  type ActivityDetail,
  type TravelDetail,
  type Category,
  type Expense,
  type Holiday,
  useHolidayData,
} from '@/hooks/use-holiday-data';

const spendCategories: Category[] = ['Food & Drink', 'Activities', 'Travel', 'Shopping', 'Other'];
const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});
const moneyWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});
const dateLong = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const dateShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDate(value: string, short = false) {
  const date = parseDate(value);
  if (Number.isNaN(date.valueOf())) return 'Date not set';
  return (short ? dateShort : dateLong).format(date);
}

function dayCount(start: string, end: string) {
  const from = parseDate(start).valueOf();
  const to = parseDate(end).valueOf();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(1, Math.round((to - from) / 86400000) + 1);
}

function statusForHoliday(holiday: Holiday): 'Active' | 'Upcoming' | 'Past' {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = parseDate(holiday.startDate);
  const end = parseDate(holiday.endDate);
  if (today < start) return 'Upcoming';
  if (today > end) return 'Past';
  return 'Active';
}

function formatDateRange(holiday: Holiday) {
  return `${formatDate(holiday.startDate, true)}–${formatDate(holiday.endDate, true)}`;
}

function CategoryGlyph({ category, size = 18 }: { category: Category; size?: number }) {
  const props = { size, strokeWidth: 1.9 };
  switch (category) {
    case 'Accommodation': return <BedDouble {...props} />;
    case 'Food & Drink': return <Utensils {...props} />;
    case 'Activities': return <Ticket {...props} />;
    case 'Travel': return <Car {...props} />;
    case 'Shopping': return <ShoppingBag {...props} />;
    default: return <CircleEllipsis {...props} />;
  }
}

function ActivityGlyph({ detail, size = 16 }: { detail: string; size?: number }) {
  const props = { size, strokeWidth: 1.9 };
  switch (detail) {
    case 'Arcade': return <Gamepad2 {...props} />;
    case 'Theme park': return <FerrisWheel {...props} />;
    case 'Attraction': return <Landmark {...props} />;
    case 'Beach':
    case 'Swimming': return <Waves {...props} />;
    case 'Other activity': return <CircleEllipsis {...props} />;
    default: return <Ticket {...props} />;
  }
}

function TravelGlyph({ detail, size = 16 }: { detail: string; size?: number }) {
  const props = { size, strokeWidth: 1.9 };
  switch (detail) {
    case 'Parking': return <SquareParking {...props} />;
    case 'EV charging': return <BatteryCharging {...props} />;
    case 'Fuel': return <Fuel {...props} />;
    case 'Public transport': return <Bus {...props} />;
    case 'Tolls': return <Route {...props} />;
    case 'Taxi': return <CarFront {...props} />;
    case 'Other travel': return <CircleEllipsis {...props} />;
    default: return <Car {...props} />;
  }
}

function CategoryIcon({ category, compact = false }: { category: Category; compact?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
      <CategoryGlyph category={category} size={compact ? 15 : 18} />
    </span>
  );
}

function DetailIcon({ kind, label }: { kind: 'activity' | 'travel'; label: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
      {kind === 'activity' ? <ActivityGlyph detail={label} /> : <TravelGlyph detail={label} />}
    </span>
  );
}

function ExpenseIcon({ category, activityDetail, travelDetail }: { category: Category; activityDetail?: string; travelDetail?: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
      {category === 'Activities' && activityDetail ? <ActivityGlyph detail={activityDetail} size={18} /> : category === 'Travel' && travelDetail ? <TravelGlyph detail={travelDetail} size={18} /> : <CategoryGlyph category={category} size={18} />}
    </span>
  );
}

function StatusBadge({ status }: { status: 'Active' | 'Upcoming' | 'Past' }) {
  const styles = {
    Active: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    Upcoming: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    Past: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 pb-24 pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-8">{children}</main>;
}

function CreateHolidayDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: Pick<Holiday, 'name' | 'location' | 'startDate' | 'endDate'>) => void;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setError('Add a holiday name and both dates.');
      return;
    }
    if (parseDate(endDate) < parseDate(startDate)) {
      setError('The end date cannot be before the start date.');
      return;
    }
    onCreate({ name: name.trim(), location: location.trim() || undefined, startDate, endDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#14171a] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">New holiday</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Add a trip</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Holiday name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cornwall 2026" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900/50" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lizard Point" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900/50" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <label>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Start date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 min-w-0 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900/50" />
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">End date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 min-w-0 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900/50" />
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

        <button type="submit" className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
          Add holiday
        </button>
      </form>
    </div>
  );
}

interface YearSummary {
  year: string;
  staySpend: number;
  accommodation: number;
  trips: number;
  stayTrips: number;
  accommodationTrips: number;
}

function HistoricalColumns({
  data,
  valueKey,
  secondary = false,
}: {
  data: YearSummary[];
  valueKey: 'staySpend' | 'accommodation';
  secondary?: boolean;
}) {
  const maxValue = Math.max(1, ...data.map((item) => item[valueKey]));
  return (
    <div className="flex items-end gap-3 sm:gap-8">
      {data.map((item) => {
        const value = item[valueKey];
        const height = value ? Math.max((value / maxValue) * 100, 6) : 2;
        const averageTrips = valueKey === 'staySpend' ? item.stayTrips : item.accommodationTrips;
        const average = averageTrips ? value / averageTrips : 0;
        return (
          <div key={item.year} className="flex min-w-0 flex-1 flex-col">
            <p className="mb-2 text-center text-xs font-bold tracking-tight sm:text-sm">{moneyWhole.format(value)}</p>
            <div className="flex h-40 items-end justify-center sm:h-44">
              <div className={`w-full max-w-14 rounded-t-2xl ${secondary ? 'bg-orange-200 dark:bg-orange-900' : 'bg-orange-500'}`} style={{ height: `${height}%` }} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.year}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{moneyWhole.format(average)} avg / trip</p>
              <p className="mt-1 text-[10px] text-slate-400">{item.trips} {item.trips === 1 ? 'trip' : 'trips'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { holidays, expenses, isHydrated, createHoliday } = useHolidayData();
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();

  const currentYear = new Date().getFullYear();
  const currentYearHolidays = holidays.filter((holiday) => parseDate(holiday.startDate).getFullYear() === currentYear);
  const currentHolidayIds = new Set(currentYearHolidays.map((holiday) => holiday.id));
  const currentExpenses = expenses.filter((expense) => currentHolidayIds.has(expense.holidayId));
  const staySpend = currentExpenses.filter((expense) => expense.category !== 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0);
  const accommodationSpend = currentExpenses.filter((expense) => expense.category === 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0);
  const totalDays = currentYearHolidays.reduce((sum, holiday) => sum + dayCount(holiday.startDate, holiday.endDate), 0);
  const tripsWithSpend = currentYearHolidays.filter((holiday) => currentExpenses.some((expense) => expense.holidayId === holiday.id && expense.category !== 'Accommodation')).length;
  const averageTrip = tripsWithSpend ? staySpend / tripsWithSpend : 0;

  const activeTrips = holidays.filter((holiday) => statusForHoliday(holiday) === 'Active');
  const upcomingTrips = holidays.filter((holiday) => statusForHoliday(holiday) === 'Upcoming').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const recentTrips = holidays.filter((holiday) => statusForHoliday(holiday) === 'Past').sort((a, b) => b.endDate.localeCompare(a.endDate)).slice(0, 4);

  const years = Array.from(new Set(holidays.map((holiday) => parseDate(holiday.startDate).getFullYear()).filter(Number.isFinite))).sort((a, b) => a - b);
  const historicalYears = (years.length ? years : [currentYear]).slice(-4);
  const yearlyData: YearSummary[] = historicalYears.map((year) => {
    const yearHolidays = holidays.filter((holiday) => parseDate(holiday.startDate).getFullYear() === year);
    const ids = new Set(yearHolidays.map((holiday) => holiday.id));
    const yearExpenses = expenses.filter((expense) => ids.has(expense.holidayId));
    const stayTripIds = new Set(yearExpenses.filter((expense) => expense.category !== 'Accommodation').map((expense) => expense.holidayId));
    const accommodationTripIds = new Set(yearExpenses.filter((expense) => expense.category === 'Accommodation').map((expense) => expense.holidayId));
    return {
      year: String(year),
      staySpend: yearExpenses.filter((expense) => expense.category !== 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0),
      accommodation: yearExpenses.filter((expense) => expense.category === 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0),
      trips: yearHolidays.length,
      stayTrips: stayTripIds.size,
      accommodationTrips: accommodationTripIds.size,
    };
  });

  const categoryTotals = spendCategories
    .map((category) => ({
      category,
      amount: currentExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const categoryTotal = categoryTotals.reduce((sum, item) => sum + item.amount, 0);
  const maxCategory = Math.max(1, ...categoryTotals.map((item) => item.amount));

  const create = (input: Pick<Holiday, 'name' | 'location' | 'startDate' | 'endDate'>) => {
    const holiday = createHoliday(input);
    setShowCreate(false);
    setLocation(`/holiday/${holiday.id}`);
  };

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading holidays…</p></PageShell>;

  return (
    <PageShell>
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-600 dark:text-orange-400">Away</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Our trips</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">The places, stays and spending along the way.</p>
      </header>

      <section className="mb-8 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-50">{currentYear} spending</p>
        <p className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl">{money.format(staySpend)}</p>
        <p className="mt-2 text-sm text-orange-100">spent while away</p>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-orange-400/50 pt-4">
          <div><p className="text-[11px] text-orange-100">Trips</p><p className="mt-1 text-base font-semibold">{currentYearHolidays.length}</p></div>
          <div><p className="text-[11px] text-orange-100">Days away</p><p className="mt-1 text-base font-semibold">{totalDays}</p></div>
          <div><p className="text-[11px] text-orange-100">Avg. / trip</p><p className="mt-1 text-base font-semibold">{moneyWhole.format(averageTrip)}</p></div>
        </div>
      </section>

      {activeTrips.length > 0 && (
        <section className="mb-7">
          <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Active now</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The trip you're currently tracking.</p></div>
          {activeTrips.map((trip) => <TripCard key={trip.id} holiday={trip} expenses={expenses} featured />)}
        </section>
      )}

      {upcomingTrips.length > 0 && (
        <section className="mb-7">
          <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Upcoming</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Trips you've already got planned.</p></div>
          <div className="space-y-3">{upcomingTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} holiday={trip} expenses={expenses} />)}</div>
        </section>
      )}

      {recentTrips.length > 0 && (
        <section className="mb-7">
          <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Recent trips</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your latest completed trips and spend.</p></div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">{recentTrips.map((trip) => <RecentTripRow key={trip.id} holiday={trip} expenses={expenses} />)}</div>
          </div>
        </section>
      )}

      <section className="mb-5">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Spending over time</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Annual day-to-day spend, with the average per trip.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]"><HistoricalColumns data={yearlyData} valueKey="staySpend" /></div>
      </section>

      <section className="mb-7">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Accommodation</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kept separate so it doesn't distort your spend-while-away trend.</p></div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm dark:border-orange-800/60 dark:bg-orange-950/30"><HistoricalColumns data={yearlyData} valueKey="accommodation" secondary /></div>
      </section>

      <section>
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold tracking-tight">Where you spend</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your {currentYear} day-to-day spending, largest category first.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
          {categoryTotals.length === 0 ? <p className="text-sm text-slate-400">Add spending to see your category trends.</p> : (
            <div className="space-y-5">{categoryTotals.map((item) => {
              const percentage = categoryTotal ? (item.amount / categoryTotal) * 100 : 0;
              const width = (item.amount / maxCategory) * 100;
              return <div key={item.category}><div className="flex items-center gap-3"><CategoryIcon category={item.category} compact /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.category}</p><p className="text-sm font-semibold">{money.format(item.amount)}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500" style={{ width: `${width}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{percentage.toFixed(0)}%</p></div></div></div>;
            })}</div>
          )}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
          <Plus size={17} />
          <span>Add holiday</span>
        </button>
        <Link href="/analysis" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-[#14171a] dark:text-slate-200 dark:hover:border-orange-800 dark:hover:text-orange-400">
          <ChartColumnIncreasing size={17} />
          <span>Analysis</span>
        </Link>
      </div>
      <Link href="/settings" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200">
        <Settings size={16} />
        <span>Settings</span>
      </Link>
      {showCreate && <CreateHolidayDialog onClose={() => setShowCreate(false)} onCreate={create} />}
    </PageShell>
  );
}


export function SettingsPage() {
  const { holidays, expenses, createBackup, restoreBackup, isHydrated } = useHolidayData();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{ name: string; backup: unknown; trips: number; expenses: number; exportedAt?: string } | null>(null);

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading settings…</p></PageShell>;

  const handleBackup = async () => {
    setMessage(null);
    const backup = createBackup();
    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `Away-backup-${date}.json`;
    const file = new File([json], fileName, { type: 'application/json' });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Away backup', files: [file] });
      } else {
        const url = URL.createObjectURL(file);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }
      setMessage({ type: 'success', text: 'Backup created. Keep the file somewhere safe, such as iCloud Drive.' });
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        setMessage({ type: 'error', text: 'Away could not create the backup file.' });
      }
    }
  };

  const chooseRestore = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setPendingRestore(null);
    try {
      const parsed = JSON.parse(await file.text()) as any;
      const rawData = parsed?.data ?? parsed;
      const trips = Array.isArray(rawData?.holidays) ? rawData.holidays.length : -1;
      const expenseCount = Array.isArray(rawData?.expenses) ? rawData.expenses.length : -1;
      if (trips < 0 || expenseCount < 0) throw new Error('Invalid backup');
      setPendingRestore({
        name: file.name,
        backup: parsed,
        trips,
        expenses: expenseCount,
        exportedAt: typeof parsed?.exportedAt === 'string' ? parsed.exportedAt : undefined,
      });
    } catch {
      setMessage({ type: 'error', text: 'That file is not a valid Away backup.' });
    }
  };

  const confirmRestore = () => {
    if (!pendingRestore) return;
    try {
      restoreBackup(pendingRestore.backup);
      setPendingRestore(null);
      setMessage({ type: 'success', text: 'Backup restored. Your trips and expenses have been replaced with the backup data.' });
    } catch {
      setMessage({ type: 'error', text: 'Away could not restore that backup.' });
    }
  };

  return (
    <PageShell>
      <button onClick={() => setLocation('/')} className="mb-7 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400">
        <ArrowLeft size={16} /> Our trips
      </button>

      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">Away</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Keep a portable copy of your Away data and restore it when you move to a new build or device.</p>
      </header>

      <section className="mb-7">
        <div className="mb-4 px-1">
          <h2 className="text-lg font-semibold tracking-tight">Data & backups</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your current data stays on this device until you export it.</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"><DatabaseBackup size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Back up Away</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Creates one file containing all {holidays.length} {holidays.length === 1 ? 'trip' : 'trips'} and {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}.</p>
              </div>
            </div>
            <button type="button" onClick={() => void handleBackup()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
              <Download size={17} /> Create backup
            </button>
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><FileUp size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Restore a backup</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose an Away backup file. Nothing is replaced until you confirm the restore.</p>
              </div>
            </div>

            <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-orange-800">
              <Upload size={17} /> Choose backup file
              <input type="file" accept="application/json,.json" className="hidden" onChange={(event) => void chooseRestore(event.target.files?.[0])} />
            </label>

            {pendingRestore && (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/60 dark:bg-orange-950/30">
                <p className="truncate text-sm font-semibold text-orange-950 dark:text-orange-100">{pendingRestore.name}</p>
                <p className="mt-1 text-xs leading-5 text-orange-900/70 dark:text-orange-200/70">{pendingRestore.trips} {pendingRestore.trips === 1 ? 'trip' : 'trips'} · {pendingRestore.expenses} {pendingRestore.expenses === 1 ? 'expense' : 'expenses'}{pendingRestore.exportedAt ? ` · ${new Date(pendingRestore.exportedAt).toLocaleDateString('en-GB')}` : ''}</p>
                <p className="mt-3 text-xs leading-5 text-orange-900/80 dark:text-orange-200/80">Restoring replaces all data currently stored in Away on this device.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPendingRestore(null)} className="rounded-xl border border-orange-200 bg-white px-3 py-3 text-xs font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300">Cancel</button>
                  <button type="button" onClick={confirmRestore} className="rounded-xl bg-orange-500 px-3 py-3 text-xs font-semibold text-white">Restore backup</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message.text}</div>
      )}
    </PageShell>
  );
}


export function AnalysisPage() {
  const { holidays, expenses, isHydrated } = useHolidayData();
  const [, setLocation] = useLocation();
  const availableYears = Array.from(
    new Set(holidays.map((holiday) => parseDate(holiday.startDate).getFullYear()).filter(Number.isFinite)),
  ).sort((a, b) => a - b);
  const currentYear = new Date().getFullYear();
  const latestYear = availableYears.length ? availableYears[availableYears.length - 1] : currentYear;
  const [selectedYear, setSelectedYear] = useState(latestYear);

  const yearlyData: YearSummary[] = (availableYears.length ? availableYears : [currentYear]).map((year) => {
    const yearHolidays = holidays.filter((holiday) => parseDate(holiday.startDate).getFullYear() === year);
    const ids = new Set(yearHolidays.map((holiday) => holiday.id));
    const yearExpenses = expenses.filter((expense) => ids.has(expense.holidayId));
    const stayExpenses = yearExpenses.filter((expense) => expense.category !== 'Accommodation');
    const accommodationExpenses = yearExpenses.filter((expense) => expense.category === 'Accommodation');
    return {
      year: String(year),
      staySpend: stayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      accommodation: accommodationExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      trips: yearHolidays.length,
      stayTrips: new Set(stayExpenses.map((expense) => expense.holidayId)).size,
      accommodationTrips: new Set(accommodationExpenses.map((expense) => expense.holidayId)).size,
    };
  });

  const selectedHolidays = holidays.filter((holiday) => parseDate(holiday.startDate).getFullYear() === selectedYear);
  const selectedIds = new Set(selectedHolidays.map((holiday) => holiday.id));
  const selectedExpenses = expenses.filter((expense) => selectedIds.has(expense.holidayId));
  const selectedStayExpenses = selectedExpenses.filter((expense) => expense.category !== 'Accommodation');
  const selectedAccommodation = selectedExpenses.filter((expense) => expense.category === 'Accommodation');
  const selectedStaySpend = selectedStayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const selectedAccommodationSpend = selectedAccommodation.reduce((sum, expense) => sum + expense.amount, 0);
  const stayTripCount = new Set(selectedStayExpenses.map((expense) => expense.holidayId)).size;
  const accommodationTripCount = new Set(selectedAccommodation.map((expense) => expense.holidayId)).size;

  const categoryTotals = spendCategories
    .map((category) => ({
      category,
      amount: selectedStayExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const activityTotals = ACTIVITY_DETAILS
    .map((detail) => ({
      detail,
      amount: selectedStayExpenses.filter((expense) => expense.category === 'Activities' && (expense.activityDetail || 'General activity') === detail).reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const travelTotals = TRAVEL_DETAILS
    .map((detail) => ({
      detail,
      amount: selectedStayExpenses.filter((expense) => expense.category === 'Travel' && (expense.travelDetail || 'General travel') === detail).reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const maxCategory = Math.max(1, ...categoryTotals.map((item) => item.amount));
  const maxActivity = Math.max(1, ...activityTotals.map((item) => item.amount));
  const maxTravel = Math.max(1, ...travelTotals.map((item) => item.amount));

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading analysis…</p></PageShell>;

  return (
    <PageShell>
      <button onClick={() => setLocation('/')} className="mb-7 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"><ArrowLeft size={16} /> Our trips</button>

      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">Away</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Analysis</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Spending, stays and trends across your trips.</p>
      </header>

      <div className="mb-2 px-1"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">View year</p></div>
      <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
        {(availableYears.length ? availableYears : [currentYear]).map((year) => (
          <button key={year} type="button" onClick={() => setSelectedYear(year)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${selectedYear === year ? 'bg-orange-500 text-white' : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-[#14171a] dark:text-slate-400'}`}>{year}</button>
        ))}
      </div>

      <section className="mb-7 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-wider text-orange-50">Spent while away</p><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{selectedYear}</span></div>
        <p className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl">{money.format(selectedStaySpend)}</p>
        <div className="mt-6 grid grid-cols-3 border-t border-orange-400/50 pt-4">
          <div><p className="text-xs text-orange-100">Trips</p><p className="mt-1 text-sm font-semibold">{selectedHolidays.length}</p></div>
          <div><p className="text-xs text-orange-100">Avg. trip</p><p className="mt-1 text-sm font-semibold">{moneyWhole.format(stayTripCount ? selectedStaySpend / stayTripCount : 0)}</p></div>
          <div><p className="text-xs text-orange-100">Accommodation</p><p className="mt-1 text-sm font-semibold">{moneyWhole.format(selectedAccommodationSpend)}</p></div>
        </div>
      </section>

      <section className="mb-5">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold">Spending over time</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Annual spending while away and the average per recorded trip.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]"><HistoricalColumns data={yearlyData} valueKey="staySpend" /></div>
      </section>

      <section className="mb-7">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold">Accommodation over time</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Annual accommodation cost and average per recorded stay.</p></div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm dark:border-orange-800/60 dark:bg-orange-950/30"><HistoricalColumns data={yearlyData} valueKey="accommodation" secondary /></div>
      </section>

      <AnalysisBreakdown title="Spending by category" subtitle={`${selectedYear} spending while away, largest categories first.`} items={categoryTotals.map((item) => ({ label: item.category, amount: item.amount }))} maxAmount={maxCategory} empty="Add spending to see your category analysis." iconKind="category" />

      <div className="mt-7 grid gap-7 sm:grid-cols-2">
        <AnalysisBreakdown title="Activities breakdown" subtitle="How your activity spending is split." items={activityTotals.map((item) => ({ label: item.detail, amount: item.amount }))} maxAmount={maxActivity} empty="Activity subcategories will appear here." compact iconKind="activity" />
        <AnalysisBreakdown title="Travel breakdown" subtitle="Parking, charging and other travel costs." items={travelTotals.map((item) => ({ label: item.detail, amount: item.amount }))} maxAmount={maxTravel} empty="Travel subcategories will appear here." compact iconKind="travel" />
      </div>


    </PageShell>
  );
}

function AnalysisBreakdown({ title, subtitle, items, maxAmount, empty, compact = false, iconKind }: { title: string; subtitle: string; items: Array<{ label: string; amount: number }>; maxAmount: number; empty: string; compact?: boolean; iconKind?: 'category' | 'activity' | 'travel' }) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className={compact ? '' : 'mb-7'}>
      <div className="mb-4 px-1"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
        {items.length === 0 ? <p className="text-sm text-slate-400">{empty}</p> : <div className="space-y-5">{items.map((item) => {
          const percentage = total ? (item.amount / total) * 100 : 0;
          return <div key={item.label} className="flex items-start gap-3">{iconKind === 'category' ? <CategoryIcon category={item.label as Category} compact /> : iconKind === 'activity' ? <DetailIcon kind="activity" label={item.label} /> : iconKind === 'travel' ? <DetailIcon kind="travel" label={item.label} /> : null}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.label}</p><p className="text-sm font-semibold">{money.format(item.amount)}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500" style={{ width: `${(item.amount / maxAmount) * 100}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{percentage.toFixed(0)}%</p></div></div>;
        })}</div>}
      </div>
    </section>
  );
}

function TripCard({ holiday, expenses, featured = false }: { holiday: Holiday; expenses: Expense[]; featured?: boolean }) {
  const tripExpenses = expenses.filter((expense) => expense.holidayId === holiday.id);
  const spend = tripExpenses.filter((expense) => expense.category !== 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0);
  const days = dayCount(holiday.startDate, holiday.endDate);
  const featuredClasses = featured
    ? 'border-orange-200 bg-orange-50/70 p-6 dark:border-orange-900/60 dark:bg-orange-950/20'
    : 'border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#14171a]';
  return (
    <Link href={`/holiday/${holiday.id}`} className={`group block w-full rounded-3xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:hover:border-orange-800 ${featuredClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2"><StatusBadge status={statusForHoliday(holiday)} /></div>
          <h3 className={`${featured ? 'text-2xl' : 'text-lg'} font-semibold tracking-tight`}>{holiday.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{holiday.location || 'Location not set'} · {formatDateRange(holiday)}</p>
          <p className="mt-1 text-xs text-slate-400">{days} {days === 1 ? 'day' : 'days'}</p>
        </div>
        <ChevronRight className="mt-1 text-slate-300 transition-transform group-hover:translate-x-1 dark:text-slate-700" size={19} />
      </div>
      <div className={`${featured ? 'mt-6' : 'mt-4'} flex items-end justify-between gap-4`}>
        <div>
          <p className={`${featured ? 'text-3xl' : 'text-2xl'} font-bold tracking-tight`}>{money.format(spend)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">spent while away</p>
        </div>
        {days > 0 && <p className="pb-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{money.format(spend / days)} / day</p>}
      </div>
    </Link>
  );
}

function RecentTripRow({ holiday, expenses }: { holiday: Holiday; expenses: Expense[] }) {
  const spend = expenses.filter((expense) => expense.holidayId === holiday.id && expense.category !== 'Accommodation').reduce((sum, expense) => sum + expense.amount, 0);
  const days = dayCount(holiday.startDate, holiday.endDate);
  return (
    <Link href={`/holiday/${holiday.id}`} className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">◇</span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-5">{holiday.name}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateRange(holiday)} · {days} {days === 1 ? 'day' : 'days'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p className="text-sm font-semibold">{money.format(spend)}</p>
        <ChevronRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-700" />
      </div>
    </Link>
  );
}

export function HolidayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { holidays, expenses, isHydrated, deleteHoliday } = useHolidayData();
  const [, setLocation] = useLocation();
  const holiday = holidays.find((item) => item.id === id);
  const [showDelete, setShowDelete] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading holiday…</p></PageShell>;
  if (!holiday) return <PageShell><Link href="/" className="text-sm font-medium text-orange-600">← Our trips</Link><h1 className="mt-8 text-3xl font-bold">Holiday not found</h1></PageShell>;

  const tripExpenses = expenses.filter((expense) => expense.holidayId === holiday.id).sort((a, b) => b.date.localeCompare(a.date));
  const spendExpenses = tripExpenses.filter((expense) => expense.category !== 'Accommodation');
  const visibleSpendExpenses = showAllTransactions ? spendExpenses : spendExpenses.slice(0, 6);
  const accommodationExpenses = tripExpenses.filter((expense) => expense.category === 'Accommodation');
  const staySpend = spendExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const accommodation = accommodationExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalHolidayCost = staySpend + accommodation;
  const days = dayCount(holiday.startDate, holiday.endDate);
  const categoryTotals = spendCategories
    .map((category) => ({ category, amount: spendExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const maxCategory = Math.max(1, ...categoryTotals.map((item) => item.amount));

  return (
    <PageShell>
      <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"><ArrowLeft size={16} /> Our trips</Link>

      <header className="mb-8">
        <div className="mb-3"><StatusBadge status={statusForHoliday(holiday)} /></div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{holiday.name}</h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{holiday.location || 'Location not set'}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(holiday.startDate)}–{formatDate(holiday.endDate, true)} · {days} {days === 1 ? 'day' : 'days'}</p>
      </header>

      <section className="mb-4 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-50">Spent while away</p>
        <p className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl">{money.format(staySpend)}</p>
        <div className="mt-6 grid grid-cols-2 border-t border-orange-400/50 pt-4">
          <div><p className="text-xs text-orange-100">Avg. per day</p><p className="mt-1 text-sm font-semibold">{money.format(days ? staySpend / days : 0)}</p></div>
          <div><p className="text-xs text-orange-100">Transactions</p><p className="mt-1 text-sm font-semibold">{spendExpenses.length}</p></div>
        </div>
      </section>

      {accommodation > 0 && (
        <section className="mb-7 flex items-center justify-between rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm dark:border-orange-800/60 dark:bg-orange-950/30">
          <div className="flex items-center gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 dark:bg-orange-950/70 dark:text-orange-400"><BedDouble size={18} strokeWidth={1.9} /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-900 dark:text-orange-100">Total holiday cost</p><p className="mt-1 text-xs text-orange-800/70 dark:text-orange-200/70">Including {money.format(accommodation)} accommodation</p></div></div>
          <p className="text-lg font-bold text-orange-950 dark:text-orange-50">{money.format(totalHolidayCost)}</p>
        </section>
      )}

      <section className="mb-7">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold">Spending breakdown</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Day-to-day spending, largest categories first.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
          {categoryTotals.length === 0 ? <p className="text-sm text-slate-400">No day-to-day spending recorded yet.</p> : <div className="space-y-5">{categoryTotals.map((item) => {
            const percentage = staySpend ? (item.amount / staySpend) * 100 : 0;
            return <div key={item.category}><div className="flex items-center gap-3"><CategoryIcon category={item.category} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.category}</p><p className="text-sm font-semibold">{money.format(item.amount)}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500" style={{ width: `${(item.amount / maxCategory) * 100}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{percentage.toFixed(0)}% of spend</p></div></div></div>;
          })}</div>}
        </div>
      </section>

      <section className="mb-7">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div>
            <h2 className="text-lg font-semibold">Transactions</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tap any expense to review or edit its details.
            </p>
          </div>
          {spendExpenses.length > 6 && (
            <p className="shrink-0 text-xs font-medium text-slate-400">
              {showAllTransactions ? spendExpenses.length : `6 of ${spendExpenses.length}`}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
          {spendExpenses.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">No transactions yet.</div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleSpendExpenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </div>

              {spendExpenses.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllTransactions((current) => !current)}
                  className="flex w-full items-center justify-center border-t border-slate-100 px-5 py-3.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50/60 dark:border-slate-800 dark:text-orange-400 dark:hover:bg-orange-950/20"
                >
                  {showAllTransactions ? 'Show less' : `View all ${spendExpenses.length} transactions`}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="mb-7">
        <div className="mb-4 px-1"><h2 className="text-lg font-semibold">Accommodation</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional, and kept separate from spending while away.</p></div>
        {accommodationExpenses.length ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">{accommodationExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</div>
        ) : (
          <Link href={`/holiday/${holiday.id}/add?category=Accommodation`} className="flex w-full items-center justify-between rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-4 text-left dark:border-slate-700 dark:bg-[#14171a]"><div><p className="text-sm font-semibold">Add accommodation cost</p><p className="mt-1 text-xs text-slate-400">Optional — include it when you want the full holiday cost.</p></div><Plus size={18} className="text-slate-400" /></Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <Link href={`/holiday/${holiday.id}/add`} className="flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-orange-600 sm:px-4 sm:text-sm"><Plus size={17} className="shrink-0" /><span className="whitespace-nowrap">Add spending</span></Link>
        <Link href={`/holiday/${holiday.id}/import`} className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-[#14171a] dark:text-slate-200 dark:hover:border-orange-700 dark:hover:text-orange-400 sm:px-4 sm:text-sm"><Upload size={17} className="shrink-0" /><span className="whitespace-nowrap">Import statement</span></Link>
      </div>
      <button onClick={() => setShowDelete(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"><Trash2 size={16} /> Delete holiday</button>

      {showDelete && <ConfirmDelete onCancel={() => setShowDelete(false)} onConfirm={() => { deleteHoliday(holiday.id); setLocation('/'); }} title="Delete this holiday?" />}
    </PageShell>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <Link
      href={`/holiday/${expense.holidayId}/expense/${expense.id}/edit`}
      className="group flex items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
      aria-label={`Edit ${expense.description}`}
    >
      <ExpenseIcon category={expense.category} activityDetail={expense.activityDetail} travelDetail={expense.travelDetail} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-5">{expense.description}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {formatDate(expense.date, true)} · {expense.category}
          {expense.activityDetail ? ` · ${expense.activityDetail}` : ''}
          {expense.travelDetail ? ` · ${expense.travelDetail}` : ''}
        </p>
        {expense.note && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{expense.note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <p className="text-sm font-semibold tabular-nums">{money.format(expense.amount)}</p>
        <ChevronRight size={16} className="mt-0.5 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-700" />
      </div>
    </Link>
  );
}

function ConfirmDelete({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#14171a]">
        <h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">This will also remove the spending recorded against it. This cannot be undone.</p>
        <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={onCancel} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">Cancel</button><button onClick={onConfirm} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">Delete</button></div>
      </div>
    </div>
  );
}

export function AddSpendingPage() {
  const { id, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const { holidays, expenses, addExpense, updateExpense, deleteExpense, isHydrated } = useHolidayData();
  const [, setLocation] = useLocation();
  const holiday = holidays.find((item) => item.id === id);
  const existingExpense = expenseId ? expenses.find((item) => item.id === expenseId && item.holidayId === id) : undefined;
  const editing = Boolean(expenseId);
  const queryAccommodation = new URLSearchParams(window.location.search).get('category') === 'Accommodation';
  const accommodationMode = existingExpense?.category === 'Accommodation' || queryAccommodation;

  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [merchant, setMerchant] = useState(existingExpense?.description ?? (accommodationMode ? 'Accommodation' : ''));
  const [date, setDate] = useState(existingExpense?.date ?? holiday?.startDate ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>(existingExpense?.category ?? (accommodationMode ? 'Accommodation' : 'Food & Drink'));
  const [activityDetail, setActivityDetail] = useState<ActivityDetail>((existingExpense?.activityDetail as ActivityDetail) ?? 'General activity');
  const [travelDetail, setTravelDetail] = useState<TravelDetail>((existingExpense?.travelDetail as TravelDetail) ?? 'General travel');
  const [note, setNote] = useState(existingExpense?.note ?? '');
  const [error, setError] = useState('');
  const [showDeleteExpense, setShowDeleteExpense] = useState(false);

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading…</p></PageShell>;
  if (!holiday) return <PageShell><Link href="/" className="text-sm font-medium text-orange-600">← Our trips</Link><h1 className="mt-8 text-3xl font-bold">Holiday not found</h1></PageShell>;
  if (editing && !existingExpense) return <PageShell><button onClick={() => setLocation(`/holiday/${holiday.id}`)} className="text-sm font-medium text-orange-600">← {holiday.name}</button><h1 className="mt-8 text-3xl font-bold">Expense not found</h1></PageShell>;

  const save = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Enter an amount greater than zero.');
    if (!merchant.trim()) return setError('Add a merchant or description.');
    if (!date) return setError('Choose a date.');

    const values = {
      amount: parsed,
      description: merchant.trim(),
      date,
      category,
      activityDetail: category === 'Activities' ? activityDetail : undefined,
      travelDetail: category === 'Travel' ? travelDetail : undefined,
      note: note.trim() || undefined,
    };

    if (existingExpense) {
      updateExpense(existingExpense.id, values);
    } else {
      addExpense({ holidayId: holiday.id, ...values });
    }
    setLocation(`/holiday/${holiday.id}`);
  };

  const title = editing
    ? accommodationMode
      ? 'Edit accommodation'
      : 'Edit spending'
    : accommodationMode
      ? 'Add accommodation'
      : 'Add spending';

  const intro = editing
    ? 'Update the details below, then save your changes.'
    : accommodationMode
      ? 'Keep the stay cost separate from what you spend while you’re away.'
      : 'Record a purchase or expense for this trip.';

  return (
    <PageShell>
      <button
        onClick={() => setLocation(`/holiday/${holiday.id}`)}
        className="mb-7 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
      >
        <ArrowLeft size={16} />
        {holiday.name}
      </button>

      <header className="mb-7">
        <p className="mb-2 text-sm font-medium text-orange-600 dark:text-orange-400">{holiday.name}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{intro}</p>
      </header>

      <section className="mb-6 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
        <label htmlFor="expense-amount" className="text-xs font-semibold uppercase tracking-wider text-orange-50">
          Amount
        </label>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="shrink-0 text-4xl font-semibold text-orange-100 sm:text-5xl">£</span>
          <input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError('');
            }}
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent text-5xl font-bold tracking-tight text-white outline-none placeholder:text-orange-200 sm:text-6xl"
            autoFocus={!editing}
          />
        </div>
        <p className="mt-3 text-xs text-orange-100">
          {amount ? money.format(Number(amount) || 0) : accommodationMode ? 'Enter the accommodation cost' : 'Enter the amount you spent'}
        </p>
      </section>

      <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
        <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
          <label htmlFor="expense-merchant" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {accommodationMode ? 'Accommodation' : 'Merchant or description'}
          </label>
          <input
            id="expense-merchant"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value);
              if (error) setError('');
            }}
            placeholder={accommodationMode ? 'e.g. Parkdean Resort' : 'e.g. Tesco'}
            className="mt-2 w-full bg-transparent text-base font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        <div className="px-5 py-5">
          <label htmlFor="expense-date" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (error) setError('');
            }}
            className="mt-2 w-full bg-transparent text-base font-medium outline-none"
          />
        </div>
      </section>

      {!accommodationMode && (
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
          <div>
            <h2 className="text-base font-semibold">Category</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose the broad type first. Activities and Travel can then be refined further.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {spendCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition ${
                  category === item
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:text-orange-400'
                }`}
              >
                <CategoryGlyph category={item} size={15} />
                <span>{item}</span>
              </button>
            ))}
          </div>

          {category === 'Activities' && (
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Activity type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIVITY_DETAILS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActivityDetail(item)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
                      activityDetail === item
                        ? 'border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300'
                        : 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <ActivityGlyph detail={item} size={14} />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'Travel' && (
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Travel type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRAVEL_DETAILS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTravelDetail(item)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
                      travelDetail === item
                        ? 'border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300'
                        : 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <TravelGlyph detail={item} size={14} />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
        <label htmlFor="expense-note" className="block text-base font-semibold">Note</label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional detail you may want to remember later.</p>
        <textarea
          id="expense-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-900/50"
        />
      </section>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={save}
        className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
      >
        {editing ? 'Save changes' : accommodationMode ? 'Save accommodation' : 'Save expense'}
      </button>

      <button
        onClick={() => setLocation(`/holiday/${holiday.id}`)}
        className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
      >
        Cancel
      </button>

      {existingExpense && (
        <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
          <button
            onClick={() => setShowDeleteExpense(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <Trash2 size={16} />
            Delete expense
          </button>
        </div>
      )}

      {showDeleteExpense && existingExpense && (
        <ConfirmDelete
          title="Delete this expense?"
          onCancel={() => setShowDeleteExpense(false)}
          onConfirm={() => {
            deleteExpense(existingExpense.id);
            setLocation(`/holiday/${holiday.id}`);
          }}
        />
      )}
    </PageShell>
  );
}


type ImportConfidence = 'high' | 'medium' | 'low';

type ImportedTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  activityDetail?: string;
  travelDetail?: string;
  selected: boolean;
  confidence: ImportConfidence;
  needsReview: boolean;
};

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseMoneyValue(value: string) {
  const cleaned = value
    .replace(/£/g, '')
    .replace(/,/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
    .replace(/[^0-9.\-]/g, '')
    .trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseStatementDate(value: string) {
  const raw = value.trim();
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const uk = raw.match(/^(\d{1,2})[\-/\.](\d{1,2})[\-/\.](\d{2,4})/);
  if (uk) {
    const year = uk[3].length === 2 ? `20${uk[3]}` : uk[3];
    return `${year}-${uk[2].padStart(2, '0')}-${uk[1].padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.valueOf())) {
    const y = parsed.getFullYear();
    const m = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const d = `${parsed.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function addDays(value: string, days: number) {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function suggestCategory(description: string): { category: Category; activityDetail?: string; travelDetail?: string; confidence: ImportConfidence } {
  const text = description.toLowerCase();
  if (/parkdean|hotel|travelodge|premier inn|airbnb|booking\.com|haven|caravan|camping/.test(text)) {
    return { category: 'Accommodation', confidence: 'high' };
  }
  if (/arcade|amusement/.test(text)) {
    return { category: 'Activities', activityDetail: 'Arcade', confidence: 'high' };
  }
  if (/zoo|aquarium|museum|theme park|attraction|cinema|tickets?|national trust|seal sanctuary|flambards/.test(text)) {
    return { category: 'Activities', confidence: 'high' };
  }
  if (/tesco|sainsbury|asda|aldi|lidl|morrisons|waitrose|restaurant|cafe|coffee|bakery|pub|bar|mcdonald|burger|pizza|food|kfc|greggs/.test(text)) {
    return { category: 'Food & Drink', confidence: 'high' };
  }
  if (/parking|car park|ncp|ringgo|ringo|paybyphone|justpark|apcoa|q-park|q park/.test(text)) {
    return { category: 'Travel', travelDetail: 'Parking', confidence: 'high' };
  }
  if (/gridserve|instavolt|ionity|tesla supercharger|chargepoint|ev charge|electric charging|charger/.test(text)) {
    return { category: 'Travel', travelDetail: 'EV charging', confidence: 'high' };
  }
  if (/shell|bp |esso|texaco|fuel|petrol|diesel/.test(text)) {
    return { category: 'Travel', travelDetail: 'Fuel', confidence: 'high' };
  }
  if (/train|rail|bus|coach|tram|underground|tube|transport for london|tfl/.test(text)) {
    return { category: 'Travel', travelDetail: 'Public transport', confidence: 'high' };
  }
  if (/toll|dart charge|dartford|merseyflow/.test(text)) {
    return { category: 'Travel', travelDetail: 'Tolls', confidence: 'high' };
  }
  if (/uber|taxi|bolt|free now/.test(text)) {
    return { category: 'Travel', travelDetail: 'Taxi', confidence: 'high' };
  }
  if (/service station|services/.test(text)) {
    return { category: 'Travel', travelDetail: 'General travel', confidence: 'medium' };
  }
  if (/amazon|shop|store|gift|souvenir|clothes|boots|superdrug/.test(text)) {
    return { category: 'Shopping', confidence: 'medium' };
  }
  return { category: 'Other', confidence: 'low' };
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header === alias || header.includes(alias)));
}

const descriptionHeaderAliases = [
  'description',
  'transaction description',
  'merchant',
  'merchant name',
  'payee',
  'payee name',
  'details',
  'transaction details',
  'narrative',
  'memo',
  'reference',
  'payment reference',
  'transaction reference',
  'particulars',
  'additional details',
  'additional information',
  'counterparty',
  'counterparty name',
  'beneficiary',
  'name',
];

const secondaryDescriptionAliases = [
  'type',
  'transaction type',
  'payment type',
  'method',
  'category',
  'card',
  'card number',
];

function findDescriptionColumns(headers: string[], sampleRows: string[][], excludedIndexes: Set<number>) {
  const preferred = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) =>
      !excludedIndexes.has(index) &&
      descriptionHeaderAliases.some((alias) => header === alias || header.includes(alias)),
    )
    .map(({ index }) => index);

  const secondary = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) =>
      !excludedIndexes.has(index) &&
      !preferred.includes(index) &&
      secondaryDescriptionAliases.some((alias) => header === alias || header.includes(alias)),
    )
    .map(({ index }) => index);

  if (preferred.length > 0) return [...preferred, ...secondary].slice(0, 4);

  // Fallback for bank exports with unfamiliar headings: choose columns that contain
  // non-numeric, merchant-like text across the first few transactions.
  const scored = headers
    .map((_, index) => {
      if (excludedIndexes.has(index)) return { index, score: -1 };
      let score = 0;
      for (const row of sampleRows) {
        const value = (row[index] ?? '').trim();
        if (!value) continue;
        if (/[A-Za-z]{2,}/.test(value)) score += 3;
        if (/\s/.test(value)) score += 1;
        if (/^[+-]?[£$€]?\s*[\d,.]+$/.test(value)) score -= 4;
        if (/^\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}$/.test(value)) score -= 4;
      }
      return { index, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.index);

  return scored.slice(0, 3);
}

function buildDescription(cells: string[], indexes: number[]) {
  const parts = indexes
    .map((index) => (cells[index] ?? '').trim())
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

  return parts.join(' · ') || 'Bank transaction';
}

function parseStatementCsv(text: string, holiday: Holiday): ImportedTransaction[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('The CSV does not contain any transaction rows.');

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);
  const dateIndex = findColumn(headers, ['transaction date', 'date', 'posted date', 'posting date', 'booking date', 'value date']);
  const amountIndex = findColumn(headers, ['amount', 'transaction amount', 'value']);
  const debitIndex = findColumn(headers, ['debit', 'money out', 'paid out', 'withdrawal', 'debit amount']);
  const creditIndex = findColumn(headers, ['credit', 'money in', 'paid in', 'deposit', 'credit amount']);
  const excludedIndexes = new Set([dateIndex, amountIndex, debitIndex, creditIndex].filter((index) => index >= 0));
  const sampleRows = lines.slice(1, 16).map(splitCsvLine);
  const descriptionIndexes = findDescriptionColumns(headers, sampleRows, excludedIndexes);

  if (dateIndex < 0 || (amountIndex < 0 && debitIndex < 0)) {
    throw new Error('I could not identify Date and Amount/Money Out columns in this CSV.');
  }

  const periodEnd = addDays(holiday.endDate, 2);
  const rows: ImportedTransaction[] = [];

  lines.slice(1).forEach((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const date = parseStatementDate(cells[dateIndex] ?? '');
    if (!date || date < holiday.startDate || date > periodEnd) return;

    const description = buildDescription(cells, descriptionIndexes);
    let amount = NaN;
    if (debitIndex >= 0 && cells[debitIndex]) amount = Math.abs(parseMoneyValue(cells[debitIndex]));
    if (!Number.isFinite(amount) && amountIndex >= 0) amount = parseMoneyValue(cells[amountIndex] ?? '');
    if (!Number.isFinite(amount)) return;

    // Bank exports vary: spending may be negative in a single Amount column.
    if (amountIndex >= 0 && debitIndex < 0) {
      const rawAmount = parseMoneyValue(cells[amountIndex] ?? '');
      if (rawAmount > 0 && creditIndex >= 0 && cells[creditIndex]) return;
      amount = Math.abs(rawAmount);
    }
    if (amount <= 0) return;

    const suggestion = suggestCategory(description);
    const afterHoliday = date > holiday.endDate;
    const needsReview = afterHoliday || suggestion.confidence !== 'high';
    const selected = !afterHoliday;

    rows.push({
      id: `import-${rowIndex}-${date}-${amount}`,
      date,
      description,
      amount,
      category: suggestion.category,
      activityDetail: suggestion.activityDetail,
      travelDetail: suggestion.travelDetail,
      selected,
      confidence: afterHoliday ? 'low' : suggestion.confidence,
      needsReview,
    });
  });

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

function ImportSelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
      {selected && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

export function StatementImportPage() {
  const { id } = useParams<{ id: string }>();
  const { holidays, addExpenses, isHydrated } = useHolidayData();
  const [, setLocation] = useLocation();
  const holiday = holidays.find((item) => item.id === id);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  if (!isHydrated) return <PageShell><p className="text-sm text-slate-400">Loading…</p></PageShell>;
  if (!holiday) return <PageShell><Link href="/" className="text-sm font-medium text-orange-600">← Our trips</Link><h1 className="mt-8 text-3xl font-bold">Holiday not found</h1></PageShell>;

  const selectedTransactions = transactions.filter((transaction) => transaction.selected);
  const selectedTotal = selectedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const reviewTransactions = transactions.filter((transaction) => transaction.needsReview);
  const statementEnd = addDays(holiday.endDate, 2);

  const changeSelection = (transactionId: string) => {
    setReviewConfirmed(false);
    setTransactions((current) => current.map((transaction) => transaction.id === transactionId ? { ...transaction, selected: !transaction.selected } : transaction));
  };

  const changeCategory = (transactionId: string, category: Category) => {
    setReviewConfirmed(false);
    setTransactions((current) => current.map((transaction) => transaction.id === transactionId ? {
      ...transaction,
      category,
      activityDetail: category === 'Activities' ? (transaction.activityDetail ?? 'General activity') : undefined,
      travelDetail: category === 'Travel' ? (transaction.travelDetail ?? 'General travel') : undefined,
    } : transaction));
  };

  const changeActivity = (transactionId: string, detail: string) => {
    setReviewConfirmed(false);
    setTransactions((current) => current.map((transaction) => transaction.id === transactionId ? { ...transaction, activityDetail: detail } : transaction));
  };

  const changeTravel = (transactionId: string, detail: string) => {
    setReviewConfirmed(false);
    setTransactions((current) => current.map((transaction) => transaction.id === transactionId ? { ...transaction, travelDetail: detail } : transaction));
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setReviewConfirmed(false);
    try {
      const text = await file.text();
      const parsed = parseStatementCsv(text, holiday);
      if (parsed.length === 0) throw new Error(`No spending transactions were found during the holiday or within the two-day pending-payment window (${formatDate(holiday.startDate)}–${formatDate(statementEnd)}).`);
      setTransactions(parsed);
      setFileName(file.name);
    } catch (err) {
      setTransactions([]);
      setFileName('');
      setError(err instanceof Error ? err.message : 'This statement could not be read.');
    }
  };

  const finishImport = () => {
    addExpenses(selectedTransactions.map((transaction) => ({
      holidayId: holiday.id,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      activityDetail: transaction.category === 'Activities' ? transaction.activityDetail : undefined,
      travelDetail: transaction.category === 'Travel' ? transaction.travelDetail : undefined,
      note: `Imported from ${fileName}`,
    })));
    setLocation(`/holiday/${holiday.id}`);
  };

  return (
    <PageShell>
      <button onClick={() => setLocation(`/holiday/${holiday.id}`)} className="mb-7 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"><ArrowLeft size={16} /> {holiday.name}</button>

      <header className="mb-7">
        <p className="mb-2 text-sm font-medium text-orange-600 dark:text-orange-400">{holiday.name}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Import statement</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Import a CSV bank statement, review the suggested holiday transactions and only add them once you're happy.</p>
      </header>

      {transactions.length === 0 ? (
        <>
          <section className="mb-6 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-50">Statement period</p>
            <p className="mt-2 text-xl font-semibold">{formatDate(holiday.startDate, true)}–{formatDate(statementEnd, true)}</p>
            <p className="mt-2 text-sm leading-6 text-orange-100">Transactions dated during the holiday and up to two days afterwards are included, so delayed or pending card payments can still be reviewed.</p>
          </section>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center transition hover:border-orange-400 dark:border-slate-700 dark:bg-[#14171a] dark:hover:border-orange-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"><Upload size={21} /></span>
            <span className="mt-4 text-base font-semibold">Choose CSV statement</span>
            <span className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">Download a CSV from your bank containing the holiday period. Common Date, Description, Amount and Money Out formats are recognised.</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void loadFile(event.target.files?.[0])} />
          </label>

          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <button onClick={() => setLocation(`/holiday/${holiday.id}`)} className="mt-4 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900">Cancel</button>
        </>
      ) : (
        <>
          <section className="mb-7 rounded-3xl bg-orange-500 p-6 text-white shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-orange-50">Statement period</p><p className="mt-2 text-xl font-semibold">{formatDate(holiday.startDate, true)}–{formatDate(statementEnd, true)}</p><p className="mt-1 text-sm text-orange-100">{transactions.length} transactions found · {fileName}</p></div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Receipt size={18} /></span>
            </div>
            <div className="mt-6 border-t border-orange-400/50 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-orange-100">Selected for holiday</p><p className="mt-1 text-3xl font-bold">{money.format(selectedTotal)}</p></div>
          </section>

          <section className={`mb-7 rounded-3xl border p-5 shadow-sm ${reviewConfirmed ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-orange-200 bg-orange-50 dark:border-orange-800/60 dark:bg-orange-950/30'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white ${reviewConfirmed ? 'text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400' : 'text-orange-600 dark:bg-orange-950/70 dark:text-orange-400'}`}>{reviewConfirmed ? <Check size={20} /> : <CircleHelp size={20} />}</div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${reviewConfirmed ? 'text-emerald-950 dark:text-emerald-100' : 'text-orange-950 dark:text-orange-100'}`}>{reviewConfirmed ? 'Review confirmed' : reviewTransactions.length ? `${reviewTransactions.length} transactions need checking` : 'Check the statement before importing'}</p>
                <p className={`mt-1 text-xs leading-5 ${reviewConfirmed ? 'text-emerald-900/70 dark:text-emerald-200/70' : 'text-orange-900/70 dark:text-orange-200/70'}`}>{reviewConfirmed ? 'Your selections are ready to add to this holiday.' : 'Change a category if needed or untick a transaction to exclude it. Highlighted rows stay marked until you confirm the review.'}</p>
                {!reviewConfirmed && <div className="mt-3 flex items-center gap-4"><div className="flex items-center gap-2"><ImportSelectionIndicator selected /><span className="text-xs font-medium text-orange-900/70 dark:text-orange-200/70">Included</span></div><div className="flex items-center gap-2"><ImportSelectionIndicator selected={false} /><span className="text-xs font-medium text-orange-900/70 dark:text-orange-200/70">Excluded</span></div></div>}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between px-1"><div><h2 className="text-lg font-semibold">Transactions</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{reviewConfirmed ? 'Review complete.' : 'Check the highlighted transactions before importing.'}</p></div><span className="text-xs font-medium text-slate-400">{selectedTransactions.length} selected</span></div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#14171a]">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((transaction) => {
                  const highlighted = transaction.needsReview && !reviewConfirmed;
                  return (
                    <div key={transaction.id} className={`relative px-5 py-5 transition ${!transaction.selected ? 'bg-slate-50/70 dark:bg-slate-900/30' : highlighted ? 'bg-orange-100 dark:bg-orange-950/40' : ''}`}>
                      {highlighted && <span className="absolute bottom-0 left-0 top-0 w-1 bg-orange-500" />}
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                        <button
                          type="button"
                          onClick={() => changeSelection(transaction.id)}
                          aria-label={transaction.selected ? `Exclude ${transaction.description}` : `Include ${transaction.description}`}
                          className="mt-0.5"
                        >
                          <ImportSelectionIndicator selected={transaction.selected} />
                        </button>

                        <div className="min-w-0 pt-0.5">
                          <p className="truncate text-sm font-semibold leading-5">
                            {transaction.description}
                          </p>
                        </div>

                        <div className="min-w-[6.25rem] shrink-0 text-right">
                          <div className="inline-flex flex-col items-center">
                            <p className="text-sm font-semibold tabular-nums">
                              {money.format(transaction.amount)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {formatDate(transaction.date, true)}
                            </p>
                          </div>
                          <div className="mt-1 flex min-h-5 justify-end">
                            {highlighted ? (
                              <span className="inline-flex rounded-full bg-orange-300 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-900 dark:bg-orange-800 dark:text-orange-100">
                                Review
                              </span>
                            ) : transaction.date > holiday.endDate ? (
                              <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">
                                Pending window
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {transaction.selected ? (
                        <div className="mt-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Category</p>
                          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                            {(['Accommodation', ...spendCategories] as Category[]).map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => changeCategory(transaction.id, category)}
                                className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-center text-xs font-medium transition ${
                                  transaction.category === category
                                    ? 'border-orange-500 bg-orange-500 text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:text-slate-300 dark:hover:border-orange-500 dark:hover:text-orange-400'
                                }`}
                              >
                                <CategoryGlyph category={category} size={13} />
                                <span className="leading-tight">{category}</span>
                              </button>
                            ))}
                          </div>
                          {transaction.category === 'Activities' && <div className="mt-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Activity type</p><div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                              {ACTIVITY_DETAILS.map((detail) => (
                                <button
                                  key={detail}
                                  type="button"
                                  onClick={() => changeActivity(transaction.id, detail)}
                                  className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-center text-xs font-medium transition ${
                                    transaction.activityDetail === detail
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  <ActivityGlyph detail={detail} size={13} />
                                  <span className="leading-tight">{detail}</span>
                                </button>
                              ))}
                            </div></div>}
                          {transaction.category === 'Travel' && <div className="mt-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Travel type</p><div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                              {TRAVEL_DETAILS.map((detail) => (
                                <button
                                  key={detail}
                                  type="button"
                                  onClick={() => changeTravel(transaction.id, detail)}
                                  className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-center text-xs font-medium transition ${
                                    transaction.travelDetail === detail
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  <TravelGlyph detail={detail} size={13} />
                                  <span className="leading-tight">{detail}</span>
                                </button>
                              ))}
                            </div></div>}
                        </div>
                      ) : <div className="mt-3"><span className="text-xs text-slate-400">Excluded from holiday</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-7">
            {!reviewConfirmed ? <button onClick={() => setReviewConfirmed(true)} className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">Confirm review</button> : <><div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20"><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">✓ Review complete</p><p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-300/70">{selectedTransactions.length} expenses · {money.format(selectedTotal)}</p></div><button onClick={finishImport} disabled={selectedTransactions.length === 0} className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">Add {selectedTransactions.length} expenses</button></>}
            <label className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900">Choose a different statement<input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void loadFile(event.target.files?.[0])} /></label>
            <button onClick={() => setLocation(`/holiday/${holiday.id}`)} className="mt-1 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900">Cancel import</button>
          </section>
        </>
      )}
    </PageShell>
  );
}
