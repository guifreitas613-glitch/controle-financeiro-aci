import React, { useState, useEffect, useMemo, useRef, FC } from 'react';
import { 
    TransactionType, 
    ExpenseStatus, 
    ExpenseNature, 
    Transaction, 
    IncomeCategory, 
    ExpenseCategory, 
    CostCenter, 
    Advisor, 
    ImportedRevenue, 
    TransactionFormProps, 
    TransactionFormValues 
} from '../../types';
import { Button } from '../UIComponents';
import { round, formatCurrency, formatDateForInput } from '../../services/financialCalculations';

export const TransactionForm: FC<TransactionFormProps> = ({ 
    onSubmit, 
    onClose, 
    initialData, 
    defaultType, 
    incomeCategories, 
    expenseCategories, 
    paymentMethods, 
    costCenters, 
    advisors, 
    globalTaxRate, 
    transactions = [], 
    importedRevenues = [], 
    userId 
}) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || defaultType || TransactionType.EXPENSE);
    const [nature, setNature] = useState<ExpenseNature>(initialData?.nature || ExpenseNature.VARIABLE);
    const [advisorId, setAdvisorId] = useState(initialData?.advisorId || '');

    const isAddingFromTab = !!defaultType;
    const isEditing = !!initialData;
    const isInitializing = useRef(true); 
    const currentCategories = useMemo(() => 
        type === TransactionType.INCOME 
            ? incomeCategories.map(c => c.name) 
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
         origin: initialData?.origin || 'manual',
    });
    
    const [applyTax, setApplyTax] = useState(true);
    const [taxRateInput, setTaxRateInput] = useState<string>(globalTaxRate.toString());
    const [taxValueCents, setTaxValueCents] = useState<number>(0);

    const gross: number = parseFloat(formData.grossAmount) || 0;

    const effectiveTaxRate = applyTax ? (parseFloat(taxRateInput) || 0) : 0;

    useEffect(() => {
        if (initialData && initialData.type === TransactionType.INCOME) {
            const iTax = initialData.taxAmount ?? 0;
            const storedRate = (initialData as any).taxRate;
            if (iTax > 0 || (storedRate !== undefined && storedRate > 0)) {
                setApplyTax(true);
                const rateStr = storedRate !== undefined ? storedRate.toString() : (gross > 0 ? ((iTax / gross) * 100).toFixed(2) : globalTaxRate.toString());
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
    }, [initialData, globalTaxRate, gross]);

    useEffect(() => {
        if (!isInitializing.current && applyTax) {
            const currentRate = parseFloat(taxRateInput) || 0;
            const newVal = round(gross * (currentRate / 100));
            setTaxValueCents(Math.round(newVal * 100));
        }
    }, [gross, applyTax]);

    const handleRateInputChange = (val: string) => {
        setTaxRateInput(val);
        const rate = parseFloat(val) || 0;
        const newVal = round(gross * (rate / 100));
        setTaxValueCents(Math.round(newVal * 100));
    };

    const handleValueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const cents = raw ? parseInt(raw, 10) : 0;
        setTaxValueCents(cents);
        
        if (gross > 0) {
            const valR = cents / 100;
            const rate = (valR / gross) * 100;
            setTaxRateInput(rate.toFixed(4).replace(/\.?0+$/, ''));
        }
    };

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            category: currentCategories.includes(prev.category) ? prev.category : (currentCategories[0] || '')
        }));
    }, [type, currentCategories]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { description, grossAmount, date, category, paymentMethod, status, costCenter, clientSupplier, origin } = formData;
        
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
        
        const submissionData: TransactionFormValues = {
            description,
            amount: parsedGrossAmount, 
            date: new Date(date).toISOString(),
            type,
            category,
            clientSupplier,
            paymentMethod,
            costCenter,
            origin: origin as any,
        };
        
        if (type === TransactionType.INCOME) {
            submissionData.taxAmount = round(taxValueCents / 100);
            submissionData.grossAmount = parsedGrossAmount;
            submissionData.taxRate = parseFloat(taxRateInput) || 0;
            submissionData.amount = parsedGrossAmount;
        }

        if (type === TransactionType.EXPENSE) {
            submissionData.status = status;
            submissionData.nature = nature;
        }
        
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Tipo</label>
                    <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} name="type" disabled={!!initialData || isAddingFromTab} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed">
                        <option value={TransactionType.INCOME}>Receita</option>
                        <option value={TransactionType.EXPENSE}>Despesa</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Origem da Transação</label>
                    <select value={formData.origin || 'manual'} onChange={handleChange} name="origin" className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary h-[38px]">
                        <option value="manual">Manual/Faturamento Padrão</option>
                        <option value="comissoes">Comissão Conciliada (Sincronizado)</option>
                        <option value="importado">Importado Extrato</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary h-[38px]" required />
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
                <div className="bg-background p-3 rounded-lg border border-border-color">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-text-secondary uppercase">Cálculo de Imposto</p>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                             <span className="text-xs text-text-secondary">Aplicar imposto</span>
                             <input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4 bg-surface border-border-color" />
                        </label>
                     </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-text-secondary">Valor Bruto</p>
                            <p className="font-semibold text-primary">{formatCurrency(gross)}</p>
                        </div>
                        <div className={`border-l border-r border-border-color px-2 ${!applyTax ? 'opacity-50 pointer-events-none' : ''}`}>
                            <p className="text-xs text-text-secondary mb-1">(-) Imposto ({taxRateInput}%)</p>
                            <input 
                                type="text" 
                                value={(taxValueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                onChange={handleValueInputChange}
                                className="w-full bg-surface border border-border-color rounded px-1 py-0.5 text-xs text-center font-bold text-danger focus:ring-primary focus:border-primary outline-none"
                                disabled={!applyTax}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">(=) Valor Líquido Estimado (pós-imposto)</p>
                            <p className="font-bold text-green-400">{formatCurrency(round(gross - (taxValueCents / 100)))}</p>
                        </div>
                    </div>
                </div>
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
                <Button onClick={onClose} type="button" variant="ghost">Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
};

export default TransactionForm;
