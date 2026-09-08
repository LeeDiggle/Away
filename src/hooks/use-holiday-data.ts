import { useCallback, useEffect, useMemo, useState } from 'react';

export const CATEGORIES = [
  'Accommodation',
  'Food & Drink',
  'Travel',
  'Activities',
  'Shopping',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const ACTIVITY_DETAILS = [
  'General activity',
  'Arcade',
  'Theme park',
  'Attraction',
  'Beach',
  'Swimming',
  'Other activity',
] as const;

export type ActivityDetail = (typeof ACTIVITY_DETAILS)[number];

export const TRAVEL_DETAILS = [
  'General travel',
  'Parking',
  'EV charging',
  'Fuel',
  'Public transport',
  'Tolls',
  'Taxi',
  'Other travel',
] as const;

export type TravelDetail = (typeof TRAVEL_DETAILS)[number];

export type Holiday = {
  id: string;
  name: string;
  location?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  holidayId: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  activityDetail?: ActivityDetail | string;
  travelDetail?: TravelDetail | string;
  note?: string;
  createdAt: string;
};

type StoredData = {
  holidays: Holiday[];
  expenses: Expense[];
};

export type AwayBackup = {
  app: 'Away';
  version: 1;
  exportedAt: string;
  data: StoredData;
};

const STORAGE_KEY = 'holiday-companion-data-v2';
const LEGACY_STORAGE_KEY = 'holiday-companion-data-v1';

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCategory(category: string): { category: Category; activityDetail?: string; travelDetail?: string } {
  switch (category) {
    case 'Accommodation':
      return { category: 'Accommodation' };
    case 'Food & Drink':
    case 'Groceries':
      return { category: 'Food & Drink' };
    case 'Travel':
      return { category: 'Travel' };
    case 'EV Charging':
      return { category: 'Travel', travelDetail: 'EV charging' };
    case 'Fuel':
      return { category: 'Travel', travelDetail: 'Fuel' };
    case 'Parking':
      return { category: 'Travel', travelDetail: 'Parking' };
    case 'Activities':
      return { category: 'Activities' };
    case 'Arcade':
      return { category: 'Activities', activityDetail: 'Arcade' };
    case 'Shopping':
      return { category: 'Shopping' };
    default:
      return { category: 'Other' };
  }
}


function inferTravelDetail(description: string): TravelDetail | undefined {
  const text = description.toLowerCase();
  if (/parking|car park|ncp|ringgo|ringo|paybyphone|justpark|apcoa|q-park|q park/.test(text)) return 'Parking';
  if (/gridserve|instavolt|ionity|tesla supercharger|chargepoint|ev charge|electric charging|charger/.test(text)) return 'EV charging';
  if (/shell|bp |esso|texaco|fuel|petrol|diesel/.test(text)) return 'Fuel';
  if (/train|rail|bus|coach|tram|underground|tube|transport for london|tfl/.test(text)) return 'Public transport';
  if (/toll|dart charge|dartford|merseyflow/.test(text)) return 'Tolls';
  if (/uber|taxi|bolt|free now/.test(text)) return 'Taxi';
  return undefined;
}

function normalizeStored(input: unknown): StoredData {
  const parsed = (input ?? {}) as Partial<StoredData>;
  const holidays = Array.isArray(parsed.holidays)
    ? parsed.holidays.map((holiday) => ({ ...holiday }))
    : [];

  const expenses = Array.isArray(parsed.expenses)
    ? parsed.expenses.map((expense) => {
        const raw = expense as Expense & { category?: string };
        const normalized = normalizeCategory(raw.category ?? 'Other');
        return {
          ...raw,
          category: normalized.category,
          activityDetail: raw.activityDetail ?? normalized.activityDetail,
          travelDetail:
            raw.travelDetail ??
            normalized.travelDetail ??
            (normalized.category === 'Travel' ? inferTravelDetail(raw.description ?? '') : undefined),
        } as Expense;
      })
    : [];

  return { holidays, expenses };
}

function readStored(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { holidays: [], expenses: [] };
    return normalizeStored(JSON.parse(raw));
  } catch {
    return { holidays: [], expenses: [] };
  }
}

function writeStored(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The UI remains usable if storage is unavailable or full.
  }
}

function parseBackup(input: unknown): StoredData {
  if (!input || typeof input !== 'object') throw new Error('Invalid Away backup.');
  const candidate = input as Partial<AwayBackup> & Partial<StoredData>;
  const raw = candidate.data ?? candidate;
  if (!raw || !Array.isArray((raw as Partial<StoredData>).holidays) || !Array.isArray((raw as Partial<StoredData>).expenses)) {
    throw new Error('Invalid Away backup.');
  }
  return normalizeStored(raw);
}

export function useHolidayData() {
  const [data, setData] = useState<StoredData>(() => readStored());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeStored(data);
  }, [data, isHydrated]);

  const createHoliday = useCallback(
    (input: Pick<Holiday, 'name' | 'location' | 'startDate' | 'endDate'>) => {
      const holiday: Holiday = {
        ...input,
        id: makeId('holiday'),
        createdAt: new Date().toISOString(),
      };
      const next = { ...data, holidays: [holiday, ...data.holidays] };
      writeStored(next);
      setData(next);
      return holiday;
    },
    [data],
  );

  const updateHoliday = useCallback(
    (id: string, updates: Partial<Pick<Holiday, 'name' | 'location' | 'startDate' | 'endDate'>>) => {
      const next = {
        ...data,
        holidays: data.holidays.map((holiday) =>
          holiday.id === id ? { ...holiday, ...updates } : holiday,
        ),
      };
      writeStored(next);
      setData(next);
    },
    [data],
  );

  const deleteHoliday = useCallback(
    (id: string) => {
      const next = {
        holidays: data.holidays.filter((holiday) => holiday.id !== id),
        expenses: data.expenses.filter((expense) => expense.holidayId !== id),
      };
      writeStored(next);
      setData(next);
    },
    [data],
  );

  const addExpense = useCallback(
    (input: Omit<Expense, 'id' | 'createdAt'>) => {
      const expense: Expense = {
        ...input,
        id: makeId('expense'),
        createdAt: new Date().toISOString(),
      };
      const next = { ...data, expenses: [expense, ...data.expenses] };
      writeStored(next);
      setData(next);
      return expense;
    },
    [data],
  );

  const addExpenses = useCallback(
    (inputs: Array<Omit<Expense, 'id' | 'createdAt'>>) => {
      const created = inputs.map((input) => ({
        ...input,
        id: makeId('expense'),
        createdAt: new Date().toISOString(),
      }));
      const next = { ...data, expenses: [...created, ...data.expenses] };
      writeStored(next);
      setData(next);
      return created;
    },
    [data],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Omit<Expense, 'id' | 'holidayId' | 'createdAt'>>) => {
      const next = {
        ...data,
        expenses: data.expenses.map((expense) =>
          expense.id === id ? { ...expense, ...updates } : expense,
        ),
      };
      writeStored(next);
      setData(next);
    },
    [data],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const next = {
        ...data,
        expenses: data.expenses.filter((expense) => expense.id !== id),
      };
      writeStored(next);
      setData(next);
    },
    [data],
  );

  const createBackup = useCallback((): AwayBackup => ({
    app: 'Away',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      holidays: data.holidays.map((holiday) => ({ ...holiday })),
      expenses: data.expenses.map((expense) => ({ ...expense })),
    },
  }), [data]);

  const restoreBackup = useCallback((input: unknown) => {
    const restored = parseBackup(input);
    writeStored(restored);
    setData(restored);
    return restored;
  }, []);

  const totals = useMemo(
    () =>
      data.holidays.reduce<Record<string, number>>((acc, holiday) => {
        acc[holiday.id] = data.expenses
          .filter((expense) => expense.holidayId === holiday.id)
          .reduce((sum, expense) => sum + expense.amount, 0);
        return acc;
      }, {}),
    [data.expenses, data.holidays],
  );

  return {
    holidays: data.holidays,
    expenses: data.expenses,
    totals,
    isHydrated,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
    createBackup,
    restoreBackup,
  };
}
