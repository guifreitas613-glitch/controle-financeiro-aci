

import React, { useState, useMemo, FC, ReactNode, useEffect } from 'react';
import { Transaction, Goal, TransactionType, View, ExpenseStatus, ExpenseNature, CostCenter, Advisor, ExpenseCategory, ExpenseType } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import Login from './Login';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser } from './auth';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction as deleteTransactionFromDb } from './firestore';


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
const MoreVerticalIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>);
const SearchIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const LogoutIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const ArrowUpIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>);
const ArrowDownIcon: FC<{ className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>);
const HistoryIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>);
const DragHandleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-5 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>);
const AlertCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const CheckCircleIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);


// --- DECLARAÇÕES DE BIBLIOTECAS GLOBAIS ---
declare var XLSX: any;
declare var jspdf: any;

// --- HOOKS ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
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
    // Find all STMTTRN blocks. Regex is greedy but splitting by tag is safer for large files
    const transactionBlocks = content.split('<STMTTRN>');

    transactionBlocks.forEach(block => {
        if (!block.includes('</STMTTRN>')) return;

        // Extract basic fields using regex. 
        // OFX tags can be <TAG>VALUE or <TAG>VALUE</TAG> or <TAG>VALUE (newline)
        const amountMatch = block.match(/<TRNAMT>([\d.-]+)/);
        const dateMatch = block.match(/<DTPOSTED>\s*(\d{8})/); // Just take first 8 digits (YYYYMMDD)
        const memoMatch = block.match(/<MEMO>(.*?)(\n|<)/);
        const nameMatch = block.match(/<NAME>(.*?)(\n|<)/);

        if (dateMatch && amountMatch) {
            const rawDate = dateMatch[1];
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(4, 6);
            const day = rawDate.substring(6, 8);
            // Set time to noon to avoid timezone rollover issues when converting to ISO date only
            const dateIso = `${year}-${month}-${day}T12:00:00.000Z`;

            const amount = parseFloat(amountMatch[1]);
            const description = (memoMatch ? memoMatch[1] : (nameMatch ? nameMatch[1] : 'Importação OFX')).trim();

            const type = amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
            const absAmount = Math.abs(amount);

            transactions.push({
                tempId: crypto.randomUUID(),
                selected: true, // Select by default
                date: dateIso,
                amount: absAmount,
                description: description || 'Transação OFX',
                type: type,
                category: 'Outros', // Default category
                status: ExpenseStatus.PAID, // Bank transactions are already processed
                paymentMethod: 'Transferência Bancária', // Default
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

// --- COMPONENTES DE FORMULÁRIO ATUALIZADOS ---
interface TransactionFormValues {
    description: string;
    amount: number; // Net amount for income, total for expense
    date: string; // YYYY-MM-DD
    type: TransactionType;
    category: string;
    clientSupplier: string;
    paymentMethod: string;
    status?: ExpenseStatus;
    nature?: ExpenseNature;
    costCenter?: string;
    taxAmount?: number;
    // New fields
    grossAmount?: number;
    commissionAmount?: number;
    advisorId?: string;
    recurringCount?: number;
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
}

const TransactionForm: FC<TransactionFormProps> = ({ onSubmit, onClose, initialData, defaultType, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors }) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || defaultType || TransactionType.EXPENSE);
    const [nature, setNature] = useState<ExpenseNature>(initialData?.nature || ExpenseNature.VARIABLE);
    const [advisorId, setAdvisorId] = useState(initialData?.advisorId || '');
    const [taxType, setTaxType] = useState<'percent' | 'fixed'>('percent');
    const [taxValue, setTaxValue] = useState('0');
    const [recurringCount, setRecurringCount] = useState('1');

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
    
    const [commissionAmount, setCommissionAmount] = useState(initialData?.commissionAmount || 0);
    const [netAmount, setNetAmount] = useState(initialData?.amount || 0);
    const [isCommissionManual, setIsCommissionManual] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Set tax fields on edit
            if (initialData.type === TransactionType.INCOME && initialData.taxAmount) {
                // If gross amount exists, try to calculate percentage, otherwise default to fixed
                if(initialData.grossAmount && initialData.grossAmount > 0) {
                     const percent = (initialData.taxAmount / initialData.grossAmount) * 100;
                     // Use a small tolerance for floating point issues
                     if(Math.abs(percent - Math.round(percent)) < 0.01) {
                         setTaxType('percent');
                         setTaxValue(percent.toFixed(2));
                     } else {
                        setTaxType('fixed');
                        setTaxValue(initialData.taxAmount.toString());
                     }
                } else {
                    setTaxType('fixed');
                    setTaxValue(initialData.taxAmount.toString());
                }
            }

            // Set commission fields on edit
            if (initialData.type === TransactionType.INCOME && initialData.advisorId && initialData.commissionAmount) {
                const selectedAdvisor = advisors.find(a => a.id === initialData.advisorId);
                const gross = initialData.grossAmount ?? 0;
                if (selectedAdvisor && gross > 0) {
                    const calculatedCommission = (gross * selectedAdvisor.commissionRate) / 100;
                    // If the stored commission is different from the calculated one, assume it was manual
                    if (Math.abs(calculatedCommission - initialData.commissionAmount) > 0.01) {
                        setIsCommissionManual(true);
                    }
                } else if (initialData.commissionAmount > 0) {
                    // If there's a commission but we can't calculate it (no advisor/gross), it must have been manual
                    setIsCommissionManual(true);
                }
            }
        }
    }, [initialData, advisors]);

    useEffect(() => {
        if (isCommissionManual) return;
        
        const gross = parseFloat(formData.grossAmount);
        const selectedAdvisor = advisors.find(a => a.id === advisorId);

        if (!isNaN(gross) && selectedAdvisor) {
            const commission = (gross * selectedAdvisor.commissionRate) / 100;
            setCommissionAmount(commission);
        } else if (!isNaN(gross)) {
            setCommissionAmount(0);
        } else {
            setCommissionAmount(0);
        }
    }, [formData.grossAmount, advisorId, advisors, isCommissionManual]);
    
    useEffect(() => {
        const gross = parseFloat(formData.grossAmount) || 0;
        setNetAmount(gross - commissionAmount);
    }, [formData.grossAmount, commissionAmount]);


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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

        const submissionData: TransactionFormValues = {
            description,
            amount: type === TransactionType.INCOME ? netAmount : parsedGrossAmount,
            date: new Date(date).toISOString(),
            type,
            category,
            clientSupplier,
            paymentMethod,
            costCenter,
        };
        
        if (type === TransactionType.INCOME) {
            let calculatedTax = 0;
            const parsedTaxValue = parseFloat(taxValue);
            if (!isNaN(parsedGrossAmount) && !isNaN(parsedTaxValue) && parsedTaxValue > 0) {
                calculatedTax = taxType === 'percent' ? (parsedGrossAmount * parsedTaxValue) / 100 : parsedTaxValue;
            }
            submissionData.taxAmount = calculatedTax;
            submissionData.grossAmount = parsedGrossAmount;
            submissionData.commissionAmount = commissionAmount;
            submissionData.advisorId = advisorId;
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
                    <label className="block text-sm font-medium text-text-secondary">{type === TransactionType.INCOME ? 'Valor Bruto (Repasse)' : 'Valor'}</label>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Assessor (Opcional)</label>
                         <select value={advisorId} onChange={(e) => { setAdvisorId(e.target.value); setIsCommissionManual(false); }} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                            <option value="">Sem Assessor</option>
                            {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-1 bg-background p-3 rounded-lg border border-border-color">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Provisão de Impostos</label>
                        <div className="flex items-center gap-2">
                            <select value={taxType} onChange={e => setTaxType(e.target.value as 'percent' | 'fixed')} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                                <option value="percent">%</option>
                                <option value="fixed">R$</option>
                            </select>
                            <input type="number" step="0.01" value={taxValue} onChange={e => setTaxValue(e.target.value)} className="block w-full bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                </div>
                {advisorId && (
                    <div className="bg-background p-3 rounded-lg border border-border-color">
                        <div className="grid grid-cols-3 gap-4 text-center mb-2">
                            <div>
                                <p className="text-xs text-text-secondary">Valor Bruto</p>
                                <p className="font-semibold">{formatCurrency(parseFloat(formData.grossAmount) || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">(-) Comissão</p>
                                <p className="font-semibold text-danger">{formatCurrency(commissionAmount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">(=) Valor Líquido</p>
                                <p className="font-bold text-green-400">{formatCurrency(netAmount)}</p>
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-2 pt-2 border-t border-border-color">
                            {isCommissionManual ? (
                                <>
                                    <label className="text-sm text-text-secondary">Editar Comissão (R$):</label>
                                    <input
                                        type="number" step="0.01"
                                        value={commissionAmount.toFixed(2)}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                setCommissionAmount(val);
                                            }
                                        }}
                                        className="w-28 bg-surface p-1 rounded-md border border-border-color text-danger font-semibold"
                                    />
                                    <Button type="button" variant="secondary" className="py-1 px-2 text-xs" onClick={() => setIsCommissionManual(false)}>Calcular Auto</Button>
                                </>
                            ) : (
                                <Button type="button" variant="secondary" className="py-1 px-2 text-xs" onClick={() => setIsCommissionManual(true)}>Editar Comissão</Button>
                            )}
                        </div>
                    </div>
                )}
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

// --- ESTRUTURA E LAYOUT ---
const Sidebar: FC<{ activeView: View; setActiveView: (view: View) => void; isSidebarOpen: boolean; user: User | null; }> = ({ activeView, setActiveView, isSidebarOpen, user }) => {
    
    const getUserDisplayName = (user: User | null) => {
        if (!user) return "";
        if (user.displayName) return user.displayName;
        if (user.email) {
            const namePart = user.email.split('@')[0];
            // Capitalize first letter of each part separated by dot or underscore or hyphen
            return namePart.replace(/[._-]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return "Usuário";
    }

    const allNavItems: { view: View; label: string; icon: ReactNode; }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6"/> },
        { view: 'transactions', label: 'Transações', icon: <TransactionsIcon className="w-6 h-6"/> },
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

// --- VISUALIZAÇÕES (VIEWS) ---
const CustomPieTooltip: FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border-color p-3 rounded-lg shadow-lg text-text-primary">
          <p className="font-semibold">{`${data.name}: ${formatCurrency(data.amount)} (${payload[0].value.toFixed(1)}%)`}</p>
        </div>
      );
    }
    return null;
};

const DashboardView: FC<{ transactions: Transaction[]; goals: Goal[]; onSetPaid: (id: string) => void }> = ({ transactions, goals, onSetPaid }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
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
        const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);

        let largestExpense: Transaction | null = null;
        if (filteredTransactions.length > 0) {
            const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
            if (expenses.length > 0) {
                largestExpense = expenses.reduce((max, t) => t.amount > max.amount ? t : max);
            }
        }

        const monthProfits = filteredTransactions.reduce((acc, t) => {
            const month = getMonthYear(t.date);
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            acc[month] = (acc[month] || 0) + amount;
            return acc;
        }, {} as Record<string, number>);

        const mostProfitableMonth = Object.keys(monthProfits).length > 0
            ? Object.entries(monthProfits).reduce((max, entry) => entry[1] > max[1] ? entry : max, ["N/A", -Infinity])[0]
            : "N/A";
            
        const totalProvisioned = filteredTransactions
            .filter(t => t.type === TransactionType.INCOME && t.taxAmount)
            .reduce((sum, t) => sum + t.taxAmount!, 0);

        const totalTaxPaid = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE && t.costCenter === 'provisao-impostos')
            .reduce((sum, t) => sum + t.amount, 0);


        return { totalIncome: income, totalExpense: expense, netProfit: income - expense, mostProfitableMonth, largestExpense, taxProvisionBalanceForPeriod: totalProvisioned - totalTaxPaid };
    }, [filteredTransactions]);
    
    const achievedGoals = useMemo(() => {
         return goals.filter(g => g.currentAmount >= g.targetAmount).length;
    }, [goals]);

    // New Logic for Upcoming Bills (Pending expenses <= 5 days from now)
    const upcomingBills = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(today.getDate() + 5);

        return transactions
            .filter(t =>
                t.type === TransactionType.EXPENSE &&
                t.status === ExpenseStatus.PENDING &&
                new Date(t.date) <= fiveDaysFromNow
            )
            .sort((a: Transaction, b: Transaction) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const expenseSubcategoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        if (totalExpense === 0) return [];

        const data = expenses.reduce((acc, t) => {
            if (t.nature === ExpenseNature.FIXED) {
                acc[0].amount += t.amount;
            } else {
                acc[1].amount += t.amount;
            }
            return acc;
        }, [
            { name: 'Fixo', amount: 0 },
            { name: 'Variável', amount: 0 },
        ]);
        
        return data
            .map(d => ({
                ...d,
                value: (d.amount / totalExpense) * 100,
            }))
            .filter(d => d.amount > 0);
    }, [filteredTransactions]);

    const cashFlowData = useMemo(() => { 
        const sorted = [...transactions].sort((a: Transaction, b: Transaction) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let balance = 0;
        const data = sorted.map(t => {
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            balance += amount;
            return {
                date: formatDate(t.date),
                balance,
                // Just for sorting/key purposes
                rawDate: t.date
            };
        });

        // Group by date to show final balance for the day
        const groupedData = data.reduce((acc, item) => {
            acc[item.date] = item.balance;
            return acc;
        }, {} as Record<string, number>);

        // Convert back to array
        return Object.entries(groupedData).map(([date, balance]) => ({ date, balance }));
    }, [transactions]);
    
    const COLORS = ['#D1822A', '#6366F1', '#10B981', '#EF4444', '#F59E0B'];
    
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

            {/* Cards de Métricas */}
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

            {/* Próximos Pagamentos - High Priority Section - Compact Version */}
            {upcomingBills.length > 0 && (
                <div className="bg-surface border border-danger/30 rounded-xl shadow-lg p-3 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-danger/10 p-2 rounded-full">
                            <AlertCircleIcon className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-text-primary">Contas a Pagar (Próximos 5 Dias)</h3>
                            <p className="text-xs sm:text-sm text-text-secondary">Atenção aos vencimentos próximos.</p>
                        </div>
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
                                    const billDate = new Date(bill.date);
                                    const today = new Date();
                                    today.setHours(0,0,0,0);
                                    const isOverdue = billDate < today;
                                    const isToday = billDate.getTime() === today.getTime();
                                    
                                    return (
                                        <tr key={bill.id} className="border-b border-border-color/50 last:border-0 hover:bg-background/50 transition-colors">
                                            <td className="py-2 px-1 whitespace-nowrap">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold ${isOverdue ? 'bg-danger text-white' : (isToday ? 'bg-yellow-500 text-black' : 'bg-background text-text-secondary')}`}>
                                                    {isOverdue ? 'Atrasado' : (isToday ? 'Hoje' : formatDate(bill.date))}
                                                </span>
                                            </td>
                                            <td className="py-2 px-1 font-medium truncate max-w-[100px] sm:max-w-none" title={bill.description}>{bill.description}</td>
                                            <td className="py-2 px-1 text-text-secondary hidden sm:table-cell truncate max-w-[150px]" title={bill.clientSupplier || ''}>{bill.clientSupplier || '-'}</td>
                                            <td className="py-2 px-1 font-bold text-danger whitespace-nowrap">{formatCurrency(bill.amount)}</td>
                                            <td className="py-2 px-1 text-right">
                                                <Button 
                                                    onClick={() => onSetPaid(bill.id)} 
                                                    variant="success" 
                                                    className="py-1 px-2 text-[10px] sm:text-xs ml-auto gap-1"
                                                    title="Marcar como Pago"
                                                >
                                                    <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Pagar</span>
                                                </Button>
                                            </td>
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
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-primary rounded-sm"></span>
                        Fluxo de Caixa
                    </h3>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D1822A" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#D1822A" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D376A" opacity={0.5} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#A0AEC0" 
                                    tick={{ fontSize: 11 }} 
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    stroke="#A0AEC0" 
                                    tickFormatter={(value: number) => `R$${value/1000}k`} 
                                    tick={{ fontSize: 11 }}
                                    width={60}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1A214A', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)', color: '#F0F2F5' }} 
                                    itemStyle={{ color: '#D1822A' }}
                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Saldo']} 
                                    cursor={{ stroke: '#D1822A', strokeWidth: 1, strokeDasharray: '5 5' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="balance" 
                                    stroke="#D1822A" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorBalance)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-secondary rounded-sm"></span>
                        Natureza das Despesas
                    </h3>
                    <div className="flex-grow relative">
                        {expenseSubcategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={expenseSubcategoryData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60}
                                        outerRadius={100} 
                                        fill="#8884d8" 
                                        paddingAngle={5}
                                        stroke="none"
                                    >
                                        {expenseSubcategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-text-secondary ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-text-secondary">
                                 <p>Sem dados de despesas para exibir.</p>
                             </div>
                        )}
                        {/* Donut Center Text */}
                        {expenseSubcategoryData.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <p className="text-xs text-text-secondary">Total</p>
                                    <p className="text-lg font-bold text-text-primary">100%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            
             <Card>
                <h3 className="text-lg font-bold text-text-primary mb-4">Informações Rápidas</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50">
                        <span className="text-text-secondary">Mês mais lucrativo:</span>
                        <span className="font-bold text-primary">{mostProfitableMonth}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50">
                        <span className="text-text-secondary">Maior despesa única:</span>
                        {largestExpense ? (
                            <span className="font-bold text-danger text-right">{largestExpense.description}<br/><span className="text-sm">{formatCurrency(largestExpense.amount)}</span></span>
                        ) : (
                            <span className="font-bold text-text-secondary">N/A</span>
                        )}
                    </div>
                     <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border-color/50">
                        <span className="text-text-secondary">Saldo Provisão de Impostos:</span>
                        <span className={`font-bold ${taxProvisionBalanceForPeriod >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(taxProvisionBalanceForPeriod)}</span>
                    </div>
                 </div>
            </Card>
        </div>
    );
};

interface TransactionsViewProps {
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
    onImportTransactions: (data: any[]) => Promise<void>;
}
const TransactionsView: FC<TransactionsViewProps> = ({ transactions, onAdd, onEdit, onDelete, onSetPaid, incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, onImportTransactions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [filterStatus, setFilterStatus] = useState<'all' | ExpenseStatus>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<'all' | number>('all');
    const [filterMonth, setFilterMonth] = useState<'all' | number>('all');
    
    // OFX Import State
    const [isOfxModalOpen, setIsOfxModalOpen] = useState(false);
    const [pendingOfxTransactions, setPendingOfxTransactions] = useState<ImportableTransaction[]>([]);

    const openModal = (transaction: Transaction | null = null) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };
    
    const handleSubmit = (data: TransactionFormValues) => {
        if (editingTransaction) {
            onEdit(editingTransaction.id, data);
        } else {
            onAdd(data);
        }
        closeModal();
    };

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
        return years.sort((a, b) => b - a);
    }, [transactions]);

    const months = useMemo(() => ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], []);

    const filteredTransactions = useMemo(() => {
        let items = transactions.filter(t => t.type === activeTab);
        
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            items = items.filter(t => 
                (t.description || '').toLowerCase().includes(lowercasedFilter) ||
                (t.clientSupplier || '').toLowerCase().includes(lowercasedFilter) ||
                (t.category || '').toLowerCase().includes(lowercasedFilter)
            );
        }
        
        if (activeTab === TransactionType.EXPENSE && filterStatus !== 'all') {
            items = items.filter(t => t.status === filterStatus);
        }

        if (filterCategory !== 'all') {
            items = items.filter(t => t.category === filterCategory);
        }

        if (filterYear !== 'all') {
            items = items.filter(t => new Date(t.date).getFullYear() === filterYear);
        }

        if (filterMonth !== 'all') {
            items = items.filter(t => new Date(t.date).getMonth() === filterMonth);
        }
        
        return items;
    }, [transactions, activeTab, searchTerm, filterStatus, filterCategory, filterYear, filterMonth]);
    
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key as keyof Transaction] as (string | number);
                const valB = b[sortConfig.key as keyof Transaction] as (string | number);
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactions, sortConfig]);
    
    const totalFilteredAmount = useMemo(() => {
        return sortedTransactions.reduce((sum, t) => sum + t.amount, 0);
    }, [sortedTransactions]);

    const requestSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Transaction) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />;
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(sortedTransactions.map(t => ({
            Data: formatDate(t.date),
            Descrição: t.description,
            Valor: t.amount,
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
            head: [['Data', 'Descrição', 'Valor', 'Categoria', 'Status']],
            body: sortedTransactions.map(t => [
                formatDate(t.date),
                t.description,
                formatCurrency(t.amount),
                t.category,
                t.status || 'N/A'
            ]),
        });
        
        doc.save('transacoes.pdf');
    };

    const handleOFXImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text");
                
                const data = parseOFX(text);

                if (data.length === 0) {
                     alert("Nenhuma transação válida encontrada no arquivo OFX.");
                     return;
                }

                setPendingOfxTransactions(data);
                setIsOfxModalOpen(true);
            } catch (error) {
                console.error("Error importing OFX:", error);
                alert("Ocorreu um erro ao importar o arquivo OFX. Verifique se o formato é válido.");
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const handleToggleOfxSelection = (tempId: string) => {
        setPendingOfxTransactions(prev => prev.map(t => t.tempId === tempId ? { ...t, selected: !t.selected } : t));
    };

    const handleToggleAllOfx = () => {
        const allSelected = pendingOfxTransactions.every(t => t.selected);
        setPendingOfxTransactions(prev => prev.map(t => ({ ...t, selected: !allSelected })));
    };

    const handleUpdateOfxTransaction = (tempId: string, field: keyof ImportableTransaction, value: any) => {
        setPendingOfxTransactions(prev => prev.map(t => {
             if (t.tempId !== tempId) return t;
             return { ...t, [field]: value };
        }));
    };

    const handleConfirmImport = async () => {
        const selected = pendingOfxTransactions.filter(t => t.selected);
        if (selected.length === 0) {
            alert("Selecione pelo menos uma transação para importar.");
            return;
        }

        // Remove temp properties
        const cleanData = selected.map(({ tempId, selected, ...rest }) => rest);
        
        await onImportTransactions(cleanData);
        setIsOfxModalOpen(false);
        setPendingOfxTransactions([]);
        alert(`${selected.length} transações importadas com sucesso!`);
    };
    
    const currentCategories = activeTab === TransactionType.INCOME ? incomeCategories : expenseCategories.map(c => c.name);
    const allCategories = useMemo(() => ({
        income: incomeCategories,
        expense: expenseCategories.map(c => c.name)
    }), [incomeCategories, expenseCategories]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">Gerenciar Transações</h2>
                 <Button onClick={() => openModal()}><PlusIcon className="w-5 h-5"/> Adicionar Transação</Button>
            </div>
            
            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <div className="flex-1">
                         <div className="flex border-b border-border-color">
                             <button onClick={() => setActiveTab(TransactionType.EXPENSE)} className={`px-4 py-2 font-semibold ${activeTab === TransactionType.EXPENSE ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}>Despesas</button>
                             <button onClick={() => setActiveTab(TransactionType.INCOME)} className={`px-4 py-2 font-semibold ${activeTab === TransactionType.INCOME ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}>Receitas</button>
                         </div>
                     </div>
                      <div className="flex gap-2 items-center">
                        <Button onClick={exportToExcel} variant="secondary" className="whitespace-nowrap"><ExportIcon className="w-4 h-4"/> XLSX</Button>
                        <Button onClick={exportToPdf} variant="secondary" className="whitespace-nowrap"><ExportIcon className="w-4 h-4"/> PDF</Button>
                        
                        <input
                            type="file"
                            id="import-ofx"
                            className="hidden"
                            accept=".ofx,.ofx.sgml"
                            onChange={handleOFXImport}
                        />
                        <Button as="label" htmlFor="import-ofx" variant="secondary" className="whitespace-nowrap" title="Importar Extrato Bancário (OFX)">
                            <UploadIcon className="w-4 h-4" /> OFX
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                 <div className="flex flex-col lg:flex-row gap-4 mb-4 p-4 bg-background rounded-lg items-center">
                    <div className="relative w-full lg:flex-1">
                        <input 
                            type="text" 
                            placeholder="Buscar por descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border-border-color rounded-md shadow-sm pl-10 pr-4 py-2 focus:ring-primary focus:border-primary"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 w-full sm:w-auto max-w-[200px]">
                            <option value="all">Todas as Categorias</option>
                            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 w-full sm:w-auto">
                            <option value="all">Todos os Anos</option>
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 w-full sm:w-auto">
                            <option value="all">Todos os Meses</option>
                            {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                        </select>
                        {activeTab === TransactionType.EXPENSE && (
                             <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | ExpenseStatus)} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 w-full sm:w-auto">
                                 <option value="all">Todos os Status</option>
                                 <option value={ExpenseStatus.PAID}>Paga</option>
                                 <option value={ExpenseStatus.PENDING}>Pendente</option>
                             </select>
                        )}
                    </div>
                 </div>

                 {/* KPI de Total do Filtro */}
                 <div className="mb-4 py-4 px-4 bg-background rounded-lg flex flex-col items-center justify-center shadow-sm border border-border-color/20">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                        Total de {activeTab === TransactionType.INCOME ? 'Receitas' : 'Despesas'} no Período
                    </h3>
                    <p className={`text-3xl font-bold ${activeTab === TransactionType.INCOME ? 'text-green-400' : 'text-danger'} tracking-tight`}>
                        {formatCurrency(totalFilteredAmount)}
                    </p>
                </div>

                <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="border-b border-border-color">
                            <tr>
                                <th className="p-4 cursor-pointer" onClick={() => requestSort('date')}><div className="flex items-center">Data {getSortIndicator('date')}</div></th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 cursor-pointer" onClick={() => requestSort('amount')}><div className="flex items-center">Valor {getSortIndicator('amount')}</div></th>
                                <th className="p-4">Categoria</th>
                                {activeTab === TransactionType.EXPENSE && <th className="p-4">Status</th>}
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                         <tbody>
                            {sortedTransactions.map(t => (
                                <tr key={t.id} className="border-b border-border-color hover:bg-background">
                                    <td className="p-4">{formatDate(t.date)}</td>
                                    <td className="p-4">
                                        <p className="font-semibold">{t.description}</p>
                                        <p className="text-sm text-text-secondary">{t.clientSupplier}</p>
                                    </td>
                                    <td className={`p-4 font-bold ${activeTab === 'income' ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(t.amount)}</td>
                                    <td className="p-4">{t.category}</td>
                                    {activeTab === 'expense' && (
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.status === ExpenseStatus.PAID ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PENDING && (
                                                <Button onClick={() => onSetPaid(t.id)} variant="ghost" className="p-3 h-14 w-14 flex items-center justify-center text-green-400 hover:bg-green-500/10" title="Marcar como Pago">
                                                    <PaidIcon className="w-8 h-8"/>
                                                </Button>
                                            )}
                                            <Button onClick={() => openModal(t)} variant="ghost" className="p-3 h-14 w-14 flex items-center justify-center" title="Editar">
                                                <EditIcon className="w-8 h-8"/>
                                            </Button>
                                            <Button onClick={() => onDelete(t.id)} variant="ghostDanger" className="p-3 h-14 w-14 flex items-center justify-center" title="Excluir">
                                                <TrashIcon className="w-8 h-8"/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedTransactions.length === 0 && <p className="text-center p-8 text-text-secondary">Nenhuma transação encontrada.</p>}
                </div>
            </Card>

            {/* Modais */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTransaction ? 'Editar Transação' : 'Adicionar Transação'}>
                <TransactionForm
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    initialData={editingTransaction}
                    defaultType={editingTransaction ? null : activeTab}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    paymentMethods={paymentMethods}
                    costCenters={costCenters}
                    advisors={advisors}
                />
            </Modal>
            
            {/* OFX Preview Modal */}
            <Modal isOpen={isOfxModalOpen} onClose={() => setIsOfxModalOpen(false)} title="Importar Extrato (Pré-visualização)" size="xl">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-text-secondary text-sm">Selecione e ajuste as transações antes de confirmar.</p>
                        <div className="flex gap-2">
                             <Button onClick={handleToggleAllOfx} variant="secondary" className="text-xs py-1">
                                {pendingOfxTransactions.every(t => t.selected) ? "Desmarcar Todos" : "Marcar Todos"}
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[60vh] border border-border-color rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-background sticky top-0 z-10">
                                <tr className="border-b border-border-color text-text-secondary">
                                    <th className="p-3 w-10 text-center">#</th>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3">Valor</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Categoria</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingOfxTransactions.map((t) => (
                                    <tr key={t.tempId} className={`border-b border-border-color/50 hover:bg-background/50 ${!t.selected ? 'opacity-50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={t.selected} 
                                                onChange={() => handleToggleOfxSelection(t.tempId)}
                                                className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary bg-surface"
                                            />
                                        </td>
                                        <td className="p-3 whitespace-nowrap">{formatDate(t.date!)}</td>
                                        <td className="p-3">
                                            <input 
                                                type="text" 
                                                value={t.description} 
                                                onChange={(e) => handleUpdateOfxTransaction(t.tempId, 'description', e.target.value)}
                                                className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full"
                                            />
                                        </td>
                                        <td className={`p-3 font-bold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>
                                            {formatCurrency(t.amount!)}
                                        </td>
                                        <td className="p-3">
                                             <select 
                                                value={t.type} 
                                                onChange={(e) => {
                                                    const newType = e.target.value as TransactionType;
                                                    // Reset category to default of new type if changed
                                                    const defaultCat = newType === TransactionType.INCOME ? allCategories.income[0] : allCategories.expense[0];
                                                    handleUpdateOfxTransaction(t.tempId, 'type', newType);
                                                    handleUpdateOfxTransaction(t.tempId, 'category', defaultCat);
                                                }} 
                                                className="bg-surface border-border-color rounded px-2 py-1 text-xs"
                                            >
                                                <option value={TransactionType.INCOME}>Receita</option>
                                                <option value={TransactionType.EXPENSE}>Despesa</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                             <select 
                                                value={t.category} 
                                                onChange={(e) => handleUpdateOfxTransaction(t.tempId, 'category', e.target.value)}
                                                className="bg-surface border-border-color rounded px-2 py-1 text-xs w-full max-w-[150px]"
                                            >
                                                {(t.type === TransactionType.INCOME ? allCategories.income : allCategories.expense).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex justify-end gap-4 pt-2 border-t border-border-color">
                        <div className="mr-auto text-sm text-text-secondary flex items-center">
                             {pendingOfxTransactions.filter(t => t.selected).length} selecionados
                        </div>
                        <Button onClick={() => setIsOfxModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handleConfirmImport}>Confirmar Importação</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const GoalsView: FC<{ goals: Goal[]; onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void; onEditGoal: (id: string, goal: Omit<Goal, 'id' | 'currentAmount'>) => void; onDeleteGoal: (id: string) => void; onAddProgress: (id: string, amount: number) => void }> = ({ goals, onAddGoal, onEditGoal, onDeleteGoal, onAddProgress }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    
    const openModal = (goal: Goal | null = null) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGoal(null);
    };

    const openProgressModal = (id: string) => {
        setSelectedGoalId(id);
        setIsProgressModalOpen(true);
    };

    const closeProgressModal = () => {
        setSelectedGoalId(null);
        setIsProgressModalOpen(false);
    };

    const handleGoalSubmit = (data: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (editingGoal) {
            onEditGoal(editingGoal.id, data);
        } else {
            onAddGoal(data);
        }
        closeModal();
    };

    const handleProgressSubmit = (amount: number) => {
        if (selectedGoalId) {
            onAddProgress(selectedGoalId, amount);
        }
        closeProgressModal();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Metas Financeiras</h2>
                <Button onClick={() => openModal()}><PlusIcon className="w-5 h-5"/> Nova Meta</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                        <Card key={goal.id} className="flex flex-col">
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold mb-2">{goal.name}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(goal)} className="text-text-secondary hover:text-primary"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => onDeleteGoal(goal.id)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary mb-4">{goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : 'Sem prazo definido'}</p>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-lg font-bold text-primary">{formatCurrency(goal.currentAmount)}</span>
                                    <span className="text-sm text-text-secondary">de {formatCurrency(goal.targetAmount)}</span>
                                </div>
                                <ProgressBar progress={progress}/>
                                <p className="text-right text-sm mt-1 font-semibold">{progress.toFixed(1)}%</p>
                            </div>
                            <Button onClick={() => openProgressModal(goal.id)} className="w-full mt-4">Adicionar Progresso</Button>
                        </Card>
                    )
                })}
            </div>
             {goals.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-text-secondary">Você ainda não tem nenhuma meta. Que tal criar uma?</p>
                </div>
             )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingGoal ? 'Editar Meta' : 'Nova Meta'}>
                <GoalForm onSubmit={handleGoalSubmit} onClose={closeModal} initialData={editingGoal} />
            </Modal>
            <Modal isOpen={isProgressModalOpen} onClose={closeProgressModal} title="Adicionar Progresso" size="sm">
                <AddProgressForm onSubmit={handleProgressSubmit} onClose={closeProgressModal} />
            </Modal>
        </div>
    );
};

const ReportsView: FC<{ transactions: Transaction[], expenseCategories: ExpenseCategory[] }> = ({ transactions, expenseCategories }) => {
    const [reportType, setReportType] = useState<'monthly' | 'category' | 'dre'>('dre');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a,b) => b-a);
        if(!years.includes(new Date().getFullYear())) {
            years.unshift(new Date().getFullYear());
        }
        return years;
    }, [transactions]);
    
    const filteredByYear = useMemo(() => {
        return transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
    }, [transactions, selectedYear]);
    
    const monthlyData = useMemo(() => {
        const data = Array(12).fill(0).map((_, i) => {
            const monthName = new Date(0, i).toLocaleString('pt-BR', { month: 'short' });
            return { month: monthName, income: 0, expense: 0, profit: 0 };
        });
        
        filteredByYear.forEach(t => {
            const month = new Date(t.date).getMonth();
            if (t.type === 'income') {
                data[month].income += t.amount;
            } else {
                data[month].expense += t.amount;
            }
            data[month].profit = data[month].income - data[month].expense;
        });
        
        return data;
    }, [filteredByYear]);
    
    const categoryData = useMemo(() => {
        const expenseByCat = filteredByYear
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);
        
        return Object.entries(expenseByCat)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .map(([name, amount]) => ({ name, amount }));
    }, [filteredByYear]);

    // DRE Logic
    const dreData = useMemo(() => {
        const grossRevenue = filteredByYear
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + (t.grossAmount ?? t.amount), 0);

        const commissions = filteredByYear
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + (t.commissionAmount ?? 0), 0);
        
        const netRevenue = grossRevenue - commissions;

        const cogs = filteredByYear
            .filter(t => {
                if (t.type !== TransactionType.EXPENSE) return false;
                const categoryInfo = expenseCategories.find(cat => cat.name === t.category);
                return categoryInfo?.type === ExpenseType.COST;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const grossProfit = netRevenue - cogs;

        const operatingExpenses = filteredByYear
            .filter(t => {
                if (t.type !== TransactionType.EXPENSE) return false;
                const categoryInfo = expenseCategories.find(cat => cat.name === t.category);
                return categoryInfo?.type === ExpenseType.EXPENSE;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        const netProfit = grossProfit - operatingExpenses;

        return {
            grossRevenue,
            commissions,
            netRevenue,
            cogs,
            grossProfit,
            operatingExpenses,
            netProfit,
        };
    }, [filteredByYear, expenseCategories]);
    
    const COLORS = ['#D1822A', '#6366F1', '#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

    const renderReport = () => {
        switch(reportType) {
            case 'monthly':
                return (
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Desempenho Mensal ({selectedYear})</h3>
                        <ResponsiveContainer width="100%" height={400}>
                             <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D376A" />
                                <XAxis dataKey="month" stroke="#A0AEC0" />
                                <YAxis stroke="#A0AEC0" tickFormatter={(value) => `${formatCurrency(value)}`} tick={{ fontSize: 10 }} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: '#1A214A', border: '1px solid #2D376A', color: '#F0F2F5' }} formatter={(value: any, name: string) => [formatCurrency(Number(value)), name === 'income' ? 'Receita Líq.' : 'Despesa Total']} cursor={{fill: 'rgba(209, 130, 42, 0.1)'}}/>
                                <Legend />
                                <Bar dataKey="income" fill="#10B981" name="Receita Líq." />
                                <Bar dataKey="expense" fill="#EF4444" name="Despesa Total"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                );
            case 'category':
                 return (
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Despesas por Categoria ({selectedYear})</h3>
                         <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie data={categoryData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={150} labelLine={false}>
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                );
             case 'dre':
                return (
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Demonstrativo de Resultados (DRE) - {selectedYear}</h3>
                        <div className="space-y-2 text-text-primary">
                            {Object.entries({
                                "(=) Receita Bruta de Vendas": dreData.grossRevenue,
                                "(-) Comissões e Devoluções": -dreData.commissions,
                                "(=) Receita Operacional Líquida": dreData.netRevenue,
                                "(-) Custo dos Serviços Prestados (CSP)": -dreData.cogs,
                                "(=) Lucro Bruto": dreData.grossProfit,
                                "(-) Despesas Operacionais": -dreData.operatingExpenses,
                                "(=) Lucro Líquido do Exercício": dreData.netProfit,
                            }).map(([label, value]) => {
                                const isBold = label.startsWith("(=)");
                                const isNegative = !label.startsWith("(=)") && value !== 0;
                                const isResult = label.startsWith("(=)");
                                const colorClass = value >= 0 ? 'text-green-400' : 'text-danger';

                                return(
                                    <div key={label} className={`flex justify-between p-3 rounded-md ${isResult ? 'bg-background mt-2' : ''}`}>
                                        <span className={`${isBold ? 'font-bold' : ''}`}>{label}</span>
                                        <span className={`font-mono ${isBold ? 'font-bold' : ''} ${isResult ? colorClass : (isNegative ? 'text-danger' : '')}`}>
                                            {formatCurrency(isNegative ? -value : value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                );
        }
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">Relatórios</h2>
                <div className="flex items-center gap-2">
                     <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        <option value="dre">DRE</option>
                        <option value="monthly">Mensal</option>
                        <option value="category">Por Categoria</option>
                    </select>
                     <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-surface border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>
            {renderReport()}
        </div>
    );
};

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
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  transactions: Transaction[];
  onImportTransactions: (data: any[]) => Promise<void>;
}

const SettingsView: FC<SettingsViewProps> = ({
    incomeCategories, setIncomeCategories,
    expenseCategories, setExpenseCategories,
    paymentMethods, setPaymentMethods,
    costCenters, setCostCenters,
    advisors, setAdvisors,
    goals, setGoals,
    transactions,
    onImportTransactions
}) => {

    const draggedItem = React.useRef<{ list: string; index: number } | null>(null);
    const dragOverItem = React.useRef<{ list: string; index: number } | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDragStart = (e: React.DragEvent, list: string, index: number) => {
        draggedItem.current = { list, index };
        setDragActive(true);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, list: string, index: number) => {
        if (draggedItem.current && draggedItem.current.list === list) {
            dragOverItem.current = { list, index };
        }
    };
    
    const handleDragEnd = () => {
        draggedItem.current = null;
        dragOverItem.current = null;
        setDragActive(false);
    };

    const handleDrop = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        if (!draggedItem.current || !dragOverItem.current || draggedItem.current.index === dragOverItem.current.index) return;
        
        setter(prev => {
            const newItems = [...prev];
            const [reorderedItem] = newItems.splice(draggedItem.current!.index, 1);
            newItems.splice(dragOverItem.current!.index, 0, reorderedItem);
            return newItems;
        });
    };
    
    const handleSave = () => {
        // This is now handled by useLocalStorage automatically.
        alert('Configurações salvas!');
    };

    const addListItem = (setter: React.Dispatch<React.SetStateAction<any[]>>, defaultValue: any) => {
        setter(prev => [...prev, defaultValue]);
    };

    const updateListItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, value: T) => {
        setter(prev => prev.map((item, i) => i === index ? value : item));
    };

    const deleteListItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleExport = () => {
        const dataToExport = {
            incomeCategories,
            expenseCategories,
            paymentMethods,
            costCenters,
            advisors,
            goals,
            transactions,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `acicapital_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text");
                
                const data = JSON.parse(text);

                if (!data || typeof data !== 'object') throw new Error("Invalid JSON structure");

                if (window.confirm("Isso irá sobrescrever suas configurações e metas e ADICIONAR as transações do backup. Deseja continuar?")) {
                    if (Array.isArray(data.incomeCategories)) setIncomeCategories(data.incomeCategories);
                    if (Array.isArray(data.expenseCategories)) setExpenseCategories(data.expenseCategories);
                    if (Array.isArray(data.paymentMethods)) setPaymentMethods(data.paymentMethods);
                    if (Array.isArray(data.costCenters)) setCostCenters(data.costCenters);
                    if (Array.isArray(data.advisors)) setAdvisors(data.advisors);
                    if (Array.isArray(data.goals)) setGoals(data.goals);
                    
                    if (Array.isArray(data.transactions)) {
                         await onImportTransactions(data.transactions);
                    }
                    
                    alert("Dados importados com sucesso!");
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert("Ocorreu um erro ao importar o arquivo. Verifique o console.");
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Configurações</h2>
                <Button onClick={handleSave}><PlusIcon className="w-5 h-5"/> Salvar Configurações</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold mb-1">Categorias de Receita</h3>
                    <p className="text-xs text-text-secondary mb-4">Arraste os itens para reordenar.</p>
                    <ul className="space-y-2">
                        {incomeCategories.map((cat, i) => (
                            <li key={i} 
                                className={`flex items-center gap-2 p-2 rounded-xl bg-background/40 transition-all duration-200 ${dragActive && draggedItem.current?.list === 'income' && draggedItem.current?.index === i ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'income', i)}
                                onDragEnter={(e) => handleDragEnter(e, 'income', i)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(setIncomeCategories)}
                            >
                                <span className="cursor-grab p-2 text-text-secondary/50 hover:text-text-secondary"><DragHandleIcon className="w-6 h-6"/></span>
                                <input 
                                    type="text" 
                                    value={cat} 
                                    onChange={(e) => updateListItem(setIncomeCategories, i, e.target.value)} 
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium text-text-primary placeholder-text-secondary/50"
                                    placeholder="Nome da categoria"
                                />
                                <Button variant="ghostDanger" onClick={() => deleteListItem(setIncomeCategories, i)} className="p-3 h-12 w-12 rounded-lg"><TrashIcon className="w-7 h-7"/></Button>
                            </li>
                        ))}
                    </ul>
                     <Button onClick={() => addListItem(setIncomeCategories, 'Nova Categoria')} className="mt-4 text-sm" variant="secondary">Adicionar Categoria</Button>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold mb-1">Categorias de Despesa</h3>
                    <p className="text-xs text-text-secondary mb-4">Arraste os itens para reordenar.</p>
                     <ul className="space-y-2">
                        {expenseCategories.map((cat, i) => (
                            <li key={i} 
                                className={`flex items-center gap-2 p-2 rounded-xl bg-background/40 transition-all duration-200 ${dragActive && draggedItem.current?.list === 'expense' && draggedItem.current?.index === i ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'expense', i)}
                                onDragEnter={(e) => handleDragEnter(e, 'expense', i)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(setExpenseCategories)}
                            >
                                <span className="cursor-grab p-2 text-text-secondary/50 hover:text-text-secondary"><DragHandleIcon className="w-6 h-6"/></span>
                                <input 
                                    type="text" 
                                    value={cat.name} 
                                    onChange={(e) => updateListItem(setExpenseCategories, i, { ...cat, name: e.target.value })} 
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium text-text-primary placeholder-text-secondary/50"
                                    placeholder="Nome da categoria"
                                />
                                <select 
                                    value={cat.type} 
                                    onChange={(e) => updateListItem(setExpenseCategories, i, { ...cat, type: e.target.value as ExpenseType })} 
                                    className="bg-transparent border-none focus:ring-0 text-sm text-text-secondary font-medium cursor-pointer"
                                >
                                    <option value={ExpenseType.COST} className="bg-surface">Custo</option>
                                    <option value={ExpenseType.EXPENSE} className="bg-surface">Despesa</option>
                                </select>
                                <Button variant="ghostDanger" onClick={() => deleteListItem(setExpenseCategories, i)} className="p-3 h-12 w-12 rounded-lg"><TrashIcon className="w-7 h-7"/></Button>
                            </li>
                        ))}
                    </ul>
                     <Button onClick={() => addListItem(setExpenseCategories, { name: 'Nova Categoria', type: ExpenseType.EXPENSE })} className="mt-4 text-sm" variant="secondary">Adicionar Categoria</Button>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold mb-1">Formas de Pagamento</h3>
                    <p className="text-xs text-text-secondary mb-4">Arraste os itens para reordenar.</p>
                     <ul className="space-y-2">
                        {paymentMethods.map((method, i) => (
                             <li key={i}
                                className={`flex items-center gap-2 p-2 rounded-xl bg-background/40 transition-all duration-200 ${dragActive && draggedItem.current?.list === 'payment' && draggedItem.current?.index === i ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'payment', i)}
                                onDragEnter={(e) => handleDragEnter(e, 'payment', i)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(setPaymentMethods)}
                             >
                                <span className="cursor-grab p-2 text-text-secondary/50 hover:text-text-secondary"><DragHandleIcon className="w-6 h-6"/></span>
                                <input 
                                    type="text" 
                                    value={method} 
                                    onChange={(e) => updateListItem(setPaymentMethods, i, e.target.value)} 
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium text-text-primary placeholder-text-secondary/50"
                                    placeholder="Método de pagamento"
                                />
                                <Button variant="ghostDanger" onClick={() => deleteListItem(setPaymentMethods, i)} className="p-3 h-12 w-12 rounded-lg"><TrashIcon className="w-7 h-7"/></Button>
                            </li>
                        ))}
                    </ul>
                    <Button onClick={() => addListItem(setPaymentMethods, 'Novo Método')} className="mt-4 text-sm" variant="secondary">Adicionar Método</Button>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold mb-1">Centros de Custo</h3>
                    <p className="text-xs text-text-secondary mb-4">Arraste os itens para reordenar.</p>
                     <ul className="space-y-2">
                        {costCenters.map((center, i) => (
                             <li key={i}
                                className={`flex items-center gap-2 p-2 rounded-xl bg-background/40 transition-all duration-200 ${dragActive && draggedItem.current?.list === 'cost' && draggedItem.current?.index === i ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'cost', i)}
                                onDragEnter={(e) => handleDragEnter(e, 'cost', i)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(setCostCenters)}
                            >
                                <span className="cursor-grab p-2 text-text-secondary/50 hover:text-text-secondary"><DragHandleIcon className="w-6 h-6"/></span>
                                <input 
                                    type="text" 
                                    value={center.name} 
                                    onChange={(e) => updateListItem(setCostCenters, i, { ...center, name: e.target.value })} 
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium text-text-primary placeholder-text-secondary/50"
                                    placeholder="Nome do centro de custo"
                                />
                                <Button variant="ghostDanger" onClick={() => deleteListItem(setCostCenters, i)} className="p-3 h-12 w-12 rounded-lg"><TrashIcon className="w-7 h-7"/></Button>
                            </li>
                        ))}
                    </ul>
                    <Button onClick={() => addListItem(setCostCenters, { id: crypto.randomUUID(), name: 'Novo Centro' })} className="mt-4 text-sm" variant="secondary">Adicionar Centro</Button>
                </Card>
                 <Card className="md:col-span-2">
                    <h3 className="text-lg font-bold mb-1">Assessores</h3>
                    <p className="text-xs text-text-secondary mb-4">Arraste os itens para reordenar.</p>
                     <ul className="space-y-2">
                        {advisors.map((advisor, i) => (
                             <li key={i}
                                className={`flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-background/40 transition-all duration-200 ${dragActive && draggedItem.current?.list === 'advisor' && draggedItem.current?.index === i ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'advisor', i)}
                                onDragEnter={(e) => handleDragEnter(e, 'advisor', i)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(setAdvisors)}
                            >
                                <div className="flex items-center flex-grow w-full">
                                    <span className="cursor-grab p-2 text-text-secondary/50 hover:text-text-secondary"><DragHandleIcon className="w-6 h-6"/></span>
                                    <input 
                                        type="text" 
                                        placeholder="Nome do Assessor" 
                                        value={advisor.name} 
                                        onChange={(e) => updateListItem(setAdvisors, i, { ...advisor, name: e.target.value })} 
                                        className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium text-text-primary placeholder-text-secondary/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto pl-10 md:pl-0">
                                    <div className="flex items-center bg-surface/50 rounded-lg px-2">
                                        <input 
                                            type="number" 
                                            placeholder="Comissão" 
                                            value={advisor.commissionRate} 
                                            onChange={(e) => updateListItem(setAdvisors, i, { ...advisor, commissionRate: parseFloat(e.target.value) || 0 })} 
                                            className="w-16 bg-transparent border-none focus:ring-0 text-right font-medium"
                                        />
                                        <span className="text-text-secondary ml-1">%</span>
                                    </div>
                                    <Button variant="ghostDanger" onClick={() => deleteListItem(setAdvisors, i)} className="p-3 h-12 w-12 rounded-lg"><TrashIcon className="w-7 h-7"/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Button onClick={() => addListItem(setAdvisors, { id: crypto.randomUUID(), name: '', commissionRate: 0 })} className="mt-4 text-sm" variant="secondary">Adicionar Assessor</Button>
                </Card>
                <Card className="md:col-span-2">
                    <h3 className="text-lg font-bold mb-4">Gerenciamento de Dados</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleExport} variant="secondary">
                            <ExportIcon className="w-4 h-4" /> Exportar Dados
                        </Button>
                        <div>
                             <input
                                type="file"
                                id="import-file"
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <Button as="label" htmlFor="import-file" variant="secondary">
                                <UploadIcon className="w-4 h-4" /> Importar Dados
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-4">
                        Exporte seus dados (configurações, metas, transações) para um arquivo de backup. A importação restaurará configurações e metas e adicionará as transações.
                    </p>
                </Card>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    // Fetch transactions from firestore
    useEffect(() => {
        if (currentUser) {
            setLoadingTransactions(true);
            getTransactions()
                .then(snapshot => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as Omit<Transaction, 'id'>),
                    })) as Transaction[];
                    setTransactions(data);
                })
                .catch(error => {
                    console.error("Error fetching transactions: ", error);
                })
                .finally(() => {
                    setLoadingTransactions(false);
                });
        } else {
            setTransactions([]); // Clear transactions on logout
            setLoadingTransactions(false);
        }
    }, [currentUser]);

    const [goals, setGoals] = useLocalStorage<Goal[]>('goals', getInitialGoals());
    const [incomeCategories, setIncomeCategories] = useLocalStorage<string[]>('incomeCategories', initialIncomeCategories);
    const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialExpenseCategories);
    const [paymentMethods, setPaymentMethods] = useLocalStorage<string[]>('paymentMethods', initialPaymentMethods);
    const [costCenters, setCostCenters] = useLocalStorage<CostCenter[]>('costCenters', initialCostCenters);
    const [advisors, setAdvisors] = useLocalStorage<Advisor[]>('advisors', initialAdvisors);
    const [view, setView] = useState<View>('dashboard');

    const addTransaction = async (data: TransactionFormValues) => {
        if (!currentUser) return;
        
        const recurringCount = data.recurringCount || 1;
        const baseDate = new Date(data.date);

        const transactionsToSave = [];
        const batchRecurringId = recurringCount > 1 ? crypto.randomUUID() : undefined;

        for (let i = 0; i < recurringCount; i++) {
            const transactionDate = new Date(baseDate);
            // We add to UTC month to avoid timezone issues
            transactionDate.setUTCMonth(baseDate.getUTCMonth() + i);
            
            const newTransactionData: Partial<Omit<Transaction, 'id'>> = {
                date: transactionDate.toISOString(),
                description: data.description,
                amount: data.amount,
                type: data.type,
                category: data.category,
                clientSupplier: data.clientSupplier,
                paymentMethod: data.paymentMethod,
                status: data.status,
                nature: data.nature,
                costCenter: data.costCenter,
                taxAmount: data.taxAmount,
                grossAmount: data.grossAmount,
                commissionAmount: data.commissionAmount,
                advisorId: data.advisorId,
                recurringId: batchRecurringId,
            };
            
            // Sanitize object to ensure no undefined values are passed to Firestore
            const cleanData = Object.entries(newTransactionData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            transactionsToSave.push(saveTransaction(cleanData, currentUser.uid));
        }

        try {
            await Promise.all(transactionsToSave);
        } catch (error) {
            console.error("Error adding transaction(s): ", error);
            // Optionally, show an error message to the user
            const errorMessage = (error as any).message || "Erro desconhecido";
            alert(`Erro ao salvar transação: ${errorMessage}`);
        }
        
        // Refetch all transactions to update the UI
        const snapshot = await getTransactions();
        const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) })) as Transaction[];
        setTransactions(updatedData);
    };

    const editTransaction = async (id: string, data: TransactionFormValues) => {
        const transactionToUpdate: Partial<Omit<Transaction, 'id'>> = {
            ...data,
            date: new Date(data.date).toISOString(),
        };
        delete (transactionToUpdate as any).recurringCount;

        await updateTransaction(id, transactionToUpdate);

        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transactionToUpdate, id } : t));
    };

    const deleteTransaction = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
            await deleteTransactionFromDb(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };
    
    const setExpenseAsPaid = async (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (transaction && transaction.type === TransactionType.EXPENSE) {
             await updateTransaction(id, { status: ExpenseStatus.PAID });
             setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: ExpenseStatus.PAID } : t));
        }
    };

    const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        const newGoal: Goal = {
            ...goalData,
            id: crypto.randomUUID(),
            currentAmount: 0,
        };
        setGoals(prev => [...prev, newGoal]);
    };

    const editGoal = (id: string, goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goalData } : g));
    };

    const deleteGoal = (id: string) => {
        if(window.confirm("Tem certeza que deseja excluir esta meta?")) {
             setGoals(prev => prev.filter(g => g.id !== id));
        }
    };

    const addProgressToGoal = (id: string, amount: number) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    };

    // New function to handle transaction import
    const importTransactions = async (importedTransactions: any[]) => {
        if (!currentUser) return;
        setLoadingTransactions(true);
        try {
            // Filter out potentially invalid transactions and sanitize data
            const validTransactions = importedTransactions.filter(t => t.description && t.amount && t.date);
            
            const promises = validTransactions.map(t => {
                // Exclude ID to create new records and let Firestore generate new IDs
                const { id, ...rest } = t;
                
                // Ensure no undefined values are passed to Firestore
                const cleanData = Object.entries(rest).reduce((acc, [key, value]) => {
                    if (value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as any);
                
                return saveTransaction(cleanData, currentUser.uid);
            });

            await Promise.all(promises);

            // Reload transactions from Firestore to reflect changes
            const snapshot = await getTransactions();
            const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) })) as Transaction[];
            setTransactions(updatedData);
        } catch (error) {
            console.error("Error importing transactions:", error);
            throw error; // Allow SettingsView to handle alert if needed, or handle here
        } finally {
            setLoadingTransactions(false);
        }
    };


    const pageTitles: Record<View, string> = {
        dashboard: 'Dashboard',
        transactions: 'Transações',
        goals: 'Metas',
        reports: 'Relatórios',
        settings: 'Configurações',
    };

    const renderView = () => {
        if (loadingTransactions) {
             return <div className="flex items-center justify-center h-full"><p>Carregando dados...</p></div>;
        }
        switch (view) {
            case 'dashboard': return <DashboardView transactions={transactions} goals={goals} onSetPaid={setExpenseAsPaid}/>;
            case 'transactions': return <TransactionsView transactions={transactions} onAdd={addTransaction} onEdit={editTransaction} onDelete={deleteTransaction} onSetPaid={setExpenseAsPaid} incomeCategories={incomeCategories} expenseCategories={expenseCategories} paymentMethods={paymentMethods} costCenters={costCenters} advisors={advisors} onImportTransactions={importTransactions}/>;
            case 'goals': return <GoalsView goals={goals} onAddGoal={addGoal} onEditGoal={editGoal} onDeleteGoal={deleteGoal} onAddProgress={addProgressToGoal}/>;
            case 'reports': return <ReportsView transactions={transactions} expenseCategories={expenseCategories} />;
            case 'settings': return <SettingsView incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} costCenters={costCenters} setCostCenters={setCostCenters} advisors={advisors} setAdvisors={setAdvisors} goals={goals} setGoals={setGoals} transactions={transactions} onImportTransactions={importTransactions} />;
            default: return <DashboardView transactions={transactions} goals={goals} onSetPaid={setExpenseAsPaid} />;
        }
    };
    
    if (loadingAuth) {
        return <div className="flex items-center justify-center min-h-screen bg-background text-white">Carregando...</div>;
    }
    
    if (!currentUser) {
        return <Login />;
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar activeView={view} setActiveView={setView} isSidebarOpen={isSidebarOpen} user={currentUser} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header pageTitle={pageTitles[view]} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
                 {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;
