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
  user_id?: string; // Foreign key to user
  date: string; // ISO string
  description: string;
  amount: number; // Net amount for income, total for expense
  type: TransactionType;
  category: string;
  client_supplier: string; // Cliente para receitas, Fornecedor para despesas
  payment_method: string;
  status?: ExpenseStatus; // Apenas para despesas
  nature?: ExpenseNature; // Apenas para despesas (Fixo/Variável)
  recurring_id?: string; // Para agrupar transações (e.g., receita + comissão)
  attachment?: string; // Placeholder para nome do anexo
  cost_center?: string; // Centro de custo
  tax_amount?: number; // Valor do imposto provisionado para receitas

  // New fields for investment office logic
  gross_amount?: number; // For income: gross value before commission
  commission_amount?: number; // For income: commission paid to advisor
  advisor_id?: string; // Link to an Advisor
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
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


export type View = 'dashboard' | 'transactions' | 'goals' | 'reports' | 'settings' | 'insights';

// FIX: Added AspectRatio type to be used for image generation.
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

// --- AUTHENTICATION TYPES ---
export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gestor',
  OPERATIONAL = 'Operacional',
  GUEST = 'Convidado',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
}

// --- NEW TYPES FOR AI & LOGS ---
export interface ActivityLog {
    id: string;
    timestamp: string; // ISO string
    user_display_name: string;
    action: string;
    details: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}