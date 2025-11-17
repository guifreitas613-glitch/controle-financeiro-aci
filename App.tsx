import React, { useState, useMemo, FC, ReactNode, useEffect, useRef } from 'react';
import { Transaction, Goal, TransactionType, View, ExpenseStatus, ExpenseNature, CostCenter, User, UserRole, Advisor, ExpenseCategory, ExpenseType, ActivityLog, ChatMessage } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { AuthProvider, useAuth } from './auth';
import Login from './Login';
import { generateFinancialInsights, getChatResponse } from './services/geminiService';
import { supabase } from './services/supabaseClient';


// --- ÍCONES ---
// FIX: Corrected invalid viewBox attribute. It requires four values.
const DashboardIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>);
// FIX: Corrected invalid viewBox attribute. It requires four values.
const TransactionsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
// FIX: Corrected syntax error in viewBox attribute which was breaking JSX parsing.
const GoalsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const ReportsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const SettingsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const InsightsIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M12 2a10 10 0 0 0-10 10c0 3.54 1.83 6.64 4.5 8.35"/><path d="M12 22a10 10 0 0 0 10-10c0-3.54-1.83-6.64-4.5-8.35"/></svg>);
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
const SparklesIcon: FC<{ className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>);
const SendIcon: FC<{ className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>);
const HistoryIcon: FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>);

// --- DECLARAÇÕES DE BIBLIOTECAS GLOBAIS ---
declare var XLSX: any;
declare var jspdf: any;

// --- UTILITÁRIOS ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
const formatDateForInput = (dateString: string) => new Date(dateString).toISOString().split('T')[0];
const getMonthYear = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// --- DADOS INICIAIS (FALLBACKS) ---
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
const Button: FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; variant?: 'primary' | 'secondary' | 'danger'; className?: string; type?: "button" | "submit" | "reset"; disabled?: boolean }> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105';
  const variantClasses = {
    primary: 'bg-primary hover:bg-opacity-90 text-white shadow-md shadow-primary/30',
    secondary: 'bg-text-secondary bg-opacity-20 hover:bg-opacity-30 text-text-primary',
    danger: 'bg-danger hover:bg-red-500 text-white',
  };
  return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled}>{children}</button>;
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
      <div className={`bg-surface rounded-lg shadow-xl w-full p-6 m-4 ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
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
    amount: number; // Net amount for income
    date: string; // YYYY-MM-DD
    type: TransactionType;
    category: string;
    client_supplier: string;
    payment_method: string;
    status?: ExpenseStatus;
    nature?: ExpenseNature;
    cost_center?: string;
    tax_amount?: number;
    // New fields
    gross_amount?: number;
    commission_amount?: number;
    advisor_id?: string;
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
    const [advisor_id, setAdvisorId] = useState(initialData?.advisor_id || '');
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
        gross_amount: (initialData?.gross_amount ?? initialData?.amount)?.toString() || '',
        date: initialData?.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date().toISOString()),
        category: initialData?.category || (currentCategories.length > 0 ? currentCategories[0] : ''),
        client_supplier: initialData?.client_supplier || '',
        payment_method: initialData?.payment_method || (paymentMethods.length > 0 ? paymentMethods[0] : ''),
        status: initialData?.status || ExpenseStatus.PENDING,
        cost_center: initialData?.cost_center || 'conta-pj',
    });
    
    const [commission_amount, setCommissionAmount] = useState(initialData?.commission_amount || 0);
    const [netAmount, setNetAmount] = useState(initialData?.amount || 0);
    const [isCommissionManual, setIsCommissionManual] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Set tax fields on edit
            if (initialData.type === TransactionType.INCOME && initialData.tax_amount) {
                // If gross amount exists, try to calculate percentage, otherwise default to fixed
                if(initialData.gross_amount && initialData.gross_amount > 0) {
                     const percent = (initialData.tax_amount / initialData.gross_amount) * 100;
                     // Use a small tolerance for floating point issues
                     if(Math.abs(percent - Math.round(percent)) < 0.01) {
                         setTaxType('percent');
                         setTaxValue(percent.toFixed(2));
                     } else {
                        setTaxType('fixed');
                        setTaxValue(initialData.tax_amount.toString());
                     }
                } else {
                    setTaxType('fixed');
                    setTaxValue(initialData.tax_amount.toString());
                }
            }

            // Set commission fields on edit
            if (initialData.type === TransactionType.INCOME && initialData.advisor_id && initialData.commission_amount) {
                const selectedAdvisor = advisors.find(a => a.id === initialData.advisor_id);
                const gross = initialData.gross_amount ?? 0;
                if (selectedAdvisor && gross > 0) {
                    const calculatedCommission = (gross * selectedAdvisor.commissionRate) / 100;
                    // If the stored commission is different from the calculated one, assume it was manual
                    if (Math.abs(calculatedCommission - initialData.commission_amount) > 0.01) {
                        setIsCommissionManual(true);
                    }
                } else if (initialData.commission_amount > 0) {
                    // If there's a commission but we can't calculate it (no advisor/gross), it must have been manual
                    setIsCommissionManual(true);
                }
            }
        }
    }, [initialData, advisors]);

    useEffect(() => {
        if (isCommissionManual) return;
        
        const gross = parseFloat(formData.gross_amount);
        const selectedAdvisor = advisors.find(a => a.id === advisor_id);

        if (!isNaN(gross) && selectedAdvisor) {
            const commission = (gross * selectedAdvisor.commissionRate) / 100;
            setCommissionAmount(commission);
        } else if (!isNaN(gross)) {
            setCommissionAmount(0);
        } else {
            setCommissionAmount(0);
        }
    }, [formData.gross_amount, advisor_id, advisors, isCommissionManual]);
    
    useEffect(() => {
        const gross = parseFloat(formData.gross_amount) || 0;
        setNetAmount(gross - commission_amount);
    }, [formData.gross_amount, commission_amount]);


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
        const { description, gross_amount, date, category, payment_method, status, cost_center, client_supplier } = formData;
        
        if (!description || !gross_amount || !date || !category) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (type === TransactionType.INCOME && !client_supplier.trim()) {
            alert("O campo 'Cliente' é obrigatório para receitas.");
            return;
        }
        if (type === TransactionType.EXPENSE && !payment_method) {
            alert("O campo 'Forma de Pagamento' é obrigatório para despesas.");
            return;
        }

        const parsedGrossAmount = parseFloat(gross_amount);
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
            client_supplier,
            payment_method,
            cost_center,
        };
        
        if (type === TransactionType.INCOME) {
            let calculatedTax = 0;
            const parsedTaxValue = parseFloat(taxValue);
            if (!isNaN(parsedGrossAmount) && !isNaN(parsedTaxValue) && parsedTaxValue > 0) {
                calculatedTax = taxType === 'percent' ? (parsedGrossAmount * parsedTaxValue) / 100 : parsedTaxValue;
            }
            submissionData.tax_amount = calculatedTax;
            submissionData.gross_amount = parsedGrossAmount;
            submissionData.commission_amount = commission_amount;
            submissionData.advisor_id = advisor_id;
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
                    <input type="number" step="0.01" name="gross_amount" value={formData.gross_amount} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
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
                 <input type="text" name="client_supplier" value={formData.client_supplier} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required={type === TransactionType.INCOME} />
            </div>
            
            {type === TransactionType.INCOME && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Assessor (Opcional)</label>
                         <select value={advisor_id} onChange={(e) => { setAdvisorId(e.target.value); setIsCommissionManual(false); }} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
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
                {advisor_id && (
                    <div className="bg-background p-3 rounded-lg border border-border-color">
                        <div className="grid grid-cols-3 gap-4 text-center mb-2">
                            <div>
                                <p className="text-xs text-text-secondary">Valor Bruto</p>
                                <p className="font-semibold">{formatCurrency(parseFloat(formData.gross_amount) || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">(-) Comissão</p>
                                <p className="font-semibold text-danger">{formatCurrency(commission_amount)}</p>
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
                                        value={commission_amount.toFixed(2)}
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
                             <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
                                {paymentMethods.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Centro de Custo</label>
                             <select name="cost_center" value={formData.cost_center} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required>
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

interface GoalFormProps { onSubmit: (goal: Omit<Goal, 'id' | 'current_amount'>) => void; onClose: () => void; initialData?: Goal | null; }
const GoalForm: FC<GoalFormProps> = ({ onSubmit, onClose, initialData }) => { 
    const [name, setName] = useState(initialData?.name || '');
  const [target_amount, setTargetAmount] = useState(initialData?.target_amount.toString() || '');
  const [deadline, setDeadline] = useState(initialData?.deadline ? formatDateForInput(initialData.deadline) : '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target_amount) return;
    onSubmit({
      name,
      target_amount: parseFloat(target_amount as string),
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
            <input type="number" step="0.01" value={target_amount} onChange={(e) => setTargetAmount(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
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
const Sidebar: FC<{ activeView: View; setActiveView: (view: View) => void; isSidebarOpen: boolean }> = ({ activeView, setActiveView, isSidebarOpen }) => {
    const { permissions, logout, currentUser } = useAuth();
    
    const allNavItems: { view: View; label: string; icon: ReactNode; canView: boolean }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5"/>, canView: permissions.canViewDashboard },
        { view: 'transactions', label: 'Transações', icon: <TransactionsIcon className="w-5 h-5"/>, canView: permissions.canViewTransactions },
        { view: 'reports', label: 'Relatórios', icon: <ReportsIcon className="w-5 h-5"/>, canView: permissions.canViewReports },
        { view: 'goals', label: 'Metas', icon: <GoalsIcon className="w-5 h-5"/>, canView: permissions.canViewGoals },
        { view: 'insights', label: 'Insights (IA)', icon: <SparklesIcon className="w-5 h-5"/>, canView: permissions.canViewDashboard },
        { view: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-5 h-5"/>, canView: permissions.canViewSettings },
    ];
    
    const navItems = allNavItems.filter(item => item.canView);

    return (
        <aside className={`absolute md:relative z-20 md:z-auto bg-surface md:translate-x-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 p-4 flex flex-col`}>
             <h1 className="text-3xl font-bold text-text-primary mb-8">ACI<span className="text-primary">Capital</span></h1>
             <nav className="flex flex-col space-y-2 flex-grow">
                {navItems.map(item => (
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
                 <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-text-primary">{currentUser?.username}</p>
                    <p className="text-xs text-text-secondary">{currentUser?.role}</p>
                 </div>
                 <button
                    onClick={logout}
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

const DashboardView: FC<{ transactions: Transaction[]; goals: Goal[] }> = ({ transactions, goals }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
// FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
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
            .filter(t => t.type === TransactionType.INCOME && t.tax_amount)
            .reduce((sum, t) => sum + t.tax_amount!, 0);

        const totalTaxPaid = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE && t.cost_center === 'provisao-impostos')
            .reduce((sum, t) => sum + t.amount, 0);


        return { totalIncome: income, totalExpense: expense, netProfit: income - expense, mostProfitableMonth, largestExpense, taxProvisionBalanceForPeriod: totalProvisioned - totalTaxPaid };
    }, [filteredTransactions]);
    
    const achievedGoals = useMemo(() => {
         return goals.filter(g => g.current_amount >= g.target_amount).length;
    }, [goals]);

    const upcomingBills = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);

        return transactions
            .filter(t =>
                t.type === TransactionType.EXPENSE &&
                t.status === ExpenseStatus.PENDING &&
                new Date(t.date) <= twoDaysFromNow
            )
// FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
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
        // FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
        const sorted = [...transactions].sort((a: Transaction, b: Transaction) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let balance = 0;
        const dataMap = new Map<string, { income: number; expense: number; balance: number }>();

        sorted.forEach(t => {
            const date = formatDate(t.date);
            if (!dataMap.has(date)) {
                dataMap.set(date, { income: 0, expense: 0, balance: 0 });
            }
            const dayData = dataMap.get(date)!;
            if (t.type === TransactionType.INCOME) {
                const netIncome = t.amount - (t.tax_amount || 0);
                dayData.income += netIncome;
                balance += netIncome;
            } else { // EXPENSE
                // Only subtract from operational cash if not paid from tax provision
                if (t.cost_center !== 'provisao-impostos') {
                    dayData.expense += t.amount;
                    balance -= t.amount;
                }
            }
            dayData.balance = balance;
        });
        
        return Array.from(dataMap.entries()).map(([date, values]) => ({ date, ...values }));
    }, [transactions]);
    
    const PIE_COLORS = ['#D1822A', '#6366F1'];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        // only render label if percent is large enough to not look cluttered
        if (percent < 0.07) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface rounded-lg items-end">
                <div>
                    <label htmlFor="dashboardYearFilter" className="block text-sm font-medium text-text-secondary">Ano</label>
                    <select
                        id="dashboardYearFilter"
                        value={String(selectedYear)}
                        onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                    >
                        <option value="all">Todos os Anos</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="dashboardMonthFilter" className="block text-sm font-medium text-text-secondary">Mês</label>
                    <select
                        id="dashboardMonthFilter"
                        value={String(selectedMonth)}
                        onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                    >
                        <option value="all">Todos os Meses</option>
                        {months.map((month, index) => <option key={index} value={index}>{month}</option>)}
                    </select>
                </div>
                <Button variant="secondary" onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); }}>Limpar Filtros</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card><h3 className="text-xs text-text-secondary font-semibold">Receita do Período</h3><p className="text-lg font-bold text-green-400">{formatCurrency(totalIncome)}</p></Card>
                <Card><h3 className="text-xs text-text-secondary font-semibold">Despesa do Período</h3><p className="text-lg font-bold text-danger">{formatCurrency(totalExpense)}</p></Card>
                <Card><h3 className="text-xs text-text-secondary font-semibold">Lucro do Período</h3><p className={`text-lg font-bold ${netProfit >= 0 ? 'text-text-primary' : 'text-danger'}`}>{formatCurrency(netProfit)}</p></Card>
                <Card><h3 className="text-xs text-text-secondary font-semibold">Variação Provisão</h3><p className="text-lg font-bold text-blue-400">{formatCurrency(taxProvisionBalanceForPeriod)}</p></Card>
                <Card><h3 className="text-xs text-text-secondary font-semibold">Metas Alcançadas</h3><p className="text-lg font-bold text-primary">{achievedGoals} / {goals.length}</p></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-1">
                    <h3 className="text-xl font-bold mb-4">Despesas por Natureza</h3>
                    {expenseSubcategoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie 
                                    data={expenseSubcategoryData} 
                                    dataKey="value"
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60}
                                    outerRadius={85} 
                                    paddingAngle={5}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {expenseSubcategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={'#1A214A'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend iconSize={12} wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[260px]">
                           <p className="text-text-secondary text-center py-4">Nenhuma despesa para exibir no período.</p>
                        </div>
                    )}
                </Card>
                <Card className="lg:col-span-2">
                     <h3 className="text-xl font-bold mb-4">Contas a Pagar</h3>
                    <p className="text-sm text-text-secondary mb-4">Vencidas e vencendo nos próximos 2 dias.</p>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {upcomingBills.length > 0 ? (
                            upcomingBills.map(bill => {
                                const dueDate = new Date(bill.date);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isOverdue = dueDate < today;

                                return (
                                    <div key={bill.id} className="flex justify-between items-center bg-background p-3 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-text-primary">{bill.description}</p>
                                            <p className={`text-sm ${isOverdue ? 'text-danger' : 'text-yellow-400'}`}>
                                                Vence: {formatDate(bill.date)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-danger">{formatCurrency(bill.amount)}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-text-secondary text-center py-4">Nenhuma conta a pagar em breve.</p>
                        )}
                    </div>
                </Card>
            </div>
             <Card>
                <h3 className="text-xl font-bold mb-4">Fluxo de Caixa (Operacional) - Geral</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D376A" />
                        <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        {/* FIX: Explicitly typed the 'value' parameter as number to allow arithmetic operation. */}
                        <YAxis stroke="#A0AEC0" tickFormatter={(value: number) => `R$${value/1000}k`} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A214A', border: '1px solid #2D376A', color: '#F0F2F5' }} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="balance" stroke="#D1822A" strokeWidth={2} name="Saldo Operacional" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
             </Card>
        </div>
    );
};

interface TransactionsViewProps {
    transactions: Transaction[];
    costCenters: CostCenter[];
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    onEdit: (t: Transaction) => void;
    onDelete: (id: string, recurringId?: string) => void;
    onAdd: (type: TransactionType) => void;
    onMarkAsPaid: (id: string) => void;
    onExport: (format: 'csv' | 'xlsx' | 'pdf', data: Transaction[]) => void;
    onImport: (type: 'ofx' | 'csv' | 'pdf') => void;
    onBulkDelete: (ids: Set<string>) => void;
    selectedIds: Set<string>;
    onSelect: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const TransactionsView: FC<TransactionsViewProps> = ({ 
    transactions, costCenters, incomeCategories, expenseCategories, onEdit, 
    onDelete, onAdd, onMarkAsPaid, onExport, onImport, onBulkDelete, selectedIds, onSelect 
}) => {
    const { permissions } = useAuth();
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paga' | 'pendente' | 'vencido'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);

    const costCenterMap = useMemo(() => new Map(costCenters.map(cc => [cc.id, cc.name])), [costCenters]);

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
// FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
        return years.sort((a: number, b: number) => b - a);
    }, [transactions]);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const currentCategories = useMemo(() => {
        return activeTab === 'income' ? incomeCategories : expenseCategories.map(c => c.name);
    }, [activeTab, incomeCategories, expenseCategories]);

    useEffect(() => {
        setCategoryFilter('all'); // Reset category filter when tab changes
        onSelect(new Set()); // Clear selection when tab changes
    }, [activeTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
                setIsImportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredTransactions = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return transactions
            .filter(t => {
                if (t.type !== (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)) return false;
                
                if (selectedYear !== 'all' && new Date(t.date).getFullYear() !== selectedYear) return false;
                if (selectedMonth !== 'all' && new Date(t.date).getMonth() !== selectedMonth) return false;
                if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

                if (searchTerm && !(
                    t.description.toLowerCase().includes(lowercasedSearch) ||
                    t.category.toLowerCase().includes(lowercasedSearch) ||
                    (t.client_supplier && t.client_supplier.toLowerCase().includes(lowercasedSearch)) ||
                    t.amount.toString().includes(lowercasedSearch)
                )) return false;

                if (activeTab === 'expense' && statusFilter !== 'all') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const transactionDate = new Date(t.date);

                    switch (statusFilter) {
                        case 'paga':
                            return t.status === ExpenseStatus.PAID;
                        case 'pendente':
                            return t.status === ExpenseStatus.PENDING && transactionDate >= today;
                        case 'vencido':
                            return t.status === ExpenseStatus.PENDING && transactionDate < today;
                    }
                }

                return true;
            })
// FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
            .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [transactions, activeTab, selectedYear, selectedMonth, searchTerm, statusFilter, categoryFilter]);
    
    const totalAmountForPeriod = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
    }, [filteredTransactions]);

    const columnCount = useMemo(() => {
        let base = 5; // Checkbox, Data, Descrição, Valor
        if (activeTab === 'income') base += 1; // Impostos
        if (activeTab === 'expense') base += 2; // Centro de Custo, Status
        if (permissions.canEditTransactions) base += 1; // Ações
        return base;
    }, [activeTab, permissions]);

    const TabButton: FC<{ tabName: 'expense' | 'income', children: ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`py-2 px-4 text-sm font-medium transition-colors duration-300 ${activeTab === tabName ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold">Transações</h2>
                 {selectedIds.size > 0 ? (
                    <Button variant="danger" onClick={() => onBulkDelete(selectedIds)}>
                        <TrashIcon className="w-5 h-5"/> Excluir {selectedIds.size} Itens
                    </Button>
                 ) : (
                    permissions.canEditTransactions && (
                        <Button onClick={() => onAdd(activeTab === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME)}>
                            <PlusIcon className="w-5 h-5"/> 
                            {activeTab === 'expense' ? 'Adicionar Despesa' : 'Adicionar Receita'}
                        </Button>
                    )
                 )}
            </div>
            <Card>
                 <div className="flex flex-col md:flex-row gap-4 items-center pb-4 mb-4 border-b border-border-color">
                    <div className="relative w-full md:flex-grow">
                        <input type="text" placeholder="Buscar por descrição, valor, etc..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary pl-10 p-2" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    </div>
                    {permissions.canEditTransactions && (
                        <div className="flex items-center gap-2">
                            <div className="relative" ref={importMenuRef}>
                                <Button variant="secondary" onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}>
                                    <UploadIcon className="w-5 h-5"/> Importar Extrato <MoreVerticalIcon className="w-4 h-4 -mr-2"/>
                                </Button>
                                {isImportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-color rounded-md shadow-lg z-10">
                                        <button onClick={() => { onImport('ofx'); setIsImportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Arquivo OFX</button>
                                        <button onClick={() => { onImport('csv'); setIsImportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Arquivo CSV</button>
                                        <button onClick={() => { onImport('pdf'); setIsImportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Arquivo PDF</button>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={exportMenuRef}>
                                <Button variant="secondary" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}><ExportIcon className="w-5 h-5"/> Exportar <MoreVerticalIcon className="w-4 h-4 -mr-2" /></Button>
                                {isExportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-color rounded-md shadow-lg z-10">
                                        <button onClick={() => { onExport('csv', filteredTransactions); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Exportar CSV</button>
                                        <button onClick={() => { onExport('xlsx', filteredTransactions); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Exportar Excel</button>
                                        <button onClick={() => { onExport('pdf', filteredTransactions); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background">Exportar PDF</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-4 items-end pb-4 mb-4 border-b border-border-color">
                    <div>
                        <label htmlFor="yearFilter" className="block text-sm font-medium text-text-secondary">Ano</label>
                        <select
                            id="yearFilter"
                            value={String(selectedYear)}
                            onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                        >
                            <option value="all">Todos os Anos</option>
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="monthFilter" className="block text-sm font-medium text-text-secondary">Mês</label>
                        <select
                            id="monthFilter"
                            value={String(selectedMonth)}
                            onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                        >
                            <option value="all">Todos os Meses</option>
                            {months.map((month, index) => <option key={index} value={index}>{month}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="categoryFilter" className="block text-sm font-medium text-text-secondary">Categoria</label>
                        <select
                            id="categoryFilter"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                        >
                            <option value="all">Todas as Categorias</option>
                            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     {activeTab === 'expense' && (
                        <div>
                             <label htmlFor="statusFilter" className="block text-sm font-medium text-text-secondary">Status</label>
                             <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="paga">Pagas</option>
                                <option value="pendente">Pendentes</option>
                                <option value="vencido">Vencidas</option>
                            </select>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); setStatusFilter('all'); setCategoryFilter('all'); }}>Limpar Filtros</Button>
                </div>

                <div className="p-4 my-4 bg-background rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase">
                        {activeTab === 'expense' ? 'Total de Despesas no Período' : 'Total de Receitas Líquidas no Período'}
                    </h3>
                    <p className={`text-3xl font-bold ${activeTab === 'expense' ? 'text-danger' : 'text-green-400'}`}>
                        {formatCurrency(totalAmountForPeriod)}
                    </p>
                </div>

                <div className="border-b border-border-color">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton tabName="expense">Despesas</TabButton>
                        <TabButton tabName="income">Receitas</TabButton>
                    </nav>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-border-color">
                        <thead className="bg-background">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onSelect(new Set(filteredTransactions.map(t => t.id)));
                                            } else {
                                                onSelect(new Set());
                                            }
                                        }}
                                        aria-label="Selecionar todos os itens"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Valor</th>
                                {activeTab === 'income' && <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Impostos</th>}
                                {activeTab === 'expense' && <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Centro de Custo</th>}
                                {activeTab === 'expense' && <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>}
                                {permissions.canEditTransactions && <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(t => {
                                    let statusContent;
                                    if (t.type === TransactionType.EXPENSE) {
                                        if (t.status === ExpenseStatus.PAID) {
                                            statusContent = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">Paga</span>;
                                        } else {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const isOverdue = new Date(t.date) < today;
                                            if (isOverdue) {
                                                statusContent = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">Vencida</span>;
                                            } else {
                                                statusContent = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">Pendente</span>;
                                            }
                                        }
                                    }
                                    
                                    return (
                                        <tr key={t.id} className={`transition-colors duration-200 ${selectedIds.has(t.id) ? 'bg-primary/10' : 'hover:bg-background'}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={selectedIds.has(t.id)}
                                                    onChange={() => {
                                                        const newSelection = new Set(selectedIds);
                                                        if (newSelection.has(t.id)) {
                                                            newSelection.delete(t.id);
                                                        } else {
                                                            newSelection.add(t.id);
                                                        }
                                                        onSelect(newSelection);
                                                    }}
                                                    aria-label={`Selecionar ${t.description}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                                {t.description}
                                                <p className="text-xs text-text-secondary">{t.client_supplier}</p>
                                                {t.type === TransactionType.EXPENSE && t.nature && (
                                                    <p className="text-xs text-text-secondary mt-1 italic">
                                                        Gasto {t.nature === ExpenseNature.FIXED ? 'Fixo' : 'Variável'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>
                                                {formatCurrency(t.amount)}
                                                {t.type === TransactionType.INCOME && t.gross_amount && (
                                                    <p className="text-xs text-text-secondary">Bruto: {formatCurrency(t.gross_amount)}</p>
                                                )}
                                            </td>
                                            {activeTab === 'income' && <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{t.tax_amount ? formatCurrency(t.tax_amount) : '-'}</td>}
                                            {activeTab === 'expense' && <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{costCenterMap.get(t.cost_center || '') || 'N/A'}</td>}
                                            {activeTab === 'expense' && <td className="px-6 py-4 whitespace-nowrap text-sm">{statusContent}</td>}
                                            {permissions.canEditTransactions && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {t.type === TransactionType.EXPENSE && t.status !== ExpenseStatus.PAID && (
                                                            <button onClick={() => onMarkAsPaid(t.id)} title="Marcar como Paga" className="text-green-400 hover:text-green-300"><PaidIcon className="w-5 h-5"/></button>
                                                        )}
                                                        <button onClick={() => onEdit(t)} className="text-blue-400 hover:text-blue-300"><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => onDelete(t.id, t.recurring_id)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })
                             ) : (
                                <tr>
                                    <td colSpan={columnCount} className="px-6 py-10 text-center text-text-secondary">
                                        Nenhuma transação encontrada para os filtros aplicados.
                                    </td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const GoalsView: FC<{ goals: Goal[]; onEdit: (g: Goal) => void; onDelete: (id: string) => void; onAdd: () => void; onAddProgress: (g: Goal) => void; }> = ({ goals, onEdit, onDelete, onAdd, onAddProgress }) => {
    const { permissions } = useAuth();
    return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Metas Financeiras</h2>
            {permissions.canEditGoals && <Button onClick={onAdd}><PlusIcon className="w-5 h-5"/> Adicionar Meta</Button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                return (
                    <Card key={goal.id}>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold mb-2">{goal.name}</h3>
                            {permissions.canEditGoals && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onAddProgress(goal)} title="Adicionar Progresso" className="text-green-400 hover:text-green-300"><PlusIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onEdit(goal)} title="Editar Meta" className="text-blue-400 hover:text-blue-300"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDelete(goal.id)} title="Excluir Meta" className="text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(goal.target_amount)}</p>
                            <div>
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold text-text-secondary">Progresso</span>
                                    <span className="font-semibold text-accent">{formatCurrency(goal.current_amount)} ({Math.round(progress)}%)</span>
                                </div>
                                <ProgressBar progress={progress} />
                            </div>
                            {goal.deadline && (<p className="text-sm text-text-secondary">Prazo: {formatDate(goal.deadline)}</p>)}
                        </div>
                    </Card>
                )
            })}
             {goals.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3 text-center">
                    <p className="text-text-secondary">Nenhuma meta financeira foi definida ainda.</p>
                    {permissions.canEditGoals && <p className="text-text-secondary mt-2">Clique em "Adicionar Meta" para começar.</p>}
                </Card>
            )}
        </div>
    </div>
)};
const ReportsView: FC<{transactions: Transaction[], expenseCategories: ExpenseCategory[]}> = ({transactions, expenseCategories}) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    const availableYears = useMemo(() => {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
// FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
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

    const dreData = useMemo(() => {
        const expenseCategoryMap = new Map(expenseCategories.map(c => [c.name, c.type]));

        const revenue = filteredTransactions.filter(t => t.type === TransactionType.INCOME);
        const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);

        const receitaBruta = revenue.reduce((sum, t) => sum + (t.gross_amount || t.amount), 0);
        const deducoes = revenue.reduce((sum, t) => sum + (t.tax_amount || 0), 0);
        const receitaLiquida = receitaBruta - deducoes;
        
        const custos = expenses
            .filter(t => expenseCategoryMap.get(t.category) === ExpenseType.COST)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const despesas = expenses
            .filter(t => expenseCategoryMap.get(t.category) === ExpenseType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const lucroBruto = receitaLiquida - custos;
        const lucroOperacional = lucroBruto - despesas;

        return { receitaBruta, deducoes, receitaLiquida, custos, despesas, lucroBruto, lucroOperacional };
    }, [filteredTransactions, expenseCategories]);

     const monthlyChartData = useMemo(() => {
        const parseMonthYear = (monthYearStr: string): Date => {
            const parts = monthYearStr.split(' de ');
            const monthStr = parts[0];
            const yearStr = parts[1];
            const monthsMap: Record<string, number> = { 'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5, 'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11 };
            return new Date(parseInt(yearStr, 10), monthsMap[monthStr.toLowerCase() as keyof typeof monthsMap]);
        };
        const monthlyData = filteredTransactions.reduce((acc: Record<string, { month: string, income: number, expense: number }>, t) => {
            const month = getMonthYear(t.date);
            if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
            if (t.type === TransactionType.INCOME) acc[month].income += t.amount;
            else acc[month].expense += t.amount;
            return acc;
        }, {});
        // FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction.
        return Object.values(monthlyData).sort((a: { month: string; income: number; expense: number; }, b: { month: string; income: number; expense: number; }) => parseMonthYear(a.month).getTime() - parseMonthYear(b.month).getTime());
    }, [filteredTransactions]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Relatórios e Indicadores</h2>

             <Card className="flex flex-col sm:flex-row gap-4 items-end">
                <div>
                    <label htmlFor="reportYearFilter" className="block text-sm font-medium text-text-secondary">Ano</label>
                    <select id="reportYearFilter" value={String(selectedYear)} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        <option value="all">Todos</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="reportMonthFilter" className="block text-sm font-medium text-text-secondary">Mês</label>
                    <select id="reportMonthFilter" value={String(selectedMonth)} onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2">
                        <option value="all">Ano Inteiro</option>
                        {months.map((month, index) => <option key={index} value={index}>{month}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">DRE - Demonstrativo de Resultados</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg">
                        <span className="font-semibold">(=) Receita Operacional Bruta</span>
                        <span className="font-bold text-text-primary">{formatCurrency(dreData.receitaBruta)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 rounded-lg ml-4">
                        <span className="text-text-secondary">(-) Deduções e Impostos</span>
                        <span className="font-semibold text-text-secondary">({formatCurrency(dreData.deducoes)})</span>
                    </div>
                     <div className="flex justify-between items-center p-2 rounded-lg border-t border-border-color">
                        <span className="font-semibold">(=) Receita Operacional Líquida</span>
                        <span className="font-bold text-text-primary">{formatCurrency(dreData.receitaLiquida)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 rounded-lg ml-4">
                        <span className="text-text-secondary">(-) Custos dos Serviços Prestados</span>
                        <span className="font-semibold text-danger">({formatCurrency(dreData.custos)})</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-background rounded-lg border-t-2 border-primary">
                        <span className="font-bold text-lg">(=) Lucro Bruto</span>
                        <span className={`font-bold text-lg ${dreData.lucroBruto >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(dreData.lucroBruto)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 rounded-lg ml-4">
                        <span className="text-text-secondary">(-) Despesas Operacionais</span>
                        <span className="font-semibold text-danger">({formatCurrency(dreData.despesas)})</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-surface border-t-2 border-green-500 rounded-b-lg mt-2">
                        <span className="font-bold text-text-primary text-xl">(=) Lucro Operacional</span>
                        <span className={`font-bold text-xl ${dreData.lucroOperacional >= 0 ? 'text-green-400' : 'text-danger'}`}>{formatCurrency(dreData.lucroOperacional)}</span>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">Comparativo Mensal (Receita Líquida vs. Despesa Total)</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D376A" />
                        <XAxis dataKey="month" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        {/* FIX: Explicitly typed the 'value' parameter as number to allow arithmetic operation. */}
                        <YAxis stroke="#A0AEC0" tickFormatter={(value: number) => `R$${value/1000}k`} tick={{ fontSize: 12 }} />
                        {/* FIX: Explicitly typed the 'value' parameter as number for the formatter, as its type can be uncertain from the library. */}
                        <Tooltip contentStyle={{ backgroundColor: '#1A214A', border: '1px solid #2D376A', color: '#F0F2F5' }} formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Receita Líq.' : 'Despesa Total']} cursor={{ fill: 'rgba(209, 130, 42, 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '14px' }} />
                        <Bar dataKey="income" fill="#10B981" name="Receita Líq." radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#EF4444" name="Despesa Total" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

const SettingsList: FC<{ title: string; items: string[]; onAddItem: (item: string) => void; onDeleteItem: (item: string) => void; onReorder: (items: string[]) => void;}> = ({ title, items, onAddItem, onDeleteItem, onReorder }) => {
    const { permissions } = useAuth();
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAddItem(newItem.trim());
            setNewItem('');
        }
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[newIndex];
        newItems[newIndex] = temp;
        onReorder(newItems);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {items.map((item, index) => (
                    <div key={item} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <span className="text-sm">{item}</span>
                        {permissions.canManageSettings && (
                           <div className="flex items-center gap-2">
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDownIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteItem(item)} className="text-red-500 hover:text-red-400">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {items.length === 0 && <p className="text-text-secondary text-sm">Nenhum item na lista.</p>}
            </div>
            {permissions.canManageSettings && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Adicionar novo item"
                        className="flex-grow bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                    />
                    <Button onClick={handleAdd}><PlusIcon className="w-5 h-5" /></Button>
                </div>
            )}
        </Card>
    );
};

const ExpenseCategorySettings: FC<{ items: ExpenseCategory[]; onAddItem: (name: string, type: ExpenseType) => void; onDeleteItem: (name: string) => void; onReorder: (items: ExpenseCategory[]) => void;}> = ({ items, onAddItem, onDeleteItem, onReorder }) => {
    const { permissions } = useAuth();
    const [name, setName] = useState('');
    const [type, setType] = useState<ExpenseType>(ExpenseType.EXPENSE);

    const handleAdd = () => {
        if (name.trim()) {
            onAddItem(name.trim(), type);
            setName('');
            setType(ExpenseType.EXPENSE);
        }
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[newIndex];
        newItems[newIndex] = temp;
        onReorder(newItems);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">Categorias de Despesa</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {items.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center bg-background p-2 rounded-md">
                         <div>
                            <span className="text-sm">{item.name}</span>
                             <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.type === ExpenseType.COST ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                                {item.type === ExpenseType.COST ? 'Custo' : 'Despesa'}
                            </span>
                        </div>
                        {permissions.canManageSettings && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDownIcon className="w-4 h-4" /></button>
                                {item.name !== 'Remuneração de Assessores' && (
                                    <button onClick={() => onDeleteItem(item.name)} className="text-red-500 hover:text-red-400">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {permissions.canManageSettings && (
                 <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label className="text-xs text-text-secondary">Nome da Categoria</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Adicionar nova categoria"
                            className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                        />
                    </div>
                     <div className="w-36">
                         <label className="text-xs text-text-secondary">Tipo</label>
                         <select value={type} onChange={e => setType(e.target.value as ExpenseType)} className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm">
                            <option value={ExpenseType.EXPENSE}>Despesa</option>
                            <option value={ExpenseType.COST}>Custo</option>
                         </select>
                    </div>
                    <Button onClick={handleAdd}><PlusIcon className="w-5 h-5" /></Button>
                </div>
            )}
        </Card>
    );
};

const AdvisorSettings: FC<{ items: Advisor[]; onAddItem: (name: string, commissionRate: number) => void; onDeleteItem: (id: string) => void; onReorder: (items: Advisor[]) => void;}> = ({ items, onAddItem, onDeleteItem, onReorder }) => {
    const { permissions } = useAuth();
    const [name, setName] = useState('');
    const [commissionRate, setCommissionRate] = useState('');

    const handleAdd = () => {
        const rate = parseFloat(commissionRate);
        if (name.trim() && !isNaN(rate) && rate > 0) {
            onAddItem(name.trim(), rate);
            setName('');
            setCommissionRate('');
        } else {
            alert('Por favor, preencha o nome e uma taxa de comissão válida.');
        }
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[newIndex];
        newItems[newIndex] = temp;
        onReorder(newItems);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">Assessores</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <div>
                           <span className="text-sm font-semibold">{item.name}</span>
                           <p className="text-xs text-text-secondary">Comissão: {item.commissionRate}%</p>
                        </div>
                        {permissions.canManageSettings && (
                             <div className="flex items-center gap-2">
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDownIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-400">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {permissions.canManageSettings && (
                <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label className="text-xs text-text-secondary">Nome do Assessor</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                        />
                    </div>
                    <div className="w-28">
                         <label className="text-xs text-text-secondary">Comissão (%)</label>
                        <input
                            type="number"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            placeholder="Ex: 50"
                            className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                        />
                    </div>
                    <Button onClick={handleAdd}><PlusIcon className="w-5 h-5" /></Button>
                </div>
            )}
        </Card>
    );
};

const CostCenterSettings: FC<{ items: CostCenter[]; onAddItem: (name: string) => void; onDeleteItem: (id: string) => void; onReorder: (items: CostCenter[]) => void;}> = ({ items, onAddItem, onDeleteItem, onReorder }) => {
    const { permissions } = useAuth();
    const [newItem, setNewItem] = useState('');
    
    const defaultItems = items.filter(item => item.isDefault);
    const nonDefaultItems = items.filter(item => !item.isDefault);

    const handleAdd = () => {
        if (newItem.trim()) {
            onAddItem(newItem.trim());
            setNewItem('');
        }
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= nonDefaultItems.length) return;
        
        const reordered = [...nonDefaultItems];
        const temp = reordered[index];
        reordered[index] = reordered[newIndex];
        reordered[newIndex] = temp;
        
        onReorder([...defaultItems, ...reordered]);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">Centros de Custo</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {defaultItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <span className="text-sm text-text-secondary">{item.name} (Padrão)</span>
                    </div>
                ))}
                {nonDefaultItems.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <span className="text-sm">{item.name}</span>
                        {permissions.canManageSettings && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === nonDefaultItems.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDownIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-400">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {permissions.canManageSettings && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Novo centro de custo"
                        className="flex-grow bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                    />
                    <Button onClick={handleAdd}><PlusIcon className="w-5 h-5" /></Button>
                </div>
            )}
        </Card>
    );
};

const BackupSettings: FC<{ onBackup: () => void; onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ onBackup, onRestore }) => {
    const { permissions } = useAuth();
    const restoreInputRef = useRef<HTMLInputElement>(null);
    if (!permissions.canManageSettings) return null;
    
    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">Backup e Restauração (LocalStorage)</h3>
            <p className="text-sm text-text-secondary mb-4">Salve os dados atualmente no navegador em um arquivo ou restaure-os. Isso não afeta o banco de dados Supabase.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={onBackup} variant="secondary" className="w-full">Fazer Backup</Button>
                <Button onClick={() => restoreInputRef.current?.click()} variant="secondary" className="w-full">Restaurar de Backup</Button>
                <input type="file" accept=".json" ref={restoreInputRef} onChange={onRestore} className="hidden" />
            </div>
        </Card>
    );
};

const ActivityLogSettings: FC<{ logs: ActivityLog[] }> = ({ logs }) => {
    const { permissions } = useAuth();
    if (!permissions.canManageSettings) return null;

    return (
        <Card className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><HistoryIcon className="w-6 h-6" /> Logs de Atividade</h3>
            <div className="max-h-96 overflow-y-auto border border-border-color rounded-md">
                <table className="min-w-full divide-y divide-border-color text-sm">
                    <thead className="bg-background sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left font-semibold text-text-secondary">Data/Hora</th>
                            <th className="px-4 py-2 text-left font-semibold text-text-secondary">Usuário</th>
                            <th className="px-4 py-2 text-left font-semibold text-text-secondary">Ação</th>
                            <th className="px-4 py-2 text-left font-semibold text-text-secondary">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-background">
                                <td className="px-4 py-2 whitespace-nowrap text-text-secondary">{formatDateTime(log.timestamp)}</td>
                                <td className="px-4 py-2 text-text-primary font-medium">{log.user_display_name}</td>
                                <td className="px-4 py-2 text-text-secondary">{log.action}</td>
                                <td className="px-4 py-2 text-text-secondary">{log.details}</td>
                            </tr>
                        ))}
                         {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-text-secondary">Nenhuma atividade registrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const SettingsView: FC<{
    incomeCategories: string[];
    expenseCategories: ExpenseCategory[];
    paymentMethods: string[];
    costCenters: CostCenter[];
    advisors: Advisor[];
    logs: ActivityLog[];
    onSettingsUpdate: (settings: any) => void;
    onBackup: () => void;
    onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = (props) => {
    const { 
        incomeCategories, expenseCategories, paymentMethods, costCenters, advisors, logs,
        onSettingsUpdate, onBackup, onRestore 
    } = props;

    const handleUpdate = (key: string, value: any) => {
        onSettingsUpdate({ [key]: value });
    }
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Configurações</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <SettingsList 
                    title="Categorias de Receita"
                    items={incomeCategories}
                    onAddItem={(item) => handleUpdate('income_categories', [...incomeCategories, item])}
                    onDeleteItem={(item) => handleUpdate('income_categories', incomeCategories.filter(i => i !== item))}
                    onReorder={(items) => handleUpdate('income_categories', items)}
                />
                <ExpenseCategorySettings 
                    items={expenseCategories}
                    onAddItem={(name, type) => handleUpdate('expense_categories', [...expenseCategories, { name, type }])}
                    onDeleteItem={(name) => handleUpdate('expense_categories', expenseCategories.filter(c => c.name !== name))}
                    onReorder={(items) => handleUpdate('expense_categories', items)}
                />
                <AdvisorSettings
                    items={advisors}
                    onAddItem={(name, commissionRate) => handleUpdate('advisors', [...advisors, { id: crypto.randomUUID(), name, commissionRate }])}
                    onDeleteItem={(id) => handleUpdate('advisors', advisors.filter(a => a.id !== id))}
                    onReorder={(items) => handleUpdate('advisors', items)}
                />
                <SettingsList 
                    title="Formas de Pagamento"
                    items={paymentMethods}
                    onAddItem={(item) => handleUpdate('payment_methods', [...paymentMethods, item])}
                    onDeleteItem={(item) => handleUpdate('payment_methods', paymentMethods.filter(i => i !== item))}
                    onReorder={(items) => handleUpdate('payment_methods', items)}
                />
                <CostCenterSettings
                    items={costCenters}
                    onAddItem={(name) => handleUpdate('cost_centers', [...costCenters, { id: crypto.randomUUID(), name, isDefault: false }])}
                    onDeleteItem={(id) => handleUpdate('cost_centers', costCenters.filter(c => c.id !== id))}
                    onReorder={(items) => handleUpdate('cost_centers', items)}
                />
                <div className="lg:col-span-2">
                    <BackupSettings onBackup={onBackup} onRestore={onRestore} />
                </div>
                 <ActivityLogSettings logs={logs} />
            </div>
        </div>
    );
};

// --- NOVOS MODAIS DE IMPORTAÇÃO ---
const PDFInfoModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importação de Extratos PDF" size="md">
            <div className="space-y-4 text-text-secondary">
                <p>A importação direta de arquivos PDF é um desafio técnico complexo, pois o layout dos extratos varia muito entre os bancos.</p>
                <p className="font-semibold text-text-primary">Para garantir a melhor experiência e precisão dos dados, recomendamos a seguinte abordagem:</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>Acesse o portal do seu banco e verifique se há uma opção para exportar seu extrato no formato <strong className="text-primary">CSV</strong> ou <strong className="text-primary">OFX</strong>. Esses formatos são mais consistentes para importação.</li>
                    <li>Se apenas PDF estiver disponível, você pode usar ferramentas online para converter o PDF para CSV.</li>
                    <li>Após obter o arquivo CSV, utilize nossa função <strong className="text-primary">"Importar CSV"</strong> para um processo de importação mais confiável.</li>
                </ol>
            </div>
             <div className="flex justify-end gap-4 pt-6">
                <Button onClick={onClose}>Entendi</Button>
            </div>
        </Modal>
    );
};

interface CSVMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    csvData: { headers: string[]; rows: string[][] };
    onConfirm: (mappedTransactions: Partial<Transaction>[]) => void;
}

const CSVMapModal: FC<CSVMapModalProps> = ({ isOpen, onClose, csvData, onConfirm }) => {
    const [mapping, setMapping] = useState<{ date: string; description: string; amount: string }>({
        date: '', description: '', amount: ''
    });

    const handleMappingChange = (field: keyof typeof mapping, header: string) => {
        setMapping(prev => ({ ...prev, [field]: header }));
    };

    const handleSubmit = () => {
        const { date, description, amount } = mapping;
        if (!date || !description || !amount) {
            alert("Por favor, mapeie todas as colunas obrigatórias: Data, Descrição e Valor.");
            return;
        }

        const dateIndex = csvData.headers.indexOf(date);
        const descriptionIndex = csvData.headers.indexOf(description);
        const amountIndex = csvData.headers.indexOf(amount);
        
        const parseDate = (dateStr: string): Date => {
            if (!dateStr) return new Date();
            // Tenta DD/MM/YYYY
            const partsSlash = dateStr.split('/');
            if (partsSlash.length === 3 && partsSlash[2].length === 4) {
                return new Date(parseInt(partsSlash[2]), parseInt(partsSlash[1]) - 1, parseInt(partsSlash[0]));
            }
            // Tenta YYYY-MM-DD
            const partsDash = dateStr.split('-');
            if (partsDash.length === 3 && partsDash[0].length === 4) {
                 return new Date(parseInt(partsDash[0]), parseInt(partsDash[1]) - 1, parseInt(partsDash[2]));
            }
            // Fallback para o parser nativo que pode entender outros formatos
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
        }

        // FIX: Added an explicit return type to the map callback to resolve a TypeScript error
        // with the type predicate in the following filter call.
        const mapped = csvData.rows.map((row): Partial<Transaction> | null => {
            const amountStr = row[amountIndex]?.replace(/[R$\s.]/g, '').replace(',', '.').trim();
            const parsedAmount = parseFloat(amountStr);
            if (isNaN(parsedAmount)) return null;

            return {
                date: parseDate(row[dateIndex]).toISOString(),
                description: row[descriptionIndex],
                amount: Math.abs(parsedAmount),
                type: parsedAmount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                category: 'Importado (CSV)',
                client_supplier: 'Extrato Bancário',
                payment_method: 'N/A',
                status: ExpenseStatus.PAID,
            }
        }).filter((t): t is Partial<Transaction> => t !== null);

        onConfirm(mapped);
    };

    if (!isOpen) return null;

    const requiredFields: (keyof typeof mapping)[] = ['date', 'description', 'amount'];
    const fieldLabels: Record<keyof typeof mapping, string> = { date: 'Data da Transação', description: 'Descrição', amount: 'Valor' };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mapear Colunas do CSV" size="lg">
            <p className="text-text-secondary mb-4">Associe as colunas do seu arquivo CSV aos campos do sistema.</p>
            <div className="space-y-4 mb-6">
                {requiredFields.map(field => (
                    <div key={field} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                        <label className="font-semibold text-text-primary">{fieldLabels[field]}</label>
                        <select
                            value={mapping[field]}
                            onChange={(e) => handleMappingChange(field, e.target.value)}
                            className="w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
                        >
                            <option value="">Selecione uma coluna...</option>
                            {csvData.headers.map(header => <option key={header} value={header}>{header}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            
            <h4 className="text-lg font-bold mb-2">Pré-visualização dos Dados</h4>
            <div className="overflow-x-auto max-h-48 border border-border-color rounded-md">
                 <table className="min-w-full text-sm">
                    <thead className="bg-background sticky top-0">
                        <tr>{csvData.headers.map(h => <th key={h} className="p-2 text-left text-text-secondary font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {csvData.rows.slice(0, 3).map((row, i) => (
                            <tr key={i} className="border-t border-border-color">
                                {row.map((cell, j) => <td key={j} className="p-2 whitespace-nowrap text-text-secondary">{cell}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleSubmit}>Revisar Importação</Button>
            </div>
        </Modal>
    );
};


// --- NOVA VIEW DE INSIGHTS (IA) ---
const InsightsView: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    // --- State for AI Features ---
    const [recommendations, setRecommendations] = useState('');
    const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // --- Predictive Analysis Logic ---
    const predictiveAnalysis = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        if (recentTransactions.length < 5) {
            return { message: "Dados insuficientes nos últimos 30 dias para uma projeção confiável.", days: null, status: 'info' };
        }

        const netChange = recentTransactions.reduce((acc, t) => {
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            return acc + amount;
        }, 0);

        const dailyBurnRate = netChange / 30;
        
        const currentBalance = transactions.reduce((acc, t) => {
            if (t.cost_center === 'provisao-impostos') return acc; // Exclude tax provision from operational cash
             const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            return acc + amount;
        }, 0);

        if (dailyBurnRate >= 0) {
            return { message: `Seu fluxo de caixa nos últimos 30 dias foi positivo em ${formatCurrency(dailyBurnRate)}/dia.`, days: Infinity, status: 'success' };
        }

        if (currentBalance <= 0) {
             return { message: "Seu saldo operacional atual é zero ou negativo.", days: 0, status: 'danger' };
        }
        
        const daysToZero = Math.floor(-currentBalance / dailyBurnRate);
        return { message: `Mantendo o ritmo dos últimos 30 dias, seu caixa pode zerar em aproximadamente ${daysToZero} dias.`, days: daysToZero, status: 'danger' };

    }, [transactions]);
    
    // --- Handlers for AI Features ---
    const handleGenerateRecommendations = async () => {
        setIsRecommendationsLoading(true);
        setRecommendations('');
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recentTransactions = transactions.filter(t => new Date(t.date) >= lastMonth);
            const totalIncome = recentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const totalExpense = recentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const expenseByCat = recentTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

            // FIX: Explicitly typed 'a' and 'b' parameters in sort callback to allow arithmetic subtraction and resolve type errors.
            const topExpensesList = Object.entries(expenseByCat)
                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                .slice(0,5)
                .map(([cat, amt]) => `  - ${cat}: ${formatCurrency(amt)}`)
                .join('\n');

            const summary = `
- Receita Total (últimos 30 dias): ${formatCurrency(totalIncome)}
- Despesa Total (últimos 30 dias): ${formatCurrency(totalExpense)}
- Lucro/Prejuízo (últimos 30 dias): ${formatCurrency(totalIncome - totalExpense)}
- Top 5 Despesas por Categoria:
${topExpensesList}
            `;

            const result = await generateFinancialInsights(summary);
            setRecommendations(result);
        } catch (error) {
            setRecommendations("Ocorreu um erro ao gerar as recomendações. Tente novamente.");
            console.error(error);
        } finally {
            setIsRecommendationsLoading(false);
        }
    };
    
    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;
        
        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            // Prepare a simplified version of transactions for the prompt
            const transactionDataString = transactions
                .slice(-100) // Limit to last 100 transactions to manage token count
                .map(t => `${formatDate(t.date)}, ${t.type}, ${formatCurrency(t.amount)}, ${t.category}, ${t.description}, ${t.client_supplier}`)
                .join('\n');
            
            const aiResponseText = await getChatResponse(newUserMessage.text, transactionDataString);
            const newAiMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'ai', text: aiResponseText };
            setChatMessages(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'ai', text: 'Desculpe, ocorreu um erro ao processar sua pergunta.' };
            setChatMessages(prev => [...prev, errorMessage]);
            console.error(error);
        } finally {
            setIsChatLoading(false);
        }
    };
    
     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Insights com Inteligência Artificial</h2>
            
            <Card>
                <h3 className="text-xl font-bold mb-2">Análise Preditiva de Caixa</h3>
                <p className="text-sm text-text-secondary mb-4">Projeção baseada na média de entradas e saídas dos últimos 30 dias.</p>
                <div className={`p-4 rounded-lg text-center ${predictiveAnalysis.status === 'success' ? 'bg-green-500/20 text-green-300' : predictiveAnalysis.status === 'danger' ? 'bg-danger/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    <p className="font-semibold">{predictiveAnalysis.message}</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-bold mb-2">Recomendações Financeiras</h3>
                    <p className="text-sm text-text-secondary mb-4">Clique no botão para que a IA analise seus dados recentes e sugira ações para otimizar suas finanças.</p>
                    <Button onClick={handleGenerateRecommendations} disabled={isRecommendationsLoading}>
                        <SparklesIcon className="w-5 h-5"/> {isRecommendationsLoading ? 'Analisando...' : 'Gerar Recomendações'}
                    </Button>
                    {isRecommendationsLoading && <div className="text-center mt-4 text-text-secondary">Aguarde, a IA está processando seus dados...</div>}
                    {recommendations && (
                        <div className="mt-4 p-4 bg-background rounded-lg space-y-2 text-text-secondary whitespace-pre-wrap">
                           {recommendations.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                        </div>
                    )}
                </Card>
                
                 <Card className="flex flex-col">
                    <h3 className="text-xl font-bold mb-2">Chat Financeiro</h3>
                    <p className="text-sm text-text-secondary mb-4">Faça perguntas sobre suas finanças em linguagem natural.</p>
                     <div ref={chatContainerRef} className="flex-grow bg-background rounded-lg p-4 space-y-4 overflow-y-auto h-64 mb-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-surface'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                             <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-surface">
                                    <p className="text-sm text-text-secondary animate-pulse">Pensando...</p>
                                </div>
                            </div>
                        )}
                         {chatMessages.length === 0 && !isChatLoading && (
                            <div className="text-center text-text-secondary text-sm pt-8">
                                <p>Ex: "Qual foi meu lucro em setembro?"</p>
                                <p>ou "Liste minhas 3 maiores despesas."</p>
                            </div>
                         )}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Pergunte à IA..."
                            className="flex-grow bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-sm"
                            disabled={isChatLoading}
                        />
                        <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                            <SendIcon className="w-5 h-5" />
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const MainApp: FC = () => {
    const { currentUser, permissions } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<string[]>(initialIncomeCategories);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
    const [paymentMethods, setPaymentMethods] = useState<string[]>(initialPaymentMethods);
    const [costCenters, setCostCenters] = useState<CostCenter[]>(initialCostCenters);
    const [advisors, setAdvisors] = useState<Advisor[]>(initialAdvisors);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State para Modais
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [newTransactionType, setNewTransactionType] = useState<TransactionType | null>(null);
    const [isImportReviewModalOpen, setIsImportReviewModalOpen] = useState(false);
    const [parsedTransactions, setParsedTransactions] = useState<Partial<Transaction>[]>([]);
    const [isCsvMapModalOpen, setIsCsvMapModalOpen] = useState(false);
    const [csvData, setCsvData] = useState<{ headers: string[], rows: string[][] } | null>(null);
    const [isPdfInfoModalOpen, setIsPdfInfoModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [selectedForImport, setSelectedForImport] = useState<Set<number>>(new Set());
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

    const importFileRef = useRef<HTMLInputElement>(null);
    const importFileTypeRef = useRef<'ofx' | 'csv' | null>(null);

    // --- DATA FETCHING ---
    const fetchTransactions = async () => {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error) console.error("Error fetching transactions:", error);
        else setTransactions(data || []);
    };
    const fetchGoals = async () => {
        const { data, error } = await supabase.from('goals').select('*');
        if (error) console.error("Error fetching goals:", error);
        else setGoals(data || []);
    };
    const fetchLogs = async () => {
        const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);
        if (error) console.error("Error fetching logs:", error);
        else setActivityLogs(data as ActivityLog[] || []);
    };
    const fetchSettings = async () => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('settings').select('*').eq('user_id', currentUser.id).single();
        if (data) {
            setIncomeCategories(data.income_categories || initialIncomeCategories);
            setExpenseCategories(data.expense_categories || initialExpenseCategories);
            setPaymentMethods(data.payment_methods || initialPaymentMethods);
            setCostCenters(data.cost_centers || initialCostCenters);
            setAdvisors(data.advisors || initialAdvisors);
        } else if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error, use defaults
             console.error("Error fetching settings:", error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchTransactions();
            fetchGoals();
            fetchLogs();
            fetchSettings();
        }
    }, [currentUser]);
    

    const logActivity = async (action: string, details: string) => {
        if (!currentUser) return;
        const newLog = {
            user_display_name: currentUser.username,
            action,
            details
        };
        const { error } = await supabase.from('activity_logs').insert(newLog);
        if (error) console.error('Error logging activity:', error);
        else await fetchLogs(); // Refresh logs
    };

    const pageTitle = useMemo(() => {
        const titles: Record<View, string> = {
            dashboard: 'Dashboard',
            transactions: 'Transações',
            goals: 'Metas Financeiras',
            reports: 'Relatórios',
            insights: 'Insights (IA)',
            settings: 'Configurações',
        };
        return titles[activeView];
    }, [activeView]);

    const handleAddTransaction = async (data: TransactionFormValues) => {
        const isRevenueWithCommission = data.type === TransactionType.INCOME && data.advisor_id && data.commission_amount && data.commission_amount > 0;
        const isRecurringExpense = data.type === TransactionType.EXPENSE && data.nature === ExpenseNature.FIXED && data.recurringCount && data.recurringCount > 0;

        await logActivity(
            'Criar Transação',
            `${data.type === 'income' ? 'Receita' : 'Despesa'}: ${data.description} - ${formatCurrency(data.amount)}` +
            (isRecurringExpense ? ` (recorrente ${data.recurringCount}x)` : '')
        );
        
        const transactionsToInsert: Omit<Transaction, 'id'>[] = [];
        
        if (isRevenueWithCommission) {
            const recurring_id = crypto.randomUUID();
            const advisor = advisors.find(a => a.id === data.advisor_id);
            transactionsToInsert.push({ ...data, amount: data.amount, recurring_id });
            transactionsToInsert.push({
                recurring_id,
                date: data.date,
                description: `Comissão ${advisor?.name} - ${data.description}`,
                amount: data.commission_amount!,
                type: TransactionType.EXPENSE,
                category: 'Remuneração de Assessores',
                client_supplier: advisor?.name || 'N/A',
                payment_method: data.payment_method,
                status: ExpenseStatus.PENDING,
                nature: ExpenseNature.VARIABLE,
                cost_center: data.cost_center
            });
        } else if (isRecurringExpense) {
            const recurring_id = crypto.randomUUID();
            const originalDate = new Date(data.date);
            for (let i = 0; i < data.recurringCount!; i++) {
                const newDate = new Date(originalDate);
                newDate.setUTCMonth(originalDate.getUTCMonth() + i);
                transactionsToInsert.push({
                    ...(data as Omit<TransactionFormValues, 'recurringCount'>),
                    amount: data.amount,
                    date: newDate.toISOString(),
                    description: data.description,
                    recurring_id,
                });
            }
        } else {
             transactionsToInsert.push({ ...(data as Omit<TransactionFormValues, 'recurringCount'>), amount: data.amount });
        }
        
        const { error } = await supabase.from('transactions').insert(transactionsToInsert.map(t => ({ ...t, user_id: currentUser?.id })));
        if (error) console.error('Error adding transaction:', error);
        else await fetchTransactions();

        closeTransactionModal();
    };
    
    const handleEditTransaction = async (data: TransactionFormValues) => {
        if (!editingTransaction) return;
        
        await logActivity('Editar Transação', `De: "${editingTransaction.description}" Para: "${data.description}" - ${formatCurrency(data.amount)}`);
    
        const { error } = await supabase
            .from('transactions')
            .update({ ...data })
            .eq('id', editingTransaction.id);
        
        if (error) console.error("Error updating transaction:", error);
        else await fetchTransactions();

        closeTransactionModal();
    };

    const handleDeleteTransaction = async (id: string, recurring_id?: string) => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (window.confirm("Tem certeza que deseja excluir esta transação? Se ela tiver uma comissão ou recorrência vinculada, tudo será excluído.")) {
            if (transactionToDelete) {
                await logActivity('Excluir Transação', `"${transactionToDelete.description}" - ${formatCurrency(transactionToDelete.amount)}`);
                
                let query = supabase.from('transactions');
                if (recurring_id) {
                    query = query.delete().eq('recurring_id', recurring_id);
                } else {
                    query = query.delete().eq('id', id);
                }
                const { error } = await query;

                if (error) console.error('Error deleting transaction:', error);
                else await fetchTransactions();
            }
        }
    };

    const handleBulkDeleteTransactions = async (idsToDelete: Set<string>) => {
        if (window.confirm(`Tem certeza que deseja excluir os ${idsToDelete.size} lançamentos selecionados? Esta ação não pode ser desfeita e excluirá quaisquer comissões ou receitas vinculadas.`)) {
            
            await logActivity('Excluir Transações em Massa', `${idsToDelete.size} itens excluídos.`);
            const recurringIdsFromSelection = new Set<string>();
            transactions.forEach(t => {
                if (idsToDelete.has(t.id) && t.recurring_id) {
                    recurringIdsFromSelection.add(t.recurring_id);
                }
            });
            
            const { error: errorRecurring } = await supabase.from('transactions').delete().in('recurring_id', Array.from(recurringIdsFromSelection));
            const { error: errorSingle } = await supabase.from('transactions').delete().in('id', Array.from(idsToDelete));

            if (errorRecurring || errorSingle) console.error("Error bulk deleting:", { errorRecurring, errorSingle });
            else await fetchTransactions();
            
            setSelectedTransactionIds(new Set());
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if(transaction) await logActivity('Marcar como Pago', `"${transaction.description}" - ${formatCurrency(transaction.amount)}`);
        
        const { error } = await supabase.from('transactions').update({ status: ExpenseStatus.PAID }).eq('id', id);
        if (error) console.error("Error marking as paid:", error);
        else await fetchTransactions();
    };

    const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'current_amount'>) => {
        await logActivity('Criar Meta', `"${goalData.name}" - ${formatCurrency(goalData.target_amount)}`);
        const { error } = await supabase.from('goals').insert({ ...goalData, current_amount: 0, user_id: currentUser?.id });
        if(error) console.error("Error adding goal:", error);
        else await fetchGoals();
        setIsGoalModalOpen(false);
    };
    
    const handleEditGoal = async (goalData: Omit<Goal, 'id' | 'current_amount'>) => {
        if (!editingGoal) return;
        await logActivity('Editar Meta', `De: "${editingGoal.name}" Para: "${goalData.name}"`);
        const { error } = await supabase.from('goals').update(goalData).eq('id', editingGoal.id);
        if(error) console.error("Error updating goal:", error);
        else await fetchGoals();
        setEditingGoal(null);
        setIsGoalModalOpen(false);
    };
    
    const handleDeleteGoal = async (id: string) => {
        const goalToDelete = goals.find(g => g.id === id);
        if (window.confirm("Tem certeza que deseja excluir esta meta?")) {
            if(goalToDelete) await logActivity('Excluir Meta', `"${goalToDelete.name}"`);
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if(error) console.error("Error deleting goal:", error);
            else await fetchGoals();
        }
    };

    const openAddTransactionModal = (type: TransactionType) => { 
        setEditingTransaction(null); 
        setNewTransactionType(type);
        setIsTransactionModalOpen(true); 
    };
    const openAddGoalModal = () => { setEditingGoal(null); setIsGoalModalOpen(true); };

    const openEditTransactionModal = (t: Transaction) => { 
        setNewTransactionType(null);
        setEditingTransaction(t); 
        setIsTransactionModalOpen(true); 
    };
    const openEditGoalModal = (g: Goal) => { setEditingGoal(g); setIsGoalModalOpen(true); };
    
    const closeTransactionModal = () => { 
        setEditingTransaction(null); 
        setNewTransactionType(null);
        setIsTransactionModalOpen(false); 
    };
    const closeGoalModal = () => { setEditingGoal(null); setIsGoalModalOpen(false); };
    
    const handleSettingsUpdate = async (settingsToUpdate: any) => {
        if (!currentUser) return;
        await logActivity('Atualizar Configurações', `Chaves: ${Object.keys(settingsToUpdate).join(', ')}`);
        const { error } = await supabase.from('settings').upsert({ ...settingsToUpdate, user_id: currentUser.id });
        if (error) console.error('Error updating settings:', error);
        else await fetchSettings();
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf', data: Transaction[]) => {
        logActivity('Exportar Dados', `Formato: ${format.toUpperCase()}, ${data.length} transações.`);
        const dataToExport = data.map(t => ({
            Data: formatDate(t.date),
            Descrição: t.description,
            Valor: t.amount,
            Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
            Categoria: t.category,
            "Cliente/Fornecedor": t.client_supplier,
            Status: t.status || 'N/A'
        }));

        if (format === 'csv' || format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transações");
            XLSX.writeFile(wb, `transacoes.${format}`);
        } else if (format === 'pdf') {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            doc.autoTable({
                head: [Object.keys(dataToExport[0])],
                body: dataToExport.map(Object.values),
            });
            doc.save('transacoes.pdf');
        }
    };

    const handleImport = (type: 'ofx' | 'csv' | 'pdf') => {
        if (type === 'pdf') {
            setIsPdfInfoModalOpen(true);
            return;
        }
        importFileTypeRef.current = type;
        if (importFileRef.current) {
            const acceptString = type === 'ofx' ? '.ofx,.txt' : '.csv';
            importFileRef.current.accept = acceptString;
            importFileRef.current.click();
        }
    };

    const isDuplicate = (tx: Partial<Transaction>, existing: Transaction[]): boolean => {
        if (!tx.date || !tx.description || tx.amount === undefined) return false;
        const txDateStr = formatDate(tx.date);
        return existing.some(t =>
            formatDate(t.date) === txDateStr &&
            t.description.trim() === tx.description?.trim() &&
            t.amount === tx.amount
        );
    };

    const processAndReviewImportedData = (parsed: Partial<Transaction>[]) => {
        const nonDuplicates = parsed.filter(p => !isDuplicate(p, transactions));
        
        if (nonDuplicates.length > 0) {
            setParsedTransactions(nonDuplicates);
            setSelectedForImport(new Set(nonDuplicates.map((_, index) => index))); // Select all by default
            setIsImportReviewModalOpen(true);
        } else {
            alert("Nenhuma transação nova foi encontrada no arquivo. As transações podem já existir no sistema.");
        }
    };

    const parseOfx = (ofxContent: string): Partial<Transaction>[] => {
        const transactions: Partial<Transaction>[] = [];
        const transactionBlocks = ofxContent.split('<STMTTRN>');
        transactionBlocks.shift();

        for (const block of transactionBlocks) {
            const dateMatch = block.match(/<DTPOSTED>([0-9]{8})/);
            const amountMatch = block.match(/<TRNAMT>([^<]+)/);
            const memoMatch = block.match(/<MEMO>([^<]+)/);

            if (dateMatch && amountMatch && memoMatch) {
                const amount = parseFloat(amountMatch[1]);
                const dateStr = dateMatch[1];
                const date = new Date(parseInt(dateStr.substring(0, 4)), parseInt(dateStr.substring(4, 6)) - 1, parseInt(dateStr.substring(6, 8)));
                
                transactions.push({
                    date: date.toISOString(),
                    description: memoMatch[1].trim(),
                    amount: Math.abs(amount),
                    type: amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    category: 'Importado',
                    client_supplier: 'Extrato Bancário',
                    payment_method: 'N/A',
                    status: ExpenseStatus.PAID,
                });
            }
        }
        return transactions;
    };
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const type = importFileTypeRef.current;
        if (file && type) {
            logActivity('Iniciar Importação', `Arquivo: ${file.name}, Tipo: ${type.toUpperCase()}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (type === 'ofx') {
                    const parsed = parseOfx(content);
                    processAndReviewImportedData(parsed);
                } else if (type === 'csv') {
                    const lines = content.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
                    if (lines.length < 2) {
                        alert("Arquivo CSV inválido ou vazio.");
                        return;
                    }
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim())).filter(row => row.length === headers.length && row.some(cell => cell));
                    setCsvData({ headers, rows });
                    setIsCsvMapModalOpen(true);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = ''; // Reset input
    };

    const handleConfirmCsvImport = (mappedTransactions: Partial<Transaction>[]) => {
        setIsCsvMapModalOpen(false);
        if (mappedTransactions.length > 0) {
            processAndReviewImportedData(mappedTransactions);
        } else {
            alert("Nenhuma transação pôde ser mapeada. Verifique o mapeamento e o formato dos dados no arquivo.");
        }
    };


    const handleConfirmImport = async () => {
        const transactionsToAdd = parsedTransactions
            .filter((_, index) => selectedForImport.has(index))
            .map(t => ({ ...t, user_id: currentUser?.id }));
        
        await logActivity('Confirmar Importação', `${transactionsToAdd.length} transações importadas.`);
        
        const { error } = await supabase.from('transactions').insert(transactionsToAdd);
        if (error) console.error("Error confirming import:", error);
        else await fetchTransactions();
        
        setIsImportReviewModalOpen(false);
        setParsedTransactions([]);
        setSelectedForImport(new Set());
    };
    
    const handleBackup = () => {
        logActivity('Fazer Backup', 'Dados do LocalStorage exportados para arquivo JSON.');
        const backupData = {
            transactions,
            goals,
            activityLogs,
            incomeCategories,
            expenseCategories,
            paymentMethods,
            costCenters,
            advisors,
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeer_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("Backup do LocalStorage criado com sucesso!");
    };
    
    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!window.confirm("Atenção: Restaurar um backup substituirá todos os dados do NAVEGADOR. Isso não afeta o banco de dados. Deseja continuar?")) {
            e.target.value = '';
            return;
        }
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.transactions && data.goals && data.incomeCategories) {
                        setTransactions(data.transactions);
                        setGoals(data.goals);
                        setActivityLogs(data.activityLogs || []);
                        setIncomeCategories(data.incomeCategories);
                        setExpenseCategories(data.expenseCategories);
                        setPaymentMethods(data.paymentMethods);
                        setCostCenters(data.costCenters);
                        setAdvisors(data.advisors || []);
                        alert("Dados locais restaurados com sucesso!");
                    } else { throw new Error("Formato de arquivo inválido."); }
                } catch (error) {
                    alert("Erro ao restaurar backup: O arquivo está corrompido ou não é um backup válido.");
                } finally { e.target.value = ''; }
            };
            reader.readAsText(file);
        }
    };
    
    const openAddProgressModal = (goal: Goal) => {
        setSelectedGoal(goal);
        setIsProgressModalOpen(true);
    };

    const handleAddProgress = async (amount: number) => {
        if (!selectedGoal) return;
        await logActivity('Adicionar Progresso a Meta', `Meta: "${selectedGoal.name}", Valor: ${formatCurrency(amount)}`);
        
        const newAmount = selectedGoal.current_amount + amount;
        const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', selectedGoal.id);
        if (error) console.error("Error adding progress:", error);
        else await fetchGoals();
        
        setIsProgressModalOpen(false);
        setSelectedGoal(null);
    };

    const handleImportSelectionChange = (index: number) => {
        setSelectedForImport(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleSelectAllForImport = (isChecked: boolean) => {
        if (isChecked) {
            setSelectedForImport(new Set(parsedTransactions.map((_, i) => i)));
        } else {
            setSelectedForImport(new Set());
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return permissions.canViewDashboard && <DashboardView transactions={transactions} goals={goals} />;
            case 'transactions': return permissions.canViewTransactions && <TransactionsView transactions={transactions} costCenters={costCenters} incomeCategories={incomeCategories} expenseCategories={expenseCategories} onEdit={openEditTransactionModal} onDelete={handleDeleteTransaction} onAdd={openAddTransactionModal} onMarkAsPaid={handleMarkAsPaid} onExport={handleExport} onImport={handleImport} onBulkDelete={handleBulkDeleteTransactions} selectedIds={selectedTransactionIds} onSelect={setSelectedTransactionIds}/>;
            case 'goals': return permissions.canViewGoals && <GoalsView goals={goals} onEdit={openEditGoalModal} onDelete={handleDeleteGoal} onAdd={openAddGoalModal} onAddProgress={openAddProgressModal} />;
            case 'reports': return permissions.canViewReports && <ReportsView transactions={transactions} expenseCategories={expenseCategories} />;
            case 'insights': return permissions.canViewDashboard && <InsightsView transactions={transactions} />;
            case 'settings': return permissions.canViewSettings && <SettingsView 
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
                paymentMethods={paymentMethods}
                costCenters={costCenters}
                advisors={advisors}
                logs={activityLogs}
                onSettingsUpdate={handleSettingsUpdate}
                onBackup={handleBackup}
                onRestore={handleRestore}
            />;
            default: return <DashboardView transactions={transactions} goals={goals} />;
        }
    };
    
    return (
        <div className="flex h-screen bg-background">
            <input type="file" ref={importFileRef} onChange={handleFileSelect} className="hidden" />
            <Sidebar activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header pageTitle={pageTitle} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                 {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
            
            <Modal 
                isOpen={isTransactionModalOpen} 
                onClose={closeTransactionModal} 
                title={editingTransaction ? "Editar Transação" : (newTransactionType === TransactionType.INCOME ? "Adicionar Receita" : "Adicionar Despesa")}
            >
                <TransactionForm
                    onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
                    onClose={closeTransactionModal}
                    initialData={editingTransaction}
                    defaultType={newTransactionType}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    paymentMethods={paymentMethods}
                    costCenters={costCenters}
                    advisors={advisors}
                />
            </Modal>
             <Modal isOpen={isGoalModalOpen} onClose={closeGoalModal} title={editingGoal ? "Editar Meta" : "Adicionar Meta"}>
                <GoalForm 
                    onSubmit={editingGoal ? handleEditGoal : handleAddGoal} 
                    onClose={closeGoalModal} 
                    initialData={editingGoal} 
                />
            </Modal>
             <Modal
                isOpen={isProgressModalOpen}
                onClose={() => setIsProgressModalOpen(false)}
                title={`Adicionar Progresso: "${selectedGoal?.name}"`}
                size="sm"
             >
                <AddProgressForm
                    onSubmit={handleAddProgress}
                    onClose={() => setIsProgressModalOpen(false)}
                />
             </Modal>
             <Modal isOpen={isImportReviewModalOpen} onClose={() => setIsImportReviewModalOpen(false)} title={`Revisar e Selecionar Transações para Importar`} size="xl">
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="min-w-full divide-y divide-border-color">
                        <thead className="bg-background sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                                     <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={selectedForImport.size === parsedTransactions.length && parsedTransactions.length > 0}
                                        onChange={(e) => handleSelectAllForImport(e.target.checked)}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Valor</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-border-color">
                            {parsedTransactions.map((t, index) => (
                                <tr key={index} className={`${selectedForImport.has(index) ? 'bg-background' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedForImport.has(index)}
                                            onChange={() => handleImportSelectionChange(index)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{t.date ? formatDate(t.date) : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{t.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-danger'}`}>{t.amount ? formatCurrency(t.amount) : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center pt-6">
                    <p className="text-sm text-text-secondary">{selectedForImport.size} de {parsedTransactions.length} transações selecionadas.</p>
                    <div className="flex gap-4">
                        <Button onClick={() => setIsImportReviewModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handleConfirmImport} disabled={selectedForImport.size === 0}>
                            Confirmar Importação ({selectedForImport.size})
                        </Button>
                    </div>
                </div>
            </Modal>
            {csvData && <CSVMapModal isOpen={isCsvMapModalOpen} onClose={() => setIsCsvMapModalOpen(false)} csvData={csvData} onConfirm={handleConfirmCsvImport} />}
            <PDFInfoModal isOpen={isPdfInfoModalOpen} onClose={() => setIsPdfInfoModalOpen(false)} />
        </div>
    );
};


const App: FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const AppContent: FC = () => {
    const { session, loading } = useAuth();
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-text-primary text-xl">Carregando...</div>
            </div>
        )
    }
    
    if (!session) {
        return <Login />;
    }
    return <MainApp />;
}

export default App;
