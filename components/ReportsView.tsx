import React, { useState, useMemo, FC } from 'react';
import { 
    Transaction, 
    ImportedRevenue, 
    IncomeCategory, 
    ExpenseCategory, 
    TransactionType, 
    CategoryStructuralType, 
    ExpenseStatus 
} from '../types';
import { Card, Button, FileTextIcon } from './UIComponents';
import { round, formatCurrency } from '../services/financialCalculations';

declare var jspdf: any;

export const ReportsView: FC<{ 
    transactions: Transaction[], 
    importedRevenues?: ImportedRevenue[],
    incomeCategories: IncomeCategory[],
    expenseCategories: ExpenseCategory[]
}> = ({ transactions, importedRevenues = [], incomeCategories, expenseCategories }) => {
    const availableYears = useMemo(() => {
        const years = [...new Set([
            ...transactions.map(t => new Date(t.date).getFullYear()),
            ...importedRevenues.map(r => new Date(r.date).getFullYear())
        ])];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) years.push(currentYear);
        return years.sort((a, b) => b - a);
    }, [transactions, importedRevenues]);

    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [dreRegime, setDreRegime] = useState<'competencia' | 'caixa'>('competencia');

    const filterFn = (dateStr: string) => {
        const d = new Date(dateStr);
        const yearMatch = selectedYear === 'all' || d.getFullYear() === selectedYear;
        const monthMatch = selectedMonth === 'all' || d.getMonth() === selectedMonth;
        return yearMatch && monthMatch;
    };
    
    const dreData = useMemo(() => {
        const fTrans = transactions.filter(t => filterFn(t.date));
        
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

        const dreTransactions = fTrans.filter(t => {
            const info = getStructuralInfo(t);
            if (!info.impactaDRE) return false;
            if (t.type === TransactionType.EXPENSE) {
                if (dreRegime === 'caixa') {
                    return t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED;
                } else {
                    return true; // Competência includes all
                }
            }
            return true;
        });

        // 1. RECEITA OPERACIONAL BRUTA
        // Filtrar transações com origin === 'comissoes' para evitar dupla contagem com importedRevenues
        const manualOpRevenue = dreTransactions
            .filter(t => t.type === TransactionType.INCOME && t.origin !== 'comissoes' && getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.RECEITA_OPERACIONAL)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const importedOpRevenue = importedRevenues
            .filter(r => filterFn(r.date))
            .reduce((sum, r) => sum + (r.officeNetRevenue || 0), 0);
            
        const receitaBruta = round(manualOpRevenue + importedOpRevenue);

        // 2. DEDUÇÕES DA RECEITA
        const deducoes = round(dreTransactions
            .filter(t => getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DEDUCAO_RECEITA)
            .reduce((sum, t) => sum + t.amount, 0));

        // 3. RECEITA OPERACIONAL LÍQUIDA
        const receitaLiquida = round(receitaBruta - deducoes);

        // 4. CUSTOS OPERACIONAIS
        const custos = round(dreTransactions
            .filter(t => getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.CUSTO)
            .reduce((sum, t) => sum + t.amount, 0));

        // 5. RESULTADO BRUTO
        const resultadoBruto = round(receitaLiquida - custos);

        // 6. DESPESAS OPERACIONAIS
        const despesasOperacionais = round(dreTransactions
            .filter(t => getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DESPESA_OPERACIONAL)
            .reduce((sum, t) => sum + t.amount, 0));

        // 7. RESULTADO OPERACIONAL
        const resultadoOperacional = round(resultadoBruto - despesasOperacionais);

        // 8. OUTRAS RECEITAS
        const outrasReceitas = round(dreTransactions
            .filter(t => t.type === TransactionType.INCOME && getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.RECEITA_NAO_OPERACIONAL)
            .reduce((sum, t) => sum + t.amount, 0));

        // 9. RESULTADO FINAL
        const resultadoFinal = round(resultadoOperacional + outrasReceitas);

        const expensesByCategory: Record<string, number> = {};
        dreTransactions
            .filter(t => t.type === TransactionType.EXPENSE && getStructuralInfo(t).tipoEstrutural === CategoryStructuralType.DESPESA_OPERACIONAL)
            .forEach(t => {
                expensesByCategory[t.category] = round((expensesByCategory[t.category] || 0) + t.amount);
            });
        const sortedExpenses = Object.entries(expensesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { 
            receitaBruta, 
            deducoes, 
            receitaLiquida, 
            custos, 
            resultadoBruto, 
            despesasOperacionais, 
            resultadoOperacional, 
            outrasReceitas, 
            resultadoFinal, 
            sortedExpenses 
        };
    }, [transactions, importedRevenues, incomeCategories, expenseCategories, selectedYear, selectedMonth, dreRegime]);

    const valuationMonthlyData = useMemo(() => {
        const monthlyMap: Record<string, { opRevenue: number; opExpense: number; pjBalanceInMonth: number }> = {};
        
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

        transactions.forEach(t => {
            if (!filterFn(t.date)) return;
            const info = getStructuralInfo(t);
            if (!info.impactaDRE) return;
            
            // For valuation, we only care about operational items
            const isOperational = info.tipoEstrutural === CategoryStructuralType.RECEITA_OPERACIONAL || 
                                 info.tipoEstrutural === CategoryStructuralType.CUSTO || 
                                 info.tipoEstrutural === CategoryStructuralType.DESPESA_OPERACIONAL ||
                                 info.tipoEstrutural === CategoryStructuralType.DEDUCAO_RECEITA;

            if (!isOperational) return;

            if (t.type === TransactionType.EXPENSE && !(t.status === ExpenseStatus.PAID || t.status === ExpenseStatus.CLEARED)) return;

            const key = t.date.substring(0, 7);
            if (!monthlyMap[key]) monthlyMap[key] = { opRevenue: 0, opExpense: 0, pjBalanceInMonth: 0 };
            
            if (t.type === TransactionType.INCOME) {
                monthlyMap[key].opRevenue = round(monthlyMap[key].opRevenue + t.amount);
            } else {
                monthlyMap[key].opExpense = round(monthlyMap[key].opExpense + t.amount);
            }
        });

        importedRevenues.forEach(r => {
            if (!filterFn(r.date)) return;
            const key = r.date.substring(0, 7);
            if (!monthlyMap[key]) monthlyMap[key] = { opRevenue: 0, opExpense: 0, pjBalanceInMonth: 0 };
            monthlyMap[key].opRevenue = round(monthlyMap[key].opRevenue + (r.officeNetRevenue || 0));
        });

        return Object.entries(monthlyMap)
            .map(([monthKey, data]) => {
                const [year, month] = monthKey.split('-').map(Number);
                const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59);

                const resultadoOperacionalMes = round(data.opRevenue - data.opExpense);
                const valuation = resultadoOperacionalMes > 0 ? round(resultadoOperacionalMes * 5) : null;
                
                const date = new Date(year, month - 1, 1, 12, 0, 0);
                return {
                    monthYear: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                    resultadoOperacionalMes,
                    valuation,
                    key: monthKey
                };
            })
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [transactions, importedRevenues, incomeCategories, expenseCategories, selectedYear, selectedMonth]);

    const accumulatedOpResult = round(dreData.resultadoOperacional);
    const accumulatedValuation = accumulatedOpResult > 0 ? round(accumulatedOpResult * 5) : null;

    const handleDREExportPDF = () => {
        if (!jspdf) {
            alert('Erro: Biblioteca jspdf não está disponível globalmente.');
            return;
        }

        const doc = new jspdf.jsPDF('p', 'mm', 'a4');
        const companyName = "ACI Capital - Assessoria de Investimentos";
        const today = new Date().toLocaleDateString('pt-BR');
        const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const emissionLabel = `${today} às ${nowTime}`;

        const monthLabel = selectedMonth !== 'all' 
            ? ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth as number] 
            : '';
        const yearLabel = selectedYear === 'all' ? 'Todo o Período' : selectedYear.toString();
        const periodLabel = monthLabel ? `${monthLabel} / ${yearLabel}` : yearLabel;
        const regimeLabel = dreRegime === 'competencia' ? 'Regime de Competência (Amortizado)' : 'Regime de Caixa (Fluxo Pago)';

        // 1. Beautiful Solid Header Block
        doc.setFillColor(26, 33, 74); // #1A214A - Rich Navy
        doc.rect(0, 0, 210, 42, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("ACI Capital", 15, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(170, 185, 220);
        doc.text("CONSULTORIA E GESTÃO DE INVESTIMENTOS", 15, 24);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text("DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE)", 15, 34);

        // Metadata box
        doc.setFillColor(248, 249, 250); 
        doc.rect(15, 48, 180, 24, 'F');
        doc.setDrawColor(220, 225, 235);
        doc.rect(15, 48, 180, 24, 'S');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(70, 80, 95);
        doc.text("Período de Referência:", 20, 54);
        doc.text("Regime Selecionado:", 20, 60);
        doc.text("Emissão do Relatório:", 20, 66);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 33, 74);
        doc.text(periodLabel.toUpperCase(), 60, 54);
        doc.text(regimeLabel, 60, 60);
        doc.text(emissionLabel, 60, 66);

        // Rows calculation
        const rows = [
            { label: "1. RECEITA OPERACIONAL BRUTA", isSummary: true, val: dreData.receitaBruta },
            { label: "   (-) DEDUÇÕES DA RECEITA", isSummary: false, val: -Math.abs(dreData.deducoes), indent: true },
            { label: "2. (=) RECEITA OPERACIONAL LÍQUIDA", isSummary: true, val: dreData.receitaLiquida, bg: true },
            { label: "   (-) CUSTOS OPERACIONAIS", isSummary: false, val: -Math.abs(dreData.custos), indent: true },
            { label: "3. (=) RESULTADO BRUTO", isSummary: true, val: dreData.resultadoBruto, bg: true },
            { label: "   (-) DESPESAS OPERACIONAIS", isSummary: false, val: -Math.abs(dreData.despesasOperacionais), indent: true },
        ];

        dreData.sortedExpenses.forEach(exp => {
            rows.push({
                label: `       - ${exp.name}`,
                isSummary: false,
                val: -Math.abs(exp.value),
                indent: true
            });
        });

        rows.push(
            { label: "4. (=) RESULTADO OPERACIONAL", isSummary: true, val: dreData.resultadoOperacional, bg: true },
            { label: "   (+) OUTRAS RECEITAS NÃO OPERACIONAIS", isSummary: false, val: dreData.outrasReceitas, indent: true },
            { label: "5. (=) RESULTADO FINAL (LÍQUIDO)", isSummary: true, val: dreData.resultadoFinal, bg: true }
        );

        let y = 82;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(40, 44, 55);
        
        doc.text("ESTRUTURA DE CONTAS", 18, y);
        doc.text("VALOR CONTÁBIL (R$)", 190, y, { align: 'right' });
        
        y += 3;
        doc.setLineWidth(0.5);
        doc.setDrawColor(26, 33, 74);
        doc.line(15, y, 195, y);
        y += 6;

        const fCurr = (amount: number) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
        };

        rows.forEach(row => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }

            if (row.bg) {
                doc.setFillColor(240, 245, 255); 
                doc.rect(15, y - 4.5, 180, 6.5, 'F');
            } else if (row.isSummary) {
                doc.setFillColor(242, 244, 247); 
                doc.rect(15, y - 4.5, 180, 6.5, 'F');
            }

            if (row.isSummary) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(26, 33, 74);
            } else {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(row.label.startsWith('       ') ? 8 : 9);
                doc.setTextColor(80, 85, 95);
            }

            doc.text(row.label, 18, y);

            if (row.val < 0) {
                doc.setTextColor(170, 50, 50); // elegant slate red
            } else if (row.val > 0 && row.isSummary) {
                doc.setTextColor(30, 110, 80); // elegant emerald
            } else if (row.val > 0) {
                doc.setTextColor(45, 50, 60);
            } else {
                doc.setTextColor(130, 130, 140);
            }

            doc.text(fCurr(row.val), 190, y, { align: 'right' });

            doc.setLineWidth(0.15);
            doc.setDrawColor(230, 235, 240);
            doc.line(15, y + 2.5, 195, y + 2.5);

            y += 7.2;
        });

        // Signatures
        if (y < 235) {
            y = 250;
            doc.setLineWidth(0.4);
            doc.setDrawColor(190, 200, 210);
            doc.line(35, y, 85, y);
            doc.line(125, y, 175, y);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(115, 120, 130);
            doc.text("Controladoria Financeira", 60, y + 4, { align: 'center' });
            doc.text("Diretoria de Operações", 150, y + 4, { align: 'center' });
        }

        doc.save(`DRE_ACI_Capital_${periodLabel.replace(/[\s/]/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in text-text-primary">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent uppercase tracking-tight">Relatórios & DRE</h2>
                    <p className="text-text-secondary text-xs sm:text-sm">Analise balanços contábeis estruturados e valuation pro-forma</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                        className="bg-surface border border-border-color rounded-md px-3 py-1.5 text-xs text-text-primary focus:ring-primary outline-none"
                    >
                        <option value="all">Todos os Anos</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                        className="bg-surface border border-border-color rounded-md px-3 py-1.5 text-xs text-text-primary focus:ring-primary outline-none"
                    >
                        <option value="all">Todos os Meses</option>
                        {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* CARD PRINCIPAL DRE */}
            <Card className="max-w-4xl mx-auto border border-border-color/40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-primary to-blue-500"></div>
                <div className="border-b border-border-color pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                            Demonstrativo do Resultado do Exercício
                        </h3>
                        <p className="text-text-secondary text-xs">
                            Relatório executivo estruturado para tomada da decisão estratégica
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
                        <Button 
                            onClick={handleDREExportPDF} 
                            variant="secondary" 
                            className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-sm"
                            title="Exportar DRE formatado para PDF"
                        >
                            <FileTextIcon className="w-4 h-4"/> Exportar PDF de Apresentação
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 p-4 bg-background/35 border border-border-color/25 rounded-lg gap-4">
                    <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Período Selecionado</span>
                        <span className="text-sm font-bold text-text-primary font-sans uppercase">
                            {selectedMonth !== 'all' ? ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth as number] + ' ' : ''}
                            {selectedYear === 'all' ? 'Todo o Período' : selectedYear}
                        </span>
                    </div>

                    <div className="inline-flex bg-background/80 rounded-lg p-0.5 border border-border-color text-xs font-semibold shadow-inner">
                        <button
                            onClick={() => setDreRegime('competencia')}
                            className={`px-3 py-1.5 rounded-md transition-all ${dreRegime === 'competencia' ? 'bg-primary text-background font-bold shadow' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Regime de Competência: inclui despesas e custos no período da feco, independente de já estarem pagos"
                        >
                            Competência (Comprometimento)
                        </button>
                        <button
                            onClick={() => setDreRegime('caixa')}
                            className={`px-3 py-1.5 rounded-md transition-all ${dreRegime === 'caixa' ? 'bg-primary text-background font-bold shadow' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Regime de Caixa: baseado estritamente na data de pagamento das despesas lançadas como pagas"
                        >
                            Caixa (Liquidação Efetuada)
                        </button>
                    </div>
                </div>

                {/* ESTRUTURA METÓDICA DO DRE */}
                <div className="space-y-1 text-sm bg-background/5 border border-border-color/10 rounded-xl overflow-hidden shadow-lg p-1.5">
                    
                    {/* 1. RECEITA OPERACIONAL BRUTA */}
                    <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-surface hover:bg-surface/80 transition-all">
                        <span className="font-bold text-text-primary text-[13px] tracking-wide uppercase">1. FATURAMENTO BRUTO (RECOB/RECOM)</span>
                        <span className="font-bold tracking-tight text-emerald-400 font-mono text-base">{formatCurrency(dreData.receitaBruta)}</span>
                    </div>
                    
                    {/* - DEDUÇÕES */}
                    <div className="flex justify-between items-center p-2.5 px-4 transition-all hover:bg-background/20 pl-8 border-b border-border-color/10">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <span className="w-1.5 h-1.5 rounded bg-rose-500/50"></span>
                            <span>(-) Deduções da Receita (DAS/Simples/Retenções)</span>
                        </div>
                        <span className="text-rose-400 font-mono text-[13px]">{dreData.deducoes > 0 ? '-' : ''}{formatCurrency(dreData.deducoes)}</span>
                    </div>
                    
                    {/* 2. RECEITA OPERACIONAL LÍQUIDA */}
                    <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 my-1">
                        <span className="font-bold text-text-primary text-[13px] uppercase">2. (=) RECEITA OPERACIONAL LÍQUIDA</span>
                        <span className="font-bold tracking-tight text-emerald-400 font-mono text-base">{formatCurrency(dreData.receitaLiquida)}</span>
                    </div>
                    
                    {/* - CUSTOS */}
                    <div className="flex justify-between items-center p-2.5 px-4 transition-all hover:bg-background/20 pl-8 border-b border-border-color/10">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <span className="w-1.5 h-1.5 rounded bg-amber-500/50"></span>
                            <span>(-) Custos Operacionais Diretos (Repasses/Parceiros)</span>
                        </div>
                        <span className="text-rose-400 font-mono text-[13px]">{dreData.custos > 0 ? '-' : ''}{formatCurrency(dreData.custos)}</span>
                    </div>
                    
                    {/* 3. RESULTADO BRUTO */}
                    <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-blue-500/5 border border-blue-500/10 my-1">
                        <span className="font-bold text-text-primary text-[13px] uppercase">3. (=) RESULTADO BRUTO</span>
                        <span className={`font-bold tracking-tight font-mono text-base ${dreData.resultadoBruto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dreData.resultadoBruto < 0 ? '-' : ''}{formatCurrency(Math.abs(dreData.resultadoBruto))}
                        </span>
                    </div>
                    
                    {/* - DESPESAS OPERACIONAIS */}
                    <div className="flex justify-between items-center p-2.5 px-4 transition-all hover:bg-background/20 pl-8">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <span className="w-1.5 h-1.5 rounded bg-orange-500/50"></span>
                            <span>(-) Despesas Administrativas & Operacionais</span>
                        </div>
                        <span className="text-rose-400 font-mono text-[13px]">{dreData.despesasOperacionais > 0 ? '-' : ''}{formatCurrency(dreData.despesasOperacionais)}</span>
                    </div>
                    
                    {/* INDIVIDUAL EXPENSES BREAKDOWN */}
                    <div className="pl-12 pr-4 py-1.5 space-y-1 border-l-2 border-border-color/30 ml-8 mb-2 bg-background/10 rounded-lg">
                        {dreData.sortedExpenses.map((exp, idx) => (
                            <div key={idx} className="flex justify-between text-text-secondary hover:text-text-primary text-xs py-1 px-1 hover:bg-background/40 transition-colors rounded">
                                <span className="truncate max-w-[280px] sm:max-w-md">{exp.name}</span>
                                <span className="font-mono font-medium">-{formatCurrency(exp.value)}</span>
                            </div>
                        ))}
                        {dreData.sortedExpenses.length === 0 && (
                            <div className="text-[10px] text-text-secondary italic p-1">Nenhuma despesa operacional detalhada neste período.</div>
                        )}
                    </div>

                    {/* 4. RESULTADO OPERACIONAL */}
                    <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-purple-500/5 border border-purple-500/10 my-1">
                        <span className="font-bold text-text-primary text-[13px] uppercase">4. (=) RESULTADO OPERACIONAL</span>
                        <span className={`font-bold tracking-tight font-mono text-base ${dreData.resultadoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dreData.resultadoOperacional < 0 ? '-' : ''}{formatCurrency(Math.abs(dreData.resultadoOperacional))}
                        </span>
                    </div>
                    
                    {/* - OUTRAS RECEITAS */}
                    <div className="flex justify-between items-center p-2.5 px-4 transition-all hover:bg-background/20 pl-8 border-b border-border-color/10 mb-1">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <span className="w-1.5 h-1.5 rounded bg-cyan-500/50"></span>
                            <span>(+) Outras Receitas Não Operacionais / Rendimentos</span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[13px]">{formatCurrency(dreData.outrasReceitas)}</span>
                    </div>

                    {/* 5. RESULTADO FINAL HIGHLIGHT BOX */}
                    <div className="flex justify-between items-center py-4 px-5 border-t border-border-color/50 mt-4 bg-gradient-to-r from-surface to-background/50 border-2 border-primary/25 rounded-xl shadow-md">
                        <div>
                            <span className="font-bold text-[14px] text-primary uppercase tracking-wide block">(=) RESULTADO FINAL LÍQUIDO</span>
                            <span className="text-[10px] text-text-secondary">Resultado líquido contábil amortizado do período demonstrado</span>
                        </div>
                        <span className={`font-bold text-xl font-mono ${dreData.resultadoFinal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dreData.resultadoFinal < 0 ? '-' : ''}{formatCurrency(Math.abs(dreData.resultadoFinal))}
                        </span>
                    </div>
                </div>
            </Card>

            <Card className="max-w-4xl mx-auto mt-6">
                <div className="border-b border-border-color pb-4 mb-4 text-center">
                    <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Valuation Pro-Forma</h3>
                    <p className="text-text-secondary text-sm">Cálculo baseado no Resultado Operacional mensal multiplicador setorial (Múltiplo de 5x)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border-color">
                                <th className="p-3">Mês / Ano</th>
                                <th className="p-3 text-right">Resultado Operacional</th>
                                <th className="p-3 text-right text-primary">Valuation (5x)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30 font-mono text-sm">
                            {valuationMonthlyData.map(item => (
                                <tr key={item.key} className="hover:bg-background/50 transition-colors">
                                    <td className="p-3 font-bold capitalize">{item.monthYear}</td>
                                    <td className={`p-3 text-right ${item.resultadoOperacionalMes >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                        {formatCurrency(item.resultadoOperacionalMes)}
                                    </td>
                                    <td className={`p-3 text-right font-bold ${item.valuation !== null ? 'text-primary' : 'text-text-secondary'}`}>
                                        {item.valuation !== null ? (
                                            formatCurrency(item.valuation)
                                        ) : (
                                            <span className="text-text-secondary text-xs italic font-normal">Não Aplicável (Resultado negativo)</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {valuationMonthlyData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-text-secondary text-sm">Sem dados suficientes para o período selecionado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 pt-6 border-t-2 border-border-color bg-background/20 p-4 rounded-lg">
                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Resumo Acumulado (Filtro)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-border-color">
                            <span className="text-xs font-semibold text-text-secondary">Resultado Operacional Acumulado:</span>
                            <span className={`text-lg font-bold ${accumulatedOpResult >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                {formatCurrency(accumulatedOpResult)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-primary/30">
                            <span className="text-xs font-semibold text-primary">Valuation 5x Resultado Operacional:</span>
                            <span className="text-sm sm:text-base md:text-lg font-bold text-primary text-right">
                                {accumulatedValuation !== null ? (
                                    formatCurrency(accumulatedValuation)
                                ) : (
                                    <span className="text-text-secondary text-xs italic font-normal">Valuation não calculado por resultado operacional negativo</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ReportsView;
