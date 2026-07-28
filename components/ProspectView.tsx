import React, { FC, useState, useEffect, useMemo } from 'react';
import { Advisor, Prospect } from '../types';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';
import { saveProspect, updateProspect, deleteProspect } from '../firestore';
import { 
    Button, 
    Modal, 
    Card, 
    SearchIcon, 
    PlusIcon, 
    UploadIcon, 
    PartnershipIcon, 
    GoalsIcon,
    DownloadIcon,
    ExportIcon,
    SendIcon,
    MessageSquareIcon
} from './UIComponents';

const INITIAL_IMPORT_LIST_TEMPLATE = `Nome;Empresa;Cargo;Email;Celular
;Transportes Soares;;gerencia@transportesoares.com.br;(41) 99946-3909
César Ricardo Hübsch;Hübsch Consultoria e Desenvolvimento;;cesar.ricardo.consultoria@gmail.com;(41) 99667-7496
Leandro Correa;Praxis Consultoria;;adm.leandrocorrea@hotmail.com;(11) 94137-7204
Jeferson J. Freitas;Delta;;jjfreitas1371@gmail.com;(41) 99915-4411
Fábio Amarante de Souza;Amarante Gestão;;fabio@amarantegestao.com.br;(41) 98484-8491
Marcelo Pessanha;Ademicon Consórcio e Investimento;;marcelo.pessanha@autorizadoademicon.com.br;(41) 99254-3435
Sergio Luiz Beggiato Junior;DE:Risk GRC;;sergio.beggiato@gmail.com;(41) 99886-5193
Vilmar Szigel;ACI Capital;;szigelvilmar@gmail.com;(41) 99222-1976
Paulo Jacinto Rosa;SCRYTA Assessoria Contábil Ltda.;;paulo@scryta.com.br;(41) 98835-6532
Isabela Terres;Terres Advocacia;;isabelaterres1@gmail.com;(41) 98778-7631
Patricia dos Santos;Ademicon;;dossantospatricia07@gmail.com;(41) 98793-9406
Alessandro Ferreira Machado;Revisitar Desenvolvimento Humano;;afmale.fm@gmail.com;(41) 98822-9440
Clarice Moreira Dias;Instituto Clarice;;clarice.moreiradias1976@gmail.com;(41) 99676-0470
Bruna Nakamura Nepomuceno Toledo;BNNT Delta Labs;;bruna@deltadocliente.com;(41) 99932-3333
Beatrice Bueno;Bueno Advocacia e Consultoria Jurídica;;beatricebueno.adv@gmail.com;(41) 99736-6859
Davi Almeida Carvalho;Nxs Hub;;davialmeidacarvalho59@gmail.com;(92) 98620-6811
Vitor Edson Gerhardt;Veger Treinamentos;;vitorgerhardt@gmail.com;(41) 99930-7001
Jaqueline Martins;MG Consultoria;;jaquemartiins51@gmail.com;(41) 99898-2776
Andressa Cristina de Paula;Consolide Registro de Marcas e Patentes;;negocios.depaulaa@gmail.com;(41) 99956-0819
Helton Aguiar;Meu Garrafão;;helton@meugarrafao.com;(41) 99920-1144
Vivian Rosana de Campos Gomes;Vivian Campos - Psicanálise Conectamente;;psicanalise.conectamente@gmail.com;(41) 99664-0828
Anauila Osternack;Restaurante Spring;;anauilamosternack@gmail.com;(41) 99803-0666
Klaus Stromberg;Lux Capital;;klaus.stromberg@gmail.com;(41) 98841-0089
Simey Costa Batista;YOUPrime;;siimey.batista@youprime.com.br;(41) 98428-9688
Jailson Silva;Tavi Máquinas;;jailsonsilv@gmail.com;(41) 99119-9491
Victor Peck;Acampar;;acampar@acampar.com.br;(41) 99665-6807
Karoline Teotonio;Flowbiz;;karoline.teotonio@flowbiz.com.br;(41) 99586-9900
Elton Ribeiro;Unicoon Proteção Veicular;;eltonribeiro.220783@gmail.com;(41) 99942-5099
Eliane da Silva;Safe Care Consultoria;;eliane.bernardii@gmail.com;(41) 99159-7980
Henrique Cruz;Lavo na Vaga;;henrique@lavonavaga.com.br;(41) 99602-5324
Edson Eduardo Tod;Identificare Soluções para Eventos Ltda;;tod@identificare.com.br;(41) 99261-6008
Pedro Muschitz;Weagle Governance;;pedro@weagle.com.br;(41) 99822-0727
Valter Vieira Ribeiro;Jesus100 Editora Ltda;;valter@sbdh.com.br;(41) 99972-2711
Sandro Barbosa Cestaro;Cestaro Consultoria;;sandro_cestaro@cestaroconsultoria.com;(41) 98776-2108
Luciana Fernandes Dias;Golden Lion Business & Imóveis;;luciana.goldenlion@gmail.com;(41) 99907-0100
Rogerio Kriger;Direct Marketing;;rogerio@directmkt.com.br;(41) 98837-8862
Marinela Llovet Canepa;53732767 Marinela Llovet Canepa;;marinelacanepa@gmail.com;(41) 98844-3762
Caue Damião;CNX Seguros;;caue.damiao@cnxseguros.com.br;(41) 99646-0007
Luiz Renato Roble;Datamaker Design;;criacao@datamaker.com.br;(41) 99911-5230
Giancarlo Mina;RIP Memorial;;giancarlo@ripmemorial.com;(41) 98822-9187
Maithê Lima;Maithê Lima Consórcios e Investimentos (Ademicon);;amaithelima@gmail.com;(41) 99233-0454
Diandra Miziara;Diandra Miziara Estética Avançada;;diandra_f@hotmail.com;(41) 99934-7200
Rodrigo Banach;Target Invest;;rodrigo.banach@targetinvest.com.br;(41) 98835-3597
Gabriela Guadagnin;Eletro São Marcos;;gabi_guadagnin@hotmail.com;(41) 99647-4007
Edson Domingues Polizel;Edson Polizel Psicoterapeuta;;edsonpolizelterapeuta@gmail.com;(41) 98529-3064
Jesse Gomes Adamuchio;Local Score / Gran Tour 360;;jesseadamuchio@gmail.com;(41) 99945-5042
Renata Matos de Oliveira;Conectar Contabilidade;;renatamo0110@gmail.com;(41) 99887-5108
Reginaldo dos Santos Cordeiro;Impacto Consultoria e Treinamentos;;regy.cordeiro@gmail.com;(41) 99543-3024
Ariane Grazielle de Jesus;Sarai Saias;;arii__morena@hotmail.com;(43) 99652-7958
Suziani Seli da Silva Coutinho;Sarai Saias;;suzimz@hotmail.com;(41) 99637-7044
Monica de Moraes Zanelatto;Monica de Moraes Zanelatto;;monizanelatto@gmail.com;(41) 99953-3065
Daniel Bueno Coutinho;Needsclear;;danielbueno921@hotmail.com;(41) 99960-5112
Denise Santos de Souza;DS Realty;;denise@dsrealty.com.br;(41) 98817-8022
Jose Mauricio Ferreira Dieguez;Roda +;;mauricio@rodamaisgroup.com;(41) 99709-6630
Douglas Egeia;Douglas Egeia;;douglasegeia@gmail.com;(41) 99552-5482
Debora Waz;Brand To Win;;debora.waz@gmail.com;(41) 99280-8182
Veronica Letícia Pacheco;Toda Comunicação;;redacao@todacomunicacao.com.br;(41) 98846-9535
Antoine Najib Ahee;Hass Consórcio;;antoine.najib@gmail.com;(41) 98808-7510
Valdeni da Costa Lima;Live Empreendimentos;;valdeni478@gmail.com;(41) 99191-9779
Klebia de Oliveira Chagas;Aba Saúde e Segurança do Trabalho;;klebia@abaocupacional.com.br;(41) 98430-8127
Claudio Marcos Araujo;CMA Consultoria Telecom;;claudio.araujo.cwb@gmail.com;(41) 99679-1619
Paulo Dias Fernandes;PD Consultoria LTDA;;paulo@pdconsultoria.com.br;(41) 99142-4046
Lilian Oliveira;Sursuma Soluções em RH;;lilian.oliveira@sursuma.com.br;(41) 99695-9587
Robson Sudario;CMA Consultoria Telecom;;pr.robsonsudario@gmail.com;(41) 99523-9448
Alline Fieker Freiberger;Alline Fieker Desenvolvimento Humano;;allinefieker@gmail.com;(41) 99699-5002
Alex Moises Malca Lopes da Silva;BORNE Engenharia;;alex@energiaborne.com.br;(41) 99224-1002
Cledisson Ribeiro Gama de Oliveira;Escritório Advocacia;;cledissongama@gmail.com;(41) 8441-9345
Priscila de Lima;Priscila Lima;;priscila.lverissimo@gmail.com;(41) 98846-4519
Rafaelly Zanelatto;RR Gestão;;diretoria@rrgroup.live;(41) 99213-9511
Valdireni Alves;S.Clara Comunicação;;valdirenialves@gmail.com;(41) 99288-5787
Davi Barbosa;Tim;;dbarbosa@xcelltelecom.com;(41) 99501-0461
Franciele Brião Guilherme;13096438000167;;fbriao@xcelltelecom.com.br;(41) 99949-0121
Gabriel Mendonça Gama de Oliveira;Escritório Advocacia;;ggama0308@gmail.com;(41) 99104-8017
Ana Paula Richarde;Chama o Marketing;;ana@chamaomarketing.com.br;(44) 99923-4924
Juliano Moreira;AT1 Digital;;juliano@at1.digital;(31) 99676-0210
Eduardo Anderson Honjo;Carteirinha Digital;;eduardo@honjo.com.br;(48) 99140-5003
Thaiane Andretta;Consultório Thaiane Andretta;;thaiandretta@hotmail.com;(41) 98829-9129
Amanda Gaspar;Ademicon;;amanda.gaspar@autorizadoademicon.com.br;(41) 99747-5301
Manuela Araujo Gabardo Guimarães;Integra Benefícios;;manuela@integrabeneficios.com;(41) 99924-0027
Wilson Luiz Azevedo Junior;Consórcio Servopa;;wilsonlaj@hotmail.com;(41) 99991-9171
Thiago Berardi Rocha Almeida;TBS Group Marketing Estratégico;;thiago@tbsgroup.marketing;(11) 99556-7878
Eduardo Morais Pereira;Ademicon;;edump016@gmail.com;(16) 98859-5978
Zulmeia de Almeida;Profissional Liberal;;zulmeia.almeida@gmail.com;(41) 99835-3537
Edmondo Scupino;Scupino Representações;;escupino@gmail.com;(41) 99908-1249
Sandro Berton da Costa;JF Weld;;sandroberton75@gmail.com;(41) 98857-4007
Márcia De Lazari;De Lazari Corretora de Seguros;;contato@delazaricorretora.com.br;(41) 98866-5974
Bruno Castro;B. Castro Consultoria;;comercial@bcastroconsultoria.com;(41) 99952-8310
Ana Paula Westphal;De Lazari Corretora de Seguros;;paulinharibas@hotmail.com;(41) 8499-2159
Lucas da Silva Barbosa;Kinder Park;;lucascomercialkinderpark@gmail.com;(41) 99537-0900
Rosirlei Aparecida dos Santos Godinho;Dique Corretora de Seguros;;rosirlei@diquecorretora.com.br;(41) 98864-7533
Magali Garcia Rodrigues;Dedicata Intermediação Ltda.;;magali.dedicata2016@gmail.com;(41) 99952-0285
Elmar Storck Borges;E2 Importação e Comércio LTDA;;elmar@e2bright.com;(41) 99681-9660
Bruna Rocha Carneiro;Hospital Pequeno Príncipe;;bruna.carneiro@hpp.org.br;(55) 99629-8610
Camila Santiago Crucillo da Silva;Hospital Pequeno Príncipe;;camila.crucillo@hpp.org.br;(41) 99786-7214
Enrique Pigatto de Mello;W1 Capital;;enriquepigatto@gmail.com;(41) 99646-8519
Edmundo L. V. Barbosa;Youfirst;;esmundo_barbosa@hotmail.com;(41) 99969-4460`;

const normalizeName = (name: string | undefined | null) => {
    if (!name) return '';
    return name.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export const ProspectsView: FC<{ advisors: Advisor[]; userId: string }> = ({ advisors, userId }) => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [advisorFilter, setAdvisorFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [broadcastFilter, setBroadcastFilter] = useState<string>('all');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
    const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<'phone' | 'email' | null>(null);

    // Import states
    const [importText, setImportText] = useState(INITIAL_IMPORT_LIST_TEMPLATE);
    const [importResponsible, setImportResponsible] = useState('');
    const [importSource, setImportSource] = useState<'indicacao' | 'evento' | 'networking' | 'Instagram' | 'outro'>('networking');
    const [importStatus, setImportStatus] = useState<Prospect['status']>('Novo contato');
    const [isImporting, setIsImporting] = useState(false);

    // CSV Export states
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStatusFilter, setExportStatusFilter] = useState<string>('current');
    const [exportBroadcastFilter, setExportBroadcastFilter] = useState<string>('all');
    const [exportAdvisorFilter, setExportAdvisorFilter] = useState<string>('all');
    const [exportPreset, setExportPreset] = useState<'whatsapp_bulk' | 'phone_only' | 'phone_raw_only' | 'complete'>('whatsapp_bulk');
    const [exportOnlyWithPhone, setExportOnlyWithPhone] = useState<boolean>(true);
    const [csvSeparator, setCsvSeparator] = useState<';' | ','>(';');

    // WhatsApp Broadcast Disparador states
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastStatusFilter, setBroadcastStatusFilter] = useState<string>('current');
    const [broadcastBroadcastFilter, setBroadcastBroadcastFilter] = useState<string>('all');
    const [broadcastAdvisorFilter, setBroadcastAdvisorFilter] = useState<string>('all');
    const [broadcastTemplate, setBroadcastTemplate] = useState<string>(
        'Olá, {primeiro_nome}! Tudo bem? Me chamo {assessor}. Estou entrando em contato referente a oportunidades para a {empresa}. Teria alguns minutinhos para conversarmos?'
    );
    const [broadcastAutoUpdateStatus, setBroadcastAutoUpdateStatus] = useState<boolean>(true);
    const [broadcastRegisterInteraction, setBroadcastRegisterInteraction] = useState<boolean>(true);
    const [isQueueActive, setIsQueueActive] = useState<boolean>(false);
    const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
    const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);

    useEffect(() => {
        if (advisors && advisors.length > 0 && !importResponsible) {
            setImportResponsible(advisors[0].name);
        }
    }, [advisors, importResponsible]);

    // Form states
    const [formName, setFormName] = useState('');
    const [formCompany, setFormCompany] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formSource, setFormSource] = useState<'indicacao' | 'evento' | 'networking' | 'Instagram' | 'outro'>('indicacao');
    const [formStatus, setFormStatus] = useState<Prospect['status']>('Novo contato');
    const [formFirstContactDate, setFormFirstContactDate] = useState('');
    const [formResponsible, setFormResponsible] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formBroadcastAccepted, setFormBroadcastAccepted] = useState(false);

    // Log Interaction states
    const [selectedProspectForInteraction, setSelectedProspectForInteraction] = useState<Prospect | null>(null);
    const [interactionText, setInteractionText] = useState('');

    useEffect(() => {
        const q = query(collection(db, "prospects"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Prospect[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Prospect);
            });
            setProspects(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formResponsible) {
            alert("Nome e Assessor Responsável são obrigatórios.");
            return;
        }

        const data = {
            name: formName,
            company: formCompany || '',
            role: formRole || '',
            email: formEmail || '',
            phone: formPhone || '',
            source: formSource,
            status: formStatus,
            firstContactDate: formFirstContactDate || new Date().toISOString().split('T')[0],
            responsible: formResponsible,
            notes: formNotes || '',
            lastInteraction: editingProspect?.lastInteraction || '',
            broadcastAccepted: formBroadcastAccepted
        };

        try {
            if (editingProspect) {
                await updateProspect(editingProspect.id, data);
            } else {
                await saveProspect(data, userId);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error("Erro ao salvar prospecto:", err);
            alert("Ocorreu um erro ao salvar o prospecto.");
        }
    };

    const handleLogInteractionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProspectForInteraction || !interactionText) return;

        const todayStr = new Date().toLocaleDateString('pt-BR');
        const updatedNotes = `${selectedProspectForInteraction.notes || ''}\n[${todayStr}] ${interactionText}`.trim();
        const updatedInteraction = `[${todayStr}] ${interactionText}`;

        try {
            await updateProspect(selectedProspectForInteraction.id, {
                notes: updatedNotes,
                lastInteraction: updatedInteraction
            });
            setIsInteractionModalOpen(false);
            setSelectedProspectForInteraction(null);
            setInteractionText('');
        } catch (err) {
            console.error("Erro ao registrar interação:", err);
            alert("Ocorreu um erro ao registrar a interação.");
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importText.trim()) {
            alert("Cole a lista para importar.");
            return;
        }
        if (!importResponsible) {
            alert("Selecione o Assessor Responsável Padrão para estes contatos.");
            return;
        }

        setIsImporting(true);
        try {
            const lines = importText.split(/\r?\n/);
            let successCount = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('Nome;') || line.toLowerCase().startsWith('nome;empresa;')) {
                    continue;
                }

                const parts = line.split(';');
                if (parts.length < 2) continue;

                let rawName = parts[0]?.trim() || '';
                let rawCompany = parts[1]?.trim() || '';
                let rawRole = parts[2]?.trim() || '';
                let rawEmail = parts[3]?.trim() || '';
                let rawPhone = parts[4]?.trim() || '';

                if (rawEmail.startsWith('[') && rawEmail.includes('](mailto:')) {
                    const match = rawEmail.match(/\[([^\]]+)\]/);
                    if (match) {
                        rawEmail = match[1].trim();
                    }
                }

                if (!rawName) {
                    if (rawCompany) {
                        rawName = `Contato [${rawCompany}]`;
                    } else {
                        rawName = `Lead Sem Nome #${i}`;
                    }
                }

                const data = {
                    name: rawName,
                    company: rawCompany,
                    role: rawRole,
                    email: rawEmail,
                    phone: rawPhone,
                    source: importSource,
                    status: importStatus,
                    firstContactDate: new Date().toISOString().split('T')[0],
                    responsible: importResponsible,
                    notes: 'Importado em lote via lista padrão.',
                    lastInteraction: ''
                };

                await saveProspect(data, userId);
                successCount++;
            }

            alert(`Importação concluída! ${successCount} leads importados com sucesso.`);
            setIsImportModalOpen(false);
        } catch (err) {
            console.error("Erro na importação em lote:", err);
            alert("Ocorreu um erro durante a importação.");
        } finally {
            setIsImporting(false);
        }
    };

    const openEditModal = (p: Prospect) => {
        setEditingProspect(p);
        setFormName(p.name);
        setFormCompany(p.company || '');
        setFormRole(p.role || '');
        setFormEmail(p.email || '');
        setFormPhone(p.phone || '');
        setFormSource(p.source);
        setFormStatus(p.status);
        setFormFirstContactDate(p.firstContactDate || '');
        setFormResponsible(p.responsible);
        setFormNotes(p.notes || '');
        setFormBroadcastAccepted(!!p.broadcastAccepted);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingProspect(null);
        setFormName('');
        setFormCompany('');
        setFormRole('');
        setFormEmail('');
        setFormPhone('');
        setFormSource('indicacao');
        setFormStatus('Novo contato');
        setFormFirstContactDate(new Date().toISOString().split('T')[0]);
        setFormResponsible('');
        setFormNotes('');
        setFormBroadcastAccepted(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Deseja realmente remover este prospecto comercial?")) {
            await deleteProspect(id);
        }
    };

    const filteredProspects = useMemo(() => {
        return prospects.filter(p => {
            let matchesStatus = false;
            if (statusFilter === 'all') {
                matchesStatus = true;
            } else if (statusFilter === 'em_negociacao') {
                matchesStatus = p.status === 'Em análise' || 
                                p.status === 'Reunião marcada' || 
                                p.status === 'Primeiro contato realizado';
            } else {
                matchesStatus = p.status === statusFilter;
            }

            const matchesAdvisor = advisorFilter === 'all' || p.responsible === advisorFilter;
            const matchesSource = sourceFilter === 'all' || p.source === sourceFilter;
            const matchesBroadcast = broadcastFilter === 'all' ||
                (broadcastFilter === 'yes' && p.broadcastAccepted === true) ||
                (broadcastFilter === 'no' && !p.broadcastAccepted);
            const matchesSearch = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.company && p.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.responsible && p.responsible.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesAdvisor && matchesSource && matchesBroadcast && matchesSearch;
        });
    }, [prospects, statusFilter, advisorFilter, sourceFilter, broadcastFilter, searchQuery]);

    const totalCount = prospects.length;
    const inNegotiationCount = prospects.filter(p => 
        p.status === 'Em análise' || 
        p.status === 'Reunião marcada' || 
        p.status === 'Primeiro contato realizado'
    ).length;
    const convertedCount = prospects.filter(p => p.status === 'Cliente convertido').length;
    const broadcastAcceptedCount = prospects.filter(p => p.broadcastAccepted).length;

    // CSV Phone Export Logic
    const cleanPhoneNumber = (phone: string | undefined | null) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length === 10 || digits.length === 11) {
            return `55${digits}`;
        }
        return digits;
    };

    const exportFilteredList = useMemo(() => {
        return prospects.filter(p => {
            let effStatus = exportStatusFilter;
            if (effStatus === 'current') {
                effStatus = statusFilter;
            }

            let matchesStatus = false;
            if (effStatus === 'all') {
                matchesStatus = true;
            } else if (effStatus === 'em_negociacao') {
                matchesStatus = p.status === 'Em análise' || 
                                p.status === 'Reunião marcada' || 
                                p.status === 'Primeiro contato realizado';
            } else {
                matchesStatus = p.status === effStatus;
            }

            const matchesBroadcast = exportBroadcastFilter === 'all' ||
                (exportBroadcastFilter === 'yes' && p.broadcastAccepted === true) ||
                (exportBroadcastFilter === 'no' && !p.broadcastAccepted);

            const matchesAdvisor = exportAdvisorFilter === 'all' || p.responsible === exportAdvisorFilter;

            const digits = p.phone ? p.phone.replace(/\D/g, '') : '';
            const hasValidPhone = !exportOnlyWithPhone || digits.length >= 8;

            return matchesStatus && matchesBroadcast && matchesAdvisor && hasValidPhone;
        });
    }, [prospects, exportStatusFilter, statusFilter, exportBroadcastFilter, exportAdvisorFilter, exportOnlyWithPhone]);

    const handleDownloadCsv = () => {
        if (exportFilteredList.length === 0) {
            alert("Nenhum prospecto com número de telefone foi encontrado para os filtros selecionados.");
            return;
        }

        const sep = csvSeparator;

        const escapeCsvField = (val: string | undefined | null | boolean) => {
            if (val === undefined || val === null) return '';
            let str = String(val).trim();
            if (str.includes(sep) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        let headers: string[] = [];
        if (exportPreset === 'whatsapp_bulk') {
            headers = ['Nome', 'Telefone_WhatsApp', 'Telefone_Original', 'Empresa', 'Status', 'Responsavel', 'Lista_Transmissao'];
        } else if (exportPreset === 'phone_only') {
            headers = ['Nome', 'Telefone_WhatsApp'];
        } else if (exportPreset === 'phone_raw_only') {
            headers = ['Telefone_WhatsApp'];
        } else {
            headers = ['Nome', 'Telefone_WhatsApp', 'Telefone_Original', 'Empresa', 'Cargo', 'Email', 'Origem', 'Status', 'Responsavel', 'Lista_Transmissao', 'Data_Primeiro_Contato', 'Ultima_Interacao'];
        }

        const rows: string[][] = exportFilteredList.map(p => {
            const phoneClean = cleanPhoneNumber(p.phone);
            const phoneFormatted = p.phone || '';
            const broadcastStr = p.broadcastAccepted ? 'Sim' : 'Nao';

            if (exportPreset === 'whatsapp_bulk') {
                return [
                    p.name,
                    phoneClean,
                    phoneFormatted,
                    p.company || '',
                    p.status,
                    p.responsible,
                    broadcastStr
                ];
            } else if (exportPreset === 'phone_only') {
                return [
                    p.name,
                    phoneClean || phoneFormatted
                ];
            } else if (exportPreset === 'phone_raw_only') {
                return [
                    phoneClean || phoneFormatted
                ];
            } else {
                return [
                    p.name,
                    phoneClean,
                    phoneFormatted,
                    p.company || '',
                    p.role || '',
                    p.email || '',
                    getSourceLabel(p.source),
                    p.status,
                    p.responsible,
                    broadcastStr,
                    p.firstContactDate || '',
                    p.lastInteraction || ''
                ];
            }
        });

        const csvLines = [
            headers.map(h => escapeCsvField(h)).join(sep),
            ...rows.map(row => row.map(cell => escapeCsvField(cell)).join(sep))
        ];

        // UTF-8 BOM prefix for Excel Brazilian accent compatibility
        const csvBlob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const statusClean = (exportStatusFilter === 'current' ? statusFilter : exportStatusFilter)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        
        link.setAttribute('download', `telefones_prospects_${statusClean}_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExportModalOpen(false);
    };

    // WhatsApp Broadcast Disparador Logic
    const broadcastFilteredList = useMemo(() => {
        return prospects.filter(p => {
            let effStatus = broadcastStatusFilter;
            if (effStatus === 'current') {
                effStatus = statusFilter;
            }

            let matchesStatus = false;
            if (effStatus === 'all') {
                matchesStatus = true;
            } else if (effStatus === 'em_negociacao') {
                matchesStatus = p.status === 'Em análise' || 
                                p.status === 'Reunião marcada' || 
                                p.status === 'Primeiro contato realizado';
            } else {
                matchesStatus = p.status === effStatus;
            }

            const matchesBroadcast = broadcastBroadcastFilter === 'all' ||
                (broadcastBroadcastFilter === 'yes' && p.broadcastAccepted === true) ||
                (broadcastBroadcastFilter === 'no' && !p.broadcastAccepted);

            const matchesAdvisor = broadcastAdvisorFilter === 'all' || p.responsible === broadcastAdvisorFilter;

            const digits = p.phone ? p.phone.replace(/\D/g, '') : '';
            const hasValidPhone = digits.length >= 8;

            return matchesStatus && matchesBroadcast && matchesAdvisor && hasValidPhone;
        });
    }, [prospects, broadcastStatusFilter, statusFilter, broadcastBroadcastFilter, broadcastAdvisorFilter]);

    const compileMessage = (template: string, p: Prospect | undefined) => {
        if (!p) return '';
        let msg = template;
        const nameParts = (p.name || '').trim().split(' ');
        const firstName = nameParts[0] || p.name || 'Cliente';
        const assessorName = p.responsible || 'Assessor de Negócios';
        const companyName = p.company || 'sua empresa';
        const roleTitle = p.role || 'Gestor';

        msg = msg.replace(/{nome}/g, p.name || 'Cliente');
        msg = msg.replace(/{primeiro_nome}/g, firstName);
        msg = msg.replace(/{empresa}/g, companyName);
        msg = msg.replace(/{cargo}/g, roleTitle);
        msg = msg.replace(/{assessor}/g, assessorName);

        return msg;
    };

    const handleDispatchMessageForProspect = async (p: Prospect) => {
        if (!p || !p.phone) {
            alert("Este prospect não possui número de telefone cadastrado.");
            return;
        }
        const cleanPhone = cleanPhoneNumber(p.phone);
        if (!cleanPhone) {
            alert("Telefone inválido para envio de WhatsApp.");
            return;
        }

        const msgText = compileMessage(broadcastTemplate, p);
        const encoded = encodeURIComponent(msgText);
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

        window.open(waUrl, '_blank');

        // Adicionar ID à lista de disparados nesta sessão
        if (!dispatchedIds.includes(p.id)) {
            setDispatchedIds(prev => [...prev, p.id]);
        }

        // Atualizar status e registrar no histórico se ativado
        const todayStr = new Date().toLocaleDateString('pt-BR');
        const updates: Partial<Prospect> = {
            lastInteraction: `[${todayStr}] Disparo WhatsApp enviado`
        };

        if (broadcastAutoUpdateStatus && (p.status === 'Novo contato' || !p.status)) {
            updates.status = 'Primeiro contato realizado';
        }

        if (broadcastRegisterInteraction) {
            const shortNote = msgText.length > 90 ? msgText.substring(0, 90) + '...' : msgText;
            const newNotes = `${p.notes || ''}\n[${todayStr}] WhatsApp: "${shortNote}"`.trim();
            updates.notes = newNotes;
        }

        try {
            await updateProspect(p.id, updates);
        } catch (err) {
            console.error("Erro ao registrar envio no prospecto:", err);
        }
    };

    const getStatusBadgeStyle = (status: Prospect['status']) => {
        switch (status) {
            case 'Novo contato': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'Primeiro contato realizado': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
            case 'Reunião marcada': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'Em análise': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            case 'Cliente convertido': return 'bg-green-500/10 text-green-400 border border-green-500/20';
            case 'Perdido': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
        }
    };

    const getSourceLabel = (src: Prospect['source']) => {
        switch (src) {
            case 'indicacao': return 'Indicação';
            case 'evento': return 'Evento';
            case 'networking': return 'Networking';
            case 'Instagram': return 'Instagram';
            case 'outro': return 'Outro';
            default: return src;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-text-secondary italic">Carregando CRM de Prospecção...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent uppercase tracking-tight">Prospecção (CRM)</h2>
                    <p className="text-text-secondary">Controle de funil comercial e novos clientes associados.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button 
                        onClick={() => {
                            setBroadcastStatusFilter('current');
                            setIsBroadcastModalOpen(true);
                            setIsQueueActive(false);
                            setActiveQueueIndex(0);
                        }} 
                        className="text-sm bg-green-600 hover:bg-green-700 hover:text-white text-white border-none shadow-md shadow-green-900/30 font-bold"
                        title="Criar e enviar mensagens personalizadas via WhatsApp para seus prospects"
                    >
                        <SendIcon className="w-4 h-4 mr-1.5" /> Disparador WhatsApp
                    </Button>
                    <Button 
                        onClick={() => {
                            setExportStatusFilter('current');
                            setIsExportModalOpen(true);
                        }} 
                        className="text-sm bg-emerald-600 hover:bg-emerald-700 hover:text-white text-white border-none shadow-md shadow-emerald-900/20"
                        title="Baixar lista de telefones em formato .csv para envio de mensagens em massa"
                    >
                        <DownloadIcon className="w-4 h-4 mr-1.5" /> Baixar Telefones (CSV)
                    </Button>
                    <Button onClick={() => setIsImportModalOpen(true)} className="text-sm bg-blue-600 hover:bg-blue-700 hover:text-white text-white border-none">
                        <UploadIcon className="w-4 h-4 mr-1.5" /> Importar Lista
                    </Button>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="text-sm">
                        <PlusIcon className="w-4 h-4 mr-2" /> Novo Prospecto
                    </Button>
                </div>
            </div>

            {/* Totalizadores Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div 
                    onClick={() => {
                        setStatusFilter('all');
                        setBroadcastFilter('all');
                    }}
                    className={`bg-surface border p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface/80 transition-all duration-200 active:scale-[0.98] ${
                        statusFilter === 'all' && broadcastFilter === 'all' ? 'border-primary shadow-lg shadow-primary/5' : 'border-border-color'
                    }`}
                >
                    <div className="bg-primary/10 p-3 rounded-full text-primary">
                        <PartnershipIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Total de Prospects</span>
                        <p className="text-2xl font-extrabold text-text-primary mt-0.5 font-mono">{totalCount}</p>
                    </div>
                </div>
                <div 
                    onClick={() => {
                        setStatusFilter('em_negociacao');
                        setBroadcastFilter('all');
                    }}
                    className={`bg-surface border p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface/80 transition-all duration-200 active:scale-[0.98] ${
                        statusFilter === 'em_negociacao' && broadcastFilter === 'all' ? 'border-amber-500 shadow-lg shadow-amber-500/5' : 'border-border-color'
                    }`}
                >
                    <div className="bg-amber-500/10 p-3 rounded-full text-amber-500">
                        <GoalsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Em Negociação</span>
                        <p className="text-2xl font-extrabold text-amber-500 mt-0.5 font-mono">{inNegotiationCount}</p>
                    </div>
                </div>
                <div 
                    onClick={() => {
                        setStatusFilter('Cliente convertido');
                        setBroadcastFilter('all');
                    }}
                    className={`bg-surface border p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface/80 transition-all duration-200 active:scale-[0.98] ${
                        statusFilter === 'Cliente convertido' && broadcastFilter === 'all' ? 'border-green-500 shadow-lg shadow-green-500/5' : 'border-border-color'
                    }`}
                >
                    <div className="bg-green-500/10 p-3 rounded-full text-green-500">
                        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Clientes Convertidos</span>
                        <p className="text-2xl font-extrabold text-green-400 mt-0.5 font-mono">{convertedCount}</p>
                    </div>
                </div>
                <div 
                    onClick={() => {
                        setBroadcastFilter('yes');
                        setStatusFilter('all');
                    }}
                    className={`bg-surface border p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface/80 transition-all duration-200 active:scale-[0.98] ${
                        broadcastFilter === 'yes' ? 'border-indigo-500 shadow-lg shadow-indigo-500/5' : 'border-border-color'
                    }`}
                >
                    <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400">
                        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Lista Transmissão (Sim)</span>
                        <p className="text-2xl font-extrabold text-indigo-400 mt-0.5 font-mono">{broadcastAcceptedCount}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar Filtros */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Status do Funil</label>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="em_negociacao">Em Negociação</option>
                            <option value="Novo contato">Novo contato</option>
                            <option value="Primeiro contato realizado">Primeiro contato realizado</option>
                            <option value="Reunião marcada">Reunião marcada</option>
                            <option value="Em análise">Em análise</option>
                            <option value="Cliente convertido">Cliente convertido</option>
                            <option value="Perdido">Perdido</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Assessor Responsável</label>
                        <select 
                            value={advisorFilter} 
                            onChange={(e) => setAdvisorFilter(e.target.value)}
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="all">Todos os Assessores</option>
                            {advisors.map(adv => <option key={adv.id} value={adv.name}>{adv.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Origem do Lead</label>
                        <select 
                            value={sourceFilter} 
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="all">Todas as Origens</option>
                            <option value="indicacao">Indicação</option>
                            <option value="evento">Evento</option>
                            <option value="networking">Networking</option>
                            <option value="Instagram">Instagram</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Lista de Transmissão</label>
                        <select 
                            value={broadcastFilter} 
                            onChange={(e) => setBroadcastFilter(e.target.value)}
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="all">Todas as Opções</option>
                            <option value="yes">Aceitou Receber ✅</option>
                            <option value="no">Não Aceitou / Sem definição ❌</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1 font-sans">Buscar por Nome / Empresa</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="Buscar..." 
                                className="w-full bg-background border border-border-color rounded-md pl-8 pr-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                            <SearchIcon className="w-4 h-4 text-text-secondary absolute left-2.5 top-2.5" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-3 pt-3 border-t border-border-color/30 text-xs text-text-secondary">
                    <span>
                        Mostrando <strong className="text-text-primary font-mono">{filteredProspects.length}</strong> de <strong className="text-text-primary font-mono">{totalCount}</strong> prospectos no filtro selecionado.
                    </span>
                    <button 
                        onClick={() => {
                            setExportStatusFilter('current');
                            setIsExportModalOpen(true);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-all hover:underline cursor-pointer"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" /> Baixar telefones desta listagem (.CSV)
                    </button>
                </div>
            </Card>

            {/* List Table */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-[11px] sm:text-xs">
                        <thead className="bg-background/50 uppercase text-text-secondary font-bold">
                            <tr>
                                <th className="p-4">Nome completo</th>
                                <th className="p-4">Empresa / Cargo</th>
                                <th className="p-4 text-center">Origem</th>
                                <th className="p-4 text-center">Transmissão</th>
                                <th className="p-4 text-center">Data 1º Contato</th>
                                <th className="p-4 text-center">Última Interação</th>
                                <th className="p-4">Responsável</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/30">
                            {filteredProspects.map(p => (
                                <tr key={p.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4">
                                        <button 
                                            onClick={() => { setSelectedProspect(p); setIsDetailsModalOpen(true); }}
                                            className="text-left font-bold text-text-primary hover:text-primary transition-all underline decoration-dotted text-xs sm:text-sm flex items-center gap-2 group"
                                            title="Clique para abrir a Ficha Completa, ver contatos e interagir"
                                        >
                                            <span>{p.name}</span>
                                            <span className="text-[9px] font-normal text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20 font-sans">⚡ Ver Ficha</span>
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-text-primary">{p.company || '-'}</div>
                                        <div className="text-[10px] text-text-secondary">{p.role || '-'}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-0.5 rounded bg-surface border border-border-color/60 font-medium text-[10px]">
                                            {getSourceLabel(p.source)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {p.broadcastAccepted ? (
                                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-[10px]" title="Aceitou receber notícias do mercado">
                                                Aceitou ✅
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 font-normal text-[10px]" title="Não aceitou ou sem resposta">
                                                Não ❌
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-mono">
                                        {p.firstContactDate ? new Date(p.firstContactDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="p-4 text-center font-mono text-xs text-text-primary" title={p.lastInteraction || 'Nenhuma interação registrada'}>
                                        {(() => {
                                            if (!p.lastInteraction) return <span className="text-text-secondary italic font-sans text-xs">-</span>;
                                            const match = p.lastInteraction.match(/^\[([^\]]+)\]/);
                                            return match ? match[1] : (p.lastInteraction.length > 10 ? p.lastInteraction.substring(0, 10) + '...' : p.lastInteraction);
                                        })()}
                                    </td>
                                    <td className="p-4 font-semibold text-text-secondary">{p.responsible}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeStyle(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {p.phone ? (
                                            <button
                                                onClick={() => handleDispatchMessageForProspect(p)}
                                                className="p-1.5 px-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all font-semibold text-[11px] flex items-center gap-1 mx-auto cursor-pointer"
                                                title={`Enviar mensagem via WhatsApp para ${p.name}`}
                                            >
                                                <SendIcon className="w-3.5 h-3.5" />
                                                <span>Enviar</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-zinc-500 italic">Sem fone</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredProspects.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-10 text-center text-text-secondary italic">Nenhum prospecto encontrado no filtro selecionado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal: Cadastro/Edição Prospect */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProspect ? "Editar Prospect" : "Novo Prospect"}>
                <form onSubmit={handleSubmit} className="space-y-4 text-text-primary">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Nome Completo *</label>
                            <input 
                                type="text" 
                                required 
                                value={formName} 
                                onChange={(e) => setFormName(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Empresa</label>
                            <input 
                                type="text" 
                                value={formCompany} 
                                onChange={(e) => setFormCompany(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Cargo</label>
                            <input 
                                type="text" 
                                value={formRole} 
                                onChange={(e) => setFormRole(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">E-mail</label>
                            <input 
                                type="email" 
                                value={formEmail} 
                                onChange={(e) => setFormEmail(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Celular / Telefone</label>
                            <input 
                                type="text" 
                                placeholder="(00) 00000-0000" 
                                value={formPhone} 
                                onChange={(e) => setFormPhone(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Origem do contato</label>
                            <select 
                                value={formSource} 
                                onChange={(e) => setFormSource(e.target.value as any)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="indicacao">Indicação</option>
                                <option value="evento">Evento</option>
                                <option value="networking">Networking (Relações)</option>
                                <option value="Instagram">Instagram</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Status Comercial</label>
                            <select 
                                value={formStatus} 
                                onChange={(e) => setFormStatus(e.target.value as any)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="Novo contato">Novo contato</option>
                                <option value="Primeiro contato realizado">Primeiro contato realizado</option>
                                <option value="Reunião marcada">Reunião marcada</option>
                                <option value="Em análise">Em análise</option>
                                <option value="Cliente convertido">Cliente convertido</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Data Primeiro Contato</label>
                            <input 
                                type="date" 
                                value={formFirstContactDate} 
                                onChange={(e) => setFormFirstContactDate(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Assessor Responsável *</label>
                            <select 
                                required 
                                value={formResponsible} 
                                onChange={(e) => setFormResponsible(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="">Selecione...</option>
                                {advisors.map(adv => <option key={adv.id} value={adv.name}>{adv.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Histórico de Observações / Follow-up</label>
                            <textarea 
                                rows={3} 
                                value={formNotes} 
                                onChange={(e) => setFormNotes(e.target.value)} 
                                placeholder="Descreva os passos e observações deste Lead comercial..." 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-sans" 
                            />
                        </div>
                        <div className="col-span-2 bg-background/40 p-3.5 rounded-lg border border-border-color/60 flex items-center justify-between">
                            <div className="pr-4">
                                <label className="block text-sm font-bold text-text-primary">Lista de Transmissão</label>
                                <span className="text-xs text-text-secondary select-none">O cliente aceitou receber análises, notícias e oportunidades do mercado financeiro?</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={formBroadcastAccepted}
                                    onChange={(e) => setFormBroadcastAccepted(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="success">Salvar Prospecto</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Registrar Interação */}
            <Modal isOpen={isInteractionModalOpen} onClose={() => { setIsInteractionModalOpen(false); setSelectedProspectForInteraction(null); }} title="Registrar Nova Interação">
                <form onSubmit={handleLogInteractionSubmit} className="space-y-4 text-text-primary">
                    <div>
                        <span className="block text-xs font-bold uppercase text-text-secondary mb-1">Lead Selecionado</span>
                        <p className="text-sm font-bold text-text-primary">{selectedProspectForInteraction?.name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-secondary mb-1">O que foi conversado/feito? *</label>
                        <textarea 
                            rows={4} 
                            required 
                            value={interactionText} 
                            onChange={(e) => setInteractionText(e.target.value)} 
                            placeholder="Ex: Liguei para apresentar a proposta e agendamos a segunda reunião..." 
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-sans" 
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => { setIsInteractionModalOpen(false); setSelectedProspectForInteraction(null); }}>Cancelar</Button>
                        <Button type="submit" variant="success">Registrar e Atualizar</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Detalhes do Prospecto */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => { setIsDetailsModalOpen(false); setSelectedProspect(null); }} title="Ficha Completa do Prospecto">
                {selectedProspect && (
                    <div className="space-y-4 text-text-primary">
                        <div className="grid grid-cols-2 gap-4 border-b border-border-color pb-4">
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Nome</span>
                                <p className="text-sm font-extrabold text-primary">{selectedProspect.name}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Assessor Responsável</span>
                                <p className="text-sm font-bold">{selectedProspect.responsible}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Empresa / Cargo</span>
                                <p className="text-xs font-semibold">{selectedProspect.company || '-'} ({selectedProspect.role || '-'})</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Status</span>
                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeStyle(selectedProspect.status)}`}>
                                    {selectedProspect.status}
                                </span>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Celular</span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
                                    <p className="text-xs font-mono font-bold text-text-primary">{selectedProspect.phone || '-'}</p>
                                    {selectedProspect.phone && (
                                        <div className="flex items-center gap-1">
                                            <a 
                                                href={`tel:${selectedProspect.phone}`} 
                                                className="p-1 px-1.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition-all flex items-center gap-0.5"
                                                title="Ligar para este número"
                                            >
                                                📞 Ligar
                                            </a>
                                            {(() => {
                                                const waNumber = selectedProspect.phone.replace(/\D/g, '');
                                                const waFormatted = waNumber.startsWith('55') ? waNumber : `55${waNumber}`;
                                                return (
                                                    <a 
                                                        href={`https://wa.me/${waFormatted}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="p-1 px-1.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition-all flex items-center gap-0.5"
                                                        title="Conversar via WhatsApp"
                                                    >
                                                        💬 WhatsApp
                                                    </a>
                                                );
                                            })()}
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedProspect.phone || '');
                                                    setCopyFeedback('phone');
                                                    setTimeout(() => setCopyFeedback(null), 1500);
                                                }}
                                                className="p-1 px-1.5 text-[10px] bg-background border border-border-color/60 hover:border-slate-700 text-text-secondary rounded transition-all"
                                                title="Copiar celular"
                                            >
                                                {copyFeedback === 'phone' ? '✓ Copiado!' : '📋 Copiar'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">E-mail</span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
                                    <p className="text-xs text-text-secondary font-medium truncate max-w-[160px]" title={selectedProspect.email}>{selectedProspect.email || '-'}</p>
                                    {selectedProspect.email && (
                                        <div className="flex items-center gap-1">
                                            <a 
                                                href={`mailto:${selectedProspect.email}`} 
                                                className="p-1 px-1.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded transition-all flex items-center gap-0.5"
                                                title="Enviar um e-mail"
                                            >
                                                ✉️ Enviar
                                            </a>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedProspect.email || '');
                                                    setCopyFeedback('email');
                                                    setTimeout(() => setCopyFeedback(null), 1500);
                                                }}
                                                className="p-1 px-1.5 text-[10px] bg-background border border-border-color/60 hover:border-slate-700 text-text-secondary rounded transition-all"
                                                title="Copiar e-mail"
                                            >
                                                {copyFeedback === 'email' ? '✓ Copiado!' : '📋 Copiar'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Origem</span>
                                <p className="text-xs font-medium">{getSourceLabel(selectedProspect.source)}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-text-secondary uppercase">Primeiro Contato</span>
                                <p className="text-xs font-mono">{selectedProspect.firstContactDate ? new Date(selectedProspect.firstContactDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                            </div>
                            <div className="col-span-2 bg-background/40 p-3 rounded-lg border border-border-color/60 flex items-center justify-between mt-1">
                                <div>
                                    <span className="block text-[10px] font-bold text-text-secondary uppercase font-sans">Informativos & Oportunidades</span>
                                    <span className="text-[11px] text-text-secondary">Aceitou receber notícias do mercado financeiro</span>
                                </div>
                                <div>
                                    {selectedProspect.broadcastAccepted ? (
                                        <span className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-xs font-sans">
                                            Autorizado ✅
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 font-semibold text-xs font-sans">
                                            Não Autorizado ❌
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Última Interação registrada</span>
                            <div className="bg-background/40 p-3 rounded-lg border border-border-color/60 font-mono text-xs text-text-primary whitespace-pre-line">
                                {selectedProspect.lastInteraction || 'Nenhuma registrada'}
                            </div>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold text-text-secondary uppercase mb-1 font-sans">Histórico de Observações & Log de Atividades</span>
                            <div className="bg-background/20 p-3 rounded-lg border border-border-color/30 text-xs text-text-secondary max-h-48 overflow-y-auto whitespace-pre-line font-sans">
                                {selectedProspect.notes || 'Sem observações adicionadas.'}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-border-color justify-between items-center mt-6">
                            <div className="flex flex-wrap gap-2">
                                <Button 
                                    variant="primary" 
                                    className="px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5"
                                    onClick={() => { 
                                        setIsDetailsModalOpen(false); 
                                        setSelectedProspectForInteraction(selectedProspect); 
                                        setIsInteractionModalOpen(true); 
                                    }}
                                    title="Registrar nova interação"
                                >
                                    <span>💬</span> Interagir
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 border border-border-color/60"
                                    onClick={() => { 
                                        setIsDetailsModalOpen(false); 
                                        openEditModal(selectedProspect); 
                                    }}
                                    title="Alterar dados cadastrais"
                                >
                                    <span>✏️</span> Editar Cadastro
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button 
                                    variant="danger" 
                                    className="px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 border border-red-500/20"
                                    onClick={() => { 
                                        setIsDetailsModalOpen(false); 
                                        handleDelete(selectedProspect.id); 
                                    }}
                                    title="Remover prospecto"
                                >
                                    <span>🗑️</span> Excluir
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="px-3 py-1.5 text-xs uppercase"
                                    onClick={() => { 
                                        setIsDetailsModalOpen(false); 
                                        setSelectedProspect(null); 
                                    }}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Importar Prospects em Lote */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Importar Lista de Prospects" size="xl">
                <form onSubmit={handleImportSubmit} className="space-y-4 text-text-primary">
                    <div>
                        <p className="text-xs text-text-secondary">
                            Cole sua lista de contatos abaixo. O formato deve conter os cabeçalhos: <code className="bg-background px-1 py-0.5 rounded text-primary">Nome;Empresa;Cargo;Email;Celular</code>.
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                            Se o nome estiver em branco, o sistema usará a empresa como nome de referência. Links de e-mail como <code className="bg-background px-1 py-0.5 text-text-secondary select-all font-mono">[email@domain.com](mailto:...)</code> serão limpos automaticamente.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Dados dos Prospects (CSV semi-colon)</label>
                        <textarea 
                            rows={12} 
                            required
                            value={importText} 
                            onChange={(e) => setImportText(e.target.value)} 
                            placeholder="Nome;Empresa;Cargo;Email;Celular&#10;João;Empresa X;Diretor;joao@email.com;(11) 99999-9999" 
                            className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-xs focus:ring-primary focus:border-primary outline-none font-mono" 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1 font-sans">Assessor Responsável Padrão *</label>
                            <select 
                                required 
                                value={importResponsible} 
                                onChange={(e) => setImportResponsible(e.target.value)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="">Selecione...</option>
                                {advisors.map(adv => <option key={adv.id} value={adv.name}>{adv.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1 font-sans">Origem Padrão</label>
                            <select 
                                value={importSource} 
                                onChange={(e) => setImportSource(e.target.value as any)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="indicacao">Indicação</option>
                                <option value="evento">Evento</option>
                                <option value="networking">Networking (Relações)</option>
                                <option value="Instagram">Instagram</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1 font-sans">Status Comercial Padrão</label>
                            <select 
                                value={importStatus} 
                                onChange={(e) => setImportStatus(e.target.value as any)} 
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="Novo contato">Novo contato</option>
                                <option value="Primeiro contato realizado">Primeiro contato realizado</option>
                                <option value="Reunião marcada">Reunião marcada</option>
                                <option value="Em análise">Em análise</option>
                                <option value="Cliente convertido">Cliente convertido</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border-color/30">
                        <button 
                            type="button" 
                            onClick={() => {
                                if (confirm("Deseja redefinir os dados para restaurar a lista padrão de 96 contatos enviada?")) {
                                    setImportText(INITIAL_IMPORT_LIST_TEMPLATE);
                                }
                            }}
                            className="text-xs text-primary hover:underline font-medium"
                        >
                            Restaurar lista original de 96 contatos
                        </button>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button type="button" variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" variant="success" disabled={isImporting}>
                                {isImporting ? 'Importando...' : 'Processar & Importar'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal: Exportar Telefones em CSV */}
            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Exportar Telefones dos Prospects (.CSV)" size="lg">
                <div className="space-y-5 text-text-primary">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                            <DownloadIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-400">Exportação para Disparo de Mensagens em Massa</h4>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Baixe o arquivo .CSV pronto com os números de telefone formatados para disparo no WhatsApp/SMS (com DDI 55). Selecione os filtros abaixo para definir exatamente quais prospects serão exportados.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Filtro por Status */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                Filtrar por Status Comercial *
                            </label>
                            <select 
                                value={exportStatusFilter} 
                                onChange={(e) => setExportStatusFilter(e.target.value)}
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-medium"
                            >
                                <option value="current">Usar filtro atual da tela ({statusFilter === 'all' ? 'Todos' : statusFilter})</option>
                                <option value="all">Todos os Status</option>
                                <option value="em_negociacao">Em Negociação (Análise, Reunião, 1º Contato)</option>
                                <option value="Novo contato">Novo contato</option>
                                <option value="Primeiro contato realizado">Primeiro contato realizado</option>
                                <option value="Reunião marcada">Reunião marcada</option>
                                <option value="Em análise">Em análise</option>
                                <option value="Cliente convertido">Cliente convertido</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>

                        {/* Filtro por Lista de Transmissão */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                Autorização Lista de Transmissão
                            </label>
                            <select 
                                value={exportBroadcastFilter} 
                                onChange={(e) => setExportBroadcastFilter(e.target.value)}
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-medium"
                            >
                                <option value="all">Todas as Opções (Indiferente)</option>
                                <option value="yes">Apenas que Aceitaram Receber ✅</option>
                                <option value="no">Apenas Não Aceitou / Sem Definição ❌</option>
                            </select>
                        </div>

                        {/* Filtro por Assessor */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                Assessor Responsável
                            </label>
                            <select 
                                value={exportAdvisorFilter} 
                                onChange={(e) => setExportAdvisorFilter(e.target.value)}
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-medium"
                            >
                                <option value="all">Todos os Assessores</option>
                                {advisors.map(adv => <option key={adv.id} value={adv.name}>{adv.name}</option>)}
                            </select>
                        </div>

                        {/* Modelo de Colunas / Layout do CSV */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                Formato das Colunas no CSV
                            </label>
                            <select 
                                value={exportPreset} 
                                onChange={(e) => setExportPreset(e.target.value as any)}
                                className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none font-medium"
                            >
                                <option value="phone_raw_only">Somente Telefone (1 coluna apenas com o número)</option>
                                <option value="phone_only">Nome e Telefone WhatsApp (2 colunas)</option>
                                <option value="whatsapp_bulk">Envio em Massa Completo (Nome, Telefone, Empresa, Status...)</option>
                                <option value="complete">Ficha Completa em CSV (Todos os dados)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-background/50 p-3.5 rounded-xl border border-border-color/60 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-text-primary">
                                <input 
                                    type="checkbox" 
                                    checked={exportOnlyWithPhone} 
                                    onChange={(e) => setExportOnlyWithPhone(e.target.checked)}
                                    className="rounded border-border-color text-primary focus:ring-primary w-4 h-4"
                                />
                                Exportar apenas registros com telefone cadastrado
                            </label>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-text-secondary font-medium">Separador:</span>
                                <button 
                                    type="button" 
                                    onClick={() => setCsvSeparator(';')} 
                                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${csvSeparator === ';' ? 'bg-primary text-white' : 'bg-surface border border-border-color text-text-secondary'}`}
                                >
                                    ; (Ponto e Vírgula)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setCsvSeparator(',')} 
                                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${csvSeparator === ',' ? 'bg-primary text-white' : 'bg-surface border border-border-color text-text-secondary'}`}
                                >
                                    , (Vírgula)
                                </button>
                            </div>
                        </div>

                        {/* Resumo da Seleção */}
                        <div className="pt-2 border-t border-border-color/40 flex items-center justify-between text-xs">
                            <span className="text-text-secondary font-medium">Contatos prontos para exportar:</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-xs">
                                📱 {exportFilteredList.length} telefone(s) selecionado(s)
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border-color/40">
                        <Button type="button" variant="ghost" onClick={() => setIsExportModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            variant="success" 
                            onClick={handleDownloadCsv}
                            disabled={exportFilteredList.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 border-none shadow-lg shadow-emerald-900/30"
                        >
                            <DownloadIcon className="w-4 h-4 mr-1.5" /> Baixar Arquivo CSV
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Disparador de Mensagens WhatsApp */}
            <Modal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} title="Disparador de Mensagens WhatsApp" size="xl">
                <div className="space-y-5 text-text-primary">
                    {!isQueueActive ? (
                        /* Estágio 1: Configuração e Personalização da Mensagem */
                        <div className="space-y-5">
                            {/* Banner Header */}
                            <div className="bg-gradient-to-r from-green-600/20 via-emerald-600/10 to-transparent border border-green-500/30 p-4 rounded-xl flex items-start gap-3">
                                <div className="p-2.5 bg-green-500/20 text-green-400 rounded-lg shrink-0 mt-0.5">
                                    <SendIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm text-green-400 flex items-center gap-2">
                                        Campanha & Disparo Direto para WhatsApp
                                    </h3>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Crie mensagens personalizadas com tags automáticas (como o primeiro nome e a empresa do prospect) e envie em sequência 1 a 1 via WhatsApp Web ou Aplicativo sem risco de bloqueio.
                                    </p>
                                </div>
                            </div>

                            {/* Filtros da Campanha */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background/50 p-3.5 rounded-xl border border-border-color/60">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Filtrar por Status</label>
                                    <select 
                                        value={broadcastStatusFilter} 
                                        onChange={(e) => setBroadcastStatusFilter(e.target.value)}
                                        className="w-full bg-background border border-border-color rounded-md px-2.5 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none"
                                    >
                                        <option value="current">Filtro Atual da Tela ({statusFilter})</option>
                                        <option value="all">Todos os Status</option>
                                        <option value="Novo contato">Novo contato</option>
                                        <option value="Primeiro contato realizado">Primeiro contato realizado</option>
                                        <option value="Reunião marcada">Reunião marcada</option>
                                        <option value="Em análise">Em análise</option>
                                        <option value="em_negociacao">Em Negociação (Em análise / Reunião / 1º Contato)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Transmissão</label>
                                    <select 
                                        value={broadcastBroadcastFilter} 
                                        onChange={(e) => setBroadcastBroadcastFilter(e.target.value)}
                                        className="w-full bg-background border border-border-color rounded-md px-2.5 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none"
                                    >
                                        <option value="all">Todos os Leads</option>
                                        <option value="yes">Apenas Autorizados ✅</option>
                                        <option value="no">Não Autorizados / Sem Resposta</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Assessor Responsável</label>
                                    <select 
                                        value={broadcastAdvisorFilter} 
                                        onChange={(e) => setBroadcastAdvisorFilter(e.target.value)}
                                        className="w-full bg-background border border-border-color rounded-md px-2.5 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none"
                                    >
                                        <option value="all">Todos os Assessores</option>
                                        {advisors.map(adv => <option key={adv.id} value={adv.name}>{adv.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Modelos / Presets Prontos */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Modelos Prontos de Mensagem</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setBroadcastTemplate('Olá, {primeiro_nome}! Tudo bem? Me chamo {assessor}. Estou entrando em contato referente a oportunidades para a {empresa}. Teria alguns minutinhos para conversarmos?')}
                                        className="p-2 text-left bg-background/60 hover:bg-green-500/10 border border-border-color hover:border-green-500/40 rounded-lg text-xs transition-all cursor-pointer group"
                                    >
                                        <div className="font-bold text-text-primary group-hover:text-green-400">1. Apresentação</div>
                                        <div className="text-[10px] text-text-secondary truncate mt-0.5">Primeiro contato inicial</div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setBroadcastTemplate('Olá, {primeiro_nome}! Passando para dar um acompanhamento sobre nossa conversa em relação à {empresa}. Como estão os projetos por aí?')}
                                        className="p-2 text-left bg-background/60 hover:bg-green-500/10 border border-border-color hover:border-green-500/40 rounded-lg text-xs transition-all cursor-pointer group"
                                    >
                                        <div className="font-bold text-text-primary group-hover:text-green-400">2. Follow-up</div>
                                        <div className="text-[10px] text-text-secondary truncate mt-0.5">Acompanhamento pós reunião</div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setBroadcastTemplate('Olá, {primeiro_nome}! Preparamos um resumo exclusivo das melhores oportunidades do mercado financeiro para a {empresa}. Gostaria que eu te enviasse o relatório completo?')}
                                        className="p-2 text-left bg-background/60 hover:bg-green-500/10 border border-border-color hover:border-green-500/40 rounded-lg text-xs transition-all cursor-pointer group"
                                    >
                                        <div className="font-bold text-text-primary group-hover:text-green-400">3. Análise Mercado</div>
                                        <div className="text-[10px] text-text-secondary truncate mt-0.5">Transmissão de conteúdo</div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setBroadcastTemplate('Olá, {primeiro_nome}! Faz um tempo que não nos falamos. Como estão as novidades na {empresa}? Gostaria de agendar um café virtual rápido esta semana.')}
                                        className="p-2 text-left bg-background/60 hover:bg-green-500/10 border border-border-color hover:border-green-500/40 rounded-lg text-xs transition-all cursor-pointer group"
                                    >
                                        <div className="font-bold text-text-primary group-hover:text-green-400">4. Reativação</div>
                                        <div className="text-[10px] text-text-secondary truncate mt-0.5">Recuperar prospect antigo</div>
                                    </button>
                                </div>
                            </div>

                            {/* Campo de Texto da Mensagem */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-text-secondary uppercase">Texto da Mensagem</label>
                                    <span className="text-[10px] text-text-secondary">Clique nas tags para inserir no texto</span>
                                </div>

                                {/* Tags Dinâmicas Clicáveis */}
                                <div className="flex flex-wrap gap-1.5 pb-1">
                                    <button 
                                        type="button" 
                                        onClick={() => setBroadcastTemplate(prev => prev + ' {primeiro_nome}')}
                                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-mono font-semibold hover:bg-green-500/20 transition-all cursor-pointer"
                                    >
                                        + {'{primeiro_nome}'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setBroadcastTemplate(prev => prev + ' {empresa}')}
                                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-mono font-semibold hover:bg-green-500/20 transition-all cursor-pointer"
                                    >
                                        + {'{empresa}'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setBroadcastTemplate(prev => prev + ' {cargo}')}
                                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-mono font-semibold hover:bg-green-500/20 transition-all cursor-pointer"
                                    >
                                        + {'{cargo}'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setBroadcastTemplate(prev => prev + ' {assessor}')}
                                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-mono font-semibold hover:bg-green-500/20 transition-all cursor-pointer"
                                    >
                                        + {'{assessor}'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setBroadcastTemplate(prev => prev + ' {nome}')}
                                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-mono font-semibold hover:bg-green-500/20 transition-all cursor-pointer"
                                    >
                                        + {'{nome}'}
                                    </button>
                                </div>

                                <textarea 
                                    rows={4} 
                                    value={broadcastTemplate} 
                                    onChange={(e) => setBroadcastTemplate(e.target.value)} 
                                    placeholder="Digite a mensagem..." 
                                    className="w-full bg-background border border-border-color rounded-xl p-3 text-sm focus:ring-green-500 focus:border-green-500 outline-none leading-relaxed" 
                                />
                            </div>

                            {/* Pré-visualização ao Vivo (Simulação Balão do WhatsApp) */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                                    Pré-visualização do Envio (Exemplo com 1º prospect da fila)
                                </label>
                                <div className="bg-[#0b141a] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800 text-xs text-zinc-400">
                                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                                            {broadcastFilteredList[0] ? broadcastFilteredList[0].name.substring(0, 1) : 'P'}
                                        </div>
                                        <span className="font-semibold text-zinc-200">
                                            {broadcastFilteredList[0] ? broadcastFilteredList[0].name : 'Nenhum prospecto encontrado no filtro'}
                                        </span>
                                        <span className="text-[10px] text-emerald-400 ml-auto font-mono">
                                            {broadcastFilteredList[0] ? broadcastFilteredList[0].phone : ''}
                                        </span>
                                    </div>

                                    <div className="bg-[#005c4b] text-emerald-50 text-xs p-3.5 rounded-2xl rounded-tr-none max-w-[90%] ml-auto whitespace-pre-line shadow-md leading-relaxed">
                                        {broadcastFilteredList[0] 
                                            ? compileMessage(broadcastTemplate, broadcastFilteredList[0])
                                            : compileMessage(broadcastTemplate, { id: 'preview', name: 'Carlos Eduardo', company: 'Empresa Exemplo', role: 'Diretor', responsible: 'Assessor', phone: '41999999999', source: 'networking', status: 'Novo contato' })
                                        }
                                        <div className="text-[9px] text-emerald-200/60 text-right mt-1 font-mono">
                                            12:00 ✓✓
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Opções de Automação */}
                            <div className="space-y-3 pt-2 border-t border-border-color/40">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={broadcastAutoUpdateStatus} 
                                            onChange={(e) => setBroadcastAutoUpdateStatus(e.target.checked)}
                                            className="rounded border-border-color text-green-500 focus:ring-green-500 w-4 h-4"
                                        />
                                        <span>Atualizar para <strong className="text-indigo-400 font-semibold">"Primeiro contato realizado"</strong></span>
                                    </label>

                                    <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={broadcastRegisterInteraction} 
                                            onChange={(e) => setBroadcastRegisterInteraction(e.target.checked)}
                                            className="rounded border-border-color text-green-500 focus:ring-green-500 w-4 h-4"
                                        />
                                        <span>Registrar envio no histórico de notas</span>
                                    </label>
                                </div>
                            </div>

                            {/* Resumo e Botão de Iniciar Fila */}
                            <div className="pt-3 border-t border-border-color/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs text-text-secondary font-medium">Audiência da Campanha:</span>
                                    <span className="ml-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold font-mono text-xs">
                                        🎯 {broadcastFilteredList.length} destinatário(s) pronto(s)
                                    </span>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsBroadcastModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={() => {
                                            if (broadcastFilteredList.length === 0) {
                                                alert("Nenhum prospecto atende aos filtros com telefone cadastrado.");
                                                return;
                                            }
                                            setIsQueueActive(true);
                                            setActiveQueueIndex(0);
                                        }}
                                        disabled={broadcastFilteredList.length === 0}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 border-none shadow-lg shadow-green-900/30 flex items-center gap-2 cursor-pointer"
                                    >
                                        <SendIcon className="w-4 h-4" /> Iniciar Fila de Disparos (1 a 1)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Estágio 2: Fila Ativa de Disparo 1 a 1 */
                        <div className="space-y-6">
                            {/* Barra de Progresso */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold uppercase">
                                    <span className="text-green-400 flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block"></span>
                                        Fila de Disparo Ativa
                                    </span>
                                    <span className="text-text-secondary font-mono">
                                        {activeQueueIndex + 1} de {broadcastFilteredList.length} ({Math.round(((activeQueueIndex + 1) / broadcastFilteredList.length) * 100)}%)
                                    </span>
                                </div>
                                <div className="w-full bg-background border border-border-color rounded-full h-3 overflow-hidden p-0.5">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${((activeQueueIndex + 1) / broadcastFilteredList.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Card do Prospecto Atual na Fila */}
                            {broadcastFilteredList[activeQueueIndex] ? (
                                <div className="bg-background/80 border border-green-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border-color/40">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase text-green-400 tracking-wider">Destinatário Atual</div>
                                            <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                                {broadcastFilteredList[activeQueueIndex].name}
                                                {dispatchedIds.includes(broadcastFilteredList[activeQueueIndex].id) && (
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-normal">✓ Já disparado</span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-text-secondary">
                                                {broadcastFilteredList[activeQueueIndex].company || 'Empresa não informada'} • {broadcastFilteredList[activeQueueIndex].role || 'Cargo não informado'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                                📱 {broadcastFilteredList[activeQueueIndex].phone}
                                            </div>
                                            <div className="text-[10px] text-text-secondary mt-1">
                                                Assessor: {broadcastFilteredList[activeQueueIndex].responsible}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Caixinha da Mensagem Gerada para ESTE prospect */}
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-text-secondary mb-1">
                                            Mensagem Pronta para Envio:
                                        </div>
                                        <div className="bg-[#0b141a] p-4 rounded-xl border border-zinc-800 text-xs text-emerald-100 whitespace-pre-line leading-relaxed font-sans">
                                            {compileMessage(broadcastTemplate, broadcastFilteredList[activeQueueIndex])}
                                        </div>
                                    </div>

                                    {/* Botão de Disparo Manual no WhatsApp */}
                                    <div className="pt-2 text-center space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDispatchMessageForProspect(broadcastFilteredList[activeQueueIndex])}
                                            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-base rounded-xl shadow-xl shadow-green-950/50 hover:shadow-green-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
                                        >
                                            <SendIcon className="w-5 h-5" /> 
                                            <span>Disparar Mensagem para {broadcastFilteredList[activeQueueIndex].name.split(' ')[0]} no WhatsApp</span>
                                        </button>

                                        {activeQueueIndex < broadcastFilteredList.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveQueueIndex(prev => prev + 1)}
                                                className="w-full py-2.5 bg-background hover:bg-border-color/30 text-text-primary border border-border-color font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span>Próximo Lead → ({broadcastFilteredList[activeQueueIndex + 1].name.split(' ')[0]})</span>
                                            </button>
                                        )}

                                        <p className="text-[10px] text-text-secondary">
                                            Abre a conversa no WhatsApp Web com a mensagem preenchida. Quando enviar, clique em "Próximo Lead" para avançar.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-background/50 rounded-xl border border-border-color">
                                    <div className="text-3xl mb-2">🎉</div>
                                    <h4 className="font-bold text-base text-green-400">Fila Concluída com Sucesso!</h4>
                                    <p className="text-xs text-text-secondary mt-1">Você passou por todos os destinatários da campanha.</p>
                                </div>
                            )}

                            {/* Navegação da Fila */}
                            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-border-color/40">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsQueueActive(false)}
                                    className="text-xs"
                                >
                                    ⚙️ Alterar Texto ou Filtros
                                </Button>

                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button"
                                        disabled={activeQueueIndex === 0}
                                        onClick={() => setActiveQueueIndex(prev => Math.max(0, prev - 1))}
                                        className="px-3 py-1.5 bg-background border border-border-color text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                                    >
                                        ← Lead Anterior
                                    </button>

                                    <button 
                                        type="button"
                                        disabled={activeQueueIndex >= broadcastFilteredList.length - 1}
                                        onClick={() => setActiveQueueIndex(prev => Math.min(broadcastFilteredList.length - 1, prev + 1))}
                                        className="px-3 py-1.5 bg-background border border-border-color text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                                    >
                                        Próximo Lead →
                                    </button>

                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setIsBroadcastModalOpen(false)}
                                        className="text-xs ml-2"
                                    >
                                        Fechar Disparador
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
