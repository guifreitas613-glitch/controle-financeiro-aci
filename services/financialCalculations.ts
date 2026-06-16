import { Transaction, TransactionType, ExpenseStatus, ExpenseNature, CategoryStructuralType, IncomeCategory } from '../types';

export const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

export const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export const formatDateTime = (dateString: string) => 
    new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });

export const formatDateForInput = (dateString: string) => 
    new Date(dateString).toISOString().split('T')[0];

export const getMonthYear = (dateString: string) => 
    new Date(dateString).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const normalizeName = (name: string | undefined | null) => {
    if (!name) return '';
    return name.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export function deduplicateById<T extends { id?: string }>(array: T[]): T[] {
    const seen = new Set<string>();
    return array.filter(item => {
        if (!item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

export const calculateRevenueFields = (revenueAmount: number, estimatedTaxRate: number) => {
    const estimatedTax = round(revenueAmount * (estimatedTaxRate / 100));
    const estimatedNetRevenue = round(revenueAmount - estimatedTax);
    
    // receitaLiquida = receitaBruta - imposto
    // parcelaAssessor = receitaLiquida * 0.70
    // parcelaEscritorio = receitaLiquida * 0.30
    const advisorShare = round(estimatedNetRevenue * 0.70);
    const officeShare = round(estimatedNetRevenue * 0.30);
    
    return {
        advisorShare,
        officeShare,
        advisorNetTotal: advisorShare,
        referralAmount: 0,
        responsibleAdvisorNet: advisorShare,
        officeNetRevenue: officeShare,
        estimatedTax,
        estimatedNetRevenue,
        totalParcelaAssessor: advisorShare,
        totalParcelaEscritorio: officeShare
    };
};

export interface ImportableTransaction extends Partial<Transaction> {
    tempId: string;
    selected: boolean;
}

export const parseOFX = (content: string): ImportableTransaction[] => {
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
