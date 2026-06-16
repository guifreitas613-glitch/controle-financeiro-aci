import { ImportedRevenue, Advisor } from '../types';
import { round, normalizeName } from './financialCalculations';

export const calculateCommissionTotals = (
    filteredRevenues: ImportedRevenue[],
    advisors: Advisor[],
    selectedYear: number | 'all',
    selectedMonth: number | 'all',
    selectedAdvisorId: string | 'all'
) => {
    // Computations can be encapsulated here
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
                advisorName: r.advisorName || 'Desconhecido'
            };
        }
    });

    return groups;
};
