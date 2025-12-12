
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum ExpenseStatus {
    PAID = 'paga',
    PENDING = 'pendente',
}

export enum ExpenseNature {
    FIXED = 'fixo',
    VARIABLE = 'variavel',
}

export enum ExpenseType {
    COST = 'custo',
    EXPENSE = 'despesa',
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number; 
  type: TransactionType;
  category: string;
  clientSupplier: string; // Cliente para receitas, Fornecedor para despesas
  paymentMethod: string;
  status?: ExpenseStatus; // Apenas para despesas
  nature?: ExpenseNature; // Apenas para despesas (Fixo/Variável)
  recurringId?: string; // Para agrupar transações
  attachment?: string; 
  costCenter?: string;
  
  // Fields for Income Logic (Gross/Net/Commission)
  taxAmount?: number;
  grossAmount?: number;
  commissionAmount?: number;
  advisorId?: string;
}

export interface AdvisorSplit {
    advisorId: string;
    advisorName: string;
    revenueAmount: number;
    percentage: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO string
}

export interface CostCenter {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface Advisor {
    id: string;
    name: string;
    commissionRate: number; // Percentage
    crmCost?: number; // Valor negativo fixo mensal
}

export interface ExpenseCategory {
    name: string;
    type: ExpenseType; // Custo ou Despesa
}

export type View = 'dashboard' | 'transactions' | 'goals' | 'reports' | 'settings';

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";