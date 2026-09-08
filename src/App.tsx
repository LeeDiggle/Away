import { useEffect, useState } from 'react';
import { Route, Router, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AddSpendingPage, AnalysisPage, DashboardPage, HolidayDetailPage, SettingsPage, StatementImportPage } from '@/pages/holiday-tracker';
import NotFound from '@/pages/not-found';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setIsDarkMode(mediaQuery.matches);
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0b0d0f] dark:text-slate-100">
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={DashboardPage} />
          <Route path="/analysis" component={AnalysisPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/holiday/:id/expense/:expenseId/edit" component={AddSpendingPage} />
          <Route path="/holiday/:id/add" component={AddSpendingPage} />
          <Route path="/holiday/:id/import" component={StatementImportPage} />
          <Route path="/holiday/:id" component={HolidayDetailPage} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </div>
    </div>
  );
}
