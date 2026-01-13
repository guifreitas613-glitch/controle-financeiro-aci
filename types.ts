
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
  taxRate?: number;
  grossAmount?: number;
  commissionAmount?: number;
  advisorId?: string;
  splits?: AdvisorSplit[];
}

export interface ImportedRevenue {
    id: string;
    date: string; // ISO string (coluna Data) - Padronizado para 'date'
    conta: string; // coluna Conta
    cliente: string; // coluna Cliente
    codAssessor: string; // coluna Cod Assessor
    assessorPrincipal: string; // coluna Assessor Principal
    classificacao: string; // coluna Classificação
    produtoCategoria: string; // coluna Produto/Categoria
    ativo: string; // coluna Ativo
    tipoReceita: string; // coluna Tipo Receita
    receitaLiquidaEQI: number; // coluna Receita Liquida EQI
    percentualRepasse: number; // coluna % Repasse
    comissaoLiquida: number; // coluna Comissão Líquida
    tipo: string; // coluna Tipo
}

export interface AdvisorSplit {
    advisorId: string;
    advisorName: string;
    revenueAmount: number;
    percentage: number;
    // Computed fields optionally stored
    crmCost?: number; // Mantido para compatibilidade, mas agora representa a soma dos custos
    netPayout?: number;
    additionalCost?: number; // Campo local para custo adicional na tela de rateio
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

export interface AdvisorCost {
    description: string;
    value: number; // Valor negativo geralmente
}

export interface Advisor {
    id: string;
    name: string;
    commissionRate: number; // Percentage
    costs?: AdvisorCost[]; // Lista de custos variáveis
    // Deprecated: crmCost?: number; 
}

export interface ExpenseCategory {
    name: string;
    type: ExpenseType; // Custo ou Despesa
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
  quotas: number;
}

export type View = 'dashboard' | 'transactions' | 'imported-revenues' | 'goals' | 'reports' | 'settings' | 'partnership';

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
