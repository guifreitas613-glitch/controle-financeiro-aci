import { useMemo } from 'react';
import { 
    Transaction, 
    ImportedRevenue, 
    IncomeCategory, 
    ExpenseCategory, 
    Goal, 
    TransactionType, 
    ExpenseStatus, 
    ExpenseNature, 
    CategoryStructuralType 
} from '../types';
import { round, formatDate } from '../services/financialCalculations';

const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface UseFinancialDataProps {
    transactions: Transaction[];
    importedRevenues: ImportedRevenue[];
    incomeCategories: IncomeCategory[];
    expenseCategories: ExpenseCategory[];
    goals: Goal[];
    selectedYear: number | 'all';
    selectedMonth: number | 'all';
    dashboardDreRegime: 'competencia' | 'caixa';
    showProjection: boolean;
}

export const useFinancialData = ({
    transactions,
    importedRevenues,
    incomeCategories,
    expenseCategories,
    goals,
    selectedYear,
    selectedMonth,
    dashboardDreRegime,
    showProjection
}: UseFinancialDataProps) => {

    const filteredTransactions = useMemo(() => transactions.filter(t => {
        const date = new Date(t.date);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        return (selectedYear === 'all' || year === selectedYear) && (selectedMonth === 'all' || month === selectedMonth);
    }), [transactions, selectedYear, selectedMonth]);

    const { totalIncome, totalExpense, resultadoPeriodo, custosOperacionais, despesasOperacionais } = useMemo(() => {
        const getStructuralInfo = (t: Transaction) => {
            if (t.type === TransactionType.INCOME) {
                const cat = incomeCategories.find(c => c.name === t.category);
                return {
                    tipoEstrutural: cat?.tipoEstrutural || CategoryStructuralType.RECEITA_OPERACIONAL,
                    impactaDRE: cat?.impactaDRE ?? true
                };
            } else {
                const cat = expenseCategories.find(c => c.name === t.category);
                return {
                    tipoEstrutural: cat?.tipoEstrutural || CategoryStructuralType.DESPESA_OPERACIONAL,
                    impactaDRE: cat?.impactaDRE ?? true
                };
            }
        };

        const dreTransactions = filteredTransactions.filter(t => {
            const info = getStructuralInfo(t);
            if (!info.impactaDRE) return false;
            if (t.type === TransactionType.EXPENSE) {
                if (dashboardDreRegime === 'caixa') {
                    return t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED;
                } else {
                    return true;
                }
            }
            return true;
        });

        // Filtrar transações com origin === 'comissoes' para evitar dupla contagem com importedRevenues
        const manualIncome = dreTransactions
            .filter(t => t.type === TransactionType.INCOME && t.origin !== 'comissoes')
            .reduce<number>((acc, t) => acc + t.amount, 0);
        
        const importedIncome = importedRevenues
            .filter(r => {
                const date = new Date(r.date);
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth();
                const periodMatch = (selectedYear === 'all' || year === selectedYear) && (selectedMonth === 'all' || month === selectedMonth);
                return periodMatch && !r.lancamentosRealizados;
            })
            .reduce((sum, r) => sum + (r.officeNetRevenue || 0), 0);

        const income = round(manualIncome + importedIncome);
        const custos = round(dreTransactions
            .filter(t => t.type === TransactionType.EXPENSE && (getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.CUSTO || getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DEDUCAO_RECEITA))
            .reduce<number>((acc, t) => acc + t.amount, 0));
        const despesas = round(dreTransactions
            .filter(t => t.type === TransactionType.EXPENSE && getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DESPESA_OPERACIONAL)
            .reduce<number>((acc, t) => acc + t.amount, 0));
        const expense = round(custos + despesas);
        
        return { 
            totalIncome: income, 
            totalExpense: expense, 
            resultadoPeriodo: round(Number(income) - Number(expense)),
            custosOperacionais: custos,
            despesasOperacionais: despesas
        };
    }, [filteredTransactions, importedRevenues, incomeCategories, expenseCategories, selectedYear, selectedMonth, dashboardDreRegime]);

    const { 
        previousPeriodIncome, 
        previousPeriodExpense, 
        previousResultadoPeriodo, 
        previousPeriodCustos,
        previousPeriodDespesas,
        previousAchievedGoals 
    } = useMemo(() => {
        let prevYear: number | 'all' = selectedYear;
        let prevMonth: number | 'all' = selectedMonth;

        if (selectedMonth !== 'all') {
            if (selectedMonth === 0) {
                prevMonth = 11;
                if (selectedYear !== 'all') {
                    prevYear = selectedYear - 1;
                }
            } else {
                prevMonth = selectedMonth - 1;
            }
        } else if (selectedYear !== 'all') {
            prevYear = selectedYear - 1;
        }

        const prevFilteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();
            return (prevYear === 'all' || year === prevYear) && (prevMonth === 'all' || month === prevMonth);
        });

        const getStructuralInfo = (t: Transaction) => {
            if (t.type === TransactionType.INCOME) {
                const cat = incomeCategories.find(c => c.name === t.category);
                return {
                    tipoEstrutural: cat?.tipoEstrutural || CategoryStructuralType.RECEITA_OPERACIONAL,
                    impactaDRE: cat?.impactaDRE ?? true
                };
            } else {
                const cat = expenseCategories.find(c => c.name === t.category);
                return {
                    tipoEstrutural: cat?.tipoEstrutural || CategoryStructuralType.DESPESA_OPERACIONAL,
                    impactaDRE: cat?.impactaDRE ?? true
                };
            }
        };

        const drePrevTransactions = prevFilteredTransactions.filter(t => {
            const info = getStructuralInfo(t);
            if (!info.impactaDRE) return false;
            if (t.type === TransactionType.EXPENSE) {
                if (dashboardDreRegime === 'caixa') {
                    return t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED;
                } else {
                    return true;
                }
            }
            return true;
        });

        const manualIncome = drePrevTransactions
            .filter(t => t.type === TransactionType.INCOME && t.origin !== 'comissoes')
            .reduce<number>((acc, t) => acc + t.amount, 0);
        
        const importedIncome = importedRevenues
            .filter(r => {
                const date = new Date(r.date);
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth();
                const periodMatch = (prevYear === 'all' || year === prevYear) && (prevMonth === 'all' || month === prevMonth);
                return periodMatch && !r.lancamentosRealizados;
            })
            .reduce((sum, r) => sum + (r.officeNetRevenue || 0), 0);

        const income = round(manualIncome + importedIncome);
        const prevCustos = round(drePrevTransactions
            .filter(t => t.type === TransactionType.EXPENSE && (getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.CUSTO || getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DEDUCAO_RECEITA))
            .reduce<number>((acc, t) => acc + t.amount, 0));
        const prevDespesas = round(drePrevTransactions
            .filter(t => t.type === TransactionType.EXPENSE && getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DESPESA_OPERACIONAL)
            .reduce<number>((acc, t) => acc + t.amount, 0));
        const expense = round(prevCustos + prevDespesas);
        
        const prevAchieved = goals.filter(g => (Number(g.currentAmount) || 0) >= g.targetAmount).length;

        return {
            previousPeriodIncome: income,
            previousPeriodExpense: expense,
            previousResultadoPeriodo: round(income - expense),
            previousPeriodCustos: prevCustos,
            previousPeriodDespesas: prevDespesas,
            previousAchievedGoals: prevAchieved
        };
    }, [transactions, importedRevenues, incomeCategories, expenseCategories, selectedYear, selectedMonth, dashboardDreRegime, goals]);

    const saldoHoje = useMemo(() => round(transactions.reduce((acc: number, t: Transaction) => {
        const txDate = new Date(t.date).getTime();
        const now = new Date().getTime();
        if (txDate <= now) {
            if (t.type === TransactionType.INCOME) {
                return acc + Number(t.amount);
            } else if (t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID) {
                return acc - Number(t.amount);
            }
        }
        return acc;
    }, 0)), [transactions]);

    const saldoProvisaoHoje = useMemo(() => round(transactions.reduce((acc: number, t: Transaction) => {
        const txDate = new Date(t.date).getTime();
        const now = new Date().getTime();
        if (txDate <= now) {
            if (t.type === TransactionType.INCOME) {
                return acc + Number(t.taxAmount || 0);
            } else if (t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID) {
                if (t.costCenter === 'provisao-impostos') {
                    return acc - Number(t.amount);
                }
            }
        }
        return acc;
    }, 0)), [transactions]);

    const saldoDisponivel = useMemo(() => round(saldoHoje - saldoProvisaoHoje), [saldoHoje, saldoProvisaoHoje]);

    const financePosition = useMemo(() => {
        const aportes = transactions
            .filter(t => {
                if (t.type !== TransactionType.INCOME) return false;
                const cat = incomeCategories.find(c => c.name === t.category);
                return cat?.tipoEstrutural === CategoryStructuralType.SOCIETARIO || cat?.impactaDRE === false;
            })
            .reduce<number>((sum, t) => sum + t.amount, 0);

        const saidasRealizadas = transactions
            .filter(t => t.type === TransactionType.EXPENSE && (t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED))
            .reduce<number>((sum, t) => sum + t.amount, 0);

        return {
            totalAportes: round(aportes),
            totalSaidasRealizadas: round(saidasRealizadas)
        };
    }, [transactions, incomeCategories]);

    const achievedGoals = useMemo(() => goals.filter(g => (Number(g.currentAmount) || 0) >= g.targetAmount).length, [goals]);

    const strategicIndicators = useMemo(() => {
        const netMargin = totalIncome > 0 ? (resultadoPeriodo / totalIncome) * 100 : null;
        return { netMargin };
    }, [totalIncome, resultadoPeriodo]);

    const upcomingBills = useMemo(() => {
        const thresholdDate = new Date();
        thresholdDate.setHours(23, 59, 59, 999);
        thresholdDate.setDate(thresholdDate.getDate() + 10);
        const threshold = thresholdDate.getTime();

        return transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && new Date(t.date).getTime() <= threshold)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const overdueCount = useMemo(() => {
        const now = new Date();
        return upcomingBills.filter(b => new Date(b.date) < now).length;
    }, [upcomingBills]);

    const contasAPagarStats = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const vencidas = upcomingBills.filter(t => new Date(t.date) < todayStart);
        const vencidasCount = vencidas.length;
        const vencidasTotal = round(vencidas.reduce((sum, t) => sum + t.amount, 0));

        const pendentes = upcomingBills.filter(t => new Date(t.date) >= todayStart);
        const pendentesCount = pendentes.length;
        const pendentesTotal = round(pendentes.reduce((sum, t) => sum + t.amount, 0));

        const totalCount = upcomingBills.length;
        const totalAmount = round(upcomingBills.reduce((sum, t) => sum + t.amount, 0));

        return {
            vencidasCount,
            vencidasTotal,
            pendentesCount,
            pendentesTotal,
            totalCount,
            totalAmount
        };
    }, [upcomingBills]);

    const expenseSubcategoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID);
        const total = round(expenses.reduce((sum, t) => sum + t.amount, 0));
        if (total === 0) return [];
        const data = expenses.reduce((acc, t) => { 
            acc[t.nature === ExpenseNature.FIXED ? 0 : 1].amount = round(acc[t.nature === ExpenseNature.FIXED ? 0 : 1].amount + t.amount); 
            return acc; 
        }, [{ name: 'Fixo', amount: 0 }, { name: 'Variável', amount: 0 }]);
        return data.map(d => ({ 
            ...d, 
            value: round((d.amount / total) * 100), 
            percent: round((d.amount / total) * 100) 
        })).filter(d => d.amount > 0);
    }, [filteredTransactions]);

    const historyCashFlow = useMemo(() => {
        const now = new Date();
        const endOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
        
        const realInScope = transactions
            .filter(t => new Date(t.date) <= endOfCurrentMonth)
            .sort((a, b) => (new Date(a.date).getTime()) - (new Date(b.date).getTime()));
        
        let bankBalance = 0;
        return realInScope.map(t => { 
            if (t.type === TransactionType.INCOME) {
                bankBalance = round(bankBalance + t.amount); 
            } else if (t.status === ExpenseStatus.PAID) {
                bankBalance = round(bankBalance - t.amount);
            }
            return { date: formatDate(t.date), balance: bankBalance, isProjection: false }; 
        }).reduce((acc: any[], item) => {
            if (acc.length && acc[acc.length-1].date === item.date) {
                acc[acc.length-1].balance = item.balance;
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    }, [transactions]);

    const cashFlowData = useMemo(() => { 
        if (!showProjection) return historyCashFlow;

        const now = new Date();
        const curM = now.getUTCMonth();
        const curY = now.getUTCFullYear();
        
        const threeMonthsAgo = new Date(Date.UTC(curY, curM - 3, 1));
        const oneMonthAgoEnd = new Date(Date.UTC(curY, curM, 0, 23, 59, 59));
        
        const recentRealTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= threeMonthsAgo && d <= oneMonthAgoEnd && !t.isProjection;
        });

        const recentExpenses = recentRealTransactions.filter(t => t.type === TransactionType.EXPENSE);
        const fixedExpensesTotal = recentExpenses.filter(e => e.nature === ExpenseNature.FIXED).reduce((sum, e) => sum + e.amount, 0);
        const avgMonthlyFixedExpense = round(fixedExpensesTotal / 3);

        const recentIncomes = recentRealTransactions.filter(t => t.type === TransactionType.INCOME && t.origin !== 'comissoes');
        const manualIncomeTotal = recentIncomes.reduce((sum, t) => sum + t.amount, 0);
        
        const recentImported = (importedRevenues || []).filter(r => {
            const d = new Date(r.date);
            return d >= threeMonthsAgo && d <= oneMonthAgoEnd;
        });
        const importedIncomeTotal = recentImported.reduce((sum, r) => sum + (r.officeNetRevenue || 0), 0);
        
        const avgMonthlyIncome = round((manualIncomeTotal + importedIncomeTotal) / 3);

        const bankBalance = historyCashFlow.length > 0 ? historyCashFlow[historyCashFlow.length - 1].balance : 0;
        let projectedBalance = bankBalance;
        const projectionPoints = [];

        for (let i = 1; i <= 12; i++) {
            const targetMonthIndex = curM + i;
            const targetMonth = targetMonthIndex % 12;
            const targetYear = curY + Math.floor(targetMonthIndex / 12);
            
            const scheduledFixed = transactions.filter(t => {
                return t.type === TransactionType.EXPENSE &&
                       t.nature === ExpenseNature.FIXED &&
                       !t.isProjection &&
                       new Date(t.date).getUTCFullYear() === targetYear &&
                       new Date(t.date).getUTCMonth() === targetMonth;
            }).reduce((sum, t) => sum + t.amount, 0);

            const scheduledVariableAndOthers = transactions.filter(t => {
                return t.type === TransactionType.EXPENSE &&
                       t.nature !== ExpenseNature.FIXED &&
                       !t.isProjection &&
                       new Date(t.date).getUTCFullYear() === targetYear &&
                       new Date(t.date).getUTCMonth() === targetMonth;
            }).reduce((sum, t) => sum + t.amount, 0);

            const scheduledIncome = transactions.filter(t => {
                return t.type === TransactionType.INCOME &&
                       !t.isProjection &&
                       new Date(t.date).getUTCFullYear() === targetYear &&
                       new Date(t.date).getUTCMonth() === targetMonth;
            }).reduce((sum, t) => sum + t.amount, 0);

            const projectedExpenseForMonth = round(
                Math.max(avgMonthlyFixedExpense, scheduledFixed) + scheduledVariableAndOthers
            );

            const projectedIncomeForMonth = round(
                Math.max(avgMonthlyIncome, scheduledIncome)
            );

            projectedBalance = round(projectedBalance + projectedIncomeForMonth - projectedExpenseForMonth);
            
            const projDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0));
            projectionPoints.push({
                date: formatDate(projDate.toISOString()),
                balance: projectedBalance,
                isProjection: true
            });
        }

        return [...historyCashFlow, ...projectionPoints];
    }, [historyCashFlow, showProjection, transactions, importedRevenues]);

    const periodoAnalisado = useMemo(() => {
        if (selectedYear === 'all' && selectedMonth === 'all') return 'Consolidado';
        if (selectedMonth === 'all') return `Exercício ${selectedYear}`;
        return `${months[selectedMonth as number]} / ${selectedYear}`;
    }, [selectedYear, selectedMonth]);

    const avgMonthlyExpense = useMemo(() => {
        const paidExpenses = transactions.filter(t => t.type === TransactionType.EXPENSE && (t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED));
        if (paidExpenses.length === 0) return 0;
        const dates = paidExpenses.map(t => new Date(t.date).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const monthsDiff = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30.4)));
        const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
        return round(totalPaid / monthsDiff);
    }, [transactions]);

    const mesesSobrevivencia = useMemo(() => {
        const divisor = avgMonthlyExpense > 0 ? avgMonthlyExpense : (totalExpense > 0 ? totalExpense : 1000);
        const value = saldoDisponivel / divisor;
        if (value <= 0) return '0.0m';
        if (value > 99) return '>99m';
        return `${value.toFixed(1)} meses`;
    }, [saldoDisponivel, avgMonthlyExpense, totalExpense]);

    const chartData = useMemo(() => {
        const data = showProjection ? cashFlowData : historyCashFlow;
        const lastRealIndex = data.map(d => d.isProjection).lastIndexOf(false);
        return data.map((d, index) => {
            const isProj = d.isProjection;
            const bal = d.balance;
            return {
                date: d.date,
                realBalance: isProj ? undefined : bal,
                projectedBalance: (isProj || index === lastRealIndex) ? bal : undefined,
                isProjection: isProj
            };
        });
    }, [cashFlowData, historyCashFlow, showProjection]);

    return {
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
        strategicIndicators,
        upcomingBills,
        overdueCount,
        contasAPagarStats,
        expenseSubcategoryData,
        historyCashFlow,
        cashFlowData,
        periodoAnalisado,
        avgMonthlyExpense,
        mesesSobrevivencia,
        chartData
    };
};
