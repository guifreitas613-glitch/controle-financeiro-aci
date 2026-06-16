import React, { useState, useMemo, FC } from 'react';
import { 
    Transaction, 
    IncomeCategory, 
    ExpenseCategory, 
    CostCenter, 
    Advisor, 
    ImportedRevenue, 
    TransactionType, 
    ExpenseStatus, 
    ExpenseNature, 
    TransactionFormValues 
} from '../types';
import { 
    Card, 
    Button, 
    Modal, 
    UploadIcon, 
    ExportIcon, 
    FileTextIcon, 
    PlusIcon, 
    InfoIcon, 
    SearchIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    CheckCircleIcon, 
    EditIcon, 
    TrashIcon 
} from './UIComponents';
import { TransactionForm } from './forms/TransactionForm';
import { round, formatCurrency, formatDate } from '../services/financialCalculations';

declare var XLSX: any;
declare var jspdf: any;

type ImportableTransaction = Partial<Transaction> & {
    tempId: string;
    selected: boolean;
};

const parseOFX = (content: string): ImportableTransaction[] => {
    const transactions: ImportableTransaction[] = [];
    const transactionBlocks = content.split('<STMTTRN>');

    transactionBlocks.forEach(block => {
        if (!block.includes('</STMTTRN>')) return;
        const amountMatch = block.match(/<TRNAMT>([\d.-]+)/);
        const dateMatch = block.match(/<DTPOSTED>\s*(\d{8})/);
        const memoMatch = block.match(/<MEMO>(.*?)(\n|<)/);
        const nameMatch = block.match(/<MEMO>(.*?)(\n|<)/) || block.match(/<NAME>(.*?)(\n|<)/);

        if (dateMatch && amountMatch) {
            const rawDate = dateMatch[1];
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(4, 6);
            const day = rawDate.substring(6, 8);
            const dateIso = `${year}-${month}-${day}T12:00:00.000Z`;

            const amount = parseFloat(amountMatch[1]);
            const description = (memoMatch ? memoMatch[1] : (nameMatch ? nameMatch[1] : 'Importação OFX')).trim();

            const type = amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
            const absAmount = Math.abs(amount);

            transactions.push({
                tempId: crypto.randomUUID(),
                selected: true,
                date: dateIso,
                amount: round(absAmount),
                description: description || 'Transação OFX',
                type: type,
                category: 'Outros',
                status: ExpenseStatus.PAID,
                paymentMethod: 'Transferência Bancária',
                clientSupplier: 'Importação Bancária',
                nature: ExpenseNature.VARIABLE,
                costCenter: 'conta-pj',
            });
        }
    });
    return transactions;
};

export const TransactionsView: FC<{
    transactions: Transaction[];
    onAdd: (data: TransactionFormValues) => void;
    onEdit: (id: string, data: TransactionFormValues) => void;
    onDelete: (id: string) => void;
    onSetPaid: (id: string) => void;
    onToggleReconciliation: (id: string, current: boolean) => void;
    incomeCategories: IncomeCategory[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    onImportTransactions: (data: any[]) => void;
    globalTaxRate: number;
    importedRevenues: ImportedRevenue[];
    userId?: string;
}> = ({ 
    transactions, 
    onAdd, 
    onEdit, 
    onDelete, 
    onSetPaid, 
    onToggleReconciliation, 
    incomeCategories, 
    expenseCategories, 
    paymentMethods, 
    costCenters, 
    advisors, 
    onImportTransactions, 
    globalTaxRate, 
    importedRevenues, 
    userId 
}) => {
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
    const [activeTab, setActiveTab ] = useState<TransactionType>(TransactionType.EXPENSE);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>('all');
    const [filterReconciliation, setFilterReconciliation] = useState<'all' | 'pending' | 'reconciled'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const availableYears = useMemo(() => {
        const yearsSet = new Set(transactions.map(t => t.date ? new Date(t.date).getUTCFullYear() : null).filter((y): y is number => y !== null));
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a: number, b: number) => b - a);
    }, [transactions]);

    const filtered = useMemo(() => {
        let items = transactions.filter(t => {
            const d = new Date(t.date);
            if (filterYear !== 'all' && d.getUTCFullYear() !== filterYear) return false;
            if (filterMonth !== 'all' && d.getUTCMonth() !== filterMonth) return false;
            
            if (t.type !== activeTab) return false;
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            
            if (activeTab === TransactionType.EXPENSE && filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterReconciliation === 'pending' && t.reconciled) return false;
            if (filterReconciliation === 'reconciled' && !t.reconciled) return false;

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return (t.description || '').toLowerCase().includes(lower) || (t.clientSupplier || '').toLowerCase().includes(lower) || (t.category || '').toLowerCase().includes(lower);
            }
            return true;
        });

        // PROJEÇÃO AUTOMÁTICA DE GASTOS FIXOS (VISUAL APENAS)
        if (activeTab === TransactionType.EXPENSE && filterYear !== 'all' && filterMonth !== 'all' && !searchTerm && filterCategory === 'all') {
            const now = new Date();
            const currentYear = now.getUTCFullYear();
            const currentMonth = now.getUTCMonth();
            const selectedYear = filterYear as number;
            const selectedMonth = filterMonth as number;
            
            const isFutureOrCurrent = (selectedYear > currentYear) || (selectedYear === currentYear && selectedMonth >= currentMonth);

            if (isFutureOrCurrent) {
                const refDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
                const refYear = refDate.getUTCFullYear();
                const refMonth = refDate.getUTCMonth();

                const baseFixedExpenses = transactions.filter(t => {
                    const d = new Date(t.date);
                    return t.type === TransactionType.EXPENSE &&
                           t.nature === ExpenseNature.FIXED &&
                           d.getUTCFullYear() === refYear &&
                           d.getUTCMonth() === refMonth;
                });

                baseFixedExpenses.forEach(f => {
                    const alreadyExists = items.some(item => 
                        !item.isProjection &&
                        item.description === f.description && 
                        item.category === f.category && 
                        item.nature === ExpenseNature.FIXED
                    );

                    if (!alreadyExists) {
                        const day = new Date(f.date).getUTCDate();
                        const lastDayOfTarget = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0)).getUTCDate();
                        const targetDay = Math.min(day, lastDayOfTarget);
                        
                        const projectedDate = new Date(Date.UTC(selectedYear, selectedMonth, targetDay, 12, 0, 0)).toISOString();
                        const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
                        
                        items.push({
                            ...f,
                            id: `proj-${f.id}-${selectedYear}-${selectedMonth}`,
                            date: projectedDate,
                            status: ExpenseStatus.PENDING,
                            reconciled: false,
                            isProjection: !isCurrentMonth
                        } as any);
                    }
                });
            }
        }

        if (sortConfig !== null) {
            items.sort((a, b) => {
                const valA = a[sortConfig.key as keyof Transaction] as (string | number);
                const valB = b[sortConfig.key as keyof Transaction] as (string | number);
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [transactions, filterYear, filterMonth, activeTab, filterCategory, searchTerm, sortConfig, filterStatus, filterReconciliation]);

    const totalFilteredAmount = useMemo(() => round(filtered.reduce<number>((sum, t) => sum + t.amount, 0)), [filtered]);

    const requestSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Transaction) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1 inline" /> : <ArrowDownIcon className="w-4 h-4 ml-1 inline" />;
    };

    const handleEdit = (t: Transaction) => { 
        setEditingId(t.id); 
        setIsModalOpen(true); 
    };
    const handleClose = () => { setIsModalOpen(false); setEditingId(null); };
    const handleSubmit = (data: TransactionFormValues) => { if (editingId) onEdit(editingId, data); else onAdd(data); handleClose(); };

    const handleExportExcel = () => {
        if (!XLSX) { alert('Biblioteca Excel não carregada.'); return; }
        const dataToExport = filtered.map(t => ({
            Data: formatDate(t.date),
            Descrição: t.description,
            Categoria: t.category,
            Valor: t.amount,
            Status: t.status || '-',
            Conciliado: t.reconciled ? 'Sim' : 'Não',
            'Meio de Pagamento': t.paymentMethod,
            'Cliente/Fornecedor': t.clientSupplier
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");
        XLSX.writeFile(workbook, `transacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!jspdf) { alert('Biblioteca PDF não carregada.'); return; }
        const doc = new jspdf.jsPDF();
        doc.text("Relatório de Transações - ACI Capital", 14, 15);
        const tableData = filtered.map(t => [
            formatDate(t.date),
            t.description,
            t.category,
            formatCurrency(t.amount),
            t.status || '-',
            t.reconciled ? 'SIM' : 'NÃO'
        ]);
        (doc as any).autoTable({
            head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Status', 'Concil.']],
            body: tableData,
            startY: 20,
            theme: 'striped',
            headStyles: { fillStyle: '#1A214A', textColor: [255, 255, 255] }
        });
        doc.save(`transacoes_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent uppercase tracking-tight">Transações</h2>
                        <p className="text-text-secondary text-sm">Gerencie suas receitas e despesas.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <label className="bg-surface hover:bg-surface/80 text-text-primary px-4 py-2 rounded-lg cursor-pointer border border-border-color flex items-center gap-2 text-sm font-semibold transition-all">
                        <UploadIcon className="w-4 h-4"/> Importar OFX
                        <input type="file" accept=".ofx" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    if (evt.target?.result) {
                                        const parsed = parseOFX(evt.target.result as string);
                                        onImportTransactions(parsed);
                                    }
                                };
                                reader.readAsText(file);
                            }
                        }} />
                    </label>
                    <div className="flex gap-1">
                        <Button onClick={handleExportExcel} variant="secondary" className="text-sm" title="Exportar para Excel">
                            <ExportIcon className="w-4 h-4"/> Excel
                        </Button>
                        <Button onClick={handleExportPDF} variant="secondary" className="text-sm" title="Exportar para PDF">
                            <FileTextIcon className="w-4 h-4"/> PDF
                        </Button>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-opacity-90"><PlusIcon className="w-4 h-4"/> Nova Transação</Button>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3 mb-6">
                <InfoIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-200">
                    <strong>Atenção:</strong> Receitas geradas por assessores e suas respectivas comissões devem ser registradas exclusivamente na aba <strong>Comissões</strong> para garantir o cálculo correto de divisões e impostos.
                </p>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4 border-b border-border-color pb-4">
                     <div className="flex bg-background p-1 rounded-lg">
                        <button onClick={() => setActiveTab(TransactionType.EXPENSE)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === TransactionType.EXPENSE ? 'bg-surface text-danger shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Despesas</button>
                        <button onClick={() => setActiveTab(TransactionType.INCOME)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === TransactionType.INCOME ? 'bg-surface text-green-400 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Receitas</button>
                    </div>
                     <div className="flex-1 flex flex-col md:flex-row gap-4 items-center w-full">
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-background border border-border-color rounded-md text-sm focus:ring-primary focus:border-primary" />
                        </div>
                        <div className="text-right whitespace-nowrap bg-background px-3 py-2 rounded-lg border border-border-color">
                            <span className="text-text-secondary text-sm mr-2 font-medium">Saldo Listado:</span>
                            <span className={`font-bold ${activeTab === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(totalFilteredAmount)}</span>
                        </div>
                    </div>
                </div>
                <div className={`grid grid-cols-2 ${activeTab === TransactionType.EXPENSE ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
                    <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                        <option value="all">Todos os Anos</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                        <option value="all">Todos os Meses</option>
                        {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                        <option value="all">Todas as Categorias</option>
                        {(activeTab === TransactionType.INCOME ? incomeCategories.map(c => c.name) : expenseCategories.map(c => c.name)).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {activeTab === TransactionType.EXPENSE && (
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                            <option value="all">Todos os Status</option>
                            <option value={ExpenseStatus.PAID}>Pago</option>
                            <option value={ExpenseStatus.PENDING}>Pendente</option>
                        </select>
                    )}
                    <select value={filterReconciliation} onChange={(e) => setFilterReconciliation(e.target.value as any)} className="bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                        <option value="all">Todas as Conciliações</option>
                        <option value="pending">Aguardando Conciliação</option>
                        <option value="reconciled">Conciliado</option>
                    </select>
                </div>
            </Card>

            <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/40 text-text-secondary text-[9px] font-bold uppercase tracking-wider border-b border-border-color">
                                <th className="p-2.5 px-3 cursor-pointer hover:text-primary transition-colors text-left" onClick={() => requestSort('date')}>Data {getSortIndicator('date')}</th>
                                <th className="p-2.5 px-3 cursor-pointer hover:text-primary transition-colors text-left" onClick={() => requestSort('description')}>Descrição {getSortIndicator('description')}</th>
                                <th className="p-2.5 px-3 cursor-pointer hover:text-primary transition-colors text-left" onClick={() => requestSort('category')}>Categoria {getSortIndicator('category')}</th>
                                <th className="p-2.5 px-3 text-right cursor-pointer hover:text-primary transition-colors font-semibold" onClick={() => requestSort('amount')}>Valor {getSortIndicator('amount')}</th>
                                {activeTab === TransactionType.EXPENSE && <th className="p-2.5 px-3 text-center">Status</th>}
                                <th className="p-2.5 px-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/15 text-xs font-medium">
                            {filtered.map(t => (
                                <tr key={t.id} className={`hover:bg-background/20 transition-colors h-11 ${t.isProjection ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                    <td className="p-2.5 px-3 whitespace-nowrap text-text-secondary font-mono">{formatDate(t.date)}</td>
                                    <td className="p-2.5 px-3">
                                        <div className="font-bold text-text-primary text-xs">{t.description}</div>
                                        <div className="text-[10px] text-text-secondary font-normal mt-0.5">{t.clientSupplier || '-'}</div>
                                    </td>
                                    <td className="p-2.5 px-3">
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-border-color/25 border border-border-color/40 text-[9px] uppercase font-bold text-text-secondary">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className={`p-2.5 px-3 text-right font-mono font-bold text-xs ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(t.amount)}
                                    </td>
                                    {activeTab === TransactionType.EXPENSE && (
                                        <td className="p-2.5 px-3 text-center">
                                            {(() => {
                                                const isPaid = t.status === ExpenseStatus.PAID;
                                                const isOverdue = t.status === ExpenseStatus.PENDING && new Date(t.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                                                
                                                if (isPaid) {
                                                    return (
                                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-success/15 text-success border border-success/30">
                                                            PAGO
                                                        </span>
                                                    );
                                                }
                                                if (isOverdue) {
                                                    return (
                                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-danger/15 text-danger border border-danger/30">
                                                            VENCIDO
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">
                                                        PENDENTE
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    )}
                                    <td className="p-2.5 px-3 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            {!t.isProjection ? (
                                                <>
                                                    <label className="flex items-center gap-1 cursor-pointer select-none py-1 mr-1" title={t.type === TransactionType.EXPENSE && t.status !== ExpenseStatus.PAID ? "Apenas despesas pagas podem ser conciliadas" : "Conciliação Bancária (CB)"}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!t.reconciled} 
                                                            onChange={() => onToggleReconciliation(t.id, !!t.reconciled)}
                                                            disabled={t.type === TransactionType.EXPENSE && t.status !== ExpenseStatus.PAID}
                                                            className="w-3.5 h-3.5 rounded border-border-color text-primary focus:ring-primary bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-[10px] font-bold text-text-secondary">CB</span>
                                                    </label>
                                                    {t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && (
                                                        <button 
                                                            className="p-1 rounded hover:bg-success/10 text-text-secondary hover:text-success border border-transparent hover:border-success/30 transition-all" 
                                                            onClick={() => onSetPaid(t.id)} 
                                                            title="Marcar como Pago"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="p-1 rounded hover:bg-secondary/10 text-text-secondary hover:text-primary border border-transparent hover:border-secondary/30 transition-all" 
                                                        onClick={() => handleEdit(t)} 
                                                        title="Editar"
                                                    >
                                                        <EditIcon className="w-4 h-4"/>
                                                    </button>
                                                    <button 
                                                        className="p-1 rounded hover:bg-danger/10 text-text-secondary hover:text-danger border border-transparent hover:border-danger/30 transition-all" 
                                                        onClick={() => onDelete(t.id)} 
                                                        title="Excluir"
                                                    >
                                                        <TrashIcon className="w-4 h-4"/>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[9px] uppercase font-bold text-secondary px-1.5 py-0.5 bg-secondary/15 rounded border border-secondary/25">Projetado</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === TransactionType.EXPENSE ? 6 : 5} className="p-6 text-center text-text-secondary text-sm">Nenhuma transação encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleClose} title={editingId ? "Editar Transação" : "Nova Transação"}>
                <TransactionForm onSubmit={handleSubmit} onClose={handleClose} initialData={editingId ? transactions.find(t => t.id === editingId) : null} defaultType={activeTab} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} globalTaxRate={globalTaxRate} transactions={transactions} importedRevenues={importedRevenues} userId={userId} />
            </Modal>
        </div>
    );
};

export default TransactionsView;
