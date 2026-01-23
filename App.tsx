
import React, { useState, useMemo, FC, ReactNode, useEffect, useRef } from 'react';
import { Transaction, Goal, TransactionType, View, ExpenseStatus, ExpenseNature, CostCenter, Advisor, ExpenseCategory, ExpenseType, AdvisorSplit, ImportedRevenue, AdvisorCost, Partner } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import Login from './Login';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser } from './auth';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction as deleteTransactionFromDb, getImportedRevenues, saveImportedRevenue, deleteImportedRevenue, getRevenuesByPeriod, deduplicateImportedRevenues, getPartnership, savePartnership } from './firestore';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- UTILITÁRIOS GLOBAIS ---
const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// --- ÍCONES ---
const DashboardIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>);
const TransactionsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const GoalsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const ReportsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const SettingsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0 .73-2.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.73l.15-.08a2 2 0 0 0 .73-2.73l.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const PartnershipIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const PlusIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const EditIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>);
const TrashIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
const CloseIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const MenuIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>);
const ExportIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const PaidIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M8 12.5H2.5a2 2 0 1 0 0-4H8v4z"/><path d="M8 12.5v4"/><path d="M13.5 12.5H16"/><path d="M14 16.5h2"/></svg>);
const UploadIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const SearchIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const LogoutIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const ArrowUpIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>);
const ArrowDownIcon: FC<{ className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>);
const AlertCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const CheckCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const FileTextIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const TrendingUpIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>);
const BankIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2-10 7h20Z"/></svg>);

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
            return parsed as T;
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
const Card: FC<{ children: ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (<div className={`bg-surface rounded-xl shadow-lg p-4 sm:p-6 ${className}`}>{children}</div>);
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
    taxRate?: number;
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
    const [splits, setSplits] = useState<AdvisorSplit[]>(initialData?.splits || []);

    const isAddingFromTab = !!defaultType;
    const isEditing = !!initialData;
    const isInitializing = useRef(true); 
    const currentCategories = useMemo(() => 
        type === TransactionType.INCOME 
            ? incomeCategories 
            : expenseCategories.map(c => c.name), 
        [type, incomeCategories, expenseCategories]
    );
    
    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        grossAmount: (initialData?.grossAmount ?? initialData?.amount)?.toFixed(2) || '',
        date: initialData?.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date().toISOString()),
        category: initialData?.category || (currentCategories.length > 0 ? currentCategories[0] : ''),
        clientSupplier: initialData?.clientSupplier || '',
        paymentMethod: initialData?.paymentMethod || (paymentMethods.length > 0 ? paymentMethods[0] : ''),
        status: initialData?.status || ExpenseStatus.PENDING,
        costCenter: initialData?.costCenter || 'conta-pj',
    });
    
    const [searchPeriod, setsearchPeriod] = useState({ start: '', end: '', show: false });
    const [commissionAmount, setCommissionAmount] = useState(initialData?.commissionAmount || 0);
    const [isCommissionManual, setIsCommissionManual] = useState(false);
    
    const [applyTax, setApplyTax] = useState(true);
    const [taxRateInput, setTaxRateInput] = useState<string>(globalTaxRate.toString());
    const [taxValueCents, setTaxValueCents] = useState<number>(0);

    const gross: number = parseFloat(formData.grossAmount) || 0;

    // --- LOGICA FINANCEIRA (DEFINITIVE VERSION) ---
    // Regra 2: CRM deduzido integralmente independentemente de ter receita.
    const totalCRM = useMemo(() => 
        round(splits.reduce((acc, s) => acc + (Number(s.additionalCost) || 0), 0))
    , [splits]);

    // Step 3: Base Econômica Total = Receita - CRM (Impacto de caixa líquido da PJ)
    const entradaCaixaPJ = round(Number(gross) - totalCRM);
    const effectiveTaxRate = applyTax ? (parseFloat(taxRateInput) || 0) : 0;

    // ETAPA CRÍTICA: RATEIO CONFORME HIERARQUIA OBRIGATÓRIA
    const splitsDetails = useMemo(() => {
        return splits.map(split => {
            const revenueAmount = Number(split.revenueAmount) || 0;
            const percentage = Number(split.percentage) || 0;
            const additionalCost = Number(split.additionalCost) || 0;
            
            // Regra 5: Somente assessores com receita participam do rateio de imposto e split.
            if (revenueAmount <= 0) {
                return { 
                    ...split, 
                    grossPayout: 0, 
                    taxAmount: 0, 
                    netPayout: 0, 
                    officeGrossPart: 0, 
                    officeTax: 0, 
                    additionalCost,
                    isRevenueGenerator: false 
                };
            }

            // Step 3: Base Econômica Pós-CRM Individual
            const baseIndividual = round(revenueAmount - additionalCost);
            
            // Step 4: Split de Comissão sobre a base pós-CRM
            const grossPayout = round(baseIndividual * (percentage / 100));
            const officeGrossPart = round(baseIndividual * (1 - (percentage / 100)));
            
            // Step 5: Imposto incidindo após CRM e após split
            const advisorTax = round(grossPayout * (effectiveTaxRate / 100));
            const officeTax = round(officeGrossPart * (effectiveTaxRate / 100));
            
            // Step 6: Repasse Líquido do Assessor
            const netPayout = round(grossPayout - advisorTax);
            
            return { 
                ...split, 
                grossPayout, 
                taxAmount: advisorTax, 
                officeTax,
                officeGrossPart,
                netPayout, 
                additionalCost,
                isRevenueGenerator: true 
            };
        });
    }, [splits, effectiveTaxRate]);

    // Totalizadores para cálculo do Resultado do Escritório (Step 7)
    const totalAdvisorTax = useMemo(() => 
        round(splitsDetails.reduce((acc, s) => acc + (Number(s.taxAmount) || 0), 0))
    , [splitsDetails]);

    const totalOfficeTaxFromRevenue = useMemo(() => 
        round(splitsDetails.reduce((acc, s) => acc + (Number((s as any).officeTax) || 0), 0))
    , [splitsDetails]);

    const totalOfficeGrossFromRevenue = useMemo(() => 
        round(splitsDetails.reduce((acc, s) => acc + (Number((s as any).officeGrossPart) || 0), 0))
    , [splitsDetails]);

    // Regra 2: CRM dos assessores sem receita gera prejuízo direto
    const crmNonRevenueAdvisors = useMemo(() => 
        round(splits.filter(s => (Number(s.revenueAmount) || 0) <= 0).reduce((acc, s) => acc + (Number(s.additionalCost) || 0), 0))
    , [splits]);

    // Total de Imposto Provisionado para a transação
    const calculatedTotalTax = round(totalAdvisorTax + totalOfficeTaxFromRevenue);

    // Step 7: Resultado do Escritório = soma partes escritório − imposto escritório − CRM sem receita
    const officeResult = round(totalOfficeGrossFromRevenue - totalOfficeTaxFromRevenue - crmNonRevenueAdvisors);

    useEffect(() => {
        if (initialData && initialData.type === TransactionType.INCOME) {
            const iTax = initialData.taxAmount ?? 0;
            const storedRate = (initialData as any).taxRate;
            if (iTax > 0 || (storedRate !== undefined && storedRate > 0)) {
                setApplyTax(true);
                const rateStr = storedRate !== undefined ? storedRate.toString() : (entradaCaixaPJ > 0 ? ((iTax / entradaCaixaPJ) * 100).toFixed(2) : globalTaxRate.toString());
                setTaxRateInput(rateStr);
                setTaxValueCents(Math.round(round(iTax) * 100));
            } else {
                setApplyTax(false);
                setTaxRateInput(globalTaxRate.toString());
                setTaxValueCents(0);
            }
        } else if (!initialData) {
            setApplyTax(true);
            setTaxRateInput(globalTaxRate.toString());
        }
        setTimeout(() => { isInitializing.current = false; }, 0);
    }, [initialData, globalTaxRate, entradaCaixaPJ]);

    useEffect(() => {
        if (!isInitializing.current && applyTax && !isEditing) {
            // Sincroniza o valor total do imposto com a soma calculada proporcionalmente
            setTaxValueCents(Math.round(calculatedTotalTax * 100));
        }
    }, [entradaCaixaPJ, applyTax, effectiveTaxRate, isEditing, calculatedTotalTax]);

    const handleRateInputChange = (val: string) => {
        setTaxRateInput(val);
        const rate = parseFloat(val) || 0;
        // Ao mudar a taxa, recalcula o imposto total proporcional conforme lógica definitiva
        // O valor exibido como "Imposto Total" é a soma das partes do rateio proporcional
        setTaxValueCents(Math.round(calculatedTotalTax * 100));
    };

    const handleApplyTaxCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setApplyTax(checked);
        if (checked) {
            setTaxValueCents(Math.round(calculatedTotalTax * 100));
        }
    };

    const formattedTaxValue = (taxValueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    useEffect(() => {
        const newCats = type === TransactionType.INCOME ? incomeCategories : expenseCategories.map(c => c.name);
        setFormData(prev => ({
            ...prev,
            category: newCats.includes(prev.category) ? prev.category : (newCats[0] || '')
        }));
    }, [type, incomeCategories, expenseCategories]);
    
    useEffect(() => {
        if (!isInitializing.current && !isCommissionManual && type === TransactionType.INCOME && advisorId && splits.length === 0 && !isEditing) {
             const grossComm = round(entradaCaixaPJ * 0.30);
             const commTax = round(grossComm * (effectiveTaxRate / 100));
             const netComm = Math.max(0, round(grossComm - commTax));
             setCommissionAmount(netComm);
        }
    }, [entradaCaixaPJ, advisorId, splits.length, type, effectiveTaxRate, isCommissionManual, isEditing]);

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

    const confirmSearchPeriod = async () => {
        if (!searchPeriod.start || !searchPeriod.end) {
            alert("Selecione a data inicial e final.");
            return;
        }
        const startDateIso = new Date(searchPeriod.start).toISOString();
        const endDateIso = new Date(searchPeriod.end).toISOString();
        try {
            const snapshot = await getRevenuesByPeriod(startDateIso, endDateIso);
            const periodRevenues = snapshot.docs.map(doc => doc.data() as ImportedRevenue);
            if (periodRevenues.length === 0) {
                alert("Nenhuma receita encontrada para o período.");
                return;
            }
            const revenueByAdvisor: Record<string, number> = {};
            let totalRevenueFound = 0;
            periodRevenues.forEach(rev => {
                if (rev.classificacao === 'CUSTOS') return;
                const advisor = advisors.find(adv => adv.name.toLowerCase() === (rev.assessorPrincipal || '').toLowerCase());
                if (advisor) {
                    const val = round(rev.comissaoLiquida || 0);
                    revenueByAdvisor[advisor.id] = round((revenueByAdvisor[advisor.id] || 0) + val);
                    totalRevenueFound = round(totalRevenueFound + val);
                }
            });
            const newSplits: AdvisorSplit[] = Object.keys(revenueByAdvisor).map(advId => {
                const advisor = advisors.find(a => a.id === advId)!;
                return {
                    advisorId: advisor.id,
                    advisorName: advisor.name,
                    revenueAmount: round(revenueByAdvisor[advId]),
                    percentage: advisor.commissionRate || 30,
                    additionalCost: 0
                };
            });
            setSplits(newSplits);
            setFormData(prev => ({ ...prev, grossAmount: totalRevenueFound.toFixed(2) }));
            setsearchPeriod({ ...searchPeriod, show: false });
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar receitas.");
        }
    };

    const totalSplitRevenue: number = round(splits.reduce((acc: number, s: any) => acc + (Number(s.revenueAmount) || 0), 0));
    const splitRevenueDifference: number = round(Number(gross) - Number(totalSplitRevenue));

    const handleSubmit = async (e: React.FormEvent) => {
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

        const parsedGrossAmount = round(parseFloat(grossAmount));
        if(isNaN(parsedGrossAmount)) {
             alert("O valor inserido é inválido.");
            return;
        }

        if (splits.length > 0) {
            if (Math.abs(splitRevenueDifference) > 0.05) {
                alert(`A soma das receitas individuais deve ser igual ao valor total.`);
                return;
            }
        }
        
        const submissionData: TransactionFormValues = {
            description,
            amount: entradaCaixaPJ, 
            date: new Date(date).toISOString(),
            type,
            category,
            clientSupplier,
            paymentMethod,
            costCenter,
        };
        
        if (type === TransactionType.INCOME) {
            submissionData.taxAmount = round(taxValueCents / 100);
            submissionData.grossAmount = parsedGrossAmount;
            submissionData.taxRate = parseFloat(taxRateInput) || 0;

            if (splits.length > 0) {
                submissionData.splits = splitsDetails.map(s => ({
                  ...s,
                  revenueAmount: round(Number(s.revenueAmount)),
                  grossPayout: round(Number(s.grossPayout || 0)),
                  taxAmount: round(Number(s.taxAmount || 0)),
                  netPayout: round(Number(s.netPayout || 0)),
                  additionalCost: round(Number(s.additionalCost || 0))
                }));
            } else {
                submissionData.commissionAmount = round(commissionAmount);
                submissionData.advisorId = advisorId;
            }
        }

        if (type === TransactionType.EXPENSE) {
            submissionData.status = status;
            submissionData.nature = nature;
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
                             <Button type="button" onClick={() => setsearchPeriod({...searchPeriod, show: true})} variant="secondary" className="flex-1 sm:flex-none py-2 px-4 text-xs font-semibold border border-primary/30 whitespace-nowrap" title="Busca e agrupa receitas já lançadas para os assessores por período">
                                 Buscar receitas do período
                             </Button>
                         ) : (
                            <div className="flex flex-col sm:flex-row gap-2 items-end bg-surface p-2 rounded border border-border-color w-full sm:w-auto">
                                <div>
                                    <label className="block text-[10px] text-text-secondary">De</label>
                                    <input type="date" value={searchPeriod.start} onChange={(e) => setsearchPeriod({...searchPeriod, start: e.target.value})} className="bg-background border border-border-color rounded px-2 py-1 text-xs min-w-[150px]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-secondary">Até</label>
                                    <input type="date" value={searchPeriod.end} onChange={(e) => setsearchPeriod({...searchPeriod, end: e.target.value})} className="bg-background border border-border-color rounded px-2 py-1 text-xs min-w-[150px]" />
                                </div>
                                <div className="flex gap-1">
                                    <Button type="button" onClick={confirmSearchPeriod} className="py-1 px-3 text-xs min-w-[50px]">OK</Button>
                                    <Button type="button" onClick={() => setsearchPeriod({...searchPeriod, show: false})} variant="ghost" className="py-1 px-2 text-xs">X</Button>
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
                                <div className="col-span-2 text-center">CRM (Custos)</div>
                                <div className="col-span-2 text-right">Repasse (Liq)</div>
                                <div className="col-span-1"></div>
                             </div>
                             {splitsDetails.map((split, index) => (
                                     <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-surface p-2 rounded-md">
                                        <div className="col-span-3">
                                            <select value={split.advisorId} onChange={(e) => updateSplit(index, 'advisorId', e.target.value)} className="w-full bg-background border-border-color rounded-md text-sm py-1">
                                                {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input type="text" value={Number(split.revenueAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    updateSplit(index, 'revenueAmount', round(Number(rawValue) / 100));
                                                }} placeholder="R$ 0,00" className="w-full bg-background border-border-color rounded-md text-sm py-1" />
                                        </div>
                                        <div className="col-span-1">
                                            <input type="number" step="1" min="0" max="100" value={split.percentage} onChange={(e) => updateSplit(index, 'percentage', e.target.value)} className="w-full bg-background border-border-color rounded-md text-sm py-1 text-center" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="text" value={Number(split.additionalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    updateSplit(index, 'additionalCost', round(Number(rawValue) / 100));
                                                }} placeholder="R$ 0,00" className="w-full bg-background border-border-color rounded-md text-sm py-1" />
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-danger text-sm">
                                            {Number(split.netPayout || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button type="button" onClick={() => removeSplit(index)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                     </div>
                                 ))}
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
                    <div className="flex justify-end mb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                             <span className="text-xs text-text-secondary">Aplicar imposto proporcional</span>
                             <input type="checkbox" checked={applyTax} onChange={handleApplyTaxCheckboxChange} className="rounded text-primary focus:ring-primary h-4 w-4 bg-surface border-border-color" />
                        </label>
                     </div>

                    <div className="grid grid-cols-4 gap-4 text-center mb-2">
                        <div>
                            <p className="text-xs text-text-secondary">Receita Pós-CRM</p>
                            <p className="font-semibold text-primary">{formatCurrency(entradaCaixaPJ)}</p>
                        </div>
                        <div className="border-l border-r border-border-color px-2 py-1">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <p className="text-xs text-text-secondary">(-) Imposto Total</p>
                            </div>
                            <div className={`flex flex-col gap-1 ${!applyTax ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="relative">
                                    <input type="number" step="0.01" value={taxRateInput} onChange={(e) => handleRateInputChange(e.target.value)} className="w-full bg-surface border border-border-color rounded px-2 py-1 text-xs text-center focus:ring-primary focus:border-primary" placeholder="0" disabled={!applyTax} />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary">%</span>
                                </div>
                                <div className="text-xs font-bold text-danger">{formattedTaxValue}</div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">(-) Repasses Líq</p>
                            <p className="font-bold text-danger">{formatCurrency(splitsDetails.reduce((acc, s) => acc + (Number(s.netPayout) || 0), 0))}</p>
                        </div>
                        <div className="border-l border-border-color">
                            <p className="text-xs text-text-secondary">(=) Resultado Esc.</p>
                            <p className={`font-bold ${officeResult >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(officeResult)}</p>
                        </div>
                    </div>
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
                            <label className="block text-sm font-medium text-text-secondary">Centro de Gasto</label>
                             <select name="costCenter" value={formData.costCenter} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
                                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-text-secondary">Natureza do Gasto</label>
                            <select value={nature} onChange={(e) => setNature(e.target.value as ExpenseNature)} name="nature" className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                                <option value={ExpenseNature.VARIABLE}>Variável</option>
                                <option value={ExpenseNature.FIXED}>Fixo</option>
                            </select>
                        </div>
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
      targetAmount: round(parseFloat(targetAmount as string)),
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
        const parsedAmount = round(parseFloat(amount));
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
                <div><h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Metas Financeiras</h2><p className="text-text-secondary">Defina e acompanhe seus objetivos.</p></div>
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
            </div>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Meta"><GoalForm onSubmit={(data) => { onAdd(data); setIsAddModalOpen(false); }} onClose={() => setIsAddModalOpen(false)} /></Modal>
            <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Adicionar Progresso" size="sm"><AddProgressForm onSubmit={(amount) => { if(selectedGoalId) onUpdateProgress(selectedGoalId, amount); setIsProgressModalOpen(false); }} onClose={() => setIsProgressModalOpen(false)} /></Modal>
        </div>
    );
};

const PartnershipView: FC<{ partners: Partner[], onSave: (partners: Partner[]) => void }> = ({ partners, onSave }) => {
    const [newName, setNewName] = useState('');
    const [newPercentage, setNewPercentage] = useState('');
    const [newQuotas, setNewQuotas] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Partner; direction: 'asc' | 'desc' } | null>({ key: 'percentage', direction: 'desc' });

    const handleSave = () => {
        if (!newName || !newPercentage || !newQuotas) return;
        const p = parseFloat(newPercentage);
        const q = parseFloat(newQuotas);
        if (isNaN(p) || isNaN(q)) return;
        
        let updated;
        if (editingId) {
            updated = partners.map(partner => 
                partner.id === editingId ? { ...partner, name: newName, percentage: p, quotas: q } : partner
            );
        } else {
            updated = [...partners, { id: crypto.randomUUID(), name: newName, percentage: p, quotas: q }];
        }
        
        onSave(updated);
        cancelEdit();
    };

    const handleEdit = (partner: Partner) => {
        setEditingId(partner.id);
        setNewName(partner.name);
        setNewPercentage(partner.percentage.toString());
        setNewQuotas((partner.quotas || 0).toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewName('');
        setNewPercentage('');
        setNewQuotas('');
    };

    const handleSort = (key: keyof Partner) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const filteredAndSortedPartners = useMemo(() => {
        let result = [...partners];
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(low) || 
                p.percentage.toString().includes(low) || 
                p.quotas.toString().includes(low)
            );
        }
        if (sortConfig) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                if (aVal === undefined) aVal = 0;
                if (bVal === undefined) bVal = 0;

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return sortConfig.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }
        return result;
    }, [partners, searchTerm, sortConfig]);

    const totalPercent = partners.reduce((acc, p) => acc + p.percentage, 0);
    const totalQuotas = partners.reduce((acc, p) => acc + (p.quotas || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Partnership ACI</h2><p className="text-text-secondary">Gerencie o quadro societário da empresa.</p></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 h-fit">
                    <h3 className="font-bold mb-4 text-primary uppercase text-sm tracking-wider">
                        {editingId ? 'Editar Sócio' : 'Adicionar Sócio'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Nome Completo</label>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm" placeholder="Nome do sócio" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Percentual (%)</label>
                                <input type="number" step="0.01" value={newPercentage} onChange={e => setNewPercentage(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm" placeholder="Ex: 25" />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">N° de cotas</label>
                                <input type="number" step="1" value={newQuotas} onChange={e => setNewQuotas(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm" placeholder="Ex: 1000" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="flex-1">{editingId ? 'Salvar Alterações' : 'Adicionar'}</Button>
                            {editingId && <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>}
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="font-bold text-text-primary uppercase text-sm tracking-wider">Quadro de Sócios</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="relative">
                                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filtrar..." className="bg-background border border-border-color rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none w-32 sm:w-40" />
                            </div>
                            <div className="flex gap-2">
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${Math.abs(totalPercent - 100) < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-danger'}`}>
                                    Total: {totalPercent.toFixed(2)}%
                                </div>
                                <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary">
                                    Total Cotas: {totalQuotas.toLocaleString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-color text-[10px] text-text-secondary uppercase tracking-wider">
                                    <th className="p-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                        Nome Completo {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3 cursor-pointer hover:text-primary transition-colors text-center" onClick={() => handleSort('percentage')}>
                                        Percentual (%) {sortConfig?.key === 'percentage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3 cursor-pointer hover:text-primary transition-colors text-center" onClick={() => handleSort('quotas')}>
                                        N° de cotas {sortConfig?.key === 'quotas' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color/30 text-sm">
                                {filteredAndSortedPartners.map(p => (
                                    <tr key={p.id} className={`hover:bg-background/50 transition-colors ${editingId === p.id ? 'bg-primary/10' : ''}`}>
                                        <td className="p-3 font-bold text-text-primary">{p.name}</td>
                                        <td className="p-3 font-mono text-primary font-bold text-center">{p.percentage}%</td>
                                        <td className="p-3 text-text-secondary text-center">{p.quotas?.toLocaleString('pt-BR') || 0}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleEdit(p)} className="p-2 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-all" title="Editar Sócio"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={() => { if(window.confirm("Remover sócio?")) onSave(partners.filter(item => item.id !== p.id)) }} className="p-2 text-text-secondary hover:text-danger hover:bg-surface rounded-lg transition-all" title="Remover Sócio"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAndSortedPartners.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-text-secondary text-sm">Nenhum sócio encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdvisorSettingsItem: FC<{ 
    advisor: Advisor; 
    onDelete: () => void; 
    onUpdate: (updated: Advisor) => void; 
    onMove?: (direction: 'up' | 'down') => void;
}> = ({ advisor, onDelete, onUpdate, onMove }) => {
    const [newCostDesc, setNewCostDesc] = useState('');
    const [newCostVal, setNewCostVal] = useState('');
    const [isEditingBase, setIsEditingBase] = useState(false);
    const [editName, setEditName] = useState(advisor.name);
    const [editRate, setEditRate] = useState(advisor.commissionRate.toString());

    const totalCost = (advisor.costs || []).reduce((acc, c) => acc + c.value, 0);

    const addCost = () => {
        if (!newCostDesc || !newCostVal) return;
        const val = round(parseFloat(newCostVal));
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

    const saveBaseInfo = () => {
        onUpdate({ ...advisor, name: editName, commissionRate: round(parseFloat(editRate) || 0) });
        setIsEditingBase(false);
    };

    return (
        <li className="flex flex-col bg-background/50 p-3 rounded text-sm gap-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {onMove && (
                        <div className="flex flex-col gap-0.5 mr-1">
                            <button onClick={() => onMove('up')} className="text-text-secondary hover:text-primary transition-colors"><ArrowUpIcon className="w-3 h-3" /></button>
                            <button onClick={() => onMove('down')} className="text-text-secondary hover:text-primary transition-colors"><ArrowDownIcon className="w-3 h-3" /></button>
                        </div>
                    )}
                    {isEditingBase ? (
                        <div className="flex gap-2 items-center">
                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="bg-background border border-border-color rounded px-2 py-1 text-xs w-32" />
                            <div className="relative">
                                <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} className="bg-background border border-border-color rounded px-2 py-1 text-xs w-16" />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary">%</span>
                            </div>
                            <Button onClick={saveBaseInfo} className="py-1 px-2 text-[10px]">OK</Button>
                            <Button variant="ghost" onClick={() => setIsEditingBase(false)} className="py-1 px-2 text-[10px]">X</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">{advisor.name}</span>
                            <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded">Comissão: {advisor.commissionRate}%</span>
                            <span className="text-xs text-danger bg-background px-2 py-1 rounded" title="Soma dos custos">Custos: {formatCurrency(totalCost)}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isEditingBase && <button onClick={() => setIsEditingBase(true)} className="text-text-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button>}
                    <button onClick={onDelete} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
            
            <div className="pl-4 border-l-2 border-border-color ml-2 space-y-2">
                {(advisor.costs || []).map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="flex-1">{cost.description}</span>
                        <span className="font-mono text-danger mr-4">{formatCurrency(cost.value)}</span>
                        <button onClick={() => removeCost(idx)} className="hover:text-danger"><TrashIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                
                <div className="flex gap-2 items-center mt-2">
                    <input type="text" placeholder="Novo custo (ex: CRM)" value={newCostDesc} onChange={(e) => setNewCostDesc(e.target.value)} className="flex-1 bg-background border border-border-color rounded px-2 py-1 text-xs" />
                    <input type="number" placeholder="Valor (-)" value={newCostVal} onChange={(e) => setNewCostVal(e.target.value)} className="w-20 bg-background border border-border-color rounded px-2 py-1 text-xs" />
                    <Button onClick={addCost} variant="secondary" className="py-1 px-2 text-xs"><PlusIcon className="w-3 h-3"/></Button>
                </div>
            </div>
        </li>
    );
};

// --- SETTINGS VIEW COMPONENT ---
interface SettingsViewProps {
    incomeCategories: string[];
    setIncomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
    expenseCategories: ExpenseCategory[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
    paymentMethods: string[];
    setPaymentMethods: React.Dispatch<React.SetStateAction<string[]>>;
    costCenters: CostCenter[];
    setCostCenters: React.Dispatch<React.SetStateAction<CostCenter[]>>;
    advisors: Advisor[];
    setAdvisors: React.Dispatch<React.SetStateAction<Advisor[]>>;
    globalTaxRate: number;
    setGlobalTaxRate: React.Dispatch<React.SetStateAction<number>>;
}

const SettingsView: FC<SettingsViewProps> = ({ 
    incomeCategories, setIncomeCategories, 
    expenseCategories, setExpenseCategories, 
    paymentMethods, setPaymentMethods, 
    costCenters, setCostCenters, 
    advisors, setAdvisors,
    globalTaxRate, setGlobalTaxRate
}) => {
    const [newIncomeCat, setNewIncomeCat] = useState('');
    const [newExpenseCatName, setNewExpenseCatName] = useState('');
    const [newExpenseCatType, setNewExpenseCatType] = useState<ExpenseType>(ExpenseType.EXPENSE);
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newCostCenterName, setNewCostCenterName] = useState('');
    const [newAdvisorName, setNewAdvisorName] = useState('');
    const [newAdvisorRate, setNewAdvisorRate] = useState('30');

    // States for editing items
    const [editingIncomeIdx, setEditingIncomeIdx] = useState<number | null>(null);
    const [tempIncomeVal, setTempIncomeVal] = useState('');

    const [editingExpenseIdx, setEditingExpenseIdx] = useState<number | null>(null);
    const [tempExpenseName, setTempExpenseName] = useState('');
    const [tempExpenseType, setTempExpenseType] = useState<ExpenseType>(ExpenseType.EXPENSE);

    const [editingPaymentIdx, setEditingPaymentIdx] = useState<number | null>(null);
    const [tempPaymentVal, setTempPaymentVal] = useState('');

    const [editingCostCenterIdx, setEditingCostCenterIdx] = useState<number | null>(null);
    const [tempCostCenterName, setTempCostCenterName] = useState('');

    // Reorder Helpers
    const moveItem = <T,>(arr: T[], setArr: React.Dispatch<React.SetStateAction<T[]>>, idx: number, direction: 'up' | 'down') => {
        const newArr = [...arr];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= newArr.length) return;
        [newArr[idx], newArr[targetIdx]] = [newArr[targetIdx], newArr[idx]];
        setArr(newArr);
    };

    // Income Handlers
    const addIncomeCategory = () => { if (newIncomeCat && !incomeCategories.includes(newIncomeCat)) { setIncomeCategories([...incomeCategories, newIncomeCat]); setNewIncomeCat(''); } };
    const removeIncomeCategory = (cat: string) => setIncomeCategories(incomeCategories.filter(c => c !== cat));
    const startEditIncome = (idx: number) => { setEditingIncomeIdx(idx); setTempIncomeVal(incomeCategories[idx]); };
    const saveEditIncome = () => {
        if (!tempIncomeVal.trim()) return;
        const newList = [...incomeCategories];
        newList[editingIncomeIdx!] = tempIncomeVal.trim();
        setIncomeCategories(newList);
        setEditingIncomeIdx(null);
    };

    // Expense Handlers
    const addExpenseCategory = () => { if (newExpenseCatName && !expenseCategories.find(c => c.name === newExpenseCatName)) { setExpenseCategories([...expenseCategories, { name: newExpenseCatName, type: newExpenseCatType }]); setNewExpenseCatName(''); } };
    const removeExpenseCategory = (name: string) => setExpenseCategories(expenseCategories.filter(c => c.name !== name));
    const startEditExpense = (idx: number) => { 
        setEditingExpenseIdx(idx); 
        setTempExpenseName(expenseCategories[idx].name); 
        setTempExpenseType(expenseCategories[idx].type);
    };
    const saveEditExpense = () => {
        if (!tempExpenseName.trim()) return;
        const newList = [...expenseCategories];
        newList[editingExpenseIdx!] = { name: tempExpenseName.trim(), type: tempExpenseType };
        setExpenseCategories(newList);
        setEditingIncomeIdx(null);
    };

    // Payment Handlers
    const addPaymentMethod = () => { if (newPaymentMethod && !paymentMethods.includes(newPaymentMethod)) { setPaymentMethods([...paymentMethods, newPaymentMethod]); setNewPaymentMethod(''); } };
    const removePaymentMethod = (pm: string) => setPaymentMethods(paymentMethods.filter(p => p !== pm));
    const startEditPayment = (idx: number) => { setEditingPaymentIdx(idx); setTempPaymentVal(paymentMethods[idx]); };
    const saveEditPayment = () => {
        if (!tempPaymentVal.trim()) return;
        const newList = [...paymentMethods];
        newList[editingPaymentIdx!] = tempPaymentVal.trim();
        setPaymentMethods(newList);
        setEditingPaymentIdx(null);
    };

    // Cost Center Handlers
    const addCostCenter = () => { if (newCostCenterName && !costCenters.find(c => c.name === newCostCenterName)) { setCostCenters([...costCenters, { id: crypto.randomUUID(), name: newCostCenterName }]); setNewCostCenterName(''); } };
    const removeCostCenter = (id: string) => setCostCenters(costCenters.filter(c => c.id !== id));
    const startEditCostCenter = (idx: number) => { setEditingCostCenterIdx(idx); setTempCostCenterName(costCenters[idx].name); };
    const saveEditCostCenter = () => {
        if (!tempCostCenterName.trim()) return;
        const newList = [...costCenters];
        newList[editingCostCenterIdx!] = { ...newList[editingCostCenterIdx!], name: tempCostCenterName.trim() };
        setCostCenters(newList);
        setEditingCostCenterIdx(null);
    };

    const addAdvisor = () => { if (newAdvisorName) { setAdvisors([...advisors, { id: crypto.randomUUID(), name: newAdvisorName, commissionRate: round(parseFloat(newAdvisorRate) || 30), costs: [] }]); setNewAdvisorName(''); setNewAdvisorRate('30'); } };
    const removeAdvisor = (id: string) => setAdvisors(advisors.filter(a => a.id !== id));
    const updateAdvisor = (updated: Advisor) => setAdvisors(advisors.map(a => a.id === updated.id ? updated : a));

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Configurações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CATEGORIAS DE RECEITA */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Categorias de Receita</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" value={newIncomeCat} onChange={e => setNewIncomeCat(e.target.value)} className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="Nova categoria" />
                        <Button onClick={addIncomeCategory} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                    </div>
                    <ul className="space-y-2">
                        {incomeCategories.map((cat, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm group">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveItem(incomeCategories, setIncomeCategories, idx, 'up')} className="text-text-secondary hover:text-primary"><ArrowUpIcon className="w-3 h-3" /></button>
                                        <button onClick={() => moveItem(incomeCategories, setIncomeCategories, idx, 'down')} className="text-text-secondary hover:text-primary"><ArrowDownIcon className="w-3 h-3" /></button>
                                    </div>
                                    {editingIncomeIdx === idx ? (
                                        <div className="flex gap-1 items-center">
                                            <input type="text" value={tempIncomeVal} onChange={e => setTempIncomeVal(e.target.value)} className="bg-background border border-border-color rounded px-2 py-0.5 text-xs w-32" />
                                            <button onClick={saveEditIncome} className="text-green-400 hover:text-green-300 font-bold text-xs">OK</button>
                                        </div>
                                    ) : (
                                        <span>{cat}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {editingIncomeIdx !== idx && <button onClick={() => startEditIncome(idx)} className="text-text-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button>}
                                    <button onClick={() => removeIncomeCategory(cat)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* CATEGORIAS DE DESPESA */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Categorias de Despesa</h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <input type="text" value={newExpenseCatName} onChange={e => setNewExpenseCatName(e.target.value)} className="bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="Nome da categoria" />
                        <div className="flex gap-2">
                            <select value={newExpenseCatType} onChange={e => setNewExpenseCatType(e.target.value as ExpenseType)} className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-sm">
                                <option value={ExpenseType.COST}>Custo</option>
                                <option value={ExpenseType.EXPENSE}>Despesa</option>
                            </select>
                            <Button onClick={addExpenseCategory} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {expenseCategories.map((cat, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm group">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveItem(expenseCategories, setExpenseCategories, idx, 'up')} className="text-text-secondary hover:text-primary"><ArrowUpIcon className="w-3 h-3" /></button>
                                        <button onClick={() => moveItem(expenseCategories, setExpenseCategories, idx, 'down')} className="text-text-secondary hover:text-primary"><ArrowDownIcon className="w-3 h-3" /></button>
                                    </div>
                                    {editingExpenseIdx === idx ? (
                                        <div className="flex flex-col gap-1">
                                            <input type="text" value={tempExpenseName} onChange={e => setTempExpenseName(e.target.value)} className="bg-background border border-border-color rounded px-2 py-0.5 text-xs w-32" />
                                            <div className="flex gap-2 items-center">
                                                <select value={tempExpenseType} onChange={e => setTempExpenseType(e.target.value as ExpenseType)} className="bg-background border border-border-color rounded px-1 py-0.5 text-[10px]">
                                                    <option value={ExpenseType.COST}>Custo</option>
                                                    <option value={ExpenseType.EXPENSE}>Despesa</option>
                                                </select>
                                                <button onClick={saveEditExpense} className="text-green-400 hover:text-green-300 font-bold text-xs">OK</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="font-medium">{cat.name}</span>
                                            <span className="ml-2 text-[10px] text-text-secondary uppercase">({cat.type})</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {editingExpenseIdx !== idx && <button onClick={() => startEditExpense(idx)} className="text-text-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button>}
                                    <button onClick={() => removeExpenseCategory(cat.name)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* FORMAS DE PAGAMENTO */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Formas de Pagamento</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" value={newPaymentMethod} onChange={e => setNewPaymentMethod(e.target.value)} className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="Ex: Cartão de Crédito" />
                        <Button onClick={addPaymentMethod} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                    </div>
                    <ul className="space-y-2">
                        {paymentMethods.map((pm, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm group">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveItem(paymentMethods, setPaymentMethods, idx, 'up')} className="text-text-secondary hover:text-primary"><ArrowUpIcon className="w-3 h-3" /></button>
                                        <button onClick={() => moveItem(paymentMethods, setPaymentMethods, idx, 'down')} className="text-text-secondary hover:text-primary"><ArrowDownIcon className="w-3 h-3" /></button>
                                    </div>
                                    {editingPaymentIdx === idx ? (
                                        <div className="flex gap-1 items-center">
                                            <input type="text" value={tempPaymentVal} onChange={e => setTempPaymentVal(e.target.value)} className="bg-background border border-border-color rounded px-2 py-0.5 text-xs w-32" />
                                            <button onClick={saveEditPayment} className="text-green-400 hover:text-green-300 font-bold text-xs">OK</button>
                                        </div>
                                    ) : (
                                        <span>{pm}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {editingPaymentIdx !== idx && <button onClick={() => startEditPayment(idx)} className="text-text-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button>}
                                    <button onClick={() => removePaymentMethod(pm)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* ASSESSORES E COMISSÕES */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Assessores e Comissões</h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <input type="text" value={newAdvisorName} onChange={e => setNewAdvisorName(e.target.value)} className="bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="Nome do Assessor" />
                        <div className="flex gap-2">
                            <input type="number" value={newAdvisorRate} onChange={e => setNewAdvisorRate(e.target.value)} className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="% Comissão" />
                            <Button onClick={addAdvisor} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        {advisors.map((adv, idx) => (
                            <AdvisorSettingsItem key={adv.id} advisor={adv} onDelete={() => removeAdvisor(adv.id)} onUpdate={updateAdvisor} onMove={(dir) => moveItem(advisors, setAdvisors, idx, dir)} />
                        ))}
                    </ul>
                </Card>

                {/* IMPOSTOS E TAXAS */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Impostos e Taxas</h3>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Alíquota Padrão de Impostos (%)</label>
                        <input type="number" step="0.1" value={globalTaxRate} onChange={e => setGlobalTaxRate(parseFloat(e.target.value) || 0)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-sm" />
                    </div>
                </Card>

                {/* CENTROS DE CUSTO */}
                <Card>
                    <h3 className="font-bold mb-4 text-primary text-sm uppercase">Centros de Custo</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" value={newCostCenterName} onChange={e => setNewCostCenterName(e.target.value)} className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-sm" placeholder="Ex: Marketing" />
                        <Button onClick={addCostCenter} variant="secondary" className="py-2"><PlusIcon className="w-4 h-4"/></Button>
                    </div>
                    <ul className="space-y-2">
                        {costCenters.map((cc, idx) => (
                            <li key={cc.id} className="flex justify-between items-center bg-background/50 p-2 rounded text-sm group">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveItem(costCenters, setCostCenters, idx, 'up')} className="text-text-secondary hover:text-primary"><ArrowUpIcon className="w-3 h-3" /></button>
                                        <button onClick={() => moveItem(costCenters, setCostCenters, idx, 'down')} className="text-text-secondary hover:text-primary"><ArrowDownIcon className="w-3 h-3" /></button>
                                    </div>
                                    {editingCostCenterIdx === idx ? (
                                        <div className="flex gap-1 items-center">
                                            <input type="text" value={tempCostCenterName} onChange={e => setTempCostCenterName(e.target.value)} className="bg-background border border-border-color rounded px-2 py-0.5 text-xs w-32" />
                                            <button onClick={saveEditCostCenter} className="text-green-400 hover:text-green-300 font-bold text-xs">OK</button>
                                        </div>
                                    ) : (
                                        <span>{cc.name}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {editingCostCenterIdx !== idx && <button onClick={() => startEditCostCenter(idx)} className="text-text-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button>}
                                    {!cc.isDefault && <button onClick={() => removeCostCenter(cc.id)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
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
        { view: 'partnership', label: 'Partnership ACI', icon: <PartnershipIcon className="w-6 h-6"/> },
        { view: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-6 h-6"/> },
    ];
    return (
        <aside className={`absolute md:relative z-20 md:z-auto bg-surface md:translate-x-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 p-4 flex flex-col`}>
             <h1 className="text-3xl font-bold text-text-primary mb-8">ACI<span className="text-primary">Capital</span></h1>
             <nav className="flex flex-col space-y-2 flex-grow">
                {allNavItems.map(item => (
                    <button key={item.view} onClick={() => setActiveView(item.view)} className={`px-4 py-3 text-sm font-semibold rounded-lg flex items-center gap-3 transition-colors duration-200 text-left ${activeView === item.view ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background hover:text-white'}`}>
                        {item.icon} {item.label}
                    </button>
                ))}
            </nav>
            <div className="border-t border-border-color pt-4 mt-4">
                 <div className="px-2 mb-4">
                    <p className="text-sm font-bold text-text-primary truncate" title={getUserDisplayName(user)}>{getUserDisplayName(user)}</p>
                 </div>
                 <button onClick={logoutUser} className="w-full px-4 py-3 text-sm font-semibold rounded-lg flex items-center justify-start gap-3 transition-colors duration-200 text-text-secondary hover:bg-danger hover:text-white">
                    <LogoutIcon className="w-5 h-5"/> Sair
                </button>
            </div>
        </aside>
    )
};
const Header: FC<{ pageTitle: string, onMenuClick: () => void }> = ({ pageTitle, onMenuClick }) => (
    <header className="bg-surface p-4 flex items-center shadow-md md:hidden sticky top-0 z-10">
        <button onClick={onMenuClick} className="mr-4 text-text-primary"><MenuIcon className="w-6 h-6"/></button>
        <h2 className="text-xl font-bold uppercase">{pageTitle}</h2>
    </header>
);

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

const TransactionsView: FC<{
    transactions: Transaction[];
    onAdd: (data: TransactionFormValues) => void;
    onEdit: (id: string, data: TransactionFormValues) => void;
    onDelete: (id: string) => void;
    onSetPaid: (id: string) => void;
    onToggleReconciliation: (id: string, current: boolean) => void;
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    onImportTransactions: (data: any[]) => void;
    globalTaxRate: number;
    importedRevenues: ImportedRevenue[];
    userId?: string;
}> = ({ transactions, onAdd, onEdit, onDelete, onSetPaid, onToggleReconciliation, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, onImportTransactions, globalTaxRate, importedRevenues, userId }) => {
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
    const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const availableYears = useMemo(() => {
        const yearsSet = new Set(transactions.map(t => t.date ? new Date(t.date).getUTCFullYear() : null).filter((y): y is number => y !== null));
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [transactions]);

    const filtered = useMemo(() => {
        let items = transactions.filter(t => {
            const d = new Date(t.date);
            if (filterYear !== 'all' && d.getUTCFullYear() !== filterYear) return false;
            if (filterMonth !== 'all' && d.getUTCMonth() !== filterMonth) return false;
            
            if (t.type !== activeTab) return false;
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return (t.description || '').toLowerCase().includes(lower) || (t.clientSupplier || '').toLowerCase().includes(lower) || (t.category || '').toLowerCase().includes(lower);
            }
            return true;
        });

        if (activeTab === TransactionType.EXPENSE && filterYear !== 'all' && filterMonth !== 'all' && !searchTerm && filterCategory === 'all') {
            const selectedDate = new Date(Date.UTC(filterYear as number, filterMonth as number, 1));
            const now = new Date();
            const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            
            if (selectedDate > currentMonthStart) {
                const prevMonth = (filterMonth as number) === 0 ? 11 : (filterMonth as number) - 1;
                const prevYear = (filterMonth as number) === 0 ? (filterYear as number) - 1 : (filterYear as number);

                let fixedSource = transactions.filter(t => {
                    const d = new Date(t.date);
                    return t.type === TransactionType.EXPENSE &&
                           t.nature === ExpenseNature.FIXED &&
                           d.getUTCFullYear() === prevYear &&
                           d.getUTCMonth() === prevMonth;
                });

                if (fixedSource.length === 0) {
                     fixedSource = transactions.filter(t => {
                        const d = new Date(t.date);
                        return t.type === TransactionType.EXPENSE &&
                               t.nature === ExpenseNature.FIXED &&
                               d.getUTCFullYear() === now.getUTCFullYear() &&
                               d.getUTCMonth() === now.getUTCMonth();
                    });
                }

                fixedSource.forEach(f => {
                    const alreadyExists = items.some(item => 
                        item.description === f.description && 
                        item.category === f.category && 
                        item.nature === ExpenseNature.FIXED
                    );

                    if (!alreadyExists) {
                        const day = new Date(f.date).getUTCDate();
                        const projectedDate = new Date(Date.UTC(filterYear as number, filterMonth as number, day)).toISOString();
                        
                        items.push({
                            ...f,
                            id: `proj-${f.id}-${filterYear}-${filterMonth}`,
                            date: projectedDate,
                            status: ExpenseStatus.PENDING,
                            reconciled: false,
                            isProjection: true
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
    }, [transactions, filterYear, filterMonth, activeTab, filterCategory, searchTerm, sortConfig]);

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
                        <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Transações</h2>
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
                            <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-wider border-b border-border-color">
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => requestSort('date')}>Data {getSortIndicator('date')}</th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => requestSort('description')}>Descrição {getSortIndicator('description')}</th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => requestSort('category')}>Categoria {getSortIndicator('category')}</th>
                                <th className="p-4 text-right cursor-pointer hover:text-primary" onClick={() => requestSort('amount')}>Valor {getSortIndicator('amount')}</th>
                                {activeTab === TransactionType.EXPENSE && <th className="p-4 text-center">Status</th>}
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30 text-sm font-medium">
                            {filtered.map(t => (
                                <tr key={t.id} className={`hover:bg-background/50 transition-colors ${(t as any).isProjection ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                    <td className="p-4 whitespace-nowrap text-text-secondary">{formatDate(t.date)}</td>
                                    <td className="p-4 font-bold">{t.description}<div className="text-xs text-text-secondary font-normal">{t.clientSupplier}</div></td>
                                    <td className="p-4"><span className="px-3 py-1 rounded-full bg-border-color/50 border border-border-color text-[10px] uppercase font-bold">{t.category}</span></td>
                                    <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(t.amount)}</td>
                                    {activeTab === TransactionType.EXPENSE && (
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded text-[10px] font-black uppercase ${t.status === ExpenseStatus.PAID ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {t.status === ExpenseStatus.PAID ? 'PAGO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-3 items-center">
                                            {!(t as any).isProjection ? (
                                                <>
                                                    <label className="flex items-center gap-1 cursor-pointer select-none" title={t.type === TransactionType.EXPENSE && t.status !== ExpenseStatus.PAID ? "Apenas despesas pagas podem ser conciliadas" : "Conciliação Bancária (CB)"}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!t.reconciled} 
                                                            onChange={() => onToggleReconciliation(t.id, !!t.reconciled)}
                                                            disabled={t.type === TransactionType.EXPENSE && t.status !== ExpenseStatus.PAID}
                                                            className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-[10px] font-bold text-text-secondary">CB</span>
                                                    </label>
                                                    {t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && (
                                                        <Button variant="success" className="py-1 px-2 rounded-lg" onClick={() => onSetPaid(t.id)} title="Marcar como Pago"><CheckCircleIcon className="w-4 h-4"/></Button>
                                                    )}
                                                    <Button variant="ghost" className="py-1 px-2 rounded-lg hover:bg-surface" onClick={() => handleEdit(t)}><EditIcon className="w-4 h-4 opacity-70"/></Button>
                                                    <Button variant="ghostDanger" className="py-1 px-2 rounded-lg" onClick={() => onDelete(t.id)}><TrashIcon className="w-4 h-4"/></Button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] uppercase font-black text-primary px-2 py-1 bg-primary/10 rounded">Projetado</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === TransactionType.EXPENSE ? 6 : 5} className="p-8 text-center text-text-secondary text-sm">Nenhuma transação encontrada.</td>
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

    const uniqueAdvisors = useMemo(() => Array.from(new Set(importedRevenues.map(r => r.assessorPrincipal).filter(Boolean))).sort(), [importedRevenues]);
    const uniqueCategories = useMemo(() => Array.from(new Set(importedRevenues.map(r => r.produtoCategoria).filter(Boolean))).sort(), [importedRevenues]);

    const filteredRevenues = useMemo(() => {
        return importedRevenues.filter(r => {
            const rDate = new Date(r.date).toISOString().split('T')[0];
            if (startDate && rDate < startDate) return false;
            if (endDate && rDate > endDate) return false;
            if (selectedAdvisor && r.assessorPrincipal !== selectedAdvisor) return false;
            if (selectedCategory && r.produtoCategoria !== selectedCategory) return false;
            if (clientSearch && (!r.cliente || !r.cliente.toLowerCase().includes(clientSearch.toLowerCase()))) return false;
            return true;
        });
    }, [importedRevenues, startDate, endDate, selectedAdvisor, selectedCategory, clientSearch]);

    const handleDeduplicate = async () => {
        setIsDeduplicating(true);
        try {
            const result = await deduplicateImportedRevenues();
            alert(`Limpeza concluída!\nRegistros atualizados: ${result.updatedCount}\nDuplicatas removidas: ${result.deletedCount}`);
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
                <div><h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Receitas Importadas</h2><p className="text-text-secondary">Importe planilhas para calcular comissões.</p></div>
                <div className="flex gap-2">
                    <Button onClick={handleDeduplicate} variant="secondary" className="text-xs" disabled={isDeduplicating}>{isDeduplicating ? 'Processando...' : 'Limpar Duplicatas'}</Button>
                    <label className="bg-primary hover:bg-opacity-90 text-white shadow-md px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 font-semibold transition-all">
                        <UploadIcon className="w-4 h-4"/> Importar Relatório
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    const bstr = evt.target?.result;
                                    const wb = XLSX.read(bstr, { type: 'binary' });
                                    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                                    const formatted = data.map((row: any) => {
                                        if (row['Classificação'] === 'CUSTOS') return null;
                                        let dateIso = new Date().toISOString();
                                        if (typeof row['Data'] === 'number') {
                                            const jsDate = new Date((row['Data'] - 25569) * 86400 * 1000); 
                                            jsDate.setHours(12, 0, 0); 
                                            dateIso = jsDate.toISOString();
                                        } else if (row['Data']) dateIso = new Date(row['Data']).toISOString();
                                        let rawRepasse = parseFloat(row['% Repasse']) || 0;
                                        if (rawRepasse <= 1 && rawRepasse > 0) rawRepasse *= 100;
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
                                            receitaLiquidaEQI: round(parseFloat(row['Receita Liquida EQI']) || 0),
                                            percentualRepasse: Math.round(rawRepasse),
                                            comissaoLiquida: round(parseFloat(row['Comissão Líquida']) || 0),
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
                    <div><label className="block text-xs font-medium text-text-secondary mb-1">Data Inicial</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                    <div><label className="block text-xs font-medium text-text-secondary mb-1">Data Final</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                    <div><label className="block text-xs font-medium text-text-secondary mb-1">Assessor (Principal)</label>
                        <select value={selectedAdvisor} onChange={(e) => setSelectedAdvisor(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">Todos</option>
                            {uniqueAdvisors.map(adv => <option key={adv} value={adv}>{adv}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-xs font-medium text-text-secondary mb-1">Produto / Categoria</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">Todas</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-xs font-medium text-text-secondary mb-1">Cliente</label>
                        <div className="relative">
                            <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-background border border-border-color rounded-md pl-8 pr-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                            <SearchIcon className="w-4 h-4 text-text-secondary absolute left-2.5 top-2.5" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs">
                        <thead className="bg-background/50 uppercase text-text-secondary">
                            <tr><th className="p-4">Data</th><th className="p-4">Conta</th><th className="p-4">Cliente</th><th className="p-4">Cod Assessor</th><th className="p-4">Assessor Principal</th><th className="p-4">Classificação</th><th className="p-4">Produto/Categoria</th><th className="p-4">Ativo</th><th className="p-4">Tipo Receita</th><th className="p-4">Receita Liq EQI</th><th className="p-4">% Repasse</th><th className="p-4">Comissão Líquida</th><th className="p-4">Tipo</th><th className="p-4 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30">
                            {filteredRevenues.map(r => (
                                <tr key={r.id} className="hover:bg-background/50">
                                    <td className="p-4">{formatDate(r.date)}</td><td className="p-4">{r.conta}</td><td className="p-4 font-medium">{r.cliente}</td><td className="p-4">{r.codAssessor}</td><td className="p-4">{r.assessorPrincipal}</td><td className="p-4">{r.classificacao}</td><td className="p-4">{r.produtoCategoria}</td><td className="p-4">{r.ativo}</td><td className="p-4">{r.tipoReceita}</td><td className="p-4 font-bold text-green-400">{formatCurrency(r.receitaLiquidaEQI)}</td><td className="p-4">{Math.round(r.percentualRepasse)}%</td><td className="p-4 font-bold text-primary">{formatCurrency(r.comissaoLiquida)}</td><td className="p-4">{r.tipo}</td><td className="p-4 text-right"><Button variant="ghostDanger" onClick={() => onDelete(r.id)}><TrashIcon className="w-4 h-4"/></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
         </div>
    )
};

const ReportsView: FC<{ transactions: Transaction[], importedRevenues?: ImportedRevenue[] }> = ({ transactions, importedRevenues = [] }) => {
    const availableYears = useMemo(() => {
        const years = [...new Set([
            ...transactions.map(t => new Date(t.date).getFullYear()),
            ...importedRevenues.map(r => new Date(r.date).getFullYear())
        ])];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) years.push(currentYear);
        return years.sort((a, b) => b - a);
    }, [transactions, importedRevenues]);

    const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());

    const filterFn = (dateStr: string) => {
        const d = new Date(dateStr);
        const yearMatch = selectedYear === 'all' || d.getFullYear() === selectedYear;
        const monthMatch = selectedMonth === 'all' || d.getMonth() === selectedMonth;
        return yearMatch && monthMatch;
    };
    
    const dreData = useMemo(() => {
        const fTrans = transactions.filter(t => filterFn(t.date));
        const manualRevenue = fTrans.filter(t => t.type === TransactionType.INCOME).reduce<number>((sum, t) => sum + t.amount, 0);
        const importedRevenue = importedRevenues.filter(r => filterFn(r.date)).reduce<number>((sum, r) => sum + (r.receitaLiquidaEQI || 0), 0);
        const totalRevenue = round(Number(manualRevenue) + Number(importedRevenue));
        const expenseTrans = fTrans.filter(t => t.type === TransactionType.EXPENSE);
        const totalExpense = round(expenseTrans.reduce<number>((sum, t) => sum + t.amount, 0));
        const expensesByCategory: Record<string, number> = {};
        expenseTrans.forEach(t => { expensesByCategory[t.category] = round((expensesByCategory[t.category] || 0) + t.amount); });
        const sortedExpenses = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        
        const result = round(Number(totalRevenue) - Number(totalExpense));

        let limitDate = new Date();
        if (selectedYear !== 'all') {
            if (selectedMonth !== 'all') {
                limitDate = new Date(selectedYear, (selectedMonth as number) + 1, 0, 23, 59, 59);
            } else {
                limitDate = new Date(selectedYear as number, 12, 0, 23, 59, 59);
            }
        }
        
        const caixaEmpresa = round(transactions.reduce((acc, t) => {
            if (t.costCenter === 'conta-pj' && new Date(t.date) <= limitDate) {
                return acc + (t.type === TransactionType.INCOME ? t.amount : -t.amount);
            }
            return acc;
        }, 0));

        const lucroLiquidoAjustado = round(result + caixaEmpresa);

        return { totalRevenue, totalExpense, sortedExpenses, result, caixaEmpresa, lucroLiquidoAjustado };
    }, [transactions, importedRevenues, selectedYear, selectedMonth]);

    const valuationMonthlyData = useMemo(() => {
        const monthlyMap: Record<string, { revenue: number; expense: number; pjBalanceInMonth: number }> = {};
        
        transactions.forEach(t => {
            if (!filterFn(t.date)) return;
            const key = t.date.substring(0, 7);
            if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expense: 0, pjBalanceInMonth: 0 };
            if (t.type === TransactionType.INCOME) monthlyMap[key].revenue = round(monthlyMap[key].revenue + t.amount);
            else monthlyMap[key].expense = round(monthlyMap[key].expense + t.amount);
        });

        importedRevenues.forEach(r => {
            if (!filterFn(r.date)) return;
            const key = r.date.substring(0, 7);
            if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expense: 0, pjBalanceInMonth: 0 };
            monthlyMap[key].revenue = round(monthlyMap[key].revenue + (r.receitaLiquidaEQI || 0));
        });

        const calcularValuation = (llaMensal: number): number => {
            return llaMensal > 0 ? round(llaMensal * 5) : 0;
        };

        return Object.entries(monthlyMap)
            .map(([monthKey, data]) => {
                const [year, month] = monthKey.split('-').map(Number);
                const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59);
                
                const caixaNoMes = round(transactions.reduce((acc, t) => {
                    if (t.costCenter === 'conta-pj' && new Date(t.date) <= lastDayOfMonth) {
                        return acc + (t.type === TransactionType.INCOME ? t.amount : -t.amount);
                    }
                    return acc;
                }, 0));

                const resultadoMes = round(data.revenue - data.expense);
                const lla = round(resultadoMes + caixaNoMes); 
                const valuation = calcularValuation(lla);
                
                const date = new Date(year, month - 1, 1, 12, 0, 0);
                return {
                    monthYear: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                    lla,
                    valuation,
                    key: monthKey
                };
            })
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [transactions, importedRevenues, selectedYear, selectedMonth]);

    const accumulatedLLA = round(dreData.lucroLiquidoAjustado);
    const accumulatedValuation = accumulatedLLA > 0 ? round(accumulatedLLA * 5) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Relatórios</h2>
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
                        {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            <Card className="max-w-4xl mx-auto">
                <div className="border-b border-border-color pb-4 mb-4">
                    <h3 className="text-xl font-bold text-text-primary text-center uppercase tracking-tight">Demonstrativo do Resultado (DRE)</h3>
                    <p className="text-center text-text-secondary text-sm">
                        {selectedMonth !== 'all' ? ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth as number] + ' ' : ''}
                        {selectedYear === 'all' ? 'Todo o Período' : selectedYear}
                    </p>
                </div>
                <div className="space-y-3 font-mono text-sm sm:text-base">
                    <div className="flex justify-between items-center py-2"><span className="font-bold text-text-primary">RECEITA OPERACIONAL BRUTA</span><span className="font-bold text-green-400">{formatCurrency(dreData.totalRevenue)}</span></div>
                    <div className="flex justify-between items-center py-2 border-t border-border-color/30 mt-2"><span className="font-bold text-text-primary">(-) DESPESAS OPERACIONAIS</span><span className="font-bold text-danger">{formatCurrency(dreData.totalExpense)}</span></div>
                    <div className="pl-4 sm:pl-8 space-y-1">
                        {dreData.sortedExpenses.map((exp, idx) => (
                            <div key={idx} className="flex justify-between text-text-secondary text-xs sm:text-sm hover:bg-background/50 px-2 rounded"><span>{exp.name}</span><span>{formatCurrency(exp.value)}</span></div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 border-border-color mt-4 bg-background/30 px-2 rounded">
                        <span className="font-bold text-lg text-text-primary">RESULTADO DO PERÍODO</span>
                        <span className={`font-bold text-lg ${dreData.result >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(dreData.result)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t border-border-color/50 bg-primary/10 px-2 rounded mt-1">
                        <span className="font-bold text-lg text-primary">LUCRO LÍQUIDO AJUSTADO</span>
                        <span className={`font-bold text-lg ${dreData.lucroLiquidoAjustado >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(dreData.lucroLiquidoAjustado)}</span>
                    </div>
                </div>
            </Card>

            <Card className="max-w-4xl mx-auto mt-6">
                <div className="border-b border-border-color pb-4 mb-4 text-center">
                    <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Valuation</h3>
                    <p className="text-text-secondary text-sm">Cálculo baseado no Lucro Líquido Ajustado mensal</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border-color">
                                <th className="p-3">Mês / Ano</th>
                                <th className="p-3 text-right">LLA Mensal</th>
                                <th className="p-3 text-right text-primary">Valuation (5x)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30 font-mono text-sm">
                            {valuationMonthlyData.map(item => (
                                <tr key={item.key} className="hover:bg-background/50 transition-colors">
                                    <td className="p-3 font-bold capitalize">{item.monthYear}</td>
                                    <td className={`p-3 text-right ${item.lla >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                        {formatCurrency(item.lla)}
                                    </td>
                                    <td className={`p-3 text-right font-bold ${item.valuation >= 0 ? 'text-primary' : 'text-danger'}`}>
                                        {formatCurrency(item.valuation)}
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
                            <span className="text-xs font-semibold text-text-secondary">LLA Acumulado:</span>
                            <span className={`text-lg font-bold ${accumulatedLLA >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                {formatCurrency(accumulatedLLA)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-primary/30">
                            <span className="text-xs font-semibold text-primary">Valuation 5x LLA Anual:</span>
                            <span className="text-lg font-bold text-primary">
                                {formatCurrency(accumulatedValuation)}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const COLORS = ['#D1822A', '#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#6366F1'];

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

const DashboardView: FC<DashboardViewProps> = ({ transactions, goals, onSetPaid, onEdit, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, globalTaxRate, importedRevenues }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [showProjection, setShowProjection] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    
    const availableYears = useMemo(() => {
        const yearsSet = new Set(transactions.map(t => t.date ? new Date(t.date).getUTCFullYear() : null).filter((y): y is number => y !== null));
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [transactions]);

    const filteredTransactions = useMemo(() => transactions.filter(t => {
            const date = new Date(t.date);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();
            return (selectedYear === 'all' || year === selectedYear) && (selectedMonth === 'all' || month === selectedMonth);
        }), [transactions, selectedYear, selectedMonth]);

    const { totalIncome, totalExpense, netProfit } = useMemo(() => {
        const income = round(filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce<number>((acc, t) => acc + t.amount, 0));
        const expense = round(filteredTransactions.filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID).reduce<number>((acc, t) => acc + t.amount, 0));
        return { totalIncome: income, totalExpense: expense, netProfit: round(Number(income) - Number(expense)) };
    }, [filteredTransactions]);

    const saldoHoje = useMemo(() => round(transactions.reduce((acc: number, t: Transaction) => {
        const txDate = new Date(t.date).getTime();
        const now = new Date().getTime();
        if (txDate <= now) {
            if (t.type === TransactionType.INCOME) {
                const tax = t.taxAmount || 0;
                // available balance net of earmarked tax
                return acc + (Number(t.amount) - Number(tax));
            } else if (t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID) {
                // subtract from available balance only if NOT a tax payment (to avoid double discount)
                if (t.costCenter !== 'provisao-impostos') {
                    return acc - Number(t.amount);
                }
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

    const achievedGoals = useMemo(() => goals.filter(g => (Number(g.currentAmount) || 0) >= g.targetAmount).length, [goals]);
    
    const upcomingBills = useMemo(() => {
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setHours(23, 59, 59, 999);
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        const threshold = fiveDaysFromNow.getTime();

        return transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && new Date(t.date).getTime() <= threshold)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const expenseSubcategoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID);
        const total = round(expenses.reduce((sum, t) => sum + t.amount, 0));
        if (total === 0) return [];
        const data = expenses.reduce((acc, t) => { acc[t.nature === ExpenseNature.FIXED ? 0 : 1].amount = round(acc[t.nature === ExpenseNature.FIXED ? 0 : 1].amount + t.amount); return acc; }, [{ name: 'Fixo', amount: 0 }, { name: 'Variável', amount: 0 }]);
        return data.map(d => ({ ...d, value: round((d.amount / total) * 100), percent: round((d.amount / total) * 100) })).filter(d => d.amount > 0);
    }, [filteredTransactions]);

    const cashFlowData = useMemo(() => { 
        const now = new Date();
        const endOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
        
        const realInScope = transactions
            .filter(t => new Date(t.date) <= endOfCurrentMonth)
            .sort((a, b) => (new Date(a.date).getTime()) - (new Date(b.date).getTime()));
        
        let bankBalance = 0;
        const history = realInScope.map(t => { 
            if (t.type === TransactionType.INCOME) {
                bankBalance = round(bankBalance + t.amount); 
            } else if (t.status === ExpenseStatus.PAID) {
                bankBalance = round(bankBalance - t.amount);
            }
            return { date: formatDate(t.date), balance: bankBalance, isProjection: false }; 
        }).reduce((acc: any[], item) => {
            if (acc.length && acc[acc.length-1].date === item.date) acc[acc.length-1].balance = item.balance; else acc.push(item); return acc;
        }, []);

        if (!showProjection) return history;

        const curM = now.getUTCMonth();
        const curY = now.getUTCFullYear();
        const fixedInCurrent = transactions.filter(t => {
            const d = new Date(t.date);
            return t.type === TransactionType.EXPENSE &&
                   t.nature === ExpenseNature.FIXED &&
                   d.getUTCFullYear() === curY &&
                   d.getUTCMonth() === curM;
        });
        const monthlyFixedTotal = round(fixedInCurrent.reduce((sum, t) => sum + t.amount, 0));

        let projectedBalance = bankBalance;
        const projectionPoints = [];
        for (let i = 1; i <= 12; i++) {
            const projDate = new Date(Date.UTC(curY, curM + i + 1, 0));
            projectedBalance = round(projectedBalance - monthlyFixedTotal);
            projectionPoints.push({
                date: formatDate(projDate.toISOString()),
                balance: projectedBalance,
                isProjection: true
            });
        }

        return [...history, ...projectionPoints];
    }, [transactions, showProjection]);

    const handlePayClick = (bill: Transaction) => { setEditingTransaction({ ...bill, status: ExpenseStatus.PAID }); setIsModalOpen(true); };
    const handleFormSubmit = (data: TransactionFormValues) => { if (editingTransaction) onEdit(editingTransaction.id, data); setIsModalOpen(false); setEditingTransaction(null); };

     return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="flex gap-6 mb-3">
                        <div className="flex flex-col">
                            <span className="text-text-secondary font-semibold text-[10px] uppercase tracking-wider">Saldo Hoje</span>
                            <span className={`text-sm font-bold ${saldoHoje >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(saldoHoje)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text-secondary font-semibold text-[10px] uppercase tracking-wider">Saldo Provisão</span>
                            <span className={`text-sm font-bold ${saldoProvisaoHoje >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(saldoProvisaoHoje)}</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-tight">Visão Geral</h2>
                    <p className="text-text-secondary text-sm">Resumo do desempenho financeiro.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button 
                        onClick={() => setShowProjection(!showProjection)} 
                        variant={showProjection ? "primary" : "secondary"} 
                        className="text-xs py-1"
                        title="Projetar fluxo para os próximos 12 meses baseado em gastos fixos"
                    >
                        <TrendingUpIcon className="w-4 h-4"/> {showProjection ? "Ocultar Projeção" : "Projetar 12 Meses"}
                    </Button>
                     <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md p-2 text-xs">
                        <option value="all">Todo o Período</option>{availableYears.map((year: any) => <option key={year} value={year}>{year}</option>)}
                    </select>
                     <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md p-2 text-xs">
                        <option value="all">Todos os Meses</option>{['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="border-l-4 border-green-400"><h3 className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Receita Líquida</h3><p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</p></Card>
                <Card className="border-l-4 border-danger"><h3 className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Despesa Total</h3><p className="text-2xl font-bold text-danger">{formatCurrency(totalExpense)}</p></Card>
                <Card className="border-l-4 border-primary"><h3 className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Lucro Líquido</h3><p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-text-primary' : 'text-danger'}`}>{formatCurrency(netProfit)}</p></Card>
                <Card className="border-l-4 border-blue-400"><h3 className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Metas Atingidas</h3><p className="text-2xl font-bold text-blue-400">{achievedGoals} <span className="text-lg text-text-secondary font-normal">/ {goals.length}</span></p></Card>
            </div>

            {upcomingBills.length > 0 && (
                <div className="bg-surface border border-border-color rounded-xl p-3 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-danger/10 p-2 rounded-full"><AlertCircleIcon className="w-5 h-5 text-danger" /></div>
                        <div><h3 className="text-base font-bold uppercase tracking-tight">Contas a Pagar</h3></div>
                    </div>
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="text-text-secondary border-b border-border-color/30 uppercase text-[10px]">
                                <th className="py-2">Vencimento</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>{upcomingBills.map(bill => {
                            const todayStart = new Date();
                            todayStart.setHours(0,0,0,0);
                            const isOverdue = new Date(bill.date) < todayStart;
                            return (
                                <tr key={bill.id} className="border-b border-border-color/10 last:border-0 hover:bg-background/50">
                                    <td className="py-2 text-text-secondary">{formatDate(bill.date)}</td>
                                    <td className="font-medium">{bill.description}</td>
                                    <td className="font-bold text-danger">{formatCurrency(bill.amount)}</td>
                                    <td className="text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isOverdue ? 'bg-danger/20 text-danger' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                            {isOverdue ? 'VENCIDA' : 'PENDENTE'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end">
                                            <Button onClick={() => handlePayClick(bill)} variant="success" className="py-1 px-3 text-[10px] w-fit shadow-none">Pagar</Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}</tbody>
                    </table>
                </div>
            )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 h-[400px] flex flex-col">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Fluxo de Caixa {showProjection && <span className="text-xs text-primary ml-2">(com projeção 12m)</span>}</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer>
                      <AreaChart data={cashFlowData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D1822A" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#D1822A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D376A" opacity={0.5} />
                        <XAxis dataKey="date" stroke="#A0AEC0" tick={{fontSize:11}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#A0AEC0" tickFormatter={v => `R$${(Number(v) as number)/1000}k`} tick={{fontSize:11}} width={60} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{backgroundColor:'#1A214A',border:'none',borderRadius:'8px'}} itemStyle={{color:'#D1822A'}} formatter={v => [formatCurrency(Number(v)), 'Saldo']}/>
                        <Area type="monotone" dataKey="balance" stroke="#D1822A" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="h-[400px] flex flex-col">
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

const App: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [incomeCategories, setIncomeCategories] = useLocalStorage('incomeCategories', initialIncomeCategories);
    const [expenseCategories, setExpenseCategories] = useLocalStorage('expenseCategories', initialExpenseCategories);
    const [paymentMethods, setPaymentMethods] = useLocalStorage('paymentMethods', initialPaymentMethods);
    const [costCenters, setCostCenters] = useLocalStorage('costCenters', initialCostCenters);
    const [advisors, setAdvisors] = useLocalStorage('advisors', initialAdvisors);
    const [globalTaxRate, setGlobalTaxRate] = useLocalStorage('globalTaxRate', 6);
    const [goals, setGoals] = useLocalStorage('goals', getInitialGoals());

    const [partners, setPartners] = useLocalStorage<Partner[]>('partners', []);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [importedRevenues, setImportedRevenues] = useState<ImportedRevenue[]>([]);

    const [loadingData, setLoadingData] = useState(false);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoadingAuth(false); });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            setLoadingData(true);
            Promise.all([getTransactions(), getImportedRevenues(), getPartnership()]).then(([transSnap, revSnap, partSnap]) => {
                if (transSnap && transSnap.docs) {
                    let transData = transSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Transaction));
                    
                    const now = new Date();
                    const firstDayNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
                    
                    const legacyFutureFixed = transData.filter(t => 
                        t.type === TransactionType.EXPENSE && 
                        t.nature === ExpenseNature.FIXED && 
                        new Date(t.date) >= firstDayNextMonth
                    );

                    if (legacyFutureFixed.length > 0) {
                        legacyFutureFixed.forEach(t => deleteTransactionFromDb(t.id));
                        transData = transData.filter(t => !legacyFutureFixed.some(l => l.id === t.id));
                    }

                    setTransactions(transData);
                }
                
                if (revSnap && revSnap.docs) {
                    const revData = revSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ImportedRevenue));
                    setImportedRevenues(revData);
                }

                if (partSnap && partSnap.exists()) {
                    setPartners(partSnap.data().socios || []);
                }
            }).finally(() => {
                setLoadingData(false);
            });
        }
    }, [user, setPartners]);

    const handleAddTransaction = async (data: TransactionFormValues) => {
        if (!user) return;
        const docRef = await saveTransaction(data as any, user.uid);
        
        if (data.type === TransactionType.INCOME) {
            const splitsToProcess = data.splits || [];
            if (splitsToProcess.length > 0) {
                for (const split of splitsToProcess) {
                    const netPayout = round(Number(split.netPayout));
                    if (netPayout > 0) {
                        try {
                            await addDoc(collection(db, "transacoes"), {
                                amount: netPayout,
                                date: data.date,
                                type: TransactionType.EXPENSE,
                                category: "Remuneração de Assessores",
                                clientSupplier: split.advisorName,
                                description: `Repasse Líquido: ${split.advisorName} - ${data.description}`,
                                costCenter: data.costCenter || "conta-pj",
                                tipoInterno: "transacao",
                                criadoPor: user.uid,
                                criadoEm: serverTimestamp(),
                                advisorId: split.advisorId,
                                status: ExpenseStatus.PENDING,
                                originTransactionId: docRef.id
                            });
                        } catch (err) {
                            console.error("Erro ao gerar despesa de repasse:", err);
                        }
                    }
                }
            } 
            else if (data.advisorId && data.commissionAmount && data.commissionAmount > 0) {
                const advisorObj = advisors.find(a => a.id === data.advisorId);
                try {
                    await addDoc(collection(db, "transacoes"), {
                        amount: round(data.commissionAmount),
                        date: data.date,
                        type: TransactionType.EXPENSE,
                        category: "Remuneração de Assessores",
                        clientSupplier: advisorObj?.name || "Assessor",
                        description: `Repasse Líquido: ${advisorObj?.name || "Assessor"} - ${data.description}`,
                        costCenter: data.costCenter || "conta-pj",
                        tipoInterno: "transacao",
                        criadoPor: user.uid,
                        criadoEm: serverTimestamp(),
                        advisorId: data.advisorId,
                        status: ExpenseStatus.PENDING,
                        originTransactionId: docRef.id
                    });
                } catch (err) {
                    console.error("Erro ao gerar despesa de repasse simples:", err);
                }
            }
        }
        setTransactions([{ id: docRef.id, ...data } as unknown as Transaction, ...transactions]);
    };

    const handleEditTransaction = async (id: string, data: TransactionFormValues) => {
        if (!user) return;
        await updateTransaction(id, data);
        setTransactions(transactions.map(t => t.id === id ? { ...t, ...data } as unknown as Transaction : t));
    };

    const handleDeleteTransaction = async (id: string) => {
         if (!user || !window.confirm("Excluir?")) return;
         await deleteTransactionFromDb(id);
         setTransactions(transactions.filter(t => t.id !== id));
    };

    const handleSetPaid = async (id: string) => {
        if (!user) return;
        await updateTransaction(id, { status: ExpenseStatus.PAID });
        setTransactions(transactions.map(t => t.id === id ? { ...t, status: ExpenseStatus.PAID } : t));
    };

    const handleToggleReconciliation = async (id: string, current: boolean) => {
        if (!user) return;
        const newValue = !current;
        await updateTransaction(id, { reconciled: newValue });
        setTransactions(transactions.map(t => t.id === id ? { ...t, reconciled: newValue } : t));
    };

    const handleImportTransactions = (data: any[]) => {
        if (!user) return;
        Promise.all(data.map(item => {
             const { tempId, selected, ...rest } = item;
             return saveTransaction(rest, user.uid).then(docRef => ({ id: docRef.id, ...rest } as Transaction));
        })).then(newItems => setTransactions([...newItems, ...transactions]));
    };

    const handleImportRevenues = (data: any[]) => {
         if (!user) return;
         const importPromises = data.map(item => saveImportedRevenue(item, user.uid).then(docRef => ({ id: docRef.id, ...item } as ImportedRevenue)).catch(() => null));
         Promise.all(importPromises).then((results) => {
             const newRevenues = results.filter((r): r is ImportedRevenue => r !== null);
             setImportedRevenues([...newRevenues, ...importedRevenues]);
         });
    };

    const handleDeleteRevenue = async (id: string) => {
        if (!user || !window.confirm("Excluir?")) return;
        await deleteImportedRevenue(id);
        setImportedRevenues(importedRevenues.filter(r => r.id !== id));
    };

    const handleSavePartnership = async (updatedPartners: Partner[]) => {
        setPartners(updatedPartners);
        await savePartnership(updatedPartners);
    };

    if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">Carregando...</div>;
    if (!user) return <Login />;

    return (
        <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
             <Sidebar activeView={activeView} setActiveView={(v) => { setActiveView(v); setIsSidebarOpen(false); }} isSidebarOpen={isSidebarOpen} user={user} />
             <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header pageTitle={activeView === 'dashboard' ? 'Dashboard' : activeView === 'transactions' ? 'Transações' : activeView === 'imported-revenues' ? 'Receitas Importadas' : activeView === 'reports' ? 'Relatórios' : activeView === 'goals' ? 'Metas' : activeView === 'partnership' ? 'Partnership ACI' : 'Configurações'} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 relative">
                    {loadingData ? <div className="flex items-center justify-center h-full">Carregando dados...</div> : (
                        <>
                            {activeView === 'dashboard' && <DashboardView transactions={transactions} goals={goals} onSetPaid={handleSetPaid} onEdit={handleEditTransaction} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} globalTaxRate={globalTaxRate} importedRevenues={importedRevenues} />}
                            {activeView === 'transactions' && <TransactionsView transactions={transactions} onAdd={handleAddTransaction} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} onSetPaid={handleSetPaid} onToggleReconciliation={handleToggleReconciliation} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} onImportTransactions={handleImportTransactions} globalTaxRate={globalTaxRate} importedRevenues={importedRevenues} userId={user.uid} />}
                            {activeView === 'imported-revenues' && <ImportedRevenuesView importedRevenues={importedRevenues} advisors={advisors} onImport={handleImportRevenues} onDelete={handleDeleteRevenue} userId={user.uid} />}
                            {activeView === 'reports' && <ReportsView transactions={transactions} importedRevenues={importedRevenues} />}
                            {activeView === 'goals' && <GoalsView goals={goals} onAdd={v => setGoals([...goals, { ...v, id: crypto.randomUUID(), currentAmount: round(0) }])} onUpdateProgress={(id, amount) => setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: round((Number(g.currentAmount) || 0) + (Number(amount) || 0)) } : g))} onDelete={id => setGoals(goals.filter(g => g.id !== id))} />}
                            {activeView === 'partnership' && <PartnershipView partners={partners} onSave={handleSavePartnership} />}
                            {activeView === 'settings' && <SettingsView incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} costCenters={costCenters} setCostCenters={setCostCenters} advisors={advisors} setAdvisors={setAdvisors} globalTaxRate={globalTaxRate} setGlobalTaxRate={setGlobalTaxRate} />}
                        </>
                    )}
                </main>
             </div>
        </div>
    );
};

export default App;
