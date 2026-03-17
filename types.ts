export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum ExpenseStatus {
    PAID = 'paga',
    PENDING = 'pendente',
    CLEARED = 'quitada',
}

export enum ExpenseNature {
    FIXED = 'fixo',
    VARIABLE = 'variavel',
}

export enum ExpenseType {
    COST = 'custo',
    EXPENSE = 'despesa',
    NON_OPERATIONAL = 'despesa_nao_operacional',
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
  reconciled?: boolean; // Novo campo para conciliação bancária
  // Field to identify projected transactions (e.g., predicted fixed expenses for future months)
  isProjection?: boolean;
  
  // Fields for Income Logic (Gross/Net/Commission)
  taxAmount?: number;
  taxRate?: number;
  grossAmount?: number;
  commissionAmount?: number;
  advisorId?: string;
  splits?: AdvisorSplit[];
}

export interface AdvisorParticipation {
    advisorId: string;
    advisorName: string;
    percentage: number; // Participation % (must sum to 100)
    comissaoBruta: number; // (Receita Bruta * 0.7) * (percentage / 100)
    imposto: number; // comissaoBruta * taxRate
}

export enum CommissionStatus {
    PENDING = 'pendente',
    COMMISSION_LAUNCHED = 'comissao_lancada',
    REVENUE_LAUNCHED = 'receita_lancada',
    TAX_PROVISIONED = 'imposto_provisionado',
    COMPLETED = 'completo'
}

export interface ImportedRevenue {
    id: string;
    date: string; // ISO string
    conta?: string; // Número da conta
    cliente: string;
    advisorId: string;
    advisorName: string;
    revenueAmount: number; // Receita gerada pelo assessor
    taxRate: number; // Percentual de imposto
    observacao: string;
    
    // Indicação
    referralAdvisorId?: string;
    referralAdvisorName?: string;
    referralPercentage?: number;

    // Campos Calculados
    advisorShare?: number; // 70%
    officeShare?: number; // 30%
    advisorTax?: number;
    officeTax?: number;
    advisorNetTotal?: number; // Parcela Assessor - Imposto Assessor
    referralAmount?: number;
    responsibleAdvisorNet?: number;
    officeNetRevenue?: number;
    totalTaxProvision?: number; // Imposto Assessor + Imposto Escritório
    
    // Novos campos operacionais
    advisorOperationalResult?: number;
    productionResult?: number;
    cashResult?: number;
    cashEntryAmount?: number;
    crmCost?: number;
    
    // Status e Rastreabilidade
    status?: CommissionStatus;
    transactionIds?: {
        commission?: string;
        revenue?: string;
        tax?: string;
        referral?: string;
    };
    // Deprecated
    lancamentosRealizados?: boolean;
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
    // Fix: Added missing optional properties to resolve type errors in App.tsx
    grossPayout?: number;
    taxAmount?: number;
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
    code?: string; // Código do assessor (ex: 18931632)
    commissionRate: number; // Percentage
    costs?: AdvisorCost[]; // Lista de custos variáveis
    // Deprecated: crmCost?: number; 
}

export enum CategoryStructuralType {
    RECEITA_OPERACIONAL = 'receita_operacional',
    RECEITA_NAO_OPERACIONAL = 'receita_nao_operacional',
    CUSTO = 'custo',
    DESPESA_OPERACIONAL = 'despesa_operacional',
    DEDUCAO_RECEITA = 'deducao_receita',
    INVESTIMENTO = 'investimento',
    SOCIETARIO = 'societario',
}

export interface IncomeCategory {
    name: string;
    tipoEstrutural: CategoryStructuralType;
    impactaDRE: boolean;
}

export interface ExpenseCategory {
    name: string;
    type: ExpenseType; // Custo ou Despesa (legacy)
    tipoEstrutural: CategoryStructuralType;
    impactaDRE: boolean;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
  quotas: number;
}

export type View = 'dashboard' | 'transactions' | 'imported-revenues' | 'goals' | 'reports' | 'settings' | 'partnership';

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";