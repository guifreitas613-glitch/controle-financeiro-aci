import React, { useState, useMemo, FC, useRef, useEffect } from 'react';
import { ImportedRevenue, Advisor, CommissionStatus } from '../types';
import { 
    Card, 
    Button, 
    Modal, 
    UploadIcon, 
    RefreshCwIcon, 
    TrashIcon, 
    PlusIcon, 
    CheckCircleIcon, 
    SearchIcon, 
    InfoIcon, 
    EditIcon 
} from './UIComponents';
import { 
    round, 
    formatCurrency, 
    formatDate, 
    formatDateForInput, 
    normalizeName, 
    deduplicateById 
} from '../services/financialCalculations';

declare var XLSX: any;

const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface ImportedRevenueFormProps {
    onSubmit: (data: Partial<ImportedRevenue>) => void;
    onClose: () => void;
    advisors: Advisor[];
    initialData?: ImportedRevenue | null;
    globalTaxRate: number;
}

const ImportedRevenueForm: FC<ImportedRevenueFormProps> = ({ onSubmit, onClose, advisors, initialData, globalTaxRate }) => {
    const [date, setDate] = useState(initialData?.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date().toISOString()));
    const [conta, setConta] = useState(initialData?.conta || '');
    const [cliente, setCliente] = useState(initialData?.cliente || '');
    const [advisorId, setAdvisorId] = useState(initialData?.advisorId || (advisors.length > 0 ? advisors[0].id : ''));
    const [revenueAmount, setRevenueAmount] = useState(initialData?.revenueAmount || 0);
    const [taxRate, setTaxRate] = useState(initialData?.taxRate || globalTaxRate);
    const [observacao, setObservacao] = useState(initialData?.observacao || '');
    const [hasReferral, setHasReferral] = useState(initialData?.hasReferral || false);
    const [referralAdvisorId, setReferralAdvisorId] = useState(initialData?.referralAdvisorId || '');
    const [referralPercentage, setReferralPercentage] = useState(initialData?.referralPercentage || 0);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const advisor = advisors.find(a => a.id === advisorId);
        const referralAdvisor = advisors.find(a => a.id === referralAdvisorId);

        onSubmit({
            date: new Date(date).toISOString(),
            conta,
            cliente,
            advisorId,
            advisorName: advisor?.name || 'Desconhecido',
            revenueAmount,
            taxRate,
            observacao,
            status: initialData?.status || CommissionStatus.PENDING,
            lancamentosRealizados: initialData?.lancamentosRealizados || false,
            hasReferral,
            referralAdvisorId: hasReferral ? referralAdvisorId : '',
            referralAdvisorName: hasReferral ? referralAdvisor?.name : '',
            referralPercentage: hasReferral ? referralPercentage : 0
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Data</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Conta</label>
                    <input type="text" value={conta} onChange={(e) => setConta(e.target.value)} placeholder="00000000" className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Referência / Cliente</label>
                    <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: Receita Total Março ou Nome do Cliente" className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Assessor Responsável</label>
                    <select 
                        value={advisorId} 
                        onChange={(e) => setAdvisorId(e.target.value)}
                        className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        required
                    >
                        {advisors.map(adv => (
                            <option key={adv.id} value={adv.id}>{adv.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Valor da Receita (R$)</label>
                    <input type="number" step="0.01" value={revenueAmount} onChange={(e) => setRevenueAmount(parseFloat(e.target.value) || 0)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Houve Indicação?</label>
                    <select value={hasReferral ? 'yes' : 'no'} onChange={e => setHasReferral(e.target.value === 'yes')} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary">
                        <option value="no">Não</option>
                        <option value="yes">Sim</option>
                    </select>
                </div>
                {hasReferral && (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Assessor Indicador</label>
                        <select 
                            value={referralAdvisorId} 
                            onChange={(e) => setReferralAdvisorId(e.target.value)}
                            className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            required={hasReferral}
                        >
                            <option value="">Selecione...</option>
                            {advisors.filter(a => a.id !== advisorId).map(adv => (
                                <option key={adv.id} value={adv.id}>{adv.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {hasReferral && (
                    <div>
                        <label className="block text-sm font-medium text-sm text-text-secondary">% de Repasse</label>
                        <input type="number" value={referralPercentage} onChange={(e) => setReferralPercentage(parseFloat(e.target.value) || 0)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" required={hasReferral} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Observação (Opcional)</label>
                    <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="mt-1 block w-full bg-background border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary" rows={2}></textarea>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button type="submit">Salvar Registro</Button>
            </div>
        </form>
    );
};

const CommissionClosingModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    advisor: Advisor;
    advisors: Advisor[];
    month: number;
    year: number;
    generatedRevenue: number;
    globalTaxRate: number;
    estimatedTaxRate: number;
    revenueIds: string[];
    selectedRecords: ImportedRevenue[];
    hasCrmAlreadyApplied: boolean;
    allImportedRevenues: ImportedRevenue[];
}> = ({ isOpen, onClose, onConfirm, advisor, advisors, month, year, generatedRevenue, globalTaxRate, estimatedTaxRate, revenueIds, selectedRecords, hasCrmAlreadyApplied, allImportedRevenues }) => {
    const [hasBrokerPayout, setHasBrokerPayout] = useState(true);
    const initialCrmCost = hasCrmAlreadyApplied ? 0 : Math.abs((advisor.costs || []).reduce((acc, c) => acc + c.value, 0));
    const [crmCost, setCrmCost] = useState(initialCrmCost);
    const [officePercent, setOfficePercent] = useState(30);
    const [advisorPercent, setAdvisorPercent] = useState(70);

    // 1. Produção Própria (Onde o assessor é o principal)
    const productionRecords = selectedRecords.filter(r => r.advisorId === advisor.id || (advisor && normalizeName(r.advisorName) === normalizeName(advisor.name)));
    const totalProductionGross = productionRecords.reduce((sum, r) => sum + (r.revenueAmount || 0), 0);
    const totalProductionNet = productionRecords.reduce((sum, r) => {
        const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || globalTaxRate) / 100));
        return sum + net;
    }, 0);
    const totalProductionTax = totalProductionGross - totalProductionNet;
    const totalProductionAdvisorShare = round(totalProductionNet * (advisorPercent / 100));
    const totalProductionOfficeShare = totalProductionNet - totalProductionAdvisorShare;

    // 2. Dedução de CRM (Aplicado sobre a produção própria)
    const comissaoLiquidaAssessor = Math.max(totalProductionAdvisorShare - crmCost, 0);
    const crmNaoCoberto = Math.max(crmCost - totalProductionAdvisorShare, 0);
    const resultadoEscritorioReal = totalProductionOfficeShare - crmNaoCoberto;

    // 3. Repasse de Indicação (Dedução da comissão líquida do assessor principal)
    let totalReferralOutAmount = 0;
    const referralOutBreakdown: { advisorId: string, advisorName: string, amount: number }[] = [];

    productionRecords.forEach(record => {
        if (record.hasReferral && record.referralPercentage && record.referralPercentage > 0) {
            let amount = 0;
            // Se o valor já foi "travado" por um fechamento anterior (do indicador ou do próprio principal em outro lote)
            if (record.referralAmountLocked && record.referralAmount && record.referralAmount > 0) {
                amount = record.referralAmount;
            } else {
                const net = record.estimatedNetRevenue || round((record.revenueAmount || 0) * (1 - (record.taxRate || globalTaxRate) / 100));
                const recordAdvisorShare = round(net * (advisorPercent / 100));
                // Pro-rata CRM para este registro específico
                const proRataCrm = totalProductionAdvisorShare > 0 ? (crmCost * (recordAdvisorShare / totalProductionAdvisorShare)) : 0;
                const recordNetCommission = Math.max(recordAdvisorShare - proRataCrm, 0);
                amount = round(recordNetCommission * (record.referralPercentage / 100));
            }
            
            totalReferralOutAmount += amount;

            if (record.referralAdvisorId) {
                const existing = referralOutBreakdown.find(b => b.advisorId === record.referralAdvisorId);
                if (existing) {
                    existing.amount = round(existing.amount + amount);
                } else {
                    referralOutBreakdown.push({
                        advisorId: record.referralAdvisorId,
                        advisorName: record.referralAdvisorName || 'Assessor Indicador',
                        amount
                    });
                }
            }
        }
    });

    // 4. Indicações Recebidas (Crédito para o assessor indicador)
    const referralIncomeRecords = selectedRecords.filter(r => r.referralAdvisorId === advisor.id || (advisor && normalizeName(r.referralAdvisorName) === normalizeName(advisor.name)));
    let totalReferralInAmount = 0;
    referralIncomeRecords.forEach(record => {
        if (record.hasReferral && record.referralPercentage && record.referralPercentage > 0) {
            // Se o valor já foi calculado e salvo pelo principal, usamos ele (Fonte da Verdade)
            if (record.referralAmountLocked && record.referralAmount && record.referralAmount > 0) {
                totalReferralInAmount += record.referralAmount;
            } else {
                // Se o principal ainda não fechou, calculamos exatamente como ele faria (Passo C)
                // 1. Localizar o assessor principal e seus registros no mês
                const pAdvisor = advisors.find(a => a.id === record.advisorId);
                if (pAdvisor) {
                    const pRecords = allImportedRevenues.filter(r => 
						r.advisorId === pAdvisor.id && 
						new Date(r.date).getUTCMonth() === month && 
						new Date(r.date).getUTCFullYear() === year
					);
                    
                    // 2. Calcular a parcela bruta total do principal no mês
                    const pTotalAdvisorShare = pRecords.reduce((sum, r) => {
                        const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || globalTaxRate) / 100));
                        return sum + round(net * 0.70); // Assumimos 70% como padrão se não fechou
                    }, 0);
                    
                    // 3. Verificar se o principal já aplicou CRM em outro fechamento deste mês
                    const pAlreadyClosed = allImportedRevenues.some(r => 
                        r.advisorId === pAdvisor.id && 
                        (r.status === CommissionStatus.COMPLETED || r.lancamentosRealizados) &&
                        new Date(r.date).getUTCFullYear() === year &&
                        new Date(r.date).getUTCMonth() === month
                    );
                    
                    const pCrmCost = pAlreadyClosed ? 0 : Math.abs((pAdvisor.costs || []).reduce((acc, c) => acc + c.value, 0));
                    
                    // 4. Calcular o valor deste registro específico seguindo o Passo C
                    const net = record.estimatedNetRevenue || round((record.revenueAmount || 0) * (1 - (record.taxRate || globalTaxRate) / 100));
                    const recordAdvisorShare = round(net * 0.70);
                    const proRataCrm = pTotalAdvisorShare > 0 ? (pCrmCost * (recordAdvisorShare / pTotalAdvisorShare)) : 0;
                    const recordNetCommission = Math.max(recordAdvisorShare - proRataCrm, 0);
                    const amount = round(recordNetCommission * (record.referralPercentage / 100));
                    
                    totalReferralInAmount += amount;
                }
            }
        }
    });
    
    // 5. Líquido Final
    const advisorNetFinal = round(comissaoLiquidaAssessor - totalReferralOutAmount + totalReferralInAmount);
    
    // Resultado de Caixa = Entrada no Caixa da Corretora (Receita Líquida Total) − Comissões Pagas - CRM Não Coberto
    const cashEntryAmountVal = totalProductionNet;
    const cashResult = round(cashEntryAmountVal - advisorNetFinal - totalReferralOutAmount - crmNaoCoberto);

    const handleConfirm = () => {
        onConfirm({
            advisorId: advisor.id,
            advisorName: advisor.name,
            month,
            year,
            generatedRevenue: totalProductionGross,
            estimatedTax: totalProductionTax,
            estimatedNetRevenue: totalProductionNet,
            baseProduction: totalProductionAdvisorShare,
            productionResult: totalProductionAdvisorShare,
            cashEntryAmount: totalProductionNet,
            crmCost,
            crmNaoCoberto,
            totalParcelaAssessor: totalProductionAdvisorShare,
            totalParcelaEscritorio: totalProductionOfficeShare,
            officePercent,
            advisorPercent,
            advisorShare: totalProductionAdvisorShare,
            officeShare: totalProductionOfficeShare,
            advisorNet: advisorNetFinal,
            officeNet: resultadoEscritorioReal,
            advisorOperationalResult: round(totalProductionAdvisorShare - crmCost),
            resultadoEscritorioReal,
            cashResult,
            hasReferral: totalReferralOutAmount > 0,
            referralAmount: totalReferralOutAmount,
            referralBreakdown: referralOutBreakdown,
            totalReferralInAmount,
            revenueIds: selectedRecords.map(r => r.id)
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fechar Comissões do Assessor" size="xl">
            <div className="space-y-4">
                <div className="bg-surface p-3 rounded-lg border border-border-color flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-secondary uppercase">Assessor</span>
                            <span className="font-bold text-text-primary text-sm">{advisor.name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-secondary uppercase">Período</span>
                            <span className="font-bold text-text-primary text-sm">{months[month]}/{year}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-text-secondary uppercase border-b border-border-color pb-1">Dados da Produção</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">Receita Total Gerada</label>
                                    <div className="p-2 bg-background border border-border-color rounded text-sm font-bold">
                                        {formatCurrency(generatedRevenue)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">Custo CRM (Assessor)</label>
                                    <input 
                                        type="number" 
                                        value={crmCost} 
                                        onChange={e => setCrmCost(Number(e.target.value))} 
                                        disabled={hasCrmAlreadyApplied}
                                        className={`w-full p-2 bg-background border border-border-color rounded text-sm ${hasCrmAlreadyApplied ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    />
                                    {hasCrmAlreadyApplied && (
                                        <p className="text-[9px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                                            <span>⚠️</span> CRM já aplicado neste mês.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-background/50 p-2 rounded border border-dashed border-border-color space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-secondary">Parcela Assessor ({advisorPercent}%):</span>
                                    <span className="font-bold text-text-primary">{formatCurrency(totalProductionAdvisorShare)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-secondary">Parcela Escritório ({officePercent}%):</span>
                                    <span className="font-bold text-text-primary">{formatCurrency(totalProductionOfficeShare)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-text-secondary uppercase border-b border-border-color pb-1">Análise de CRM e Déficit</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">Custo CRM Mensal</label>
                                    <div className="p-2 bg-background border border-border-color rounded text-sm font-bold">
                                        {formatCurrency(crmCost)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">CRM Não Coberto (Déficit)</label>
                                    <div className="p-2 bg-background border border-border-color rounded text-sm font-bold text-danger">
                                        {formatCurrency(crmNaoCoberto)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-text-secondary uppercase border-b border-border-color pb-1">Configurações de Divisão</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">% Assessor</label>
                                    <input type="number" value={advisorPercent} onChange={e => setAdvisorPercent(Number(e.target.value))} className="w-full p-2 bg-background border border-border-color rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1 uppercase">% Escritório</label>
                                    <input type="number" value={officePercent} onChange={e => setOfficePercent(Number(e.target.value))} className="w-full p-2 bg-background border border-border-color rounded text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3 h-full">
                            <h4 className="text-xs font-bold uppercase text-primary border-b border-primary/10 pb-1">Resumo do Fechamento</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-secondary">Produção Própria (Bruta):</span>
                                    <span className="font-bold">{formatCurrency(totalProductionGross)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-secondary">Impostos Provisionados ({estimatedTaxRate}%):</span>
                                    <span className="text-danger">-{formatCurrency(totalProductionTax)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium border-t border-border-color/10 pt-1">
                                    <span className="text-text-secondary">Parcela Assessor (Bruta):</span>
                                    <span className="font-bold">{formatCurrency(totalProductionAdvisorShare)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-secondary">Custo CRM Mensal:</span>
                                    <span className="text-danger">-{formatCurrency(crmCost)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold border-t border-border-color/10 pt-1">
                                    <span className="text-text-primary uppercase">Comissão Líquida:</span>
                                    <span className="text-primary">{formatCurrency(comissaoLiquidaAssessor)}</span>
                                </div>

                                {totalReferralOutAmount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Repasse de Indicação (Dedução):</span>
                                        <span className="text-yellow-500">-{formatCurrency(totalReferralOutAmount)}</span>
                                    </div>
                                )}

                                {totalReferralInAmount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Indicações Recebidas (Crédito):</span>
                                        <span className="text-green-400">+{formatCurrency(totalReferralInAmount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm font-bold border-t-2 border-primary/30 pt-2 mt-2">
                                    <span className="text-primary uppercase">Líquido Final a Pagar:</span>
                                    <span className="text-primary text-lg">{formatCurrency(advisorNetFinal)}</span>
                                </div>

                                <div className="pt-2 mt-2 border-t border-border-color/30 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Parcela Escritório ({officePercent}%):</span>
                                        <span className="font-bold">{formatCurrency(totalProductionOfficeShare)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Déficit CRM (Não Coberto):</span>
                                        <span className="text-danger">-{formatCurrency(crmNaoCoberto)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold border-t border-border-color/10 pt-1">
                                        <span className="text-text-primary uppercase">Resultado Escritório Real:</span>
                                        <span className={`font-bold ${resultadoEscritorioReal < 0 ? 'text-danger' : 'text-green-400'}`}>
                                            {formatCurrency(resultadoEscritorioReal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-color/20">
                    <Button onClick={onClose} variant="secondary">Cancelar</Button>
                    <Button onClick={handleConfirm} variant="success">Confirmar Fechamento</Button>
                </div>
            </div>
        </Modal>
    );
};

export const ImportedRevenuesView: FC<{
    importedRevenues: ImportedRevenue[];
    advisors: Advisor[];
    onDelete: (id: string) => void;
    onAdd: (data: Partial<ImportedRevenue>) => void;
    onUpdate: (id: string, data: Partial<ImportedRevenue>) => void;
    onBatchCommissionClosing: (data: any) => Promise<void>;
    onClearAll: () => void;
    globalTaxRate: number;
    estimatedTaxRate: number;
    userId?: string;
}> = ({ importedRevenues, advisors, onDelete, onAdd, onUpdate, onBatchCommissionClosing, onClearAll, globalTaxRate, estimatedTaxRate, userId }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('all');
    const [clientSearch, setClientSearch] = useState('');
    const [comisTab, setComisTab] = useState<'lancamentos' | 'clientes'>('lancamentos');
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [importSummary, setImportSummary] = useState<{ records: any[], totalAmount: number } | null>(null);
    const [editingRevenue, setEditingRevenue] = useState<ImportedRevenue | null>(null);
    const [selectedRevenueIds, setSelectedRevenueIds] = useState<Set<string>>(new Set());
    const [showReconciliationReport, setShowReconciliationReport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSyncAdvisorLinks = async () => {
        if (!userId) return;
        const toUpdate = importedRevenues.filter(r => {
            const advisorByName = advisors.find(a => normalizeName(a.name) === normalizeName(r.advisorName));
            return advisorByName && r.advisorId !== advisorByName.id;
        });

        if (toUpdate.length === 0) {
            alert("Todos os lançamentos já estão com vínculos corretos.");
            return;
        }

        if (!confirm(`Encontrados ${toUpdate.length} lançamentos com vínculos desatualizados. Deseja sincronizá-los agora?`)) {
            return;
        }

        try {
            let count = 0;
            for (const r of toUpdate) {
                const advisorByName = advisors.find(a => normalizeName(a.name) === normalizeName(r.advisorName));
                if (advisorByName) {
                    await onUpdate(r.id, { advisorId: advisorByName.id });
                    count++;
                }
            }
            alert(`${count} lançamentos sincronizados com sucesso!`);
        } catch (error) {
            console.error(error);
            alert("Erro ao sincronizar lançamentos.");
        }
    };

    const hasCrmAlreadyApplied = useMemo(() => {
        if (selectedAdvisorId === 'all') return false;
        const month = selectedMonth === 'all' ? new Date().getUTCMonth() : selectedMonth as number;
        const year = selectedYear === 'all' ? new Date().getUTCFullYear() : selectedYear as number;
        
        return importedRevenues.some(r => 
            r.advisorId === selectedAdvisorId && 
            (r.status === CommissionStatus.COMPLETED || r.lancamentosRealizados) &&
            new Date(r.date).getUTCFullYear() === year &&
            new Date(r.date).getUTCMonth() === month
        );
    }, [importedRevenues, selectedAdvisorId, selectedYear, selectedMonth]);

    const availableYears = useMemo(() => {
        const yearsSet = new Set(importedRevenues.map(r => new Date(r.date).getUTCFullYear()));
        const currentYear = new Date().getUTCFullYear();
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a: number, b: number) => b - a);
    }, [importedRevenues]);

    const filteredRevenues = useMemo(() => {
        const selectedAdvisor = advisors.find(a => a.id === selectedAdvisorId);
        const filtered = importedRevenues.filter(r => {
            const date = new Date(r.date);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();
            
            const yearMatch = selectedYear === 'all' || year === selectedYear;
            const monthMatch = selectedMonth === 'all' || month === selectedMonth;
            
            // Match by ID or Name if ID is missing/mismatched
            const advisorMatch = selectedAdvisorId === 'all' || 
                r.advisorId === selectedAdvisorId || 
                r.referralAdvisorId === selectedAdvisorId ||
                (selectedAdvisor && normalizeName(r.advisorName) === normalizeName(selectedAdvisor.name));
                
            const clientMatch = !clientSearch || 
                (r.cliente && r.cliente.toLowerCase().includes(clientSearch.toLowerCase())) ||
                (r.conta && r.conta.toLowerCase().includes(clientSearch.toLowerCase()));
            
            return yearMatch && monthMatch && advisorMatch && clientMatch;
        });
        return deduplicateById(filtered);
    }, [importedRevenues, selectedYear, selectedMonth, selectedAdvisorId, clientSearch, advisors]);

    const clientRevenuesSummary = useMemo(() => {
        const clientGroups: Record<string, {
            cliente: string;
            advisorName: string;
            revenueBruta: number;
            impostos: number;
            revenueLiquida: number;
            comissaoAssessor: number;
            resultadoEscritorio: number;
        }> = {};

        filteredRevenues.forEach(r => {
            const clientName = r.cliente || 'Sem Cliente';
            const key = clientName.trim().toLowerCase();

            if (!clientGroups[key]) {
                clientGroups[key] = {
                    cliente: clientName,
                    advisorName: r.advisorName || 'Não Atribuído',
                    revenueBruta: 0,
                    impostos: 0,
                    revenueLiquida: 0,
                    comissaoAssessor: 0,
                    resultadoEscritorio: 0,
                };
            }

            const bruta = r.revenueAmount || 0;
            const net = r.estimatedNetRevenue || (bruta * (1 - (r.taxRate || 0) / 100));
            const cTax = round(bruta * ((r.taxRate || 0) / 100));
            const comm = r.advisorShare || round(net * 0.70);
            const officeResult = r.officeShare || round(net * 0.30);

            clientGroups[key].revenueBruta += bruta;
            clientGroups[key].impostos += cTax;
            clientGroups[key].revenueLiquida += net;
            clientGroups[key].comissaoAssessor += comm;
            clientGroups[key].resultadoEscritorio += officeResult;
        });

        const list = Object.values(clientGroups).map(c => ({
            ...c,
            revenueBruta: round(c.revenueBruta),
            impostos: round(c.impostos),
            revenueLiquida: round(c.revenueLiquida),
            comissaoAssessor: round(c.comissaoAssessor),
            resultadoEscritorio: round(c.resultadoEscritorio)
        }));

        const totalBruta = list.reduce((sum, item) => sum + item.revenueBruta, 0);
        const totalImpostos = list.reduce((sum, item) => sum + item.impostos, 0);
        const totalLiquida = list.reduce((sum, item) => sum + item.revenueLiquida, 0);
        const totalComissao = list.reduce((sum, item) => sum + item.comissaoAssessor, 0);
        const totalEscritorio = list.reduce((sum, item) => sum + item.resultadoEscritorio, 0);

        return {
            list,
            totals: {
                totalBruta: round(totalBruta),
                totalImpostos: round(totalImpostos),
                totalLiquida: round(totalLiquida),
                totalComissao: round(totalComissao),
                totalEscritorio: round(totalEscritorio)
            }
        };
    }, [filteredRevenues]);

    // Limpar seleção ao mudar filtros
    useEffect(() => {
        setSelectedRevenueIds(new Set());
    }, [selectedYear, selectedMonth, selectedAdvisorId, clientSearch]);

    const toggleSelectAll = () => {
        const pendingRevenues = filteredRevenues.filter(r => r.status !== CommissionStatus.COMPLETED && !r.lancamentosRealizados);
        if (selectedRevenueIds.size === pendingRevenues.length && pendingRevenues.length > 0) {
            setSelectedRevenueIds(new Set());
        } else {
            setSelectedRevenueIds(new Set(pendingRevenues.map(r => r.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedRevenueIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRevenueIds(newSet);
    };

    const selectedSummary = useMemo(() => {
        const selected = filteredRevenues.filter(r => selectedRevenueIds.has(r.id));
        return {
            revenueAmount: selected.reduce((sum, r) => sum + (r.revenueAmount || 0), 0),
            count: selected.length,
            ids: selected.map(r => r.id),
            records: selected
        };
    }, [filteredRevenues, selectedRevenueIds]);

    const totals = useMemo(() => {
        const groups: Record<string, { 
            revenue: number, 
            netRevenue: number,
            advisorShare: number, 
            officeShare: number, 
            crm: number, 
            commissionsPaid: number, 
            officeOperationalResult: number, 
            isClosed: boolean,
            advisorId: string,
            advisorName: string
        }> = {};

        if (selectedYear !== 'all' && selectedMonth !== 'all') {
            const targetAdvisors = selectedAdvisorId === 'all' ? advisors : advisors.filter(a => a.id === selectedAdvisorId);
            targetAdvisors.forEach(advisor => {
                const periodKey = `${advisor.id}-${selectedYear}-${selectedMonth}`;
                groups[periodKey] = { 
                    revenue: 0, 
                    netRevenue: 0,
                    advisorShare: 0, 
                    officeShare: 0, 
                    crm: 0, 
                    commissionsPaid: 0, 
                    officeOperationalResult: 0, 
                    isClosed: false,
                    advisorId: advisor.id,
                    advisorName: advisor.name
                };
            });
        }
        
        filteredRevenues.forEach(r => {
            const date = new Date(r.date);
            const effectiveAdvisorId = r.advisorId || (advisors.find(a => normalizeName(a.name) === normalizeName(r.advisorName))?.id) || 'unknown';
            const periodKey = `${effectiveAdvisorId}-${date.getUTCFullYear()}-${date.getUTCMonth()}`;
            
            if (!groups[periodKey]) {
                groups[periodKey] = { 
                    revenue: 0, 
                    netRevenue: 0,
                    advisorShare: 0, 
                    officeShare: 0, 
                    crm: 0, 
                    commissionsPaid: 0, 
                    officeOperationalResult: 0, 
                    isClosed: false,
                    advisorId: effectiveAdvisorId,
                    advisorName: r.advisorName || ''
                };
            }
            
            groups[periodKey].revenue += (r.revenueAmount || 0);
            const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || 0) / 100));
            groups[periodKey].netRevenue += net;
            groups[periodKey].advisorShare += (r.advisorShare || round(net * 0.70));
            groups[periodKey].officeShare += (r.officeShare || round(net * 0.30));
            
            if (r.status === CommissionStatus.COMPLETED || r.lancamentosRealizados) {
                groups[periodKey].isClosed = true;
                groups[periodKey].commissionsPaid += (r.advisorNet || r.responsibleAdvisorNet || 0);
                groups[periodKey].officeOperationalResult += (r.resultadoEscritorioReal || r.advisorOperationalResult || 0);
            }
        });

        let totalGrossProduction = 0;
        let totalNetProduction = 0;
        let totalCommissionsPaid = 0;
        let totalOfficeResult = 0;
        let totalSubsidyCost = 0;

        let maxCrmForMinProduction = 0;
        if (selectedAdvisorId !== 'all') {
            const advisor = advisors.find(a => a.id === selectedAdvisorId);
            if (advisor) {
                maxCrmForMinProduction = Math.abs((advisor.costs || []).reduce((acc, c) => acc + c.value, 0));
            }
        } else {
            const allCrms = advisors.map(a => Math.abs((a.costs || []).reduce((acc, c) => acc + c.value, 0)));
            maxCrmForMinProduction = allCrms.length > 0 ? Math.max(...allCrms) : 0;
        }

        const taxFactor = 1 - (estimatedTaxRate / 100);
        const producaoMinima = taxFactor > 0 ? (maxCrmForMinProduction / 0.70) / taxFactor : 0;

        Object.entries(groups).forEach(([periodKey, data]) => {
            const advisor = advisors.find(a => a.id === data.advisorId)
                ?? advisors.find(a => a.name === data.advisorName);
            
            totalGrossProduction += data.revenue;
            
            const crmCusto = advisor ? Math.abs((advisor.costs || []).reduce((acc, c) => acc + c.value, 0)) : 0;

            totalNetProduction += (data.netRevenue - crmCusto);
            
            const totalParcelaAssessor = data.advisorShare;
            const totalParcelaEscritorio = data.officeShare;
            
            const comissaoLiquida = Math.max(totalParcelaAssessor - crmCusto, 0);
            const crmNaoCoberto = Math.max(crmCusto - totalParcelaAssessor, 0);
            const resultadoEscritorioReal = totalParcelaEscritorio - crmNaoCoberto;

            totalCommissionsPaid += comissaoLiquida;
            totalOfficeResult += resultadoEscritorioReal;
            totalSubsidyCost += crmNaoCoberto;
        });

        return {
            totalGrossProduction,
            totalNetProduction,
            totalCommissionsPaid,
            totalOfficeResult,
            totalSubsidyCost,
            avgMinProduction: producaoMinima
        };
    }, [filteredRevenues, advisors, estimatedTaxRate, selectedAdvisorId]);

    const advisorProfitability = useMemo(() => {
        const targetAdvisors = selectedAdvisorId === 'all' ? advisors : advisors.filter(a => a.id === selectedAdvisorId);
        
        const revenuesByAdvisor = new Map<string, ImportedRevenue[]>();
        filteredRevenues.forEach(r => {
            const effectiveId = r.advisorId || (advisors.find(a => normalizeName(a.name) === normalizeName(r.advisorName))?.id) || 'unknown';
            const list = revenuesByAdvisor.get(effectiveId) || [];
            list.push(r);
            revenuesByAdvisor.set(effectiveId, list);
        });

        const results = targetAdvisors.map(advisor => {
            const advisorRevenues = revenuesByAdvisor.get(advisor.id) || [];
            const periods = new Set<string>();
            
            if (selectedMonth === 'all') {
                advisorRevenues.forEach(r => {
                    const d = new Date(r.date);
                    periods.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
                });
            } else if (selectedYear !== 'all') {
                periods.add(`${selectedYear}-${selectedMonth}`);
            } else {
                advisorRevenues.forEach(r => {
                    const d = new Date(r.date);
                    if (d.getUTCMonth() === selectedMonth) {
                        periods.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
                    }
                });
            }

            if (periods.size === 0 && selectedYear !== 'all') {
                if (selectedMonth !== 'all') {
                    periods.add(`${selectedYear}-${selectedMonth}`);
                } else {
                    const currentYear = new Date().getUTCFullYear();
                    const monthToAdd = selectedYear === currentYear ? new Date().getUTCMonth() : 0;
                    periods.add(`${selectedYear}-${monthToAdd}`);
                }
            }

            let totalResult = 0;
            let totalParcelaAssessorAcc = 0;
            let totalCrmCustoAcc = 0;
            
            periods.forEach(period => {
                const [year, month] = period.split('-').map(Number);
                const periodRevenues = advisorRevenues.filter(r => 
                    new Date(r.date).getUTCFullYear() === year && 
                    new Date(r.date).getUTCMonth() === month
                );
                
                const crmCusto = Math.abs((advisor.costs || []).reduce((acc, c) => acc + c.value, 0));
                const totalParcelaAssessor = periodRevenues.reduce((s, r) => {
                    const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || 0) / 100));
                    return s + (r.totalParcelaAssessor || r.advisorShare || round(net * 0.70));
                }, 0);
                
                totalResult += (totalParcelaAssessor - crmCusto);
                totalParcelaAssessorAcc += totalParcelaAssessor;
                totalCrmCustoAcc += crmCusto;
            });

            let status: 'Lucrativo' | 'Breakeven' | 'Subsidiado' = 'Breakeven';
            if (totalResult > 0.01) status = 'Lucrativo';
            else if (totalResult < -0.01) status = 'Subsidiado';

            return { 
                advisorId: advisor.id, 
                name: advisor.name, 
                result: totalResult, 
                status,
                totalParcelaAssessor: totalParcelaAssessorAcc,
                crmCusto: totalCrmCustoAcc
            };
        });

        const order = { 'Lucrativo': 0, 'Breakeven': 1, 'Subsidiado': 2 };
        return results.sort((a, b) => {
            if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
            if (a.status === 'Lucrativo') return b.result - a.result;
            if (a.status === 'Subsidiado') return a.result - b.result;
            return 0;
        });
    }, [filteredRevenues, advisors, estimatedTaxRate, selectedYear, selectedMonth, selectedAdvisorId]);

    const reconciliationReport = useMemo(() => {
        const targetAdvisors = selectedAdvisorId === 'all' ? advisors : advisors.filter(a => a.id === selectedAdvisorId);

        return targetAdvisors.map(a => {
            const mainRevenues = filteredRevenues.filter(r => 
                r.advisorId === a.id || normalizeName(r.advisorName) === normalizeName(a.name)
            );

            const faturamentoBruto = mainRevenues.reduce((sum, r) => sum + (r.revenueAmount || 0), 0);
            
            const totalTax = mainRevenues.reduce((sum, r) => {
                const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || globalTaxRate) / 100));
                return sum + ((r.revenueAmount || 0) - net);
            }, 0);

            const faturamentoLiquido = faturamentoBruto - totalTax;

            const repasseBrutoAssessor = mainRevenues.reduce((sum, r) => {
                const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || globalTaxRate) / 100));
                return sum + (r.advisorShare || round(net * 0.70));
            }, 0);

            const crmDesconto = Math.abs((a.costs || []).reduce((acc, c) => acc + c.value, 0));

            let repiquePago = 0;
            mainRevenues.forEach(record => {
                if (record.hasReferral && record.referralPercentage && record.referralPercentage > 0) {
                    if (record.referralAmountLocked && record.referralAmount) {
                        repiquePago += record.referralAmount;
                    } else {
                        const net = record.estimatedNetRevenue || round((record.revenueAmount || 0) * (1 - (record.taxRate || globalTaxRate) / 100));
                        const recordAdvisorShare = round(net * 0.70);
                        const proRataCrm = repasseBrutoAssessor > 0 ? (crmDesconto * (recordAdvisorShare / repasseBrutoAssessor)) : 0;
                        const recordNetCommission = Math.max(recordAdvisorShare - proRataCrm, 0);
                        repiquePago += round(recordNetCommission * (record.referralPercentage / 100));
                    }
                }
            });

            let repiqueRecebido = 0;
            const referralInRevenues = filteredRevenues.filter(r => 
                r.referralAdvisorId === a.id || normalizeName(r.referralAdvisorName) === normalizeName(a.name)
            );
            referralInRevenues.forEach(record => {
                if (record.hasReferral && record.referralPercentage && record.referralPercentage > 0) {
                    if (record.referralAmountLocked && record.referralAmount) {
                        repiqueRecebido += record.referralAmount;
                    } else {
                        const pAdvisor = advisors.find(ad => ad.id === record.advisorId);
                        if (pAdvisor) {
                            const pRecords = filteredRevenues.filter(r => 
                                r.advisorId === pAdvisor.id
                            );
                            const pTotalAdvisorShare = pRecords.reduce((sum, r) => {
                                const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || globalTaxRate) / 100));
                                return sum + round(net * 0.70);
                            }, 0);
                            const pCrmCost = Math.abs((pAdvisor.costs || []).reduce((acc, c) => acc + c.value, 0));
                            
                            const net = record.estimatedNetRevenue || round((record.revenueAmount || 0) * (1 - (record.taxRate || globalTaxRate) / 100));
                            const recordAdvisorShare = round(net * 0.70);
                            const proRataCrm = pTotalAdvisorShare > 0 ? (pCrmCost * (recordAdvisorShare / pTotalAdvisorShare)) : 0;
                            const recordNetCommission = Math.max(recordAdvisorShare - proRataCrm, 0);
                            repiqueRecebido += round(recordNetCommission * (record.referralPercentage / 100));
                        }
                    }
                }
            });

            const comissaoLiquidaAssessor = Math.max(repasseBrutoAssessor - crmDesconto, 0);
            const crmNaoCoberto = Math.max(crmDesconto - repasseBrutoAssessor, 0);
            
            const comissaoFinalLiquida = round(comissaoLiquidaAssessor - repiquePago + repiqueRecebido);
            
            const repasseEscritorio = faturamentoLiquido - repasseBrutoAssessor;
            const resultadoEscritorio = round(repasseEscritorio - crmNaoCoberto);

            return {
                advisorId: a.id,
                name: a.name,
                faturamentoBruto,
                imposto: totalTax,
                faturamentoLiquido,
                repasseBrutoAssessor,
                crmDesconto,
                repiquePago,
                repiqueRecebido,
                comissaoFinalLiquida,
                resultadoEscritorio
            };
        });
    }, [filteredRevenues, advisors, globalTaxRate, selectedAdvisorId]);

    const advisorSummary = useMemo(() => {
        if (selectedAdvisorId === 'all') return null;
        const advisor = advisors.find(a => a.id === selectedAdvisorId);
        if (!advisor) return null;

        const generated = filteredRevenues.filter(r => 
            r.advisorId === selectedAdvisorId || 
            (advisor && normalizeName(r.advisorName) === normalizeName(advisor.name))
        );
        const referrals = filteredRevenues.filter(r => 
            r.referralAdvisorId === selectedAdvisorId || 
            (advisor && normalizeName(r.referralAdvisorName) === normalizeName(advisor.name))
        );

        const operationalResult = totals.totalOfficeResult;

        return {
            name: advisor.name,
            generatedRevenue: generated.reduce((sum, r) => sum + (r.revenueAmount || 0), 0),
            totalCommission: generated.reduce((sum, r) => {
                const commission = r.advisorNetTotal || r.advisorNet || r.responsibleAdvisorNet;
                if (commission !== undefined) return sum + commission;
                
                const net = r.estimatedNetRevenue || round((r.revenueAmount || 0) * (1 - (r.taxRate || 0) / 100));
                const share = r.totalParcelaAssessor || r.advisorShare || round(net * 0.70);
                return sum + share;
            }, 0),
            referralsPaid: referrals.reduce((sum, r) => {
                if (r.referralAmount !== undefined) return sum + r.referralAmount;
                if (r.referralPercentage) return sum + round((r.revenueAmount || 0) * (r.referralPercentage / 100));
                return sum + 0;
            }, 0),
            operationalResult
        };
    }, [filteredRevenues, selectedAdvisorId, advisors, totals]);

    const getEffectiveStatus = (status?: any, lancamentosRealizados?: boolean): CommissionStatus => {
        if (status === 'completo' || status === 'completed' || lancamentosRealizados === true) {
            return CommissionStatus.COMPLETED;
        }
        if (status === 'comissao_lancada' || status === 'commission_launched') {
            return CommissionStatus.COMMISSION_LAUNCHED;
        }
        if (status === 'receita_lancada' || status === 'revenue_launched') {
            return CommissionStatus.REVENUE_LAUNCHED;
        }
        if (status === 'imposto_provisionado' || status === 'tax_provisioned') {
            return CommissionStatus.TAX_PROVISIONED;
        }
        if (status === 'indicacao_quitada' || status === 'referral_settled') {
            return CommissionStatus.REFERRAL_SETTLED;
        }
        return CommissionStatus.PENDING;
    };

    const getStatusLabel = (status?: any, lancamentosRealizados?: boolean) => {
        const effective = getEffectiveStatus(status, lancamentosRealizados);
        if (effective === CommissionStatus.COMPLETED) return { 
            label: 'Lançamento Completo', 
            style: { background: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,1)', border: '0.5px solid rgba(16,185,129,0.3)' }
        };
        if (effective === CommissionStatus.COMMISSION_LAUNCHED) return { label: 'Comissão Lançada', color: 'text-blue-400', bg: 'bg-blue-400/10' };
        if (effective === CommissionStatus.REVENUE_LAUNCHED) return { label: 'Receita Lançada', color: 'text-indigo-400', bg: 'bg-indigo-400/10' };
        if (effective === CommissionStatus.TAX_PROVISIONED) return { label: 'Impostos Provisionados', color: 'text-orange-400', bg: 'bg-orange-400/10' };
        if (effective === CommissionStatus.REFERRAL_SETTLED) return { label: 'Indicação Quitada (Parcial)', color: 'text-teal-400', bg: 'bg-teal-400/10' };
        return { label: 'Pendente de Lançamento', color: 'text-text-secondary', bg: 'bg-background' };
    };

    const handleEdit = (revenue: ImportedRevenue) => {
        setEditingRevenue(revenue);
        setIsEntryModalOpen(true);
    };

    const handleExport = () => {
        if (filteredRevenues.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const exportData = filteredRevenues.map(r => ({
            'Data': formatDate(r.date),
            'Conta': r.conta || '',
            'Cliente': r.cliente || '',
            'Assessor': r.advisorName || '',
            'Receita Bruta': r.revenueAmount || 0,
            'Imposto Assessor': r.advisorTax || 0,
            'Comissão Líquida': r.advisorNetTotal || 0,
            'Indicação': r.referralAdvisorName || '',
            'Valor Indicação': r.referralAmount || 0,
            'Líquido Assessor': r.responsibleAdvisorNet || 0,
            'Resultado Escritório': r.advisorOperationalResult || 0,
            'Status': getStatusLabel(r.status, r.lancamentosRealizados).label
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Comissões");
        
        const fileName = `Relatorio_Comissoes_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleFormSubmit = (data: Partial<ImportedRevenue>) => {
        if (editingRevenue) {
            onUpdate(editingRevenue.id, data);
        } else {
            onAdd(data);
        }
        setIsEntryModalOpen(false);
        setEditingRevenue(null);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert("O arquivo está vazio.");
                    return;
                }

                const groups: Record<string, any> = {};
                
                data.forEach((row: any) => {
                    const contaRaw = row['Conta'] || '';
                    const clienteRaw = row['Cliente'] || '';
                    const codAssessorRaw = row['Cod Assessor'] || '';
                    const assessorRaw = row['Assessor Principal'] || '';
                    const receitaLiquida = parseFloat(String(row['Comissão Líquida'] || row['Receita Liquida EQI'] || 0).replace(',', '.')) || 0;
                    const dataRaw = row['Data'] || row['Data de Referência'] || row['Referência'] || row['Mês/Ano'] || row['Competência'];

                    if (!clienteRaw || !assessorRaw) return;

                    const key = `${contaRaw}|${clienteRaw}|${codAssessorRaw}|${assessorRaw}`;
                    if (!groups[key]) {
                        groups[key] = {
                            conta: contaRaw,
                            cliente: clienteRaw,
                            codAssessor: codAssessorRaw,
                            assessorName: assessorRaw,
                            totalRevenue: 0,
                            date: dataRaw
                        };
                    }
                    groups[key].totalRevenue = round(groups[key].totalRevenue + receitaLiquida);
                });

                const recordsToImport = Object.values(groups).map(group => {
                    const advisor = advisors.find(a => 
                        (a.code && String(a.code) === String(group.codAssessor)) || 
                        (normalizeName(a.name) === normalizeName(group.assessorName))
                    );
                    
                    let d = new Date();
                    try {
                        if (group.date) {
                            if (typeof group.date === 'number') {
                                d = new Date((group.date - 25569) * 86400 * 1000);
                            } else {
                                const parts = String(group.date).split('/');
                                if (parts.length === 3) {
                                    d = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
                                } else if (parts.length === 2) {
                                    const monthName = parts[0].trim();
                                    const year = parseInt(parts[1].trim());
                                    const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                                    if (monthIndex !== -1 && !isNaN(year)) {
                                        d = new Date(Date.UTC(year, monthIndex, 1));
                                    } else {
                                        const month = parseInt(parts[0]);
                                        if (!isNaN(month) && !isNaN(year)) {
                                            d = new Date(Date.UTC(year, month - 1, 1));
                                        }
                                    }
                                } else {
                                    const parsed = new Date(group.date);
                                    if (!isNaN(parsed.getTime())) {
                                        d = parsed;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Erro ao processar data:", e);
                    }

                    if (isNaN(d.getTime()) || d.getUTCFullYear() <= 1970) {
                        d = new Date();
                    }

                    const monthYear = months[d.getUTCMonth()] + "/" + d.getUTCFullYear();
                    const displayDate = d.toISOString();

                    return {
                        date: displayDate,
                        conta: String(group.conta),
                        cliente: `${group.cliente} - ${monthYear}`,
                        advisorId: advisor?.id || '',
                        advisorName: advisor?.name || group.assessorName,
                        revenueAmount: group.totalRevenue,
                        taxRate: globalTaxRate,
                        observacao: `Importação Automática. Assessor: ${group.codAssessor} ${group.assessorName}`,
                        hasReferral: false,
                        referralAdvisorId: '',
                        referralPercentage: 0
                    };
                });

                if (recordsToImport.length === 0) {
                    alert("Nenhum registro válido encontrado para importação.");
                    return;
                }

                setImportSummary({
                    records: recordsToImport,
                    totalAmount: round(recordsToImport.reduce((sum, r) => sum + r.revenueAmount, 0))
                });
                setIsImportModalOpen(true);
            } catch (err) {
                console.error(err);
                alert("Erro ao processar o arquivo. Verifique o formato.");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = () => {
        if (!importSummary) return;
        
        const missingAdvisors = importSummary.records.filter(r => !r.advisorId);
        if (missingAdvisors.length > 0) {
            const names = [...new Set(missingAdvisors.map(m => m.advisorName))].join(", ");
            if (!confirm(`Os seguintes assessores não foram encontrados no sistema: ${names}. Deseja continuar mesmo assim? (Eles serão importados com o nome do relatório mas sem ID vinculado)`)) {
                return;
            }
        }

        importSummary.records.forEach(record => {
            onAdd(record);
        });

        setIsImportModalOpen(false);
        setImportSummary(null);
        alert(`${importSummary.records.length} registros importados com sucesso!`);
    };

    return (
         <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent uppercase tracking-tight">Comissões</h2>
                    <p className="text-text-secondary">Controle de comissões e divisão de receitas.</p>
                </div>
                <div className="no-print flex flex-wrap gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls, .csv" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="text-sm">
                        <UploadIcon className="w-4 h-4 mr-2"/> Importar Relatório
                    </Button>
                    {importedRevenues.length > 0 && (
                        <>
                            <Button onClick={handleSyncAdvisorLinks} variant="secondary" className="px-2" title="Sincronizar vínculos de assessores">
                                <RefreshCwIcon className="w-4 h-4"/>
                            </Button>
                            <Button onClick={onClearAll} variant="ghostDanger" className="text-sm">
                                <TrashIcon className="w-4 h-4 mr-2"/> Limpar Lançamentos
                            </Button>
                        </>
                    )}
                    <Button onClick={() => { setEditingRevenue(null); setIsEntryModalOpen(true); }} className="text-sm">
                        <PlusIcon className="w-4 h-4 mr-2"/> Nova Receita
                    </Button>
                    <Button 
                        onClick={() => setIsClosingModalOpen(true)} 
                        variant="success" 
                        className="text-sm shadow-sm"
                        disabled={selectedAdvisorId === 'all' || selectedRevenueIds.size === 0 || Array.from(selectedRevenueIds).some(id => {
                            const rev = importedRevenues.find(r => r.id === id);
                            return rev?.status === CommissionStatus.COMPLETED || rev?.lancamentosRealizados;
                        })}
                    >
                        <CheckCircleIcon className="w-4 h-4 mr-2"/> Fechar comissões ({selectedRevenueIds.size})
                    </Button>
                </div>
            </div>

            <Card className="no-print p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Ano</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="all">Todos os Anos</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Mês</label>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="all">Todos os Meses</option>
                            {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Assessor</label>
                        <select 
                            value={selectedAdvisorId} 
                            onChange={(e) => setSelectedAdvisorId(e.target.value)} 
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="all">Todos os Assessores</option>
                            {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Referência / Cliente</label>
                        <div className="relative">
                            <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-background border border-border-color rounded-md pl-8 pr-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                            <SearchIcon className="w-4 h-4 text-text-secondary absolute left-2.5 top-2.5" />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="no-print flex border-b border-border-color/30 gap-6 my-2">
                <button
                    onClick={() => setComisTab('lancamentos')}
                    className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 uppercase tracking-wide flex items-center gap-2 ${
                        comisTab === 'lancamentos' 
                        ? 'border-primary text-text-primary' 
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <span>📑</span> Lançamentos e Fechamento
                </button>
                <button
                    onClick={() => setComisTab('clientes')}
                    className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 uppercase tracking-wide flex items-center gap-2 ${
                        comisTab === 'clientes' 
                        ? 'border-primary text-text-primary' 
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <span>👥</span> Receita por Cliente (Analítico)
                </button>
            </div>
            
            <div style={{ background: 'transparent', padding: '0', borderRadius: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }} className="!text-[rgba(255,255,255,0.50)]">
                    Produção do período
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: '3px solid rgba(255,255,255,0.20)',
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Produção Bruta</label>
                        <p style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{formatCurrency(totals.totalGrossProduction)}</p>
                    </div>

                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: `3px solid ${totals.totalNetProduction < 0 ? '#f87171' : 'rgba(255,255,255,0.20)'}`,
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Produção Líquida</label>
                        <p style={{ fontSize: '20px', fontWeight: 600, color: totals.totalNetProduction < 0 ? '#f87171' : 'rgba(255,255,255,0.88)' }}>{formatCurrency(totals.totalNetProduction)}</p>
                    </div>

                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: '3px solid rgba(255,255,255,0.20)',
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Comissões Pagas</label>
                        <p style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{formatCurrency(totals.totalCommissionsPaid)}</p>
                    </div>

                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: `3px solid ${totals.totalOfficeResult < 0 ? '#f87171' : '#818cf8'}`,
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center'
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Resultado do Escritório</label>
                        <p style={{ fontSize: '28px', fontWeight: 600, color: totals.totalOfficeResult < 0 ? '#f87171' : '#818cf8' }}>{formatCurrency(totals.totalOfficeResult)}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: `3px solid ${totals.totalSubsidyCost > 0 ? '#f87171' : 'rgba(255,255,255,0.20)'}`,
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Custo de Subsídio</label>
                        <p style={{ fontSize: '22px', fontWeight: 600, color: totals.totalSubsidyCost > 0 ? '#f87171' : 'rgba(255,255,255,0.88)' }}>{formatCurrency(totals.totalSubsidyCost)}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.42)', marginTop: '5px' }} className="!text-[rgba(255,255,255,0.42)]">CRM não coberto no período</p>
                    </div>

                    <div style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '0.5px solid rgba(255,255,255,0.08)', 
                        borderLeft: '3px solid #fbbf24',
                        borderRadius: '0 10px 10px 0', 
                        padding: '16px 18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }} className="!text-[rgba(255,255,255,0.58)]">Produção mínima</label>
                        <p style={{ fontSize: '22px', fontWeight: 600, color: '#fbbf24' }}>
                            {formatCurrency(totals.avgMinProduction)}
                            <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.25)' }}> / mês</span>
                        </p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.42)', marginTop: '5px' }} className="!text-[rgba(255,255,255,0.42)]">mínimo para cobrir CRM e imposto</p>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', margin: '14px 0' }} />

            {reconciliationReport.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 px-1 gap-2">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-primary/10 rounded-lg text-primary">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </span>
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }} className="tracking-tight uppercase">
                                    Relatório de Conciliação e Fechamento
                                </h3>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                    Detalhamento de comissionamento, tributos, custos e repiques no período
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setShowReconciliationReport(!showReconciliationReport)}
                            variant="secondary"
                            className="text-[11px] py-1 px-3 border border-border-color/40 h-8 font-semibold"
                        >
                            {showReconciliationReport ? 'Ocultar Relatório Detalhado' : 'Ver Relatório de Conciliação'}
                        </Button>
                    </div>

                    {showReconciliationReport ? (
                        <Card className="p-2 sm:p-4 bg-surface border border-border-color/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[10px] sm:text-xs font-mono">
                                    <thead>
                                        <tr className="border-b border-border-color text-text-secondary uppercase select-none text-[9px] tracking-wider bg-background/30">
                                            <th className="p-3 font-medium">Assessor</th>
                                            <th className="p-3 font-medium text-right">Fat. Bruto</th>
                                            <th className="p-3 font-medium text-right text-danger">Imposto</th>
                                            <th className="p-3 font-medium text-right text-green-400">Fat. Líquido</th>
                                            <th className="p-3 font-medium text-right">Partilha Assessor</th>
                                            <th className="p-3 font-medium text-right text-danger">Desc. CRM</th>
                                            <th className="p-3 font-medium text-right text-danger">Repique Pago</th>
                                            <th className="p-3 font-medium text-right text-green-400">Repique Rec.</th>
                                            <th className="p-3 font-medium text-right text-primary font-bold">Comissão Líq.</th>
                                            <th className="p-3 font-medium text-right font-bold text-amber-500">Result. Escrit.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-color/10">
                                        {reconciliationReport.map(item => (
                                            <tr key={item.advisorId} className="hover:bg-background/45 transition-colors">
                                                <td className="p-3 font-sans font-bold text-text-primary capitalize">{item.name}</td>
                                                <td className="p-3 text-right">{formatCurrency(item.faturamentoBruto)}</td>
                                                <td className="p-3 text-right text-danger">{formatCurrency(item.imposto)}</td>
                                                <td className="p-3 text-right text-green-400 font-semibold">{formatCurrency(item.faturamentoLiquido)}</td>
                                                <td className="p-3 text-right">{formatCurrency(item.repasseBrutoAssessor)} <span className="text-[9px] text-text-secondary">(70%)</span></td>
                                                <td className="p-3 text-right text-danger">-{formatCurrency(item.crmDesconto)}</td>
                                                <td className="p-3 text-right text-danger">-{formatCurrency(item.repiquePago)}</td>
                                                <td className="p-3 text-right text-green-400">+{formatCurrency(item.repiqueRecebido)}</td>
                                                <td className="p-3 text-right text-primary font-bold">{formatCurrency(item.comissaoFinalLiquida)}</td>
                                                <td className={`p-3 text-right font-bold ${item.resultadoEscritorio >= 0 ? 'text-amber-500' : 'text-danger'}`}>
                                                    {formatCurrency(item.resultadoEscritorio)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        selectedAdvisorId === 'all' && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px 16px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
                                            <th style={{ padding: '12px 0', textAlign: 'left', width: '40px' }}></th>
                                            <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Assessor</th>
                                            <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Resultado</th>
                                            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Cobertura CRM</th>
                                            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {advisorProfitability.map((item, index) => {
                                            const coverage = item.crmCusto > 0 ? (item.totalParcelaAssessor / item.crmCusto) * 100 : 100;
                                            const isProfitable = item.status === 'Lucrativo';
                                            const isSubsidized = item.status === 'Subsidiado';
                                            
                                            return (
                                                <tr key={item.advisorId} style={{ borderBottom: index === advisorProfitability.length - 1 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/[0.02] transition-colors">
                                                    <td style={{ padding: '12px 0' }}>
                                                        <div style={{ 
                                                            width: '30px', 
                                                            height: '30px', 
                                                            borderRadius: '50%', 
                                                            background: isProfitable ? 'rgba(110, 231, 183, 0.1)' : isSubsidized ? 'rgba(252, 165, 165, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                            color: isProfitable ? '#6ee7b7' : isSubsidized ? '#fca5a5' : 'rgba(255, 255, 255, 0.5)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '11px',
                                                            fontWeight: 600
                                                        }}>
                                                            {item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{item.name}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: item.result < 0 ? '#f87171' : '#34d399' }}>
                                                            {formatCurrency(item.result)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                                        <div style={{ display: 'inline-block', width: '80px' }}>
                                                            <div style={{ background: 'rgba(255,255,255,0.06)', height: '4px', borderRadius: '4px', width: '100%', overflow: 'hidden' }}>
                                                                <div style={{ 
                                                                    background: coverage >= 100 ? '#34d399' : '#f87171', 
                                                                    height: '100%', 
                                                                    width: `max(${Math.min(coverage, 100)}%, 2px)` 
                                                                }} />
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
                                                                {Math.round(coverage)}%
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                                        <div style={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '6px',
                                                            padding: '3px 8px', 
                                                            border: `0.5px solid ${isProfitable ? 'rgba(52, 211, 153, 0.2)' : isSubsidized ? 'rgba(248, 113, 113, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                                                            borderRadius: '99px', 
                                                            background: isProfitable ? 'rgba(52, 211, 153, 0.1)' : isSubsidized ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                            color: isProfitable ? '#34d399' : isSubsidized ? '#f87171' : '#fbbf24',
                                                            fontSize: '10px',
                                                            fontWeight: 500
                                                        }}>
                                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                                                            {item.status}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            )}

            {advisorSummary && (
                <Card className="p-4 border-l-4 border-primary bg-primary/5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-primary uppercase tracking-tight">Resumo: {advisorSummary.name}</h3>
                            <p className="text-xs text-text-secondary">Consolidado do período selecionado</p>
                             <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div>
                                    <label className="block text-[10px] text-text-secondary uppercase font-medium">Comissão Total</label>
                                    <p className="text-sm font-bold text-primary">{formatCurrency(advisorSummary.totalCommission)}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-secondary uppercase font-medium">Indicações Recebidas</label>
                                    <p className="text-sm font-bold text-green-400">{formatCurrency(advisorSummary.referralsPaid)}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-secondary uppercase font-medium">Resultado do Escritório na Produção</label>
                                    <p className={`text-sm font-bold ${advisorSummary.operationalResult < 0 ? 'text-danger' : 'text-green-400'}`}>
                                        {formatCurrency(advisorSummary.operationalResult)}
                                    </p>
                                </div>
                             </div>
                        </div>
                    </div>
                </Card>
            )}

            {comisTab === 'lancamentos' ? (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap text-[10px] sm:text-xs">
                            <thead className="bg-background/50 uppercase text-text-secondary">
                                <tr>
                                    <th className="no-print p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-border-color bg-background text-primary focus:ring-primary"
                                            checked={selectedRevenueIds.size > 0 && selectedRevenueIds.size === filteredRevenues.filter(r => r.status !== CommissionStatus.COMPLETED && !r.lancamentosRealizados).length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Referência / Cliente</th>
                                    <th className="p-4">Assessor Resp.</th>
                                    <th className="p-4">Receita Gerada</th>
                                    <th className="p-4">Indicação</th>
                                    <th className="p-4">Comissão Líquida</th>
                                    <th className="p-4">Resultado do Escritório na Produção</th>
                                    <th className="no-print p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color/30">
                                {filteredRevenues.map(r => (
                                    <tr key={r.id} className={`hover:bg-background/50 ${selectedRevenueIds.has(r.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="no-print p-4">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-border-color bg-background text-primary focus:ring-primary"
                                                checked={selectedRevenueIds.has(r.id)}
                                                onChange={() => toggleSelect(r.id)}
                                                disabled={r.status === CommissionStatus.COMPLETED || r.lancamentosRealizados}
                                            />
                                        </td>
                                        <td className="p-4">{formatDate(r.date)}</td>
                                        <td className="p-4 font-medium max-w-[150px] truncate" title={`${r.conta ? '[' + r.conta + '] ' : ''}${r.cliente}`}>
                                            {r.conta && <span className="text-text-secondary mr-1">[{r.conta}]</span>}
                                            {r.cliente}
                                        </td>
                                        <td className="p-4">{r.advisorName}</td>
                                        <td className="p-4 font-bold">{formatCurrency(r.revenueAmount || 0)}</td>
                                        <td className="p-4">
                                            {r.referralAdvisorId ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{r.referralAdvisorName}</span>
                                                    <span className="text-[9px] text-text-secondary">{r.referralPercentage}% ({formatCurrency(r.referralAmount)})</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center opacity-20">
                                                    <InfoIcon className="w-3 h-3" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-primary font-bold">
                                            <div className="flex flex-col">
                                                <span>{formatCurrency(r.advisorNetTotal || 0)}</span>
                                                {r.referralAdvisorId && (
                                                    <span className="text-[9px] text-text-secondary font-normal">Resp: {formatCurrency(r.responsibleAdvisorNet)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`p-4 font-bold ${r.advisorOperationalResult !== undefined && r.advisorOperationalResult < 0 ? 'text-danger' : 'text-green-400'}`}>
                                            {r.advisorOperationalResult !== undefined ? formatCurrency(r.advisorOperationalResult) : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <select 
                                                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer text-center select-none border border-white/5 focus:outline-none focus:ring-1 focus:ring-primary/40 ${getStatusLabel(r.status, r.lancamentosRealizados).bg || 'bg-background'} ${getStatusLabel(r.status, r.lancamentosRealizados).color || 'text-text-secondary'}`}
                                                    style={{...getStatusLabel(r.status, r.lancamentosRealizados).style, WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlignLast: 'center'}}
                                                    value={getEffectiveStatus(r.status, r.lancamentosRealizados)}
                                                    onChange={async (e) => {
                                                        const val = e.target.value as CommissionStatus;
                                                        const lancamentosRealizados = val === CommissionStatus.COMPLETED;
                                                        await onUpdate(r.id, { status: val, lancamentosRealizados });
                                                    }}
                                                >
                                                    <option className="bg-[#1e293b] text-text-secondary" value={CommissionStatus.PENDING}>Pendente de Lançamento</option>
                                                    <option className="bg-[#1e293b] text-blue-400" value={CommissionStatus.COMMISSION_LAUNCHED}>Comissão Lançada</option>
                                                    <option className="bg-[#1e293b] text-indigo-400" value={CommissionStatus.REVENUE_LAUNCHED}>Receita Lançada</option>
                                                    <option className="bg-[#1e293b] text-orange-400" value={CommissionStatus.TAX_PROVISIONED}>Impostos Provisionados</option>
                                                    <option className="bg-[#1e293b] text-teal-400" value={CommissionStatus.REFERRAL_SETTLED}>Indicação Quitada (Parcial)</option>
                                                    <option className="bg-[#1e293b] text-green-400" value={CommissionStatus.COMPLETED}>Lançamento Completo</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="no-print p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" className="p-1" onClick={() => handleEdit(r)} disabled={r.status === CommissionStatus.COMPLETED || r.lancamentosRealizados}><EditIcon className="w-3 h-3"/></Button>
                                                <Button variant="ghostDanger" className="p-1" onClick={() => onDelete(r.id)}><TrashIcon className="w-3 h-3"/></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRevenues.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-text-secondary italic">Nenhum registro encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div className="bg-surface border border-border-color/60 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Receita Bruta</span>
                            <p className="text-lg font-extrabold text-text-primary mt-1 font-mono">{formatCurrency(clientRevenuesSummary.totals.totalBruta)}</p>
                        </div>
                        <div className="bg-surface border border-border-color/60 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Impostos</span>
                            <p className="text-lg font-extrabold text-danger/90 mt-1 font-mono">-{formatCurrency(clientRevenuesSummary.totals.totalImpostos)}</p>
                        </div>
                        <div className="bg-surface border border-border-color/60 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Receita Líquida</span>
                            <p className="text-lg font-extrabold text-green-400 mt-1 font-mono">{formatCurrency(clientRevenuesSummary.totals.totalLiquida)}</p>
                        </div>
                        <div className="bg-surface border border-border-color/60 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Repasse Assessores</span>
                            <p className="text-lg font-extrabold text-primary mt-1 font-mono">{formatCurrency(clientRevenuesSummary.totals.totalComissao)}</p>
                        </div>
                        <div className="bg-surface border border-border-color/60 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Resultado Escritório</span>
                            <p className="text-lg font-extrabold text-amber-500 mt-1 font-mono">{formatCurrency(clientRevenuesSummary.totals.totalEscritorio)}</p>
                        </div>
                    </div>

                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap text-[10px] sm:text-xs">
                                <thead className="bg-background/50 uppercase text-text-secondary">
                                    <tr>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Assessor Responsável</th>
                                        <th className="p-4 text-right">Receita Bruta Gerada</th>
                                        <th className="p-4 text-right text-danger">Impostos</th>
                                        <th className="p-4 text-right text-green-400">Receita Líquida</th>
                                        <th className="p-4 text-right text-primary">Comissão Assessor</th>
                                        <th className="p-4 text-right text-amber-500">Resultado Escritório</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color/30">
                                    {clientRevenuesSummary.list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-text-secondary italic">Nenhum cliente com lançamentos no período filtrado.</td>
                                        </tr>
                                    ) : (
                                        clientRevenuesSummary.list.map((c, i) => (
                                            <tr key={i} className="hover:bg-background/50 transition-colors">
                                                <td className="p-4 font-bold text-text-primary">{c.cliente}</td>
                                                <td className="p-4 font-medium text-text-secondary">{c.advisorName}</td>
                                                <td className="p-4 text-right font-mono font-bold">{formatCurrency(c.revenueBruta)}</td>
                                                <td className="p-4 text-right font-mono text-danger">-{formatCurrency(c.impostos)}</td>
                                                <td className="p-4 text-right font-mono text-green-400 font-bold">{formatCurrency(c.revenueLiquida)}</td>
                                                <td className="p-4 text-right font-mono text-primary font-bold">{formatCurrency(c.comissaoAssessor)}</td>
                                                <td className="p-4 text-right font-mono text-amber-500 font-bold">{formatCurrency(c.resultadoEscritorio)}</td>
                                            </tr>
                                        ))
                                    )}
                                    {clientRevenuesSummary.list.length > 0 && (
                                        <tr className="bg-background/60 font-bold border-t-2 border-border-color">
                                            <td className="p-4 text-text-primary" colSpan={2}>SUBTOTAL CONSOLIDADO ({clientRevenuesSummary.list.length} clientes)</td>
                                            <td className="p-4 text-right font-mono text-text-primary">{formatCurrency(clientRevenuesSummary.totals.totalBruta)}</td>
                                            <td className="p-4 text-right font-mono text-danger">-{formatCurrency(clientRevenuesSummary.totals.totalImpostos)}</td>
                                            <td className="p-4 text-right font-mono text-green-400">{formatCurrency(clientRevenuesSummary.totals.totalLiquida)}</td>
                                            <td className="p-4 text-right font-mono text-primary">{formatCurrency(clientRevenuesSummary.totals.totalComissao)}</td>
                                            <td className="p-4 text-right font-mono text-amber-500">{formatCurrency(clientRevenuesSummary.totals.totalEscritorio)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Confirmar Importação">
                <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm text-text-primary">Resumo da Importação:</p>
                        <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                            <li>Total de Registros Agrupados: <strong>{importSummary?.records.length}</strong></li>
                            <li>Volume Total de Receita: <strong>{formatCurrency(importSummary?.totalAmount || 0)}</strong></li>
                        </ul>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto border border-border-color rounded-md">
                        <table className="w-full text-left text-[10px]">
                            <tbody className="divide-y divide-border-color/30">
                                {importSummary?.records.map((r, i) => (
                                    <tr key={i}>
                                        <td className="p-2">{r.cliente}</td>
                                        <td className="p-2">{r.advisorName}</td>
                                        <td className="p-2 text-right font-bold">{formatCurrency(r.revenueAmount)}</td>
                                        <td className="p-2">
                                            <input 
                                                type="checkbox" 
                                                checked={r.hasReferral} 
                                                onChange={(e) => {
                                                    const newRecords = [...importSummary.records];
                                                    newRecords[i].hasReferral = e.target.checked;
                                                    setImportSummary({ ...importSummary, records: newRecords });
                                                }}
                                            />
                                        </td>
                                        <td className="p-2">
                                            {r.hasReferral && (
                                                <select 
                                                    value={r.referralAdvisorId} 
                                                    onChange={(e) => {
                                                        const newRecords = [...importSummary.records];
                                                        newRecords[i].referralAdvisorId = e.target.value;
                                                        const adv = advisors.find(a => a.id === e.target.value);
                                                        newRecords[i].referralAdvisorName = adv?.name || '';
                                                        setImportSummary({ ...importSummary, records: newRecords });
                                                    }}
                                                    className="bg-background border border-border-color rounded text-[10px] p-1 w-full"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {advisors.filter(a => a.id !== r.advisorId).map(adv => (
                                                        <option key={adv.id} value={adv.id}>{adv.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {r.hasReferral && (
                                                <input 
                                                    type="number" 
                                                    value={r.referralPercentage} 
                                                    onChange={(e) => {
                                                        const newRecords = [...importSummary.records];
                                                        newRecords[i].referralPercentage = Number(e.target.value);
                                                        setImportSummary({ ...importSummary, records: newRecords });
                                                    }}
                                                    className="bg-background border border-border-color rounded text-[10px] p-1 w-full"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-[10px] text-text-secondary italic">
                        * As receitas foram agrupadas por Cliente + Assessor.
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsImportModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={confirmImport}>Confirmar e Lançar</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title={editingRevenue ? "Editar Registro de Receita" : "Novo Registro de Receita"}>
                <ImportedRevenueForm 
                    onSubmit={handleFormSubmit} 
                    onClose={() => setIsEntryModalOpen(false)} 
                    advisors={advisors} 
                    initialData={editingRevenue} 
                    globalTaxRate={globalTaxRate} 
                />
            </Modal>

            {isClosingModalOpen && selectedAdvisorId !== 'all' && (
                <CommissionClosingModal 
                    isOpen={isClosingModalOpen}
                    onClose={() => setIsClosingModalOpen(false)}
                    onConfirm={onBatchCommissionClosing}
                    advisor={advisors.find(a => a.id === selectedAdvisorId)!}
                    advisors={advisors}
                    month={selectedMonth === 'all' ? new Date().getMonth() : selectedMonth as number}
                    year={selectedYear === 'all' ? new Date().getFullYear() : selectedYear as number}
                    generatedRevenue={selectedSummary.revenueAmount}
                    globalTaxRate={globalTaxRate}
                    estimatedTaxRate={estimatedTaxRate}
                    revenueIds={selectedSummary.ids}
                    selectedRecords={selectedSummary.records}
                    hasCrmAlreadyApplied={hasCrmAlreadyApplied}
                    allImportedRevenues={importedRevenues}
                />
            )}
         </div>
    );
};

export default ImportedRevenuesView;
