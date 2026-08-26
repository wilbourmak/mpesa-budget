import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BudgetRecord,
  CategorySpend,
  MonthSummary,
  TransactionRecord,
  getCategorySpend,
  getMonthSummary,
  listBudgets,
  listTransactions,
} from '../db';
import { monthKey } from '../lib/format';

interface AppData {
  month: string;
  setMonth: (month: string) => void;
  loading: boolean;
  transactions: TransactionRecord[];
  budgets: BudgetRecord[];
  categorySpend: CategorySpend[];
  summary: MonthSummary;
  refresh: () => Promise<void>;
}

interface MonthSnapshot {
  transactions: TransactionRecord[];
  budgets: BudgetRecord[];
  categorySpend: CategorySpend[];
  summary: MonthSummary;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(() => monthKey());
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [summary, setSummary] = useState<MonthSummary>({
    month,
    moneyIn: 0,
    moneyOut: 0,
    fees: 0,
    transactionCount: 0,
  });

  const load = useCallback(async (): Promise<MonthSnapshot> => {
    const [nextTransactions, nextBudgets, nextSpend, nextSummary] = await Promise.all([
      listTransactions(month),
      listBudgets(month),
      getCategorySpend(month),
      getMonthSummary(month),
    ]);
    return {
      transactions: nextTransactions,
      budgets: nextBudgets,
      categorySpend: nextSpend,
      summary: nextSummary,
    };
  }, [month]);

  const apply = useCallback((snapshot: MonthSnapshot) => {
    setTransactions(snapshot.transactions);
    setBudgets(snapshot.budgets);
    setCategorySpend(snapshot.categorySpend);
    setSummary(snapshot.summary);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    apply(await load());
  }, [apply, load]);

  useEffect(() => {
    let active = true;
    void load().then((snapshot) => {
      if (active) apply(snapshot);
    });
    return () => {
      active = false;
    };
  }, [apply, load]);

  const value = useMemo(
    () => ({ month, setMonth, loading, transactions, budgets, categorySpend, summary, refresh }),
    [month, loading, transactions, budgets, categorySpend, summary, refresh]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside an AppDataProvider');
  return context;
}
