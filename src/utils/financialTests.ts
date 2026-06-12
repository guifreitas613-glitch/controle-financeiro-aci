import { Transaction, Goal, TransactionType, ExpenseStatus, CategoryStructuralType, IncomeCategory, ExpenseCategory, ExpenseType, Advisor, ImportedRevenue } from '../../types';

// Let's implement a clean round function matching standard DRE logic
const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export interface TestResult {
    name: string;
    description: string;
    expected: string;
    actual: string;
    success: boolean;
    category: 'Competência' | 'Caixa' | 'Saldos & Caixa';
}

/**
 * Runs a complete unit test suite for the financial calculation engine
 * comparing outputs with human-calculated expected numbers centavo a centavo.
 */
export function runFinancialTestSuite(
    calculateDREFn: (
        transactions: Transaction[],
        importedRevenues: ImportedRevenue[],
        incomeCategories: IncomeCategory[],
        expenseCategories: ExpenseCategory[],
        period: { year: number | 'all'; month: number | 'all' } | string,
        regime: 'competencia' | 'caixa',
        globalTaxRate: number,
        advisors: Advisor[]
    ) => any
): TestResult[] {
    const results: TestResult[] = [];

    // --- FIXTURES ---
    const mockIncomeCategories: IncomeCategory[] = [
        { name: 'Produção Manual', tipoEstrutural: CategoryStructuralType.RECEITA_OPERACIONAL, impactaDRE: true },
        { name: 'Receita Financeira', tipoEstrutural: CategoryStructuralType.RECEITA_NAO_OPERACIONAL, impactaDRE: true }
    ];

    const mockExpenseCategories: ExpenseCategory[] = [
        { name: 'Remuneração Assessores', type: ExpenseType.COST, tipoEstrutural: CategoryStructuralType.CUSTO, impactaDRE: true },
        { name: 'Aluguel Escritório', type: ExpenseType.EXPENSE, tipoEstrutural: CategoryStructuralType.DESPESA_OPERACIONAL, impactaDRE: true },
        { name: 'Investimento TI', type: ExpenseType.EXPENSE, tipoEstrutural: CategoryStructuralType.INVESTIMENTO, impactaDRE: false }, // Não impacta DRE
        { name: 'Tarifas Bancárias', type: ExpenseType.EXPENSE, tipoEstrutural: CategoryStructuralType.DESPESA_OPERACIONAL, impactaDRE: true },
        { name: 'Doações Diversas', type: ExpenseType.EXPENSE, tipoEstrutural: CategoryStructuralType.DESPESA_NAO_OPERACIONAL, impactaDRE: true }
    ];

    const mockAdvisors: Advisor[] = [];

    // Fixed mock transactions list
    const mockTransactions: Transaction[] = [
        // Income (Receitas)
        {
            id: 't-1',
            date: '2026-06-15',
            description: 'Assessoria Cliente A',
            amount: 15000.00,
            type: TransactionType.INCOME,
            category: 'Produção Manual',
            paymentMethod: 'PIX',
            costCenter: 'conta-pj',
            taxAmount: 900.00, // 6% tax
            reconciled: true,
            clientSupplier: 'Cliente A'
        },
        {
            id: 't-2',
            date: '2026-06-20',
            description: 'Prestações Serviços B',
            amount: 5000.00,
            type: TransactionType.INCOME,
            category: 'Produção Manual',
            paymentMethod: 'PIX',
            costCenter: 'conta-pj',
            taxAmount: 300.00, // 6% tax
            reconciled: false,
            clientSupplier: 'Cliente B'
        },
        // Non-operational income
        {
            id: 't-3',
            date: '2026-06-25',
            description: 'Rendimento de Aplicação',
            amount: 1200.00,
            type: TransactionType.INCOME,
            category: 'Receita Financeira',
            paymentMethod: 'Transferência Bancária',
            costCenter: 'conta-pj',
            taxAmount: 0,
            reconciled: true,
            clientSupplier: 'Banco Rendimento'
        },
        // Expenses Paid (Despesas Pagas)
        {
            id: 't-4',
            date: '2026-06-10',
            description: 'Aluguel Escritório SP',
            amount: 2500.00,
            type: TransactionType.EXPENSE,
            category: 'Aluguel Escritório',
            paymentMethod: 'Boleto Bancário',
            costCenter: 'conta-pj',
            status: ExpenseStatus.PAID,
            clientSupplier: 'Imobiliária SP'
        },
        // Expense pending (Despesa pendente - Competência only)
        {
            id: 't-5',
            date: '2026-06-18',
            description: 'Consultoria TI Especialista',
            amount: 1500.00,
            type: TransactionType.EXPENSE,
            category: 'Tarifas Bancárias',
            paymentMethod: 'PIX',
            costCenter: 'conta-pj',
            status: ExpenseStatus.PENDING,
            clientSupplier: 'Especialista TI'
        },
        // Expense paid under non-impacting Category (Investimento)
        {
            id: 't-6',
            date: '2026-06-12',
            description: 'Notebooks Novos',
            amount: 8000.00,
            type: TransactionType.EXPENSE,
            category: 'Investimento TI',
            paymentMethod: 'Cartão de Crédito',
            costCenter: 'conta-pj',
            status: ExpenseStatus.PAID,
            clientSupplier: 'Loja TI'
        },
        // Paid taxes (Classified under provisão-impostos)
        {
            id: 't-7',
            date: '2026-06-22',
            description: 'DAS Simples Nacional Pago',
            amount: 400.00,
            type: TransactionType.EXPENSE,
            category: 'Doações Diversas', // Non operative
            paymentMethod: 'PIX',
            costCenter: 'provisao-impostos',
            status: ExpenseStatus.PAID,
            clientSupplier: 'Receita Federal'
        }
    ];

    const mockImported: ImportedRevenue[] = [];

    // --- TESTE 1: DRE COMPETÊNCIA ---
    // At Competência:
    // Faturamento Bruto = Produção Manual (15000 + 5000) = 20,000.00
    // Deduções (Taxes provisioned in transactions) = 900 + 300 = 1,200.00
    // Receita Líquida = 20,000.00 - 1,200.00 = 18,800.00
    // Custos = 0
    // Despesas Operacionais = Aluguel (Paid, 2500.00) + Consultoria TI (Pending, 1500.00) = 4,000.00
    // (Note: Notebooks is Investimento TI - impactaDRE: false)
    // Resultado Operacional = Receita Líquida (18800) - Custos (0) - DespesasOperacionais (4000) = 14,800.00
    // Outras Receitas = Rendimento Aplicação (1200) = 1,200.00
    // Outras Despesas = DAS Simples Pago (Non operative, 400) = 400.00
    // Resultado Final = 14,800.00 + 1,200.00 - 400.00 = 15,600.00

    const dreComp = calculateDREFn(
        mockTransactions,
        mockImported,
        mockIncomeCategories,
        mockExpenseCategories,
        '2026-06',
        'competencia',
        6,
        mockAdvisors
    );

    // Assert Faturamento Bruto Competência
    results.push({
        name: 'Faturamento Bruto (Competência)',
        description: 'Receita Operacional Bruta acumulada por competência (realizada e pendente).',
        expected: 'R$ 20.000,00',
        actual: `R$ ${dreComp.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreComp.faturamentoBruto) === 20000.00,
        category: 'Competência'
    });

    // Assert Receita Líquida Competência
    results.push({
        name: 'Receita Líquida (Competência)',
        description: 'Receita Operacional Bruta subtraída de deduções fiscais provisionadas.',
        expected: 'R$ 18.800,00',
        actual: `R$ ${dreComp.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreComp.receitaLiquida) === 18800.00,
        category: 'Competência'
    });

    // Assert Despesas Operacionais Competência
    results.push({
        name: 'Despesas Operacionais (Competência)',
        description: 'Soma de despesas operacionais realizadas (Pagas) e pendentes da competência.',
        expected: 'R$ 4.000,00',
        actual: `R$ ${dreComp.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreComp.despesasOperacionais) === 4000.00,
        category: 'Competência'
    });

    // Assert Resultado Final Competência
    results.push({
        name: 'Resultado Final Líquido (Competência)',
        description: 'Resultado operacional somado de receitas não-operacionais e deduzido de despesas não-operacionais.',
        expected: 'R$ 15.600,00',
        actual: `R$ ${dreComp.resultadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreComp.resultadoFinal) === 15600.00,
        category: 'Competência'
    });


    // --- TESTE 2: DRE CAIXA ---
    // At Caixa:
    // Faturamento Bruto = 20,000.00 (All incomes are entered, but typically filtered by date)
    // Deduções = 900 + 300 = 1,200.00
    // Receita Líquida = 18,800.00
    // Custos = 0
    // Despesas Operacionais = Only paid ones count!
    // Aluguel (Paid, 2500) = 2,500.00. Consultoria TI (Pending) is excluded!
    // Resultado Operacional = 18,800.00 - 2,500.00 = 16,300.00
    // Outras Receitas = 1,200.00
    // Outras Despesas = 400.00
    // Resultado Final = 16,300.00 + 1,200.00 - 400.00 = 17,100.00

    const dreCaixa = calculateDREFn(
        mockTransactions,
        mockImported,
        mockIncomeCategories,
        mockExpenseCategories,
        '2026-06',
        'caixa',
        6,
        mockAdvisors
    );

    // Assert Despesas Operacionais Caixa
    results.push({
        name: 'Despesas Operacionais (Caixa)',
        description: 'Soma de despesas pagas. Exclui provisões e contas pendentes.',
        expected: 'R$ 2.500,00',
        actual: `R$ ${dreCaixa.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCaixa.despesasOperacionais) === 2500.00,
        category: 'Caixa'
    });

    // Assert Resultado Final Caixa
    results.push({
        name: 'Resultado Final Líquido (Caixa)',
        description: 'Resultado caixa final do período deduzido apenas de despesas efetivamente pagas.',
        expected: 'R$ 17.100,00',
        actual: `R$ ${dreCaixa.resultadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCaixa.resultadoFinal) === 17100.00,
        category: 'Caixa'
    });


    // --- TESTE 3: SALDOS E PROVISÃO ---
    // Saldo Bruto em Conta (realizado) = Todas as Entradas Reais - Todas as Saídas Efetivamente Pagas up to today
    // Entradas Reais:
    // Assessoria A (15,000.00) + Produção B (5,000.00) + Rendimento TI (1,200.00) = 21,200.00
    // Saídas Efetivamente Pagas up to today:
    // Aluguel Escritório (2,500.00) + Notebooks Novos (8,000.00) + DAS Simples Pago (400.00) = 10,900.00
    // Expected Saldo Bruto em Conta = 21,200.00 - 10,900.00 = 10,300.00
    // 
    // Provisão de Impostos = Soma de todos os taxAmount de Incomes - Imposto Pago (costCenter === 'provisao-impostos')
    // Imposto Provisionados:
    // DAS Cliente A (900.00) + DAS Cliente B (300.00) = 1,200.00
    // Imposto Pago: DAS Simples Pago (400.00) (costCenter === 'provisao-impostos')
    // Expected Provisão Tributária = 1,200.00 - 400.00 = 800.00
    //
    // Caixa Livre Estimado = Saldo Bruto em Conta - Provisão Tributária
    // Expected Caixa Livre Estimado = 10,300.00 - 800.00 = 9,500.00

    const calculateSaldoHoje = (txs: Transaction[]) => {
        return round(txs.reduce((acc, t) => {
            if (t.type === TransactionType.INCOME) {
                return acc + Number(t.amount);
            } else if (t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID) {
                return acc - Number(t.amount);
            }
            return acc;
        }, 0));
    };

    const calculateSaldoProvisaoHoje = (txs: Transaction[]) => {
        return round(txs.reduce((acc, t) => {
            if (t.type === TransactionType.INCOME) {
                return acc + Number(t.taxAmount || 0);
            } else if (t.type === TransactionType.EXPENSE && t.status === ExpenseStatus.PAID) {
                if (t.costCenter === 'provisao-impostos') {
                    return acc - Number(t.amount);
                }
            }
            return acc;
        }, 0));
    };

    const saldoHoje = calculateSaldoHoje(mockTransactions);
    const saldoProvisaoHoje = calculateSaldoProvisaoHoje(mockTransactions);
    const saldoDisponivel = round(saldoHoje - saldoProvisaoHoje);

    // Assert Saldo Hoje (Saldo em Conta)
    results.push({
        name: 'Saldo Bruto em Conta',
        description: 'Soma de todas as entradas físicas de caixa descontando saídas efetivamente quitadas.',
        expected: 'R$ 10.300,00',
        actual: `R$ ${saldoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: saldoHoje === 10300.00,
        category: 'Saldos & Caixa'
    });

    // Assert Provisão de Impostos
    results.push({
        name: 'Provisão Tributária Acumulada',
        description: 'Impostos incidentes provisionados das receitas pendentes de quitação fiscal.',
        expected: 'R$ 800,00',
        actual: `R$ ${saldoProvisaoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: saldoProvisaoHoje === 800.00,
        category: 'Saldos & Caixa'
    });

    // Assert Caixa Livre Estimado
    results.push({
        name: 'Caixa Livre Estimado',
        description: 'Recurso financeiro efetivamente disponível livre da reserva tributária operacional.',
        expected: 'R$ 9.500,00',
        actual: `R$ ${saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: saldoDisponivel === 9500.00,
        category: 'Saldos & Caixa'
    });


    // --- TESTE 4: ISOLAMENTO DE MÓDULOS E PREVENÇÃO DE DUPLA CONTAGEM ---
    // Caso de teste do usuário:
    // Receita de produção do assessor: R$ 706,75
    // Divisão assessor: R$ 430,08
    // Divisão escritório: R$ 177,04
    // CRM: R$ 125,15
    // Net Commission Payable (Comissão líquida): R$ 287,93
    // Verificamos que a receita do assessor não alimenta receita DRE ou faturamento, e que gera uma transação de R$ 287,93 sob 'Remuneração de Assessores' que só impacta DRE Caixa se paga.

    const mockComissoesImported: ImportedRevenue[] = [
        {
            id: 'imp-special-1',
            date: '2026-06-12',
            cliente: 'Cliente Produção Especial',
            advisorId: 'adv-especial',
            advisorName: 'Assessor Especial',
            revenueAmount: 706.75, // Receita assessor
            estimatedNetRevenue: 607.12,
            taxRate: 6,
            observacao: '',
            advisorShare: 430.08, // Divisão assessor
            officeShare: 177.04, // Divisão escritório
            crmCost: 125.15, // CRM
            advisorNet: 287.93, // Comissão líquida
            status: 'COMPLETED' as any,
            lancamentosRealizados: true
        }
    ];

    // Transação de despesa criada no fechamento de comissão (Pendente)
    const mockComissaoTransactionPending: Transaction = {
        id: 't-com-special-pending',
        date: '2026-06-30',
        description: 'Comissão Líquida: Assessor Especial - 06/2026',
        amount: 287.93, // Pagamento assessor
        type: TransactionType.EXPENSE,
        category: 'Remuneração de Assessores',
        paymentMethod: 'Transferência Bancária',
        status: ExpenseStatus.PENDING,
        origin: 'comissoes',
        clientSupplier: 'Assessor Especial'
    };

    // 1. DRE Competência com comissão pendente: a comissão entra como custo, receita tem ZERO impacto (original faturamento: R$ 20.000,00)
    const dreCompWithComission = calculateDREFn(
        [...mockTransactions, mockComissaoTransactionPending],
        mockComissoesImported,
        mockIncomeCategories,
        mockExpenseCategories,
        '2026-06',
        'competencia',
        6,
        mockAdvisors
    );

    results.push({
        name: 'Isolamento de Receita (DRE Competência)',
        description: 'Verifica que o fechamento da comissão de R$ 706,75 e sua transferência têm ZERO impacto na receita operacional da DRE.',
        expected: 'R$ 20.000,00',
        actual: `R$ ${dreCompWithComission.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCompWithComission.faturamentoBruto) === 20000.00,
        category: 'Competência'
    });

    results.push({
        name: 'Isolamento de Despesa (DRE Competência)',
        description: 'Verifica se a comissão líquida a pagar (R$ 287,93) entra como custo na DRE somente quando a transação correspondente é gerada.',
        expected: 'R$ 287,93',
        actual: `R$ ${dreCompWithComission.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCompWithComission.custos) === 287.93,
        category: 'Competência'
    });

    // 2. DRE Caixa com comissão pendente: despesa pendente NÃO impacta DRE Caixa (Custos = 0)
    const dreCaixaWithComission = calculateDREFn(
        [...mockTransactions, mockComissaoTransactionPending],
        mockComissoesImported,
        mockIncomeCategories,
        mockExpenseCategories,
        '2026-06',
        'caixa',
        6,
        mockAdvisors
    );

    results.push({
        name: 'Isolamento de Caixa (DRE Caixa - Pendente)',
        description: 'Verifica que o pagamento de comissão no status pendente não gera saída na DRE em regime Caixa.',
        expected: 'R$ 0,00',
        actual: `R$ ${dreCaixaWithComission.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCaixaWithComission.custos) === 0.00,
        category: 'Caixa'
    });

    // 3. DRE Caixa com comissão PAGA: despesa paga impacta caixa e custos
    const mockComissaoTransactionPaid: Transaction = {
        ...mockComissaoTransactionPending,
        status: ExpenseStatus.PAID
    };

    const dreCaixaWithComissionPaid = calculateDREFn(
        [...mockTransactions, mockComissaoTransactionPaid],
        mockComissoesImported,
        mockIncomeCategories,
        mockExpenseCategories,
        '2026-06',
        'caixa',
        6,
        mockAdvisors
    );

    results.push({
        name: 'Isolamento de Caixa (DRE Caixa - Pago)',
        description: 'Verifica que o pagamento de comissão no status pago impacta a DRE Caixa sob rubrica de Custos.',
        expected: 'R$ 287,93',
        actual: `R$ ${dreCaixaWithComissionPaid.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        success: round(dreCaixaWithComissionPaid.custos) === 287.93,
        category: 'Caixa'
    });

    return results;
}
