
import React, { useState, useMemo, FC, ReactNode, useEffect } from 'react';
import { Transaction, Goal, TransactionType, View, ExpenseStatus, ExpenseNature, CostCenter, Advisor, ExpenseCategory, ExpenseType, AdvisorSplit, ImportedRevenue, AdvisorCost } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import Login from './Login';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser } from './auth';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction as deleteTransactionFromDb, getImportedRevenues, saveImportedRevenue, deleteImportedRevenue, getRevenuesByPeriod, deduplicateImportedRevenues } from './firestore';


// --- ÍCONES ---
const DashboardIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>);
const TransactionsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const GoalsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const ReportsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const SettingsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const PlusIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const EditIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>);
const TrashIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
const CloseIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const MenuIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>);
const ExportIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const PaidIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M8 12.5h2.5a2 2 0 1 0 0-4H8v4z"/><path d="M8 12.5v4"/><path d="M13.5 12.5H16"/><path d="M14 16.5h2"/></svg>);
const UploadIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const SearchIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const LogoutIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const ArrowUpIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>);
const ArrowDownIcon: FC<{ className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>);
const AlertCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const CheckCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const FileTextIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);


// --- DECLARAÇÕES DE BIBLIOTECAS GLOBAIS ---
declare var XLSX: any;
declare var jspdf: any;

// --- HOOKS ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValue;
            const parsed = JSON.parse(item);
            if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
                return initialValue;
            }
            return parsed;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}


// --- UTILITÁRIOS ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
const formatDateForInput = (dateString: string) => new Date(dateString).toISOString().split('T')[0];
const getMonthYear = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// Extending Transaction for Import Preview (internal use only)
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
        const nameMatch = block.match(/<NAME>(.*?)(\n|<)/);

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
                amount: absAmount,
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

// --- DADOS INICIAIS ---
const getInitialGoals = (): Goal[] => ([]);
const initialIncomeCategories = ['Taxa de Consultoria', 'Taxa de Performance', 'Comissão sobre Ativos', 'Rendimento de Investimentos', 'Reembolso de Custos', 'Outros'];
const initialExpenseCategories: ExpenseCategory[] = [
    { name: 'Remuneração de Assessores', type: ExpenseType.COST },
    { name: 'Plataformas e Sistemas', type: ExpenseType.COST },
    { name: 'Marketing e Captação', type: ExpenseType.EXPENSE },
    { name: 'Custos Operacionais', type: ExpenseType.COST },
    { name: 'Impostos e Encargos', type: ExpenseType.EXPENSE },
    { name: 'Despesas Administrativas', type: ExpenseType.EXPENSE },
    { name: 'Despesas Estruturais', type: ExpenseType.EXPENSE },
    { name: 'Mobiliário e Equipamentos', type: ExpenseType.EXPENSE },
    { name: 'Outros', type: ExpenseType.EXPENSE },
];
const initialPaymentMethods = ['Transferência Bancária', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto Bancário'];
const initialCostCenters: CostCenter[] = [
    { id: 'conta-pj', name: 'Conta PJ da Empresa', isDefault: true },
    { id: 'provisao-impostos', name: 'Provisão de Impostos', isDefault: true }
];
const initialAdvisors: Advisor[] = [];


// --- COMPONENTES DE UI REUTILIZÁVEIS ---
const Card: FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (<div className={`bg-surface rounded-xl shadow-lg p-4 sm:p-6 ${className}`}>{children}</div>);
const Button: FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghostDanger' | 'success'; className?: string; type?: "button" | "submit" | "reset"; disabled?: boolean; as?: 'button' | 'label'; htmlFor?: string; title?: string }> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false, as = 'button', htmlFor, title }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform';
  const variantClasses = {
    primary: 'bg-primary hover:bg-opacity-90 text-white shadow-md shadow-primary/30 hover:scale-105',
    secondary: 'bg-text-secondary bg-opacity-20 hover:bg-opacity-30 text-text-primary hover:scale-105',
    danger: 'bg-danger hover:bg-red-500 text-white hover:scale-105',
    success: 'bg-green-500 hover:bg-green-600 text-white hover:scale-105',
    ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary',
    ghostDanger: 'bg-transparent hover:bg-red-500/10 text-text-secondary hover:text-danger',
  };
  
  if (as === 'label') {
    return <label htmlFor={htmlFor} className={`${baseClasses} ${variantClasses[variant]} ${className} cursor-pointer`} title={title}>{children}</label>
  }

  return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled} title={title}>{children}</button>;
};
const Modal: FC<{ isOpen: boolean; onClose: () => void; title: string; children: ReactNode, size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;
  const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
      <div className={`bg-surface rounded-lg shadow-xl w-full p-6 m-4 ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><CloseIcon className="w-6 h-6"/></button>
        </div>
        {children}
      </div>
    </div>
  );
};
const ProgressBar: FC<{ progress: number }> = ({ progress }) => {
    const safeProgress = Math.min(100, Math.max(0, progress));
    return (<div className="w-full bg-background rounded-full h-2.5"><div className="bg-gradient-to-r from-primary to-yellow-500 h-2.5 rounded-full" style={{ width: `${safeProgress}%` }}></div></div>);
};

// --- COMPONENTES DE FORMULÁRIO ---
interface TransactionFormValues {
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    category: string;
    clientSupplier: string;
    paymentMethod: string;
    status?: ExpenseStatus;
    nature?: ExpenseNature;
    costCenter?: string;
    taxAmount?: number;
    grossAmount?: number;
    commissionAmount?: number;
    advisorId?: string;
    recurringCount?: number;
    splits?: AdvisorSplit[];
}
interface TransactionFormProps { 
    onSubmit: (data: TransactionFormValues) => void;
    onClose: () => void; 
    initialData?: Transaction | null; 
    defaultType?: TransactionType | null;
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    globalTaxRate: number;
    transactions?: Transaction[];
    importedRevenues?: ImportedRevenue[];
    userId?: string;
}

const TransactionForm: FC<TransactionFormProps> = ({ onSubmit, onClose, initialData, defaultType, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, globalTaxRate, transactions = [], importedRevenues = [], userId }) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || defaultType || TransactionType.EXPENSE);
    const [nature, setNature] = useState<ExpenseNature>(initialData?.nature || ExpenseNature.VARIABLE);
    const [advisorId, setAdvisorId] = useState(initialData?.advisorId || '');
    const [recurringCount, setRecurringCount] = useState('1');
    const [splits, setSplits] = useState<AdvisorSplit[]>([]);

    const isAddingFromTab = !!defaultType;
    const isEditing = !!initialData;
    const currentCategories = useMemo(() => 
        type === TransactionType.INCOME 
            ? incomeCategories 
            : expenseCategories.map(c => c.name), 
        [type, incomeCategories, expenseCategories]
    );
    
    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        grossAmount: (initialData?.grossAmount ?? initialData?.amount)?.toString() || '',
        date: initialData?.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date().toISOString()),
        category: initialData?.category || (currentCategories.length > 0 ? currentCategories[0] : ''),
        clientSupplier: initialData?.clientSupplier || '',
        paymentMethod: initialData?.paymentMethod || (paymentMethods.length > 0 ? paymentMethods[0] : ''),
        status: initialData?.status || ExpenseStatus.PENDING,
        costCenter: initialData?.costCenter || 'conta-pj',
    });
    
    // Search state for period revenues
    const [searchPeriod, setSearchPeriod] = useState({ start: '', end: '', show: false });
    
    const [commissionAmount, setCommissionAmount] = useState(initialData?.commissionAmount || 0);
    const [isCommissionManual, setIsCommissionManual] = useState(false);
    
    const gross = parseFloat(formData.grossAmount) || 0;
    const taxAmount = type === TransactionType.INCOME ? (gross * globalTaxRate / 100) : 0;
    const basePostTax = gross - taxAmount;

    useEffect(() => {
        const newCats = type === TransactionType.INCOME ? incomeCategories : expenseCategories.map(c => c.name);
        setFormData(prev => ({
            ...prev,
            category: newCats.includes(prev.category) ? prev.category : (newCats[0] || '')
        }));
    }, [type, incomeCategories, expenseCategories]);
    
    useEffect(() => {
        if (nature === ExpenseNature.VARIABLE) {
            setRecurringCount('1');
        }
    }, [nature]);

    useEffect(() => {
        if (!isCommissionManual && type === TransactionType.INCOME && advisorId && splits.length === 0) {
             const comm = basePostTax * 0.30;
             setCommissionAmount(comm > 0 ? comm : 0);
        }
    }, [formData.grossAmount, advisorId, splits.length, type, basePostTax, isCommissionManual]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSplit = () => {
        if (advisors.length === 0) {
            alert("Cadastre assessores primeiro nas Configurações.");
            return;
        }
        setSplits([...splits, { advisorId: advisors[0].id, advisorName: advisors[0].name, revenueAmount: 0, percentage: 30, additionalCost: 0 }]);
    };

    const removeSplit = (index: number) => {
        setSplits(splits.filter((_, i) => i !== index));
    };

    const updateSplit = (index: number, field: keyof AdvisorSplit, value: any) => {
        const newSplits = [...splits];
        const split = { ...newSplits[index] };
        
        if (field === 'advisorId') {
            split.advisorId = value;
            const advisor = advisors.find(a => a.id === value);
            split.advisorName = advisor ? advisor.name : '';
        } else if (field === 'revenueAmount' || field === 'percentage' || field === 'additionalCost') {
            (split as any)[field] = parseFloat(value) || 0;
        }
        
        newSplits[index] = split;
        setSplits(newSplits);
    };

    const autoAdjustSplits = () => {
        if (splits.length === 0 || gross <= 0) return;
        const perSplit = gross / splits.length;
        const newSplits = splits.map(s => ({ ...s, revenueAmount: perSplit }));
        setSplits(newSplits);
    };

    const handleSearchPeriod = () => {
        setSearchPeriod({ ...searchPeriod, show: true });
    };

    const confirmSearchPeriod = async () => {
        if (!userId) {
            alert("Erro de autenticação.");
            return;
        }
        if (!searchPeriod.start || !searchPeriod.end) {
            alert("Selecione a data inicial e final.");
            return;
        }
        
        const startDate = new Date(searchPeriod.start);
        startDate.setUTCHours(0, 0, 0, 0);
        const startDateIso = startDate.toISOString();

        const endDate = new Date(searchPeriod.end);
        endDate.setUTCHours(23, 59, 59, 999);
        const endDateIso = endDate.toISOString();

        if (startDate.getTime() > endDate.getTime()) {
            alert("Data inicial não pode ser maior que data final.");
            return;
        }

        try {
            const snapshot = await getRevenuesByPeriod(startDateIso, endDateIso, userId);
            const periodRevenues = snapshot.docs.map(doc => doc.data() as ImportedRevenue);

            if (periodRevenues.length === 0) {
                alert("Nenhuma receita importada encontrada para o período selecionado.");
                setSearchPeriod({ ...searchPeriod, show: false });
                return;
            }

            const revenueByAdvisor: Record<string, number> = {};
            let totalRevenueFound = 0;

            periodRevenues.forEach(rev => {
                // EXPLICIT FILTER: Ignore records classified as 'CUSTOS'
                if (rev.classificacao === 'CUSTOS') return;

                // Match advisor by name
                const advisor = advisors.find(adv => 
                    adv.name.toLowerCase() === (rev.assessorPrincipal || '').toLowerCase()
                );

                if (advisor) {
                    // EXPLICIT SUM: Only use comissaoLiquida
                    const val = rev.comissaoLiquida || 0;
                    revenueByAdvisor[advisor.id] = (revenueByAdvisor[advisor.id] || 0) + val;
                    totalRevenueFound += val;
                }
            });

            if (totalRevenueFound === 0) {
                alert("Receitas encontradas, mas nenhum assessor correspondente foi localizado ou todas eram 'CUSTOS'. Verifique os dados.");
                setSearchPeriod({ ...searchPeriod, show: false });
                return;
            }

            const newSplits: AdvisorSplit[] = Object.keys(revenueByAdvisor).map(advId => {
                const advisor = advisors.find(a => a.id === advId)!;
                return {
                    advisorId: advisor.id,
                    advisorName: advisor.name,
                    revenueAmount: revenueByAdvisor[advId],
                    percentage: advisor.commissionRate || 30,
                    additionalCost: 0
                };
            });

            setSplits(newSplits);
            setFormData(prev => ({ ...prev, grossAmount: totalRevenueFound.toFixed(2) }));
            setSearchPeriod({ ...searchPeriod, show: false });
            alert(`Receitas carregadas! Total: ${formatCurrency(totalRevenueFound)} distribuído entre ${newSplits.length} assessores.`);
        } catch (error) {
            console.error("Erro ao buscar receitas:", error);
            alert("Erro ao buscar receitas do período. Verifique se existe um índice composto para 'tipoInterno' e 'date' no Firebase.");
        }
    };

    const splitsDetails = useMemo(() => {
        return splits.map(split => {
             // Logic adjusted for specific request: repasseLiq = receitaIndividual * (percentualRepasse / 100) - custoAdicional
             const calculatedPayout = (split.revenueAmount * (split.percentage / 100)) - (split.additionalCost || 0);

             return {
                 ...split,
                 netPayout: calculatedPayout
             }
        });
    }, [splits]);

    const totalSplitRevenue = splits.reduce((acc, s) => acc + s.revenueAmount, 0);
    const totalNetPayouts = splitsDetails.reduce((acc, s) => acc + (s.netPayout || 0), 0);
    const splitRevenueDifference = gross - totalSplitRevenue;
    const officeShare = basePostTax - totalNetPayouts;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { description, grossAmount, date, category, paymentMethod, status, costCenter, clientSupplier } = formData;
        
        if (!description || !grossAmount || !date || !category) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (type === TransactionType.INCOME && !clientSupplier.trim()) {
            alert("O campo 'Cliente' é obrigatório para receitas.");
            return;
        }
        if (type === TransactionType.EXPENSE && !paymentMethod) {
            alert("O campo 'Forma de Pagamento' é obrigatório para despesas.");
            return;
        }

        const parsedGrossAmount = parseFloat(grossAmount);
        if(isNaN(parsedGrossAmount)) {
             alert("O valor inserido é inválido.");
            return;
        }

        if (splits.length > 0) {
            if (Math.abs(splitRevenueDifference) > 0.05) {
                alert(`A soma das receitas individuais (R$ ${formatCurrency(totalSplitRevenue)}) deve ser igual ao valor total da receita (R$ ${formatCurrency(parsedGrossAmount)}). Diferença: ${formatCurrency(splitRevenueDifference)}`);
                return;
            }
        }
        
        const submissionData: TransactionFormValues = {
            description,
            amount: type === TransactionType.INCOME ? basePostTax : parsedGrossAmount, 
            date: new Date(date).toISOString(),
            type,
            category,
            clientSupplier,
            paymentMethod,
            costCenter,
        };
        
        if (type === TransactionType.INCOME) {
            submissionData.taxAmount = taxAmount;
            submissionData.grossAmount = parsedGrossAmount;
            if (splits.length > 0) {
                // Remove additionalCost property before saving, but keep calculated netPayout
                submissionData.splits = splitsDetails.map(s => {
                    const { additionalCost, ...rest } = s;
                    return rest;
                });
            } else {
                submissionData.commissionAmount = commissionAmount;
                submissionData.advisorId = advisorId;
            }
        }

        if (type === TransactionType.EXPENSE) {
            submissionData.status = status;
            submissionData.nature = nature;
            if (nature === ExpenseNature.FIXED && !isEditing) {
                submissionData.recurringCount = parseInt(recurringCount, 10) || 1;
            }
        }
        
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Tipo</label>
                    <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} name="type" disabled={!!initialData || isAddingFromTab} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed">
                        <option value={TransactionType.INCOME}>Receita</option>
                        <option value={TransactionType.EXPENSE}>Despesa</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary">Descrição</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">{type === TransactionType.INCOME ? 'Receita Total (Bruto)' : 'Valor'}</label>
                    <input type="number" step="0.01" name="grossAmount" value={formData.grossAmount} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Categoria</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
                        {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-text-secondary">{type === TransactionType.INCOME ? 'Cliente' : 'Fornecedor (Opcional)'}</label>
                 <input type="text" name="clientSupplier" value={formData.clientSupplier} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required={type === TransactionType.INCOME} />
            </div>
            
            {type === TransactionType.INCOME && (
                <>
                <div className="border border-border-color rounded-lg p-4 bg-background/50">
                    <div className="flex flex-wrap gap-3 mb-3">
                         {!searchPeriod.show ? (
                             <Button type="button" onClick={handleSearchPeriod} variant="secondary" className="flex-1 sm:flex-none py-2 px-4 text-xs font-semibold border border-primary/30 whitespace-nowrap" title="Busca e agrupa receitas já lançadas para os assessores por período">
                                 Buscar receitas do período
                             </Button>
                         ) : (
                            <div className="flex flex-col sm:flex-row gap-2 items-end bg-surface p-2 rounded border border-border-color w-full sm:w-auto">
                                <div>
                                    <label className="block text-[10px] text-text-secondary">De</label>
                                    <input type="date" value={searchPeriod.start} onChange={(e) => setSearchPeriod({...searchPeriod, start: e.target.value})} className="bg-background border border-border-color rounded px-2 py-1 text-xs min-w-[150px]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-secondary">Até</label>
                                    <input type="date" value={searchPeriod.end} onChange={(e) => setSearchPeriod({...searchPeriod, end: e.target.value})} className="bg-background border border-border-color rounded px-2 py-1 text-xs min-w-[150px]" />
                                </div>
                                <div className="flex gap-1">
                                    <Button type="button" onClick={confirmSearchPeriod} className="py-1 px-3 text-xs min-w-[50px]">OK</Button>
                                    <Button type="button" onClick={() => setSearchPeriod({...searchPeriod, show: false})} variant="ghost" className="py-1 px-2 text-xs">X</Button>
                                </div>
                            </div>
                         )}
                         <Button type="button" onClick={addSplit} variant="secondary" className="flex-1 sm:flex-none py-2 px-4 text-xs font-semibold whitespace-nowrap">
                             <PlusIcon className="w-4 h-4" /> Adicionar Assessor
                         </Button>
                    </div>
                    
                    {splits.length > 0 && (
                        <div className="space-y-3 mb-4">
                             <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-text-secondary font-medium px-1">
                                <div className="col-span-3">Assessor</div>
                                <div className="col-span-3">Receita Individual</div>
                                <div className="col-span-1 text-center">%</div>
                                <div className="col-span-2 text-center">Custo Adicional</div>
                                <div className="col-span-2 text-right">Repasse (Liq)</div>
                                <div className="col-span-1"></div>
                             </div>
                             {splitsDetails.map((split, index) => {
                                 return (
                                     <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-surface p-2 rounded-md">
                                        <div className="col-span-3">
                                            <select 
                                                value={split.advisorId} 
                                                onChange={(e) => updateSplit(index, 'advisorId', e.target.value)}
                                                className="w-full bg-background border-border-color rounded-md text-sm py-1"
                                            >
                                                {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="text" 
                                                value={Number(split.revenueAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    updateSplit(index, 'revenueAmount', Number(rawValue) / 100);
                                                }}
                                                placeholder="R$ 0,00"
                                                className="w-full bg-background border-border-color rounded-md text-sm py-1"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <input 
                                                type="number" 
                                                step="1" 
                                                min="0"
                                                max="100"
                                                value={split.percentage} 
                                                onChange={(e) => updateSplit(index, 'percentage', e.target.value)}
                                                className="w-full bg-background border-border-color rounded-md text-sm py-1 text-center"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                value={Number(split.additionalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    updateSplit(index, 'additionalCost', Number(rawValue) / 100);
                                                }}
                                                placeholder="R$ 0,00"
                                                className="w-full bg-background border-border-color rounded-md text-sm py-1"
                                            />
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-danger text-sm">
                                            {Number(split.netPayout || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button type="button" onClick={() => removeSplit(index)} className="text-text-secondary hover:text-danger">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                     </div>
                                 )
                             })}
                            <div className="mt-3 p-3 bg-surface rounded-lg border border-border-color text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Total Receita Informada:</span>
                                    <span className="font-mono">{Number(gross || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Soma Receitas Individuais:</span>
                                    <span className={`font-mono ${Math.abs(splitRevenueDifference) > 0.05 ? 'text-danger' : 'text-green-400'}`}>
                                        {Number(totalSplitRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                {Math.abs(splitRevenueDifference) > 0.05 && (
                                    <div className="flex justify-between items-center text-danger font-bold mt-1 pt-1 border-t border-border-color">
                                        <span>Diferença:</span>
                                        <div className="flex items-center gap-2">
                                            <span>{formatCurrency(splitRevenueDifference)}</span>
                                            <button type="button" onClick={autoAdjustSplits} className="text-[10px] bg-secondary/20 hover:bg-secondary/40 px-2 py-0.5 rounded text-text-primary font-normal">
                                                Ajustar Proporcionalmente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {splits.length === 0 && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary">Assessor (Opcional - Simples)</label>
                                 <select value={advisorId} onChange={(e) => { setAdvisorId(e.target.value); setIsCommissionManual(false); }} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                                    <option value="">Sem Assessor</option>
                                    {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                 <div className="bg-background p-3 rounded-lg border border-border-color">
                    <div className="grid grid-cols-3 gap-4 text-center mb-2">
                        <div>
                            <p className="text-xs text-text-secondary">Receita Total</p>
                            <p className="font-semibold">{formatCurrency(gross)}</p>
                        </div>
                        <div className="border-l border-r border-border-color px-2">
                            <p className="text-xs text-text-secondary">(-) Imposto ({globalTaxRate}%)</p>
                            <p className="font-semibold text-danger">
                                {formatCurrency(taxAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">(=) Base Pós-Imposto</p>
                            <p className="font-bold text-green-400">{formatCurrency(basePostTax)}</p>
                        </div>
                    </div>
                    
                    {splits.length > 0 && (
                        <div className="border-t border-border-color pt-2 mt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Total Repasses (Liq):</span>
                                <span className="font-bold text-danger">{formatCurrency(totalNetPayouts)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-text-secondary">Parcela Escritório:</span>
                                <span className={`font-bold ${(officeShare) >= 0 ? 'text-primary' : 'text-danger'}`}>
                                    {formatCurrency(officeShare)}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {splits.length === 0 && advisorId && (
                        <div className="flex flex-col items-center gap-2 pt-2 border-t border-border-color mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary">Comissão Estimada (30% do Líquido):</span>
                                <span className="font-bold text-danger">{formatCurrency(commissionAmount)}</span>
                            </div>
                             {isCommissionManual ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" step="0.01"
                                        value={commissionAmount.toFixed(2)}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                setCommissionAmount(val);
                                            }
                                        }}
                                        className="w-28 bg-surface p-1 rounded-md border border-border-color text-danger font-semibold text-center"
                                    />
                                    <Button type="button" variant="secondary" className="py-1 px-2 text-xs" onClick={() => setIsCommissionManual(false)}>Recalcular (Auto)</Button>
                                </div>
                            ) : (
                                <Button type="button" variant="ghost" className="py-1 px-2 text-xs text-text-secondary" onClick={() => setIsCommissionManual(true)}>Ajustar Manualmente</Button>
                            )}
                        </div>
                    )}
                </div>
                </>
            )}
            
            {type === TransactionType.EXPENSE && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Forma de Pagamento</label>
                             <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
                                {paymentMethods.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Centro de Custo</label>
                             <select name="costCenter" value={formData.costCenter} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
                                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={`grid grid-cols-1 ${nature === ExpenseNature.FIXED && !isEditing ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                         <div>
                            <label className="block text-sm font-medium text-text-secondary">Natureza do Gasto</label>
                            <select value={nature} onChange={(e) => setNature(e.target.value as ExpenseNature)} name="nature" className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                                <option value={ExpenseNature.VARIABLE}>Variável</option>
                                <option value={ExpenseNature.FIXED}>Fixo</option>
                            </select>
                        </div>
                         {nature === ExpenseNature.FIXED && !isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Repetir por (meses)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={recurringCount}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (val > 0 || e.target.value === '') {
                                            setRecurringCount(e.target.value);
                                        }
                                    }}
                                    disabled={isEditing}
                                    className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                         )}
                         {isEditing && initialData?.nature === ExpenseNature.FIXED && (
                            <div className="flex items-end">
                                <p className="text-xs text-text-secondary mb-1">A recorrência não pode ser editada. Para alterar, exclua e crie novamente.</p>
                            </div>
                         )}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                                <option value={ExpenseStatus.PAID}>Paga</option>
                                <option value={ExpenseStatus.PENDING}>Pendente</option>
                            </select>
                        </div>
                    </div>
                </>
            )}
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
};

interface GoalFormProps { onSubmit: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void; onClose: () => void; initialData?: Goal | null; }
const GoalForm: FC<GoalFormProps> = ({ onSubmit, onClose, initialData }) => { 
    const [name, setName] = useState(initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount.toString() || '');
  const [deadline, setDeadline] = useState(initialData?.deadline ? formatDateForInput(initialData.deadline) : '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    onSubmit({
      name,
      targetAmount: parseFloat(targetAmount as string),
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
     <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary">Nome da Meta</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-text-secondary">Valor Alvo</label>
            <input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-text-secondary">Prazo (Opcional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button onClick={onClose} variant="secondary">Cancelar</Button>
        <Button type="submit">Salvar Meta</Button>
      </div>
    </form>
  )
};

interface AddProgressFormProps {
  onSubmit: (amount: number) => void;
  onClose: () => void;
}
const AddProgressForm: FC<AddProgressFormProps> = ({ onSubmit, onClose }) => {
    const [amount, setAmount] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
            onSubmit(parsedAmount);
        } else {
            alert("Por favor, insira um valor válido e positivo.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary">Valor a Adicionar</label>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button type="submit">Adicionar</Button>
            </div>
        </form>
    );
};

const GoalsView: FC<{ goals: Goal[], onAdd: (g: any) => void, onUpdateProgress: (id: string, amount: number) => void, onDelete: (id: string) => void }> = ({ goals, onAdd, onUpdateProgress, onDelete }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const openProgressModal = (id: string) => { setSelectedGoalId(id); setIsProgressModalOpen(true); };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-text-primary">Metas Financeiras</h2><p className="text-text-secondary">Defina e acompanhe seus objetivos.</p></div>
                <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Nova Meta</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                    return (
                        <Card key={goal.id} className="relative group">
                            <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold text-text-primary">{goal.name}</h3><button onClick={() => onDelete(goal.id)} className="text-text-secondary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button></div>
                            <div className="mb-4"><div className="flex justify-between text-sm mb-1"><span className="text-text-secondary">Progresso</span><span className="font-bold text-primary">{Math.round(progress)}%</span></div><ProgressBar progress={progress} /></div>
                            <div className="flex justify-between items-center text-sm mb-4"><span className="font-mono text-text-primary">{formatCurrency(goal.currentAmount)}</span><span className="text-text-secondary">de {formatCurrency(goal.targetAmount)}</span></div>
                            <Button onClick={() => openProgressModal(goal.id)} variant="secondary" className="w-full text-sm">Adicionar Valor</Button>
                        </Card>
                    )
                })}
                {goals.length === 0 && <div className="col-span-full text-center py-12 text-text-secondary border-2 border-dashed border-border-color rounded-xl"><GoalsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma meta definida ainda.</p></div>}
            </div>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Meta"><GoalForm onSubmit={(data) => { onAdd(data); setIsAddModalOpen(false); }} onClose={() => setIsAddModalOpen(false)} /></Modal>
            <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Adicionar Progresso" size="sm"><AddProgressForm onSubmit={(amount) => { if(selectedGoalId) onUpdateProgress(selectedGoalId, amount); setIsProgressModalOpen(false); }} onClose={() => setIsProgressModalOpen(false)} /></Modal>
        </div>
    );
};

const AdvisorSettingsItem: FC<{ 
    advisor: Advisor; 
    onDelete: () => void; 
    onUpdate: (updated: Advisor) => void; 
}> = ({ advisor, onDelete, onUpdate }) => {
    const [newCostDesc, setNewCostDesc] = useState('');
    const [newCostVal, setNewCostVal] = useState('');

    const totalCost = (advisor.costs || []).reduce((acc, c) => acc + c.value, 0);

    const addCost = () => {
        if (!newCostDesc || !newCostVal) return;
        const val = parseFloat(newCostVal);
        if (isNaN(val)) return;

        const updatedAdvisor = {
            ...advisor,
            costs: [...(advisor.costs || []), { description: newCostDesc, value: val }]
        };
        onUpdate(updatedAdvisor);
        setNewCostDesc('');
        setNewCostVal('');
    };

    const removeCost = (index: number) => {
        const newCosts = [...(advisor.costs || [])];
        newCosts.splice(index, 1);
        onUpdate({ ...advisor, costs: newCosts });
    };

    return (
        <li className="flex flex-col bg-background/50 p-3 rounded text-sm gap-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="font-semibold">{advisor.name}</span>
                    <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded">Comissão: {advisor.commissionRate}%</span>
                    <span className="text-xs text-danger bg-background px-2 py-1 rounded" title="Soma dos custos">Custos: {formatCurrency(totalCost)}</span>
                </div>
                <button onClick={onDelete} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
            </div>
            
            {/* Costs Repeater */}
            <div className="pl-4 border-l-2 border-border-color ml-2 space-y-2">
                {(advisor.costs || []).map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="flex-1">{cost.description}</span>
                        <span className="font-mono text-danger mr-4">{formatCurrency(cost.value)}</span>
                        <button onClick={() => removeCost(idx)} className="hover:text-danger"><TrashIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                
                <div className="flex gap-2 items-center mt-2">
                    <input 
                        type="text" 
                        placeholder="Novo custo (ex: CRM)" 
                        value={newCostDesc} 
                        onChange={e => setNewCostDesc(e.target.value)} 
                        className="flex-1 bg-background border border-border-color rounded px-2 py-1 text-xs"
                    />
                    <input 
                        type="number" 
                        placeholder="Valor (-)" 
                        value={newCostVal} 
                        onChange={e => setNewCostVal(e.target.value)} 
                        className="w-20 bg-background border border-border-color rounded px-2 py-1 text-xs"
                    />
                    <Button onClick={addCost} variant="secondary" className="py-1 px-2 text-xs"><PlusIcon className="w-3 h-3"/></Button>
                </div>
            </div>
        </li>
    );
};

const SettingsView: FC<{
    incomeCategories: string[]; setIncomeCategories: (v: string[]) => void;
    expenseCategories: ExpenseCategory[]; setExpenseCategories: (v: ExpenseCategory[]) => void;
    paymentMethods: string[]; setPaymentMethods: (v: string[]) => void;
    costCenters: CostCenter[]; setCostCenters: (v: CostCenter[]) => void;
    advisors: Advisor[]; setAdvisors: (v: Advisor[]) => void;
    globalTaxRate: number; setGlobalTaxRate: (v: number) => void;
}> = (props) => {
    const [activeTab, setActiveTab] = useState('categories');
    const [newItem, setNewItem] = useState('');
    const [newAdvisorName, setNewAdvisorName] = useState('');
    const [newAdvisorRate, setNewAdvisorRate] = useState('30');

    const addItem = (list: string[], setList: (v: string[]) => void) => { if(newItem && !list.includes(newItem)) { setList([...list, newItem]); setNewItem(''); } };
    const removeItem = (list: string[], setList: (v: string[]) => void, item: string) => setList(list.filter(i => i !== item));
    
    const [newExpCatName, setNewExpCatName] = useState('');
    const [newExpCatType, setNewExpCatType] = useState<ExpenseType>(ExpenseType.EXPENSE);
    const addExpenseCat = () => { if(newExpCatName) { props.setExpenseCategories([...props.expenseCategories, { name: newExpCatName, type: newExpCatType }]); setNewExpCatName(''); } };
    
    const [newCCName, setNewCCName] = useState('');
    const addCC = () => { if(newCCName) { props.setCostCenters([...props.costCenters, { id: newCCName.toLowerCase().replace(/\s/g, '-'), name: newCCName }]); setNewCCName(''); } };

    const addAdvisor = () => { 
        if(newAdvisorName) { 
            props.setAdvisors([...props.advisors, { 
                id: crypto.randomUUID(), 
                name: newAdvisorName, 
                commissionRate: parseFloat(newAdvisorRate) || 30,
                costs: [] 
            }]); 
            setNewAdvisorName(''); 
        } 
    };

    const updateAdvisor = (updated: Advisor) => {
        const newAdvisors = props.advisors.map(adv => adv.id === updated.id ? updated : adv);
        props.setAdvisors(newAdvisors);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div><h2 className="text-2xl font-bold text-text-primary">Configurações</h2><p className="text-text-secondary">Personalize as categorias e opções do sistema.</p></div>
            <div className="flex border-b border-border-color overflow-x-auto">
                <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'categories' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Categorias</button>
                <button onClick={() => setActiveTab('payment')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'payment' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Pagamentos</button>
                <button onClick={() => setActiveTab('advisors')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'advisors' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Assessores & Taxas</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeTab === 'categories' && (
                    <>
                        <Card><h3 className="font-bold mb-4 text-green-400">Categorias de Receita</h3><div className="flex gap-2 mb-4"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-background border border-border-color rounded-md px-3 py-2 text-sm" /><Button onClick={() => addItem(props.incomeCategories, props.setIncomeCategories)} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button></div><ul className="space-y-2 max-h-60 overflow-y-auto">{props.incomeCategories.map((cat: string, i: number) => (<li key={i} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm"><span>{cat}</span><button onClick={() => removeItem(props.incomeCategories, props.setIncomeCategories, cat)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button></li>))}</ul></Card>
                         <Card>
                            <h3 className="font-bold mb-4 text-danger">Categorias de Despesa</h3>
                            <div className="flex flex-col gap-2 mb-4">
                                <input type="text" value={newExpCatName} onChange={(e) => setNewExpCatName(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-background border border-border-color rounded-md px-3 py-2 text-sm" />
                                <div className="flex gap-2">
                                    <select value={newExpCatType} onChange={(e) => setNewExpCatType(e.target.value as ExpenseType)} className="flex-1 bg-background border border-border-color rounded-md px-3 py-2 text-sm">
                                        <option value={ExpenseType.COST}>Custo</option>
                                        <option value={ExpenseType.EXPENSE}>Despesa</option>
                                    </select>
                                    <Button onClick={addExpenseCat} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                                </div>
                            </div>
                            <ul className="space-y-2 max-h-60 overflow-y-auto">{props.expenseCategories.map((cat: ExpenseCategory, i: number) => (<li key={i} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm"><span>{cat.name} <span className="text-[10px] uppercase bg-background px-1 rounded ml-1 text-text-secondary">{cat.type}</span></span><button onClick={() => props.setExpenseCategories(props.expenseCategories.filter((_, idx) => idx !== i))} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button></li>))}</ul>
                        </Card>
                    </>
                )}
                {activeTab === 'payment' && (
                    <>
                        <Card><h3 className="font-bold mb-4">Formas de Pagamento</h3><div className="flex gap-2 mb-4"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Novo método..." className="flex-1 bg-background border border-border-color rounded-md px-3 py-2 text-sm" /><Button onClick={() => addItem(props.paymentMethods, props.setPaymentMethods)} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button></div><ul className="space-y-2 max-h-60 overflow-y-auto">{props.paymentMethods.map((pm: string, i: number) => (<li key={i} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm"><span>{pm}</span><button onClick={() => removeItem(props.paymentMethods, props.setPaymentMethods, pm)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button></li>))}</ul></Card>
                        <Card><h3 className="font-bold mb-4">Centros de Custo</h3><div className="flex gap-2 mb-4"><input type="text" value={newCCName} onChange={(e) => setNewCCName(e.target.value)} placeholder="Novo centro..." className="flex-1 bg-background border border-border-color rounded-md px-3 py-2 text-sm" /><Button onClick={addCC} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button></div><ul className="space-y-2 max-h-60 overflow-y-auto">{props.costCenters.map((cc: CostCenter, i: number) => (<li key={i} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm"><span>{cc.name}</span>{!cc.isDefault && <button onClick={() => props.setCostCenters(props.costCenters.filter(c => c.id !== cc.id))} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>}</li>))}</ul></Card>
                    </>
                )}
                {activeTab === 'advisors' && (
                    <>
                         <Card className="md:col-span-2">
                            <h3 className="font-bold mb-4">Gerenciar Assessores</h3>
                            <div className="flex flex-wrap gap-2 mb-4 items-end">
                                <div className="flex-1 min-w-[200px]"><label className="text-xs text-text-secondary block mb-1">Nome</label><input type="text" value={newAdvisorName} onChange={(e) => setNewAdvisorName(e.target.value)} placeholder="Nome do Assessor..." className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm" /></div>
                                <div className="w-24"><label className="text-xs text-text-secondary block mb-1">Comissão (%)</label><input type="number" value={newAdvisorRate} onChange={(e) => setNewAdvisorRate(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm" /></div>
                                {/* Removed Cost Input from Creation */}
                                <Button onClick={addAdvisor} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                            </div>
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                                {props.advisors.map((adv: Advisor, i: number) => (
                                    <AdvisorSettingsItem 
                                        key={adv.id} 
                                        advisor={adv} 
                                        onUpdate={updateAdvisor}
                                        onDelete={() => props.setAdvisors(props.advisors.filter((_, idx) => idx !== i))}
                                    />
                                ))}
                            </ul>
                        </Card>
                        <Card className="md:col-span-2"><h3 className="font-bold mb-4">Taxas Globais</h3><div className="space-y-4"><div><label className="block text-sm text-text-secondary mb-1">Imposto Padrão (%)</label><input type="number" step="0.01" value={props.globalTaxRate} onChange={(e) => props.setGlobalTaxRate(parseFloat(e.target.value) || 0)} className="w-full md:w-1/3 bg-background border border-border-color rounded-md px-3 py-2 text-sm"/><p className="text-xs text-text-secondary mt-1">Este valor será usado para calcular o imposto sobre receitas automaticamente.</p></div></div></Card>
                    </>
                )}
            </div>
        </div>
    );
};

const Sidebar: FC<{ activeView: View; setActiveView: (view: View) => void; isSidebarOpen: boolean; user: User | null; }> = ({ activeView, setActiveView, isSidebarOpen, user }) => {
    
    const getUserDisplayName = (user: User | null) => {
        if (!user) return "";
        if (user.displayName) return user.displayName;
        if (user.email) {
            const namePart = user.email.split('@')[0];
            return namePart.replace(/[._-]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return "Usuário";
    }

    const allNavItems: { view: View; label: string; icon: ReactNode; }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6"/> },
        { view: 'transactions', label: 'Transações', icon: <TransactionsIcon className="w-6 h-6"/> },
        { view: 'imported-revenues', label: 'Receitas Importadas', icon: <FileTextIcon className="w-6 h-6"/> },
        { view: 'reports', label: 'Relatórios', icon: <ReportsIcon className="w-6 h-6"/> },
        { view: 'goals', label: 'Metas', icon: <GoalsIcon className="w-6 h-6"/> },
        { view: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-6 h-6"/> },
    ];
    
    return (
        <aside className={`absolute md:relative z-20 md:z-auto bg-surface md:translate-x-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 p-4 flex flex-col`}>
             <h1 className="text-3xl font-bold text-text-primary mb-8">ACI<span className="text-primary">Capital</span></h1>
             <nav className="flex flex-col space-y-2 flex-grow">
                {allNavItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`px-4 py-3 text-sm font-semibold rounded-lg flex items-center gap-3 transition-colors duration-200 text-left ${activeView === item.view ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background hover:text-white'}`}
                    >
                        {item.icon} {item.label}
                    </button>
                ))}
            </nav>
            <div className="border-t border-border-color pt-4 mt-4">
                 <div className="px-2 mb-4">
                    <p className="text-sm font-semibold text-text-primary truncate" title={getUserDisplayName(user)}>{getUserDisplayName(user)}</p>
                 </div>
                 <button
                    onClick={logoutUser}
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 text-text-secondary hover:bg-danger hover:text-white"
                >
                    <LogoutIcon className="w-5 h-5"/> Sair
                </button>
            </div>
        </aside>
    )
};
const Header: FC<{ pageTitle: string, onMenuClick: () => void }> = ({ pageTitle, onMenuClick }) => (
    <header className="bg-surface p-4 flex items-center shadow-md md:hidden sticky top-0 z-10">
        <button onClick={onMenuClick} className="mr-4 text-text-primary"><MenuIcon className="w-6 h-6"/></button>
        <h2 className="text-xl font-bold">{pageTitle}</h2>
    </header>
);

const CustomPieTooltip: FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let percentVal = 0;
      if (typeof data.percent === 'number') {
          percentVal = data.percent;
      } else if (typeof payload[0].percent === 'number') {
          percentVal = payload[0].percent * 100;
      }
      const percentDisplay = percentVal.toFixed(1);
      return (
        <div className="bg-surface border border-border-color p-3 rounded-lg shadow-xl text-text-primary backdrop-blur-sm bg-opacity-95 z-50 min-w-[150px]">
          <p className="font-bold text-sm mb-2 pb-1 border-b border-border-color/50">{data.name}</p>
          <div className="space-y-1">
               <div className="flex justify-between gap-4 text-xs text-text-secondary">
                  <span>Valor:</span>
                  <span className="font-mono text-text-primary font-bold">
                       {typeof data.amount === 'number' ? formatCurrency(data.amount) : formatCurrency(data.value)}
                  </span>
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

// --- VISUALIZAÇÕES ---

const TransactionsView: FC<{
    transactions: Transaction[];
    onAdd: (data: TransactionFormValues) => void;
    onEdit: (id: string, data: TransactionFormValues) => void;
    onDelete: (id: string) => void;
    onSetPaid: (id: string) => void;
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    onImportTransactions: (data: any[]) => void;
    globalTaxRate: number;
    importedRevenues: ImportedRevenue[];
    userId?: string;
}> = ({ transactions, onAdd, onEdit, onDelete, onSetPaid, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, onImportTransactions, globalTaxRate, importedRevenues, userId }) => {
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
    const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) years.push(currentYear);
        return years.sort((a: number, b: number) => b - a);
    }, [transactions]);

    const filtered = useMemo(() => {
        let items = transactions.filter(t => {
            const d = new Date(t.date);
            if (filterYear !== 'all' && d.getFullYear() !== filterYear) return false;
            if (filterMonth !== 'all' && d.getMonth() !== filterMonth) return false;
            if (t.type !== activeTab) return false;
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return (
                    (t.description || '').toLowerCase().includes(lower) ||
                    (t.clientSupplier || '').toLowerCase().includes(lower) ||
                    (t.category || '').toLowerCase().includes(lower)
                );
            }
            return true;
        });

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
    }, [transactions, filterYear, filterMonth, activeTab, filterCategory, searchTerm, sortConfig]);

    const totalFilteredAmount = useMemo(() => {
        return filtered.reduce<number>((sum, t) => sum + t.amount, 0);
    }, [filtered]);

    const requestSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Transaction) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1 inline" /> : <ArrowDownIcon className="w-4 h-4 ml-1 inline" />;
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filtered.map(t => ({
            Data: formatDate(t.date),
            Descrição: t.description,
            Valor: t.amount,
            Tipo: t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
            Categoria: t.category,
            "Cliente/Fornecedor": t.clientSupplier,
            "Forma de Pagamento": t.paymentMethod,
            Status: t.status,
            Natureza: t.nature,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transações");
        XLSX.writeFile(wb, "transacoes.xlsx");
    };

    const exportToPdf = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        doc.autoTable({
            head: [['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Status']],
            body: filtered.map(t => [
                formatDate(t.date),
                t.description,
                formatCurrency(t.amount),
                t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
                t.category,
                t.status || '-'
            ]),
        });
        doc.save('transacoes.pdf');
    };

    const handleEdit = (t: Transaction) => { setEditingId(t.id); setIsModalOpen(true); };
    const handleClose = () => { setIsModalOpen(false); setEditingId(null); };
    const handleSubmit = (data: TransactionFormValues) => { if (editingId) onEdit(editingId, data); else onAdd(data); handleClose(); };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><h2 className="text-2xl font-bold text-text-primary">Transações</h2><p className="text-text-secondary">Gerencie suas receitas e despesas.</p></div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={exportToExcel} className="text-sm"><ExportIcon className="w-4 h-4" /> Excel</Button>
                    <Button variant="secondary" onClick={exportToPdf} className="text-sm"><ExportIcon className="w-4 h-4" /> PDF</Button>
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
                    <Button onClick={() => setIsModalOpen(true)}><PlusIcon className="w-4 h-4"/> Nova Transação</Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4 border-b border-border-color pb-4">
                     <div className="flex bg-background p-1 rounded-lg">
                        <button onClick={() => setActiveTab(TransactionType.EXPENSE)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === TransactionType.EXPENSE ? 'bg-surface text-danger shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Despesas</button>
                        <button onClick={() => setActiveTab(TransactionType.INCOME)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === TransactionType.INCOME ? 'bg-surface text-green-400 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Receitas</button>
                    </div>
                     <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-background border border-border-color rounded-md text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="text-right">
                        <span className="text-text-secondary text-sm mr-2">Saldo Listado:</span>
                        <span className={`font-bold ${activeTab === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(totalFilteredAmount)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        {(activeTab === TransactionType.INCOME ? incomeCategories : expenseCategories.map(c => c.name)).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </Card>

            <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-wider border-b border-border-color cursor-pointer">
                                <th className="p-4 hover:text-primary" onClick={() => requestSort('date')}>Data {getSortIndicator('date')}</th>
                                <th className="p-4 hover:text-primary" onClick={() => requestSort('description')}>Descrição {getSortIndicator('description')}</th>
                                <th className="p-4 hover:text-primary" onClick={() => requestSort('category')}>Categoria {getSortIndicator('category')}</th>
                                <th className="p-4 text-right hover:text-primary" onClick={() => requestSort('amount')}>Valor {getSortIndicator('amount')}</th>
                                {activeTab === TransactionType.EXPENSE && <th className="p-4 text-center">Status</th>}
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30 text-sm">
                            {filtered.map(t => (
                                <tr key={t.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4 whitespace-nowrap">{formatDate(t.date)}</td>
                                    <td className="p-4 font-medium">{t.description}<div className="text-xs text-text-secondary">{t.clientSupplier}</div></td>
                                    <td className="p-4"><span className="px-2 py-1 rounded-full bg-background border border-border-color text-xs">{t.category}</span></td>
                                    <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(t.amount)}</td>
                                    {activeTab === TransactionType.EXPENSE && (
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === ExpenseStatus.PAID ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {t.status === ExpenseStatus.PAID ? 'PAGO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && (
                                            <Button variant="success" className="py-1 px-2 text-xs" onClick={() => onSetPaid(t.id)} title="Marcar como Pago"><CheckCircleIcon className="w-4 h-4"/></Button>
                                        )}
                                        <Button variant="ghost" className="py-1 px-2" onClick={() => handleEdit(t)}><EditIcon className="w-4 h-4"/></Button>
                                        <Button variant="ghostDanger" className="py-1 px-2" onClick={() => onDelete(t.id)}><TrashIcon className="w-4 h-4"/></Button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-text-secondary">Nenhuma transação encontrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleClose} title={editingId ? "Editar Transação" : "Nova Transação"}>
                <TransactionForm 
                    onSubmit={handleSubmit} 
                    onClose={handleClose} 
                    initialData={editingId ? transactions.find(t => t.id === editingId) : null}
                    defaultType={activeTab}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    paymentMethods={paymentMethods}
                    costCenters={costCenters}
                    advisors={advisors}
                    globalTaxRate={globalTaxRate}
                    transactions={transactions}
                    importedRevenues={importedRevenues}
                    userId={userId}
                />
            </Modal>
        </div>
    );
};

const ImportedRevenuesView: FC<{
    importedRevenues: ImportedRevenue[];
    advisors: Advisor[];
    onImport: (data: any[]) => void;
    onDelete: (id: string) => void;
    userId?: string;
}> = ({ importedRevenues, advisors, onImport, onDelete, userId }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedAdvisor, setSelectedAdvisor] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [isDeduplicating, setIsDeduplicating] = useState(false);

    const uniqueAdvisors = useMemo(() => {
        const advs = new Set(importedRevenues.map(r => r.assessorPrincipal).filter(Boolean));
        return Array.from(advs).sort();
    }, [importedRevenues]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set(importedRevenues.map(r => r.produtoCategoria).filter(Boolean));
        return Array.from(cats).sort();
    }, [importedRevenues]);

    const filteredRevenues = useMemo(() => {
        return importedRevenues.filter(r => {
            const rDate = new Date(r.date).toISOString().split('T')[0];
            
            if (startDate && rDate < startDate) return false;
            if (endDate && rDate > endDate) return false;
            if (selectedAdvisor && r.assessorPrincipal !== selectedAdvisor) return false;
            if (selectedCategory && r.produtoCategoria !== selectedCategory) return false;
            
            if (clientSearch) {
                const searchLower = clientSearch.toLowerCase();
                const clientMatch = r.cliente && r.cliente.toLowerCase().includes(searchLower);
                if (!clientMatch) return false;
            }

            return true;
        });
    }, [importedRevenues, startDate, endDate, selectedAdvisor, selectedCategory, clientSearch]);

    const handleDeduplicate = async () => {
        if (!userId) return;
        setIsDeduplicating(true);
        try {
            const result = await deduplicateImportedRevenues(userId);
            alert(`Limpeza concluída!\n\nRegistros atualizados (ID gerado): ${result.updatedCount}\nDuplicatas removidas: ${result.deletedCount}`);
            // Force reload by simply reloading page or trigger a callback if available, 
            // but since we don't have a reload callback here, let's just alert.
            // In a real app we would refresh the data context.
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Erro ao executar deduplicação.");
        } finally {
            setIsDeduplicating(false);
        }
    };

    return (
         <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-2xl font-bold text-text-primary">Receitas Importadas</h2><p className="text-text-secondary">Importe planilhas para calcular comissões.</p></div>
                <div className="flex gap-2">
                    <Button onClick={handleDeduplicate} variant="secondary" className="text-xs" disabled={isDeduplicating}>
                        {isDeduplicating ? 'Processando...' : 'Limpar Duplicatas'}
                    </Button>
                    <label className="bg-primary hover:bg-opacity-90 text-white shadow-md px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 font-semibold transition-all">
                        <UploadIcon className="w-4 h-4"/> Importar Relatório
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    const bstr = evt.target?.result;
                                    const wb = XLSX.read(bstr, { type: 'binary' });
                                    const ws = wb.Sheets[wb.SheetNames[0]];
                                    const data = XLSX.utils.sheet_to_json(ws);
                                    const formatted = data.map((row: any) => {
                                        if (row['Classificação'] === 'CUSTOS') return null;
                                        
                                        // Parse date properly (assuming Excel standard)
                                        let dateIso = new Date().toISOString();
                                        const rawDate = row['Data'];

                                        if (typeof rawDate === 'number') {
                                            // Excel date to JS Date
                                            const jsDate = new Date((rawDate - 25569) * 86400 * 1000);
                                            jsDate.setHours(12, 0, 0); 
                                            dateIso = jsDate.toISOString();
                                        } else if (rawDate) {
                                            // Try parsing string
                                            dateIso = new Date(rawDate).toISOString();
                                        }

                                        // Parse Percentual Repasse as integer (80% -> 80)
                                        let rawRepasse = parseFloat(row['% Repasse']) || 0;
                                        if (rawRepasse <= 1 && rawRepasse > 0) {
                                            rawRepasse = rawRepasse * 100;
                                        }

                                        return {
                                            date: dateIso,
                                            conta: row['Conta'] || '',
                                            cliente: row['Cliente'] || '',
                                            codAssessor: row['Cod Assessor'] || '',
                                            assessorPrincipal: row['Assessor Principal'] || '',
                                            classificacao: row['Classificação'] || '',
                                            produtoCategoria: row['Produto/Categoria'] || '',
                                            ativo: row['Ativo'] || '',
                                            tipoReceita: row['Tipo Receita'] || '',
                                            receitaLiquidaEQI: parseFloat(row['Receita Liquida EQI']) || 0,
                                            percentualRepasse: Math.round(rawRepasse), // Save as Integer
                                            comissaoLiquida: parseFloat(row['Comissão Líquida']) || 0,
                                            tipo: row['Tipo'] || ''
                                        };
                                    }).filter((r: any) => r !== null);
                                    onImport(formatted);
                                };
                                reader.readAsBinaryString(file);
                            }
                        }} />
                    </label>
                </div>
            </div>
            
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Data Inicial</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Data Final</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Assessor (Principal)</label>
                        <select value={selectedAdvisor} onChange={(e) => setSelectedAdvisor(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">Todos</option>
                            {uniqueAdvisors.map(adv => <option key={adv} value={adv}>{adv}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Produto / Categoria</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">Todas</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Cliente</label>
                        <div className="relative">
                            <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-background border border-border-color rounded-md pl-8 pr-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                            <SearchIcon className="w-4 h-4 text-text-secondary absolute left-2.5 top-2.5" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-background/50 text-xs uppercase text-text-secondary">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Conta</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Cod Assessor</th>
                                <th className="p-4">Assessor Principal</th>
                                <th className="p-4">Classificação</th>
                                <th className="p-4">Produto/Categoria</th>
                                <th className="p-4">Ativo</th>
                                <th className="p-4">Tipo Receita</th>
                                <th className="p-4">Receita Liq EQI</th>
                                <th className="p-4">% Repasse</th>
                                <th className="p-4">Comissão Líquida</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30 text-xs">
                            {filteredRevenues.map(r => (
                                <tr key={r.id} className="hover:bg-background/50">
                                    <td className="p-4">{formatDate(r.date)}</td>
                                    <td className="p-4">{r.conta}</td>
                                    <td className="p-4 font-medium">{r.cliente}</td>
                                    <td className="p-4">{r.codAssessor}</td>
                                    <td className="p-4">{r.assessorPrincipal}</td>
                                    <td className="p-4">{r.classificacao}</td>
                                    <td className="p-4">{r.produtoCategoria}</td>
                                    <td className="p-4">{r.ativo}</td>
                                    <td className="p-4">{r.tipoReceita}</td>
                                    <td className="p-4 font-bold text-green-400">{formatCurrency(r.receitaLiquidaEQI)}</td>
                                    <td className="p-4">{Math.round(r.percentualRepasse)}%</td>
                                    <td className="p-4 font-bold text-primary">{formatCurrency(r.comissaoLiquida)}</td>
                                    <td className="p-4">{r.tipo}</td>
                                    <td className="p-4 text-right"><Button variant="ghostDanger" onClick={() => onDelete(r.id)}><TrashIcon className="w-4 h-4"/></Button></td>
                                </tr>
                            ))}
                            {filteredRevenues.length === 0 && <tr><td colSpan={14} className="p-8 text-center text-text-secondary">Nenhuma receita importada encontrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
         </div>
    )
};

interface DashboardViewProps {
    transactions: Transaction[];
    goals: Goal[];
    onSetPaid: (id: string) => void;
    onEdit: (id: string, data: TransactionFormValues) => void;
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    globalTaxRate: number;
    importedRevenues: ImportedRevenue[];
}

const ReportsView: FC<{ transactions: Transaction[], importedRevenues?: ImportedRevenue[] }> = ({ transactions, importedRevenues = [] }) => {
    const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');

    const dreData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const filterDate = (dateStr: string) => {
            const d = new Date(dateStr);
            if (period === 'all') return true;
            if (period === 'year') return d.getFullYear() === currentYear;
            if (period === 'month') return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            return false;
        };

        const filteredTrans = transactions.filter(t => filterDate(t.date));
        const filteredImports = importedRevenues.filter(r => filterDate(r.date));

        // Calculate Revenue
        const manualRevenue = filteredTrans
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const importedRevenue = filteredImports
            .reduce((sum, r) => sum + (r.receitaLiquidaEQI || 0), 0);

        const totalRevenue = manualRevenue + importedRevenue;

        // Calculate Expenses
        const expenseTrans = filteredTrans.filter(t => t.type === TransactionType.EXPENSE);
        const totalExpense = expenseTrans.reduce((sum, t) => sum + t.amount, 0);

        // Expenses by Category
        const expensesByCategory: Record<string, number> = {};
        expenseTrans.forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

        const sortedExpenses = Object.entries(expensesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const result = totalRevenue - totalExpense;

        return {
            totalRevenue,
            totalExpense,
            sortedExpenses,
            result
        };
    }, [transactions, importedRevenues, period]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">Relatórios</h2>
                <div className="flex gap-2">
                    <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded text-sm transition-colors ${period === 'month' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>Mês</button>
                    <button onClick={() => setPeriod('year')} className={`px-3 py-1 rounded text-sm transition-colors ${period === 'year' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>Ano</button>
                    <button onClick={() => setPeriod('all')} className={`px-3 py-1 rounded text-sm transition-colors ${period === 'all' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>Tudo</button>
                </div>
            </div>

            <Card className="max-w-4xl mx-auto">
                <div className="border-b border-border-color pb-4 mb-4">
                    <h3 className="text-xl font-bold text-text-primary text-center">Demonstrativo do Resultado (DRE)</h3>
                    <p className="text-center text-text-secondary text-sm">
                        {period === 'month' ? 'Mês Atual' : period === 'year' ? 'Ano Atual' : 'Período Completo'}
                    </p>
                </div>

                <div className="space-y-3 font-mono text-sm sm:text-base">
                    {/* Receita */}
                    <div className="flex justify-between items-center py-2">
                        <span className="font-bold text-text-primary">RECEITA OPERACIONAL BRUTA</span>
                        <span className="font-bold text-green-400">{formatCurrency(dreData.totalRevenue)}</span>
                    </div>

                    {/* Despesas Header */}
                    <div className="flex justify-between items-center py-2 border-t border-border-color/30 mt-2">
                        <span className="font-bold text-text-primary">(-) DESPESAS OPERACIONAIS</span>
                        <span className="font-bold text-danger">{formatCurrency(dreData.totalExpense)}</span>
                    </div>

                    {/* Despesas Detalhes */}
                    <div className="pl-4 sm:pl-8 space-y-1">
                        {dreData.sortedExpenses.map((exp, idx) => (
                            <div key={idx} className="flex justify-between text-text-secondary text-xs sm:text-sm hover:bg-background/50 px-2 rounded">
                                <span>{exp.name}</span>
                                <span>{formatCurrency(exp.value)}</span>
                            </div>
                        ))}
                        {dreData.sortedExpenses.length === 0 && (
                            <div className="text-text-secondary italic text-xs">Nenhuma despesa registrada.</div>
                        )}
                    </div>

                    {/* Resultado */}
                    <div className="flex justify-between items-center py-3 border-t-2 border-border-color mt-4 bg-background/30 px-2 rounded">
                        <span className="font-bold text-lg text-text-primary">RESULTADO DO PERÍODO</span>
                        <span className={`font-bold text-lg ${dreData.result >= 0 ? 'text-green-400' : 'text-danger'}`}>
                            {formatCurrency(dreData.result)}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const DashboardView: FC<DashboardViewProps> = ({ transactions, goals, onSetPaid, onEdit, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, globalTaxRate, importedRevenues }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) years.push(currentYear);
        return years.sort((a: number, b: number) => b - a);
    }, [transactions]);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const yearMatches = selectedYear === 'all' || date.getFullYear() === selectedYear;
            const monthMatches = selectedMonth === 'all' || date.getMonth() === selectedMonth;
            return yearMatches && monthMatches;
        });
    }, [transactions, selectedYear, selectedMonth]);

    const { totalIncome, totalExpense, netProfit, mostProfitableMonth, largestExpense, taxProvisionBalanceForPeriod } = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce<number>((acc, t) => acc + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce<number>((acc, t) => acc + t.amount, 0);
        let largestExpense: Transaction | null = null;
        if (filteredTransactions.length > 0) {
            const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
            if (expenses.length > 0) largestExpense = expenses.reduce((max, t) => t.amount > max.amount ? t : max);
        }
        
        const monthProfits = filteredTransactions.reduce((acc, t) => {
            const month = getMonthYear(t.date);
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            const current = acc[month] || 0;
            acc[month] = current + amount;
            return acc;
        }, {} as Record<string, number>);
        
        const mostProfitableMonth = Object.keys(monthProfits).length > 0
            ? (Object.entries(monthProfits) as [string, number][]).reduce<[string, number]>((max, entry) => entry[1] > max[1] ? entry : max, ["N/A", -Infinity])[0]
            : "N/A";
            
        const totalProvisioned = filteredTransactions.filter(t => t.type === TransactionType.INCOME && t.taxAmount).reduce<number>((sum, t) => sum + (t.taxAmount || 0), 0);
        const totalTaxPaid = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE && t.costCenter === 'provisao-impostos').reduce<number>((sum, t) => sum + t.amount, 0);
        
        return { totalIncome: income, totalExpense: expense, netProfit: income - expense, mostProfitableMonth, largestExpense, taxProvisionBalanceForPeriod: totalProvisioned - totalTaxPaid };
    }, [filteredTransactions]);
    
    const achievedGoals = useMemo(() => goals.filter(g => g.currentAmount >= g.targetAmount).length, [goals]);
    const upcomingBills = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(today.getDate() + 5);
        return transactions.filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && new Date(t.date).getTime() <= fiveDaysFromNow.getTime()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const expenseSubcategoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
        const total = expenses.reduce((sum, t) => sum + t.amount, 0);
        if (total === 0) return [];
        const data = expenses.reduce((acc, t) => {
            if (t.nature === ExpenseNature.FIXED) acc[0].amount += t.amount; else acc[1].amount += t.amount;
            return acc;
        }, [{ name: 'Fixo', amount: 0 }, { name: 'Variável', amount: 0 }]);
        return data.map(d => ({ ...d, value: (d.amount / total) * 100, percent: (d.amount / total) * 100 })).filter(d => d.amount > 0);
    }, [filteredTransactions]);

    const cashFlowData = useMemo(() => { 
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let balance = 0;
        const data = sorted.map(t => { balance += t.type === TransactionType.INCOME ? t.amount : -t.amount; return { date: formatDate(t.date), balance }; });
        const groupedData = data.reduce((acc: Record<string, number>, item) => { acc[item.date] = item.balance; return acc; }, {} as Record<string, number>);
        return Object.entries(groupedData).map(([date, balance]) => ({ date, balance }));
    }, [transactions]);
    
    const COLORS = ['#D1822A', '#6366F1', '#10B981', '#EF4444', '#F59E0B'];
    const handlePayClick = (bill: Transaction) => { setEditingTransaction({ ...bill, status: ExpenseStatus.PAID }); setIsModalOpen(true); };
    const handleFormSubmit = (data: TransactionFormValues) => { if (editingTransaction) onEdit(editingTransaction.id, data); setIsModalOpen(false); setEditingTransaction(null); };
    
     return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Visão Geral</h2>
                    <p className="text-text-secondary">Resumo do desempenho financeiro.</p>
                </div>
                <div className="flex items-center gap-2">
                     <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        <option value="all">Todo o Período</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                     <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        <option value="all">Todos os Meses</option>
                        {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="transform hover:scale-105 transition-transform duration-300 border-l-4 border-green-400">
                    <h3 className="text-text-secondary font-semibold text-sm uppercase tracking-wider">Receita Líquida</h3>
                    <p className="text-3xl font-bold text-green-400 mt-1">{formatCurrency(totalIncome)}</p>
                </Card>
                 <Card className="transform hover:scale-105 transition-transform duration-300 border-l-4 border-danger">
                    <h3 className="text-text-secondary font-semibold text-sm uppercase tracking-wider">Despesa Total</h3>
                    <p className="text-3xl font-bold text-danger mt-1">{formatCurrency(totalExpense)}</p>
                </Card>
                 <Card className="transform hover:scale-105 transition-transform duration-300 border-l-4 border-primary">
                    <h3 className="text-text-secondary font-semibold text-sm uppercase tracking-wider">Lucro Líquido</h3>
                    <p className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? 'text-text-primary' : 'text-danger'}`}>{formatCurrency(netProfit)}</p>
                </Card>
                 <Card className="transform hover:scale-105 transition-transform duration-300 border-l-4 border-blue-400">
                    <h3 className="text-text-secondary font-semibold text-sm uppercase tracking-wider">Metas Atingidas</h3>
                    <p className="text-3xl font-bold text-blue-400 mt-1">{achievedGoals} <span className="text-lg text-text-secondary font-normal">/ {goals.length}</span></p>
                </Card>
            </div>

            {upcomingBills.length > 0 && (
                <div className="bg-surface border border-danger/30 rounded-xl shadow-lg p-3 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-danger/10 p-2 rounded-full"><AlertCircleIcon className="w-5 h-5 text-danger" /></div>
                        <div><h3 className="text-base sm:text-lg font-bold text-text-primary">Contas a Pagar (Próximos 5 Dias)</h3><p className="text-xs sm:text-sm text-text-secondary">Atenção aos vencimentos próximos.</p></div>
                    </div>
                    <div className="overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-text-secondary text-xs border-b border-border-color">
                                    <th className="py-2 px-1 font-medium whitespace-nowrap">Vencimento</th>
                                    <th className="py-2 px-1 font-medium">Descrição</th>
                                    <th className="py-2 px-1 font-medium hidden sm:table-cell">Fornecedor</th>
                                    <th className="py-2 px-1 font-medium">Valor</th>
                                    <th className="py-2 px-1 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm">
                                {upcomingBills.map(bill => {
                                    const isOverdue = new Date(bill.date).getTime() < new Date(new Date().setHours(0,0,0,0)).getTime();
                                    const isToday = new Date(bill.date).toDateString() === new Date().toDateString();
                                    return (
                                        <tr key={bill.id} className="border-b border-border-color/50 last:border-0 hover:bg-background/50 transition-colors">
                                            <td className="py-2 px-1 whitespace-nowrap"><span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold ${isOverdue ? 'bg-danger text-white' : (isToday ? 'bg-yellow-500 text-black' : 'bg-background text-text-secondary')}`}>{isOverdue ? 'Atrasado' : (isToday ? 'Hoje' : formatDate(bill.date))}</span></td>
                                            <td className="py-2 px-1 font-medium truncate max-w-[100px] sm:max-w-none" title={bill.description}>{bill.description}</td>
                                            <td className="py-2 px-1 text-text-secondary hidden sm:table-cell truncate max-w-[150px]">{bill.clientSupplier || '-'}</td>
                                            <td className="py-2 px-1 font-bold text-danger whitespace-nowrap">{formatCurrency(bill.amount)}</td>
                                            <td className="py-2 px-1 text-right"><Button onClick={() => handlePayClick(bill)} variant="success" className="py-1 px-2 text-[10px] sm:text-xs ml-auto gap-1"><CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Pagar</span></Button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-primary rounded-sm"></span>Fluxo de Caixa</h3>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs><linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D1822A" stopOpacity={0.8}/><stop offset="95%" stopColor="#D1822A" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D376A" opacity={0.5} />
                                <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={30} />
                                <YAxis stroke="#A0AEC0" tickFormatter={(value) => `R$${value/1000}k`} tick={{ fontSize: 11 }} width={60} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1A214A', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)', color: '#F0F2F5' }} itemStyle={{ color: '#D1822A' }} formatter={(value) => [formatCurrency(Number(value)), 'Saldo']} cursor={{ stroke: '#D1822A', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area type="monotone" dataKey="balance" stroke="#D1822A" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-secondary rounded-sm"></span>Natureza das Despesas</h3>
                    <div className="flex-grow relative">
                        {expenseSubcategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseSubcategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} stroke="none">
                                        {expenseSubcategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-text-secondary ml-1">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-text-secondary"><p>Sem dados.</p></div>}
                    </div>
                </Card>
            </div>
            
             <Card>
                <h3 className="text-lg font-bold text-text-primary mb-4">Informações Rápidas</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50"><span className="text-text-secondary">Mês mais lucrativo:</span><span className="font-bold text-primary">{mostProfitableMonth}</span></div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50"><span className="text-text-secondary">Maior despesa única:</span>{largestExpense ? <span className="font-bold text-danger text-right">{largestExpense.description}<br/><span className="text-sm">{formatCurrency(largestExpense.amount)}</span></span> : <span className="font-bold text-text-secondary">N/A</span>}</div>
                     <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50"><span className="text-text-secondary">Saldo Provisão de Impostos:</span><span className={`font-bold ${taxProvisionBalanceForPeriod >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(taxProvisionBalanceForPeriod)}</span></div>
                 </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmar Pagamento / Ajustar Valor">
                <TransactionForm onSubmit={handleFormSubmit} onClose={() => setIsModalOpen(false)} initialData={editingTransaction} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} globalTaxRate={globalTaxRate} transactions={transactions} importedRevenues={importedRevenues} />
            </Modal>
        </div>
    );
};

// --- COMPONENTES PRINCIPAL (APP) ---

const App: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Estado global de dados
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [importedRevenues, setImportedRevenues] = useState<ImportedRevenue[]>([]);
    const [goals, setGoals] = useLocalStorage<Goal[]>('goals', getInitialGoals());
    
    // Configurações Globais
    const [incomeCategories, setIncomeCategories] = useLocalStorage('incomeCategories', initialIncomeCategories);
    const [expenseCategories, setExpenseCategories] = useLocalStorage('expenseCategories', initialExpenseCategories);
    const [paymentMethods, setPaymentMethods] = useLocalStorage('paymentMethods', initialPaymentMethods);
    const [costCenters, setCostCenters] = useLocalStorage('costCenters', initialCostCenters);
    const [advisors, setAdvisors] = useLocalStorage('advisors', initialAdvisors);
    const [globalTaxRate, setGlobalTaxRate] = useLocalStorage('globalTaxRate', 16.33);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                // Load Transactions (Filtrando por userId)
                const snapshot = await getTransactions(user.uid);
                // CHANGE: Filter out 'receita_importada' so they don't appear in the main dashboard/list
                const data = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(t => t.tipoInterno !== 'receita_importada')
                    .map(t => t as Transaction);
                setTransactions(data);

                // Load Imported Revenues (Filtrando por userId)
                const importedSnapshot = await getImportedRevenues(user.uid);
                const importedData = importedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImportedRevenue));
                setImportedRevenues(importedData);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }
        };
        loadData();
    }, [user]);

    const handleAddTransaction = async (data: TransactionFormValues) => {
        if (!user) return;
        try {
            const docRef = await saveTransaction(data as any, user.uid);
            const newTransaction = { ...data, id: docRef.id } as Transaction;
            setTransactions(prev => [newTransaction, ...prev]);
        } catch (error) {
            console.error("Erro ao adicionar transação:", error);
            alert("Erro ao salvar no banco de dados.");
        }
    };

    const handleEditTransaction = async (id: string, data: TransactionFormValues) => {
        try {
            await updateTransaction(id, data);
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } as Transaction : t));
        } catch (error) {
            console.error("Erro ao editar transação:", error);
            alert("Erro ao atualizar no banco de dados.");
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if(!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await deleteTransactionFromDb(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
            alert("Erro ao excluir do banco de dados.");
        }
    };

    const handleSetPaid = async (id: string) => {
        try {
            await updateTransaction(id, { status: ExpenseStatus.PAID });
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: ExpenseStatus.PAID } : t));
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };
    
    // Only for OFX
    const handleImportTransactions = async (data: any[]) => {
         if (!user) return;
         const newTransactions: Transaction[] = [];
         let errorCount = 0;
         for (const item of data) {
             const { tempId, selected, ...transactionData } = item;
             if (!transactionData.description) continue;
             try {
                 const docRef = await saveTransaction(transactionData, user.uid);
                 newTransactions.push({ ...transactionData, id: docRef.id } as Transaction);
             } catch (err) { errorCount++; }
         }
         if (newTransactions.length > 0) {
             setTransactions(prev => [...newTransactions, ...prev]);
             alert(`${newTransactions.length} transações importadas com sucesso.${errorCount > 0 ? ` Falha em ${errorCount} itens.` : ''}`);
         }
    };

    // New handler for Imported Revenues
    const handleImportToRevenueTable = async (data: Partial<ImportedRevenue>[]) => {
        if (!user) return;
        const newRevenues: ImportedRevenue[] = [];
        let count = 0;
        let skipped = 0;
        
        for (const item of data) {
             try {
                 // Clean object for firestore
                 const cleanItem = JSON.parse(JSON.stringify(item));
                 const docRef = await saveImportedRevenue(cleanItem, user.uid);
                 newRevenues.push({ ...cleanItem, id: docRef.id });
                 count++;
             } catch (e: any) {
                 if (e.message === "Duplicata detectada") {
                     skipped++;
                 } else {
                     console.error("Failed to save imported revenue", e);
                 }
             }
        }
        if (count > 0 || skipped > 0) {
            if (count > 0) setImportedRevenues(prev => [...newRevenues, ...prev]);
            alert(`${count} receitas importadas para a tabela.${skipped > 0 ? `\n${skipped} duplicatas ignoradas.` : ''}`);
        }
    };

    const handleDeleteImportedRevenue = async (id: string) => {
        if (!confirm("Excluir esta receita importada?")) return;
        try {
            await deleteImportedRevenue(id);
            setImportedRevenues(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error(e);
            alert("Erro ao excluir.");
        }
    }

    const handleAddGoal = (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        const newGoal: Goal = { id: crypto.randomUUID(), currentAmount: 0, ...goalData };
        setGoals(prev => [...prev, newGoal]);
    };
    const handleUpdateGoalProgress = (id: string, amount: number) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    };
    const handleDeleteGoal = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta meta?")) setGoals(prev => prev.filter(g => g.id !== id));
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-background text-text-primary">Carregando...</div>;
    if (!user) return <Login />;

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={(v) => { setActiveView(v); setIsSidebarOpen(false); }} isSidebarOpen={isSidebarOpen} user={user} />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header pageTitle={
                    activeView === 'dashboard' ? 'Dashboard' : 
                    activeView === 'transactions' ? 'Transações' :
                    activeView === 'imported-revenues' ? 'Receitas Importadas' :
                    activeView === 'goals' ? 'Metas' :
                    activeView === 'reports' ? 'Relatórios' : 'Configurações'
                } onMenuClick={() => setIsSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
                    {activeView === 'dashboard' && (
                        <DashboardView 
                            transactions={transactions} 
                            goals={goals} 
                            onSetPaid={handleSetPaid}
                            onEdit={handleEditTransaction}
                            incomeCategories={incomeCategories}
                            expenseCategories={expenseCategories}
                            paymentMethods={paymentMethods}
                            costCenters={costCenters}
                            advisors={advisors}
                            globalTaxRate={globalTaxRate}
                            importedRevenues={importedRevenues}
                        />
                    )}
                    {activeView === 'transactions' && (
                        <TransactionsView 
                            transactions={transactions} 
                            onAdd={handleAddTransaction} 
                            onEdit={handleEditTransaction} 
                            onDelete={handleDeleteTransaction} 
                            onSetPaid={handleSetPaid}
                            incomeCategories={incomeCategories}
                            expenseCategories={expenseCategories}
                            paymentMethods={paymentMethods}
                            costCenters={costCenters}
                            advisors={advisors}
                            onImportTransactions={handleImportTransactions}
                            globalTaxRate={globalTaxRate}
                            importedRevenues={importedRevenues}
                            userId={user.uid}
                        />
                    )}
                    {activeView === 'imported-revenues' && (
                        <ImportedRevenuesView 
                            importedRevenues={importedRevenues}
                            advisors={advisors}
                            onImport={handleImportToRevenueTable}
                            onDelete={handleDeleteImportedRevenue}
                            userId={user.uid}
                        />
                    )}
                    {activeView === 'goals' && (
                        <GoalsView goals={goals} onAdd={handleAddGoal} onUpdateProgress={handleUpdateGoalProgress} onDelete={handleDeleteGoal} />
                    )}
                    {activeView === 'reports' && <ReportsView transactions={transactions} importedRevenues={importedRevenues} />}
                    {activeView === 'settings' && (
                        <SettingsView 
                            incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories}
                            expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories}
                            paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
                            costCenters={costCenters} setCostCenters={setCostCenters}
                            advisors={advisors} setAdvisors={setAdvisors}
                            globalTaxRate={globalTaxRate} setGlobalTaxRate={setGlobalTaxRate}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;