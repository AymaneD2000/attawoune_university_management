import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  ClockIcon,
  CreditCardIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DashboardData } from '../../services/financeService';
import { StatusPill } from '../../components/common/EntityDisplay';

interface FinanceAnalyticsProps {
  data: DashboardData | null;
}

type ChartMode = 'cashflow' | 'net';

const palette = ['#1A4C91', '#1BAB53', '#E59741', '#6A310D', '#64748B', '#DC2626'];

const numberValue = (value: number | string | null | undefined) => Number(value || 0);

const FinanceAnalytics: React.FC<FinanceAnalyticsProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const [chartMode, setChartMode] = useState<ChartMode>('cashflow');

  const formatCurrency = (value: number | string) => new Intl.NumberFormat(
    i18n.language.startsWith('ar') ? 'ar' : 'fr-FR',
    { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 },
  ).format(numberValue(value));

  const formatCompact = (value: number | string) => new Intl.NumberFormat(
    i18n.language.startsWith('ar') ? 'ar' : 'fr-FR',
    { notation: 'compact', maximumFractionDigits: 1 },
  ).format(numberValue(value));

  const formatMonth = (month: string) => {
    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber) return month;
    return new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(year, monthNumber - 1, 1));
  };

  const monthlyData = useMemo(() => data?.monthly_cash_flow || [], [data?.monthly_cash_flow]);
  const maxCashFlow = Math.max(
    1,
    ...monthlyData.flatMap((item) => [
      numberValue(item.revenue),
      numberValue(item.salaries),
      numberValue(item.expenses),
    ]),
  );

  const netChart = useMemo(() => {
    const width = 900;
    const height = 250;
    const paddingX = 44;
    const paddingY = 28;
    const values = monthlyData.map((item) => numberValue(item.net));
    const maxAbsolute = Math.max(1, ...values.map(Math.abs));
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;
    const zeroY = height / 2;
    const points = values.map((value, index) => ({
      x: monthlyData.length <= 1 ? width / 2 : paddingX + (index / (monthlyData.length - 1)) * usableWidth,
      y: zeroY - (value / maxAbsolute) * (usableHeight / 2),
      value,
      item: monthlyData[index],
    }));
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = points.length > 0
      ? `${line} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`
      : '';
    return { width, height, zeroY, points, line, area, maxAbsolute };
  }, [monthlyData]);

  const methodGradient = useMemo(() => {
    const methods = data?.payment_methods || [];
    let cursor = 0;
    const segments = methods.map((method, index) => {
      const start = cursor;
      cursor += Number(method.percentage || 0);
      return `${palette[index % palette.length]} ${start}% ${cursor}%`;
    });
    return segments.length ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#e2e8f0 0 100%)';
  }, [data?.payment_methods]);

  const expectedRevenue = numberValue(data?.expected_revenue)
    || numberValue(data?.total_tuition_collected) + numberValue(data?.outstanding_balances);
  const collectionRate = Math.min(100, Math.max(0, Number(data?.collection_rate || 0)));
  const circumference = 2 * Math.PI * 52;
  const collected = numberValue(data?.total_tuition_collected);
  const totalOutflow = numberValue(data?.total_salaries_paid) + numberValue(data?.total_expenses);

  const metricCards = [
    {
      label: t('finance.dashboard.collected_revenue', 'Revenus collectés'),
      value: collected,
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      tone: 'bg-green-50 text-green-700 ring-green-100',
    },
    {
      label: t('finance.dashboard.total_expenses', 'Dépenses totales'),
      value: numberValue(data?.total_expenses),
      icon: <ArrowTrendingDownIcon className="h-6 w-6" />,
      tone: 'bg-red-50 text-red-600 ring-red-100',
    },
    {
      label: t('finance.dashboard.salaries_paid', 'Salaires versés'),
      value: numberValue(data?.total_salaries_paid),
      icon: <UserGroupIcon className="h-6 w-6" />,
      tone: 'bg-blue-50 text-blue-700 ring-blue-100',
    },
    {
      label: t('finance.dashboard.outstanding', 'Reste à recouvrer'),
      value: numberValue(data?.outstanding_balances),
      icon: <CreditCardIcon className="h-6 w-6" />,
      tone: 'bg-orange-50 text-brand-earth ring-orange-100',
    },
  ];

  const statusTone = (status: string): 'green' | 'orange' | 'red' | 'slate' => ({
    COMPLETED: 'green',
    PENDING: 'orange',
    FAILED: 'red',
    REFUNDED: 'slate',
  }[status] as 'green' | 'orange' | 'red' | 'slate') || 'slate';

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article key={metric.label} className="surface-panel flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-4 ${metric.tone}`}>
              {metric.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
              <p className="mt-1 truncate text-xl font-black text-slate-950">{formatCurrency(metric.value)}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(310px,1fr)]">
        <article className="surface-panel overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="brand-kicker">{data?.current_year || t('finance.dashboard.annual', 'Annuel')}</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">{t('finance.analytics.cash_flow', 'Évolution des flux financiers')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('finance.analytics.cash_flow_hint', 'Encaissements, salaires et dépenses mois par mois.')}</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setChartMode('cashflow')}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${chartMode === 'cashflow' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                {t('finance.analytics.flows', 'Flux')}
              </button>
              <button
                type="button"
                onClick={() => setChartMode('net')}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${chartMode === 'net' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                {t('finance.analytics.net_trend', 'Solde net')}
              </button>
            </div>
          </header>

          <div className="p-5">
            {monthlyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400">
                {t('finance.analytics.no_chart_data', 'Pas encore de données pour cette période.')}
              </div>
            ) : chartMode === 'cashflow' ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex h-64 min-w-[720px] items-end gap-2 border-b border-slate-200 px-2 pt-8">
                  {monthlyData.map((item) => (
                    <div key={item.month} className="group flex h-full min-w-12 flex-1 flex-col justify-end">
                      <div className="flex flex-1 items-end justify-center gap-1">
                        {[
                          { key: 'revenue', value: item.revenue, color: 'bg-green-500' },
                          { key: 'salaries', value: item.salaries, color: 'bg-blue-600' },
                          { key: 'expenses', value: item.expenses, color: 'bg-orange-500' },
                        ].map((bar) => (
                          <div
                            key={bar.key}
                            title={`${t(`finance.analytics.${bar.key}`, bar.key)}: ${formatCurrency(bar.value)}`}
                            className={`w-2.5 rounded-t-md transition-all duration-300 group-hover:opacity-80 ${bar.color}`}
                            style={{ height: `${Math.max(numberValue(bar.value) > 0 ? 3 : 0, numberValue(bar.value) / maxCashFlow * 100)}%` }}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-center text-[11px] font-bold capitalize text-slate-400">{formatMonth(item.month)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${netChart.width} ${netChart.height}`} className="min-w-[720px] w-full" role="img" aria-label={t('finance.analytics.net_trend', 'Évolution du solde net')}>
                  <defs>
                    <linearGradient id="financeNetArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A4C91" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#1A4C91" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <line x1="44" x2="856" y1={netChart.zeroY} y2={netChart.zeroY} stroke="#cbd5e1" strokeDasharray="6 6" />
                  <text x="8" y={netChart.zeroY + 4} fill="#94a3b8" fontSize="12">0</text>
                  {netChart.area && <path d={netChart.area} fill="url(#financeNetArea)" />}
                  {netChart.line && <path d={netChart.line} fill="none" stroke="#1A4C91" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
                  {netChart.points.map((point) => (
                    <g key={point.item.month}>
                      <circle cx={point.x} cy={point.y} r="6" fill={point.value >= 0 ? '#1BAB53' : '#DC2626'} stroke="white" strokeWidth="3">
                        <title>{`${formatMonth(point.item.month)}: ${formatCurrency(point.value)}`}</title>
                      </circle>
                      <text x={point.x} y="240" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700">{formatMonth(point.item.month)}</text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />{t('finance.analytics.revenue', 'Encaissements')}</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />{t('finance.analytics.salaries', 'Salaires')}</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />{t('finance.analytics.expenses', 'Dépenses')}</span>
            </div>
          </div>
        </article>

        <article className="surface-panel flex flex-col overflow-hidden">
          <header className="border-b border-slate-100 px-5 py-5">
            <p className="brand-kicker">{t('finance.analytics.collection', 'Recouvrement')}</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{t('finance.analytics.collection_rate', 'Taux d’encaissement')}</h3>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#1BAB53"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - collectionRate / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-950">{collectionRate.toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400">{t('finance.analytics.collected', 'encaissé')}</span>
              </div>
            </div>
            <div className="mt-6 w-full space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-500">{t('finance.dashboard.expected_revenue', 'Revenu attendu')}</span>
                <span className="font-black text-slate-900">{formatCurrency(expectedRevenue)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-500">{t('finance.analytics.total_outflow', 'Décaissements')}</span>
                <span className="font-black text-brand-earth">{formatCurrency(totalOutflow)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
                <span className="font-semibold text-slate-500">{t('finance.dashboard.net_balance', 'Solde net')}</span>
                <span className={`font-black ${numberValue(data?.net_balance) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(data?.net_balance || 0)}</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="surface-panel overflow-hidden">
          <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-brand-earth"><ChartBarSquareIcon className="h-5 w-5" /></div>
            <div>
              <h3 className="font-black text-slate-950">{t('finance.analytics.expense_breakdown', 'Répartition des dépenses')}</h3>
              <p className="text-xs text-slate-500">{t('finance.analytics.expense_breakdown_hint', 'Poids de chaque catégorie dans les dépenses.')}</p>
            </div>
          </header>
          <div className="space-y-4 p-5">
            {(data?.expense_categories || []).length === 0 ? (
              <p className="py-10 text-center text-sm font-semibold text-slate-400">{t('finance.analytics.no_expenses', 'Aucune dépense enregistrée.')}</p>
            ) : data?.expense_categories.map((category, index) => (
              <div key={category.category}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="truncate font-bold text-slate-700">{t(`finance.expense_categories.${category.category}`, category.label)}</span>
                    <span className="text-xs font-semibold text-slate-400">({category.count})</span>
                  </div>
                  <span className="shrink-0 font-black text-slate-900">{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${category.percentage}%`, backgroundColor: palette[index % palette.length] }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel overflow-hidden">
          <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><ChartPieIcon className="h-5 w-5" /></div>
            <div>
              <h3 className="font-black text-slate-950">{t('finance.analytics.payment_methods', 'Modes de paiement')}</h3>
              <p className="text-xs text-slate-500">{t('finance.analytics.payment_methods_hint', 'Origine des encaissements complétés.')}</p>
            </div>
          </header>
          <div className="grid grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[180px_1fr]">
            <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: methodGradient }}>
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <BanknotesIcon className="h-6 w-6 text-blue-700" />
                <span className="mt-1 text-xs font-black text-slate-500">{formatCompact(collected)}</span>
              </div>
            </div>
            <div className="space-y-3">
              {(data?.payment_methods || []).length === 0 ? (
                <p className="text-center text-sm font-semibold text-slate-400">{t('finance.analytics.no_payments', 'Aucun paiement complété.')}</p>
              ) : data?.payment_methods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-700">{t(`finance.payment_methods.${method.method}`, method.label)}</p>
                      <p className="text-xs font-semibold text-slate-400">{method.count} {t('finance.analytics.transactions', 'transaction(s)')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">{method.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {(data?.payment_statuses || []).length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {data?.payment_statuses.map((status) => (
                  <StatusPill key={status.status} tone={statusTone(status.status)} dot>
                    {t(`finance.status.${status.status}`, status.label)} · {status.count}
                  </StatusPill>
                ))}
                {numberValue(data?.pending_payments_count) > 0 && (
                  <span className="ms-auto inline-flex items-center gap-1.5 text-xs font-bold text-orange-700">
                    <ClockIcon className="h-4 w-4" />
                    {data?.pending_payments_count} {t('finance.analytics.pending', 'en attente')}
                  </span>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default FinanceAnalytics;
