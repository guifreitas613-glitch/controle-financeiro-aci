export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum ExpenseStatus {
    PAID = 'paga',
    PENDING = 'pendente',
}

// Renamed from ExpenseSubcategory for clarity
export enum ExpenseNature {
    FIXED = 'fixo',
    VARIABLE = 'variavel',
}

// New type to classify expenses for DRE
export enum ExpenseType {
    COST = 'custo', // Custo do Serviço Prestado
    EXPENSE = 'despesa', // Despesa Operacional
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number; // Net amount for income, total for expense
  type: TransactionType;
  category: string;
  clientSupplier: string; // Cliente para receitas, Fornecedor para despesas
  paymentMethod: string;
  status?: ExpenseStatus; // Apenas para despesas
  nature?: ExpenseNature; // Apenas para despesas (Fixo/Variável)
  recurringId?: string; // Para agrupar transações (e.g., receita + comissão)
  attachment?: string; // Placeholder para nome do anexo
  costCenter?: string; // Centro de custo
  taxAmount?: number; // Valor do imposto provisionado para receitas

  // New fields for investment office logic
  grossAmount?: number; // For income: gross value before commission
  commissionAmount?: number; // For income: commission paid to advisor
  advisorId?: string; // Link to an Advisor
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

// New interfaces for DRE structure
export interface Advisor {
    id: string;
    name:string;
    commissionRate: number; // Percentage
}

export interface ExpenseCategory {
    name: string;
    type: ExpenseType; // Custo ou Despesa
}


export type View = 'dashboard' | 'transactions' | 'goals' | 'reports' | 'settings';

// FIX: Added AspectRatio type to be used for image generation.
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
