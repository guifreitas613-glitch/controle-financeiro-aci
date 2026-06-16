import React, { useState, useMemo, useRef, FC } from 'react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    PieChart, 
    Pie, 
    Cell, 
    Legend 
} from 'recharts';
import { 
    Transaction, 
    Goal, 
    IncomeCategory, 
    ExpenseCategory, 
    CostCenter, 
    Advisor, 
    ImportedRevenue, 
    TransactionType, 
    ExpenseStatus, 
    ExpenseNature, 
    CategoryStructuralType, 
    DashboardViewProps,
    TransactionFormValues 
} from '../types';
import { Card, Button, Modal, CheckCircleIcon } from './UIComponents';
import { TransactionForm } from './forms/TransactionForm';
import { round, formatCurrency, formatDate } from '../services/financialCalculations';
import { useFinancialData } from '../hooks/useFinancialData';

const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const COLORS = ['#3b82f6', '#10b981', '#ff7a00', '#8b5cf6', '#ec4899', '#f43f5e'];

const CustomPieTooltip: FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let percentVal = 0;
      if (typeof data.percent === 'number') percentVal = data.percent;
      else if (typeof payload[0].percent === 'number') percentVal = payload[0].percent * 100;
      const percentDisplay = percentVal.toFixed(1);
      return (
        <div className="bg-surface border border-border-color p-3 rounded-lg shadow-xl text-text-primary backdrop-blur-sm bg-opacity-95 z-50 min-w-[150px]">
          <p className="font-bold text-sm mb-2 pb-1 border-b border-border-color/50">{data.name}</p>
          <div className="space-y-1">
               <div className="flex justify-between gap-4 text-xs text-text-secondary">
                  <span>Valor:</span>
                  <span className="font-mono text-text-primary font-bold">{typeof data.amount === 'number' ? formatCurrency(data.amount) : formatCurrency(data.value)}</span>
              </div>
              <div className="flex justify-between gap-4 text-xs text-text-secondary">
                  <span>Participação:</span>
                  <span className="font-mono text-primary font-bold">{percentDisplay}%</span>
              </div>
          </div>
        </div>
      );
    }
    return null;
};

const CustomChartTooltip: FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const isProj = item.isProjection;
        const val = isProj ? item.projectedBalance : item.realBalance;
        return (
            <div className="bg-surface border border-border-color p-3 rounded-lg shadow-xl text-text-primary backdrop-blur-sm bg-opacity-95 z-50 min-w-[150px]">
                <p className="font-bold text-xs text-[#94a3b8] mb-1.5 border-b border-border-color/30 pb-1">{item.date}</p>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isProj ? 'bg-[#ff7a00]' : 'bg-[#3b82f6]'}`}></div>
                    <p className="text-xs font-semibold">
                        {isProj ? 'Saldo Projetado:' : 'Saldo Real:'}{' '}
                        <span className="font-mono font-bold text-text-primary">{typeof val === 'number' ? formatCurrency(val) : 'N/A'}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export const DashboardView: FC<DashboardViewProps> = ({ 
    transactions, 
    goals, 
    onSetPaid, 
    onEdit, 
    incomeCategories, 
    expenseCategories, 
    paymentMethods, 
    costCenters, 
    advisors, 
    globalTaxRate, 
    estimatedTaxRate, 
    importedRevenues 
}) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [showProjection, setShowProjection] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [dashboardDreRegime, setDashboardDreRegime] = useState<'competencia' | 'caixa'>('competencia');
    
    const availableYears = useMemo(() => {
        const yearsSet = new Set(transactions.map(t => t.date ? new Date(t.date).getUTCFullYear() : null).filter((y): y is number => y !== null));
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a: number, b: number) => b - a);
    }, [transactions]);

    const {
        filteredTransactions,
        totalIncome,
        totalExpense,
        resultadoPeriodo,
        custosOperacionais,
        despesasOperacionais,
        previousPeriodIncome,
        previousPeriodExpense,
        previousResultadoPeriodo,
        previousPeriodCustos,
        previousPeriodDespesas,
        previousAchievedGoals,
        saldoHoje,
        saldoProvisaoHoje,
        saldoDisponivel,
        financePosition,
        achievedGoals,
        upcomingBills,
        contasAPagarStats,
        expenseSubcategoryData,
        periodoAnalisado,
        mesesSobrevivencia,
        chartData
    } = useFinancialData({
        transactions,
        importedRevenues,
        incomeCategories,
        expenseCategories,
        goals,
        selectedYear,
        selectedMonth,
        dashboardDreRegime,
        showProjection
    });


    const handlePayClick = (bill: Transaction) => { setEditingTransaction({ ...bill, status: ExpenseStatus.PAID }); setIsModalOpen(true); };
    const handleFormSubmit = (data: TransactionFormValues) => { if (editingTransaction) onEdit(editingTransaction.id, data); setIsModalOpen(false); setEditingTransaction(null); };

    return (
        <div className="space-y-6 animate-fade-in pr-1">
            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent uppercase tracking-tight">Painel de Controle</h2>
                    <p className="text-text-secondary text-xs sm:text-sm">Visão instantânea do fluxo de caixa e de indicadores operacionais.</p>
                </div>
                {goals.length > 0 && (
                    <div className="inline-flex items-center gap-2 bg-secondary/15 border border-secondary/30 rounded-xl px-4 py-2 self-start md:self-center">
                        <svg className="w-4 h-4 text-secondary animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                        <span className="text-xs font-semibold text-text-primary">
                            Metas Atingidas: <strong className="text-secondary">{achievedGoals}</strong> / {goals.length} ({goals.length > 0 ? ((achievedGoals/goals.length)*100).toFixed(0) : 0}%)
                        </span>
                    </div>
                )}
            </div>

            {/* SEÇÃO 1: RESULTADO OPERACIONAL */}
            <div className="bg-surface/80 border border-border-color/40 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border-color/20">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary/60 font-mono">DRE do Período</h3>
                        <p className="text-lg font-extrabold tracking-tight text-text-primary">Resultado Operacional</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                        <div className="inline-flex bg-background/60 rounded-lg p-0.5 border border-border-color/40 text-[11px] font-semibold mr-1 h-9 items-center font-mono">
                            <button
                                onClick={() => setDashboardDreRegime('competencia')}
                                className={`px-2.5 py-1 rounded-md transition-all h-7 flex items-center ${dashboardDreRegime === 'competencia' ? 'bg-primary text-background font-bold shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                                title="Regime de Competência: inclui todas as despesas lançadas para o período, pagas ou pendentes"
                            >
                                Competência
                            </button>
                            <button
                                onClick={() => setDashboardDreRegime('caixa')}
                                className={`px-2.5 py-1 rounded-md transition-all h-7 flex items-center ${dashboardDreRegime === 'caixa' ? 'bg-primary text-background font-bold shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                                title="Regime de Caixa: inclui apenas despesas devidamente pagas"
                            >
                                Caixa
                            </button>
                        </div>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border border-border-color/80 rounded-lg p-2 text-xs h-9 text-text-primary hover:border-slate-600 focus:outline-none transition-colors">
                            <option value="all">Todo o Período</option>{availableYears.map((year: any) => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border border-border-color/80 rounded-lg p-2 text-xs h-9 text-text-primary hover:border-slate-600 focus:outline-none transition-colors font-mono">
                            <option value="all">Todos os Meses</option>{['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Receita Operacional */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">Receita Operacional</span>
                                {(() => {
                                    const delta = ((totalIncome - previousPeriodIncome) / Math.abs(previousPeriodIncome || 1)) * 100;
                                    const isPositive = delta >= 0;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isPositive ? 'text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/20' : 'text-danger bg-danger/15 border border-danger/20'}`}>
                                            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-2xl font-extrabold tracking-tight text-[#f8fafc] mt-2">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-border-color/25 space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-text-secondary/50 font-medium font-mono">Período analisado:</span>
                                <span className="text-text-primary font-medium font-mono">{periodoAnalisado}</span>
                            </div>
                        </div>
                    </div>

                    {/* Custos Operacionais */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">(-) Custos Operacionais</span>
                                {(() => {
                                    const delta = ((custosOperacionais - previousPeriodCustos) / Math.abs(previousPeriodCustos || 1)) * 100;
                                    const isUp = delta >= 0;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isUp ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' : 'text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/20'}`}>
                                            {isUp ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-2xl font-extrabold tracking-tight text-[#f8fafc] mt-2">{formatCurrency(custosOperacionais)}</p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-border-color/25 space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-text-secondary/50 font-medium">Repasses, impostos e custos produtivos</span>
                            </div>
                        </div>
                    </div>

                    {/* Despesas Operacionais */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">(-) Despesas Operacionais</span>
                                {(() => {
                                    const delta = ((despesasOperacionais - previousPeriodDespesas) / Math.abs(previousPeriodDespesas || 1)) * 100;
                                    const isUp = delta >= 0;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isUp ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' : 'text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/20'}`}>
                                            {isUp ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-2xl font-extrabold tracking-tight text-[#f8fafc] mt-2">{formatCurrency(despesasOperacionais)}</p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-border-color/25 space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-text-secondary/50 font-medium">Plataformas, adm, marketing e estrutura</span>
                            </div>
                        </div>
                    </div>

                    {/* Resultado Operacional */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-850 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">(=) Resultado Operacional</span>
                                {(() => {
                                    const delta = ((resultadoPeriodo - previousResultadoPeriodo) / Math.abs(previousResultadoPeriodo || 1)) * 100;
                                    const isPositive = delta >= 0;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isPositive ? 'text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/20' : 'text-[#ef4444] bg-[#ef4444]/15 border border-[#ef4444]/20'}`}>
                                            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className={`text-2xl font-extrabold tracking-tight mt-2 ${resultadoPeriodo >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]/90'}`}>
                                {formatCurrency(resultadoPeriodo)}
                            </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-border-color/25 space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-text-secondary/50 font-medium font-mono">Status do período:</span>
                                <span className={`font-semibold ${resultadoPeriodo >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                    {resultadoPeriodo >= 0 ? 'Superavitário' : 'Deficitário'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 2: POSIÇÃO FINANCEIRA */}
            <div className="bg-surface/80 border border-border-color/40 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-color/20 animate-fade-in">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary/60">Posição Consolidada</h3>
                        <p className="text-lg font-extrabold tracking-tight text-text-primary">Posição Financeira (Liquidez)</p>
                    </div>
                    <div>
                        <Button 
                            onClick={() => setShowProjection(!showProjection)} 
                            variant={showProjection ? 'primary' : 'secondary'} 
                            className="text-xs py-1.5 px-3 h-9 animate-none flex items-center gap-1"
                            title="Projetar fluxo para os próximos 12 meses baseado em histórico robusto"
                        >
                            <svg className="w-4 h-4 text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                            {showProjection ? "Ocultar Projeção" : "Projetar 12m"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Saldo Gross em Conta */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">Saldo em Conta</span>
                            <p className={`text-2xl font-extrabold tracking-tight mt-2 ${saldoHoje >= 0 ? 'text-[#f8fafc]' : 'text-danger'}`}>{formatCurrency(saldoHoje)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/50 block font-medium">Saldo bruto total (Entradas - Saídas pagas)</span>
                        </div>
                    </div>

                    {/* Aportes / Incentivos */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">+ Aportes / Incentivos</span>
                            <p className="text-2xl font-extrabold tracking-tight mt-2 text-primary">{formatCurrency(financePosition.totalAportes)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/50 block font-medium">Investimentos e aportes societários</span>
                        </div>
                    </div>

                    {/* Saídas Realizadas */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">- Saídas Realizadas</span>
                            <p className="text-2xl font-extrabold tracking-tight mt-2 text-danger/80">{formatCurrency(financePosition.totalSaidasRealizadas)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/50 block font-medium">Total de despesas pagas acumuladas</span>
                        </div>
                    </div>

                    {/* Provisão de Impostos */}
                    <div className="bg-surface border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">- Provisão de Impostos</span>
                            <p className="text-2xl font-extrabold tracking-tight mt-2 text-amber-500">{formatCurrency(saldoProvisaoHoje)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/50 block font-medium">Reserva de impostos provisionada</span>
                        </div>
                    </div>

                    {/* Caixa Disponível */}
                    <div className="bg-surface border border-secondary/50 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(16,185,129,0.05)] hover:border-emerald-600 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">(=) Caixa Disponível</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary/10 text-secondary border border-secondary/20">Livre</span>
                            </div>
                            <p className={`text-2xl font-extrabold tracking-tight mt-2 ${saldoDisponivel >= 0 ? 'text-[#10b981]' : 'text-danger'}`}>{formatCurrency(saldoDisponivel)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border-color/25 flex justify-between items-center text-[10px]">
                            <span className="text-text-secondary/50 font-medium font-mono">Fôlego de caixa:</span>
                            <span className="font-mono font-bold text-secondary">{mesesSobrevivencia}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface/80 border border-border-color/40 shadow-[0_8px_30px_rgb(0,0,0,0.35)] rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-border-color/20">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary/60 font-mono animate-fade-in">Controle de Saídas</h3>
                        <h4 className="text-lg font-extrabold tracking-tight text-text-primary flex items-center gap-2">
                            Contas a Pagar
                        </h4>
                        <p className="text-text-secondary/60 text-[11px] mt-0.5">Lançamentos de despesas pendentes com vencimento nos próximos 10 dias.</p>
                    </div>
                </div>

                {/* Cards Resumo Contas a Pagar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Contas Vencidas */}
                    <div className="bg-surface/80 border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">Contas Vencidas</span>
                            <p className="text-xl font-extrabold text-[#ef4444] tracking-tight mt-1.5">{formatCurrency(contasAPagarStats.vencidasTotal)}</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/60 block font-medium">
                                {contasAPagarStats.vencidasCount} {contasAPagarStats.vencidasCount === 1 ? 'lançamento vencido' : 'lançamentos vencidos'}
                            </span>
                        </div>
                    </div>

                    {/* Contas Pendentes */}
                    <div className="bg-surface/80 border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">Contas Pendentes</span>
                            <p className="text-xl font-extrabold text-amber-500 tracking-tight mt-1.5">{formatCurrency(contasAPagarStats.pendentesTotal)}</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/60 block font-medium">
                                {contasAPagarStats.pendentesCount} {contasAPagarStats.pendentesCount === 1 ? 'lançamento a vencer' : 'lançamentos a vencer'}
                            </span>
                        </div>
                    </div>

                    {/* Valor Total a Pagar */}
                    <div className="bg-surface/80 border border-border-color/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-slate-800 transition-all duration-300">
                        <div>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">Total a Pagar (Aberto)</span>
                            <p className="text-xl font-extrabold text-[#f8fafc] tracking-tight mt-1.5">{formatCurrency(contasAPagarStats.totalAmount)}</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-border-color/25">
                            <span className="text-[10px] text-text-secondary/60 block font-medium">
                                {contasAPagarStats.totalCount} {contasAPagarStats.totalCount === 1 ? 'obrigação em aberto' : 'obrigações em aberto'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border-color/30">
                    <table className="w-full text-center border-collapse text-xs">
                        <thead>
                            <tr className="text-text-secondary bg-surface/50 border-b border-border-color/30 uppercase text-[9px] tracking-wider">
                                <th className="py-3 px-4 text-center font-semibold whitespace-nowrap">Vencimento</th>
                                <th className="py-3 px-4 text-center font-semibold">Descrição</th>
                                <th className="py-3 px-4 text-center font-semibold whitespace-nowrap">Categoria</th>
                                <th className="py-3 px-4 text-center font-semibold whitespace-nowrap">Valor</th>
                                <th className="py-3 px-4 text-center font-semibold whitespace-nowrap">Status</th>
                                <th className="py-3 px-4 text-center font-semibold whitespace-nowrap">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-text-secondary text-sm animate-pulse">
                                        Nenhum vencimento para os próximos 10 dias.
                                    </td>
                                </tr>
                            ) : (
                                upcomingBills.map(bill => {
                                    const todayStart = new Date();
                                    todayStart.setHours(0,0,0,0);
                                    const isPaid = bill.status === ExpenseStatus.PAID || bill.status === ExpenseStatus.CLEARED;
                                    const isOverdue = !isPaid && new Date(bill.date) < todayStart;
                                    return (
                                        <tr key={bill.id} className="border-b border-border-color/10 last:border-0 hover:bg-background/40 transition-colors h-11">
                                            <td className="py-2.5 px-4 text-center text-text-secondary font-mono whitespace-nowrap">{formatDate(bill.date)}</td>
                                            <td className="py-2.5 px-4 text-center font-medium max-w-xs truncate mx-auto" title={bill.description}>{bill.description}</td>
                                            <td className="py-2.5 px-4 text-center whitespace-nowrap"><span className="text-text-secondary bg-background/50 px-2 py-0.5 rounded text-[10px]">{bill.category}</span></td>
                                            <td className="py-2.5 px-4 text-center font-mono font-bold text-danger/90 whitespace-nowrap">{formatCurrency(bill.amount)}</td>
                                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                    isOverdue 
                                                        ? 'bg-danger/15 text-danger border border-danger/25 animate-pulse' 
                                                        : 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/25'
                                                }`}>
                                                    {isOverdue ? 'VENCIDA' : 'PENDENTE'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={() => handlePayClick(bill)} 
                                                        className="py-1 px-3 text-[10px] font-bold bg-success text-white hover:bg-success/95 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                                        title="Marcar como pago"
                                                    >
                                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                                        <span>Pagar</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 h-[410px] flex flex-col">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Fluxo de Caixa {showProjection && <span className="text-xs text-primary ml-2">(com projeção 12m)</span>}</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff7a00" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#ff7a00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.4} />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize:10}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickFormatter={v => `R$${(Number(v) as number)/1000}k`} tick={{fontSize:10}} width={62} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area type="monotone" dataKey="realBalance" name="Saldo Real" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal)" />
                        {showProjection && (
                          <Area type="monotone" dataKey="projectedBalance" name="Projeção" stroke="#ff7a00" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProj)" />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="h-[410px] flex flex-col">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Natureza das Despesas</h3>
                  <div className="flex-grow">
                    {expenseSubcategoryData.length > 0 ? (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={expenseSubcategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} stroke="none">
                            {expenseSubcategoryData.map((e,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={v => <span className="text-text-secondary ml-1">{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-secondary"><p>Sem dados.</p></div>
                    )}
                  </div>
                </Card>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmar Pagamento / Ajustar Valor">
                <TransactionForm onSubmit={handleFormSubmit} onClose={() => setIsModalOpen(false)} initialData={editingTransaction} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} globalTaxRate={globalTaxRate} transactions={transactions} importedRevenues={importedRevenues} />
            </Modal>
        </div>
    );
};

export default DashboardView;
