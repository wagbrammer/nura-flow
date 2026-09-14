import {
  User,
  Project,
  Tag,
  Meeting,
  CalendarEvent,
  Task,
  Note,
  EmailReference,
  DriveReference,
  InboxItem,
  ActivityLog,
  MeetingTemplate,
  NotificationItem,
  UsefulLink,
  ChatSpace,
  GoogleChatMessage
} from '../types';

export const CURRENT_USER: User = {
  id: 'user_wagner_1',
  name: 'Wagner Brammer',
  email: 'wagner.brammer@gmail.com',
  role: 'Supervisor de Marketing',
  themePreference: 'auto',
  sidebarCollapsed: false,
  activeCalendarIds: ['cal_nura_main', 'cal_diretoria', 'cal_pessoal']
};

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag_google_ads', name: 'Google Ads', color: '#3b82f6', isFavorite: true },
  { id: 'tag_meta_ads', name: 'Meta Ads', color: '#8b5cf6', isFavorite: true },
  { id: 'tag_implementos', name: 'Implementos', color: '#15803d', isFavorite: true },
  { id: 'tag_comercial', name: 'Comercial', color: '#f59e0b', isFavorite: false },
  { id: 'tag_diretoria', name: 'Diretoria', color: '#ef4444', isFavorite: true },
  { id: 'tag_planejamento', name: 'Planejamento', color: '#06b6d4', isFavorite: false },
  { id: 'tag_urgente', name: 'Urgente', color: '#dc2626', isFavorite: true },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_implementos',
    name: 'Implementos',
    description: 'Desenvolvimento, melhorias de engenharia e campanhas da linha de implementos agrícolas e rodoviários NuRa.',
    color: '#15803d',
    lead: 'Wagner Brammer',
    members: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', role: 'Líder' },
      { name: 'Carlos - Vendas', email: 'carlos.vendas@nura.com.br', role: 'Engenharia & Vendas' },
      { name: 'Juliana - MKT', email: 'juliana.mkt@nura.com.br', role: 'Marketing' }
    ],
    tags: ['tag_implementos', 'tag_comercial'],
    milestones: [
      { id: 'ms_1', title: 'Homologação do novo modelo Roll-on/Roll-off', dueDate: '2026-09-15', completed: false },
      { id: 'ms_2', title: 'Lançamento do catálogo técnico digital', dueDate: '2026-09-01', completed: true },
      { id: 'ms_3', title: 'Validação de testes de carga em campo', dueDate: '2026-09-30', completed: false }
    ],
    progress: 55,
    isFavorite: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'proj_marketing',
    name: 'Marketing',
    description: 'Gestão de performance digital, canais de mídia paga (Google & Meta), produção de conteúdo e branding institucional.',
    color: '#3b82f6',
    lead: 'Wagner Brammer',
    members: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', role: 'Supervisão Geral' },
      { name: 'Equipe Agência Digital', email: 'contato@agenciapartner.com.br', role: 'Agência de Performance' },
      { name: 'Juliana - MKT', email: 'juliana.mkt@nura.com.br', role: 'Analista de Marketing' }
    ],
    tags: ['tag_google_ads', 'tag_meta_ads'],
    milestones: [
      { id: 'ms_m1', title: 'Otimização de ROI no Google Ads (Meta +25% conversões)', dueDate: '2026-08-31', completed: false },
      { id: 'ms_m2', title: 'Nova Landing Page de Implementos Rodoviários', dueDate: '2026-08-28', completed: false },
      { id: 'ms_m3', title: 'Campanha de feiras e eventos agrícolas do semestre', dueDate: '2026-09-10', completed: false }
    ],
    progress: 40,
    isFavorite: true,
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'proj_planejamento_2027',
    name: 'Planejamento 2027',
    description: 'Planejamento estratégico de longo prazo, automação fabril, metas de faturamento e expansão para o mercado internacional.',
    color: '#06b6d4',
    lead: 'Wagner Brammer',
    members: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', role: 'Líder' },
      { name: 'Diretoria Executiva', email: 'diretoria@nura.com.br', role: 'Conselho' }
    ],
    tags: ['tag_planejamento', 'tag_diretoria'],
    milestones: [
      { id: 'ms_p1', title: 'Diagnóstico de capacidade produtiva das células', dueDate: '2026-10-15', completed: false },
      { id: 'ms_p2', title: 'Apresentação do orçamento de investimentos 2027', dueDate: '2026-11-30', completed: false }
    ],
    progress: 20,
    isFavorite: true,
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet_agencia_20260827',
    eventId: 'evt_agencia_1000',
    title: 'Reunião Agência',
    date: '2026-08-27',
    startTime: '10:00',
    endTime: '11:00',
    location: 'Google Meet',
    meetUrl: 'https://meet.google.com/rob-agnt-flw',
    agenda: '1. Avaliação de performance das campanhas de Google Ads e Meta Ads no mês de Agosto.\n2. Alinhamento sobre a nova Landing Page de Implementos.\n3. Definição do novo material comercial impresso e digital para a equipe de vendas.\n4. Ajustes no orçamento de mídia para o próximo trimestre.',
    participants: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', status: 'accepted', role: 'Diretor' },
      { name: 'Lucas Ramos', email: 'lucas@agenciapartner.com.br', status: 'accepted', role: 'Head de Performance' },
      { name: 'Marina Fontes', email: 'marina@agenciapartner.com.br', status: 'accepted', role: 'Diretora de Criação' },
      { name: 'Juliana - MKT', email: 'juliana.mkt@nura.com.br', status: 'accepted', role: 'Marketing NuRa' }
    ],
    tags: ['tag_google_ads', 'tag_meta_ads', 'tag_implementos'],
    projectId: 'proj_marketing',
    status: 'scheduled',
    previousMeetingId: 'meet_agencia_20260813',
    previousPendingTasksCount: 2,
    previousSummary: 'Na reunião anterior (13/08), ficou decidido pausar os grupos de anúncios com CPL acima da meta e testar novos criativos em vídeo destacando a robustez estrutural dos implementos.',
    notes: [
      {
        id: 'note_ag_1',
        title: 'Pontos pré-reunião & métricas atuais',
        type: 'text',
        content: `### Dados de Conversão - Google Ads
- **Custo por Lead (CPL):** R$ 42,50 (Meta: R$ 38,00)
- **Campanhas com melhor tração:** *Implementos Agrícolas - Busca Exata* e *Peças de Reposição*.
- **Ponto de atenção:** Taxa de rejeição na landing page antiga está em 64%. É prioritário subir a versão responsiva rápida.

### Feedback Comercial
- Carlos (Vendas) relatou que os leads que chegam pelo Google possuem maior qualificação para compras de grande porte em comparação ao Meta.`,
        tags: ['tag_google_ads', 'tag_implementos'],
        projectId: 'proj_marketing',
        meetingId: 'meet_agencia_20260827',
        privacy: 'private',
        createdAt: '2026-08-27T08:15:00Z',
        updatedAt: '2026-08-27T08:15:00Z'
      },
      {
        id: 'note_ag_checklist',
        title: 'Checklist de Validação com a Agência',
        type: 'checklist',
        content: 'Checklist operacional',
        checklist: [
          { id: 'chk_1', text: 'Confirmar data de entrega da Landing Page reformulada', completed: false },
          { id: 'chk_2', text: 'Validar testes A/B nas chamadas de anúncio de Implementos', completed: false },
          { id: 'chk_3', text: 'Aprovar distribuição de verba: 70% Google / 30% Meta', completed: true },
          { id: 'chk_4', text: 'Solicitar amostra do catálogo comercial em alta resolução', completed: false }
        ],
        tags: ['tag_google_ads', 'tag_meta_ads'],
        projectId: 'proj_marketing',
        meetingId: 'meet_agencia_20260827',
        privacy: 'team',
        createdAt: '2026-08-27T08:40:00Z',
        updatedAt: '2026-08-27T08:40:00Z'
      }
    ],
    decisions: [
      { id: 'dec_1', text: 'Manter a prioridade de orçamento alocada para os implementos pesados.', createdAt: '2026-08-27T07:10:00Z' }
    ],
    suggestedTasks: [
      {
        id: 'sug_task_1',
        title: 'Revisar campanha Google Ads',
        priority: 'urgent',
        assignee: 'Wagner Brammer',
        dueDate: '2026-08-28',
        converted: true
      },
      {
        id: 'sug_task_2',
        title: 'Criar material comercial',
        priority: 'high',
        assignee: 'Juliana - MKT',
        dueDate: '2026-08-29',
        converted: true
      },
      {
        id: 'sug_task_3',
        title: 'Revisar landing page',
        priority: 'high',
        assignee: 'Wagner Brammer',
        dueDate: '2026-08-27',
        converted: true
      }
    ],
    attachments: [
      { id: 'att_1', name: 'Relatorio_Performance_GoogleAds_Agosto.pdf', type: 'pdf', size: '2.4 MB' },
      { id: 'att_2', name: 'Layout_Nova_LP_Implementos_v3.fig', type: 'doc', size: '14.8 MB' }
    ],
    createdAt: '2026-08-20T11:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'meet_comercial_20260827',
    eventId: 'evt_comercial_0830',
    title: 'Reunião Comercial',
    date: '2026-08-27',
    startTime: '08:30',
    endTime: '09:30',
    location: 'Sala de Reuniões NuRa & Presencial',
    agenda: 'Alinhamento semanal de metas de vendas, pedidos em carteira de implementos e previsão de faturamento.',
    participants: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', status: 'accepted', role: 'Diretor' },
      { name: 'Carlos - Vendas', email: 'carlos.vendas@nura.com.br', status: 'accepted', role: 'Gerente Comercial' },
      { name: 'Fernanda - Faturamento', email: 'fernanda@robustec.com.br', status: 'accepted', role: 'Financeiro' }
    ],
    tags: ['tag_comercial', 'tag_implementos'],
    projectId: 'proj_implementos',
    status: 'completed',
    notes: [
      {
        id: 'note_com_1',
        title: 'Resumo dos números da semana',
        type: 'text',
        content: `### Pipeline de Vendas
- 18 propostas ativas no funil para a linha de caçambas e guinchos.
- Região Centro-Oeste registrou aumento de 30% na procura por implementos agrícolas para a safra.
- Carlos solicitou apoio da equipe de marketing para envio de material customizado aos revendedores.`,
        tags: ['tag_comercial', 'tag_implementos'],
        projectId: 'proj_implementos',
        meetingId: 'meet_comercial_20260827',
        privacy: 'shared',
        createdAt: '2026-08-27T08:35:00Z',
        updatedAt: '2026-08-27T09:30:00Z'
      }
    ],
    decisions: [
      { id: 'dec_com_1', text: 'Liberada condição especial de frete para lotes acima de 3 unidades no Centro-Oeste.', createdAt: '2026-08-27T09:20:00Z' }
    ],
    attachments: [
      { id: 'att_com_1', name: 'Carteira_Pedidos_Semana34.xlsx', type: 'sheet', size: '1.1 MB' }
    ],
    createdAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-08-27T09:30:00Z'
  },
  {
    id: 'meet_diretoria_20260827',
    eventId: 'evt_diretoria_1130',
    title: 'Diretoria',
    date: '2026-08-27',
    startTime: '11:30',
    endTime: '12:30',
    location: 'Sala da Presidência',
    agenda: 'Acompanhamento do fechamento mensal, fluxo de caixa e status das obras da nova ala fabril.',
    participants: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', status: 'accepted', role: 'Diretor' },
      { name: 'Roberto - Presidente', email: 'roberto@robustec.com.br', status: 'accepted', role: 'Diretor Presidente' },
      { name: 'Dr. Eduardo - Jurídico', email: 'juridico@robustec.com.br', status: 'accepted', role: 'Jurídico' }
    ],
    tags: ['tag_diretoria', 'tag_planejamento'],
    projectId: 'proj_planejamento_2027',
    status: 'scheduled',
    notes: [],
    decisions: [],
    attachments: [],
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'meet_planejamento_20260827',
    eventId: 'evt_plan_1400',
    title: 'Planejamento',
    date: '2026-08-27',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Espaço Inovação & Projetos',
    agenda: 'Revisão das especificações técnicas para a nova linha 2027 e cronograma de fornecedores de aço e componentes hidráulicos.',
    participants: [
      { name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', status: 'accepted', role: 'Diretor' },
      { name: 'Eng. Marcelo', email: 'marcelo.eng@robustec.com.br', status: 'accepted', role: 'Engenheiro Chefe' },
      { name: 'Renata - Suprimentos', email: 'renata.suprimentos@robustec.com.br', status: 'accepted', role: 'Compras' }
    ],
    tags: ['tag_planejamento', 'tag_implementos'],
    projectId: 'proj_planejamento_2027',
    status: 'scheduled',
    notes: [],
    decisions: [],
    attachments: [],
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_comercial_0830',
    calendarId: 'cal_nura_main',
    title: 'Reunião Comercial',
    description: 'Alinhamento semanal de vendas e carteira de pedidos.',
    startDate: '2026-08-27',
    startTime: '08:30',
    endDate: '2026-08-27',
    endTime: '09:30',
    location: 'Sala de Reuniões NuRa',
    color: '#f59e0b',
    participants: INITIAL_MEETINGS[1].participants,
    tags: ['tag_comercial', 'tag_implementos'],
    meetingId: 'meet_comercial_20260827'
  },
  {
    id: 'evt_agencia_1000',
    calendarId: 'cal_nura_main',
    title: 'Reunião Agência',
    description: 'Performance Google Ads / Meta Ads, nova Landing Page e materiais comerciais.',
    startDate: '2026-08-27',
    startTime: '10:00',
    endDate: '2026-08-27',
    endTime: '11:00',
    location: 'Google Meet',
    meetUrl: 'https://meet.google.com/rob-agnt-flw',
    color: '#3b82f6',
    participants: INITIAL_MEETINGS[0].participants,
    tags: ['tag_google_ads', 'tag_meta_ads', 'tag_implementos'],
    meetingId: 'meet_agencia_20260827'
  },
  {
    id: 'evt_diretoria_1130',
    calendarId: 'cal_diretoria',
    title: 'Diretoria',
    description: 'Acompanhamento do fechamento mensal e expansão.',
    startDate: '2026-08-27',
    startTime: '11:30',
    endDate: '2026-08-27',
    endTime: '12:30',
    location: 'Sala da Presidência',
    color: '#ef4444',
    participants: INITIAL_MEETINGS[2].participants,
    tags: ['tag_diretoria'],
    meetingId: 'meet_diretoria_20260827'
  },
  {
    id: 'evt_plan_1400',
    calendarId: 'cal_nura_main',
    title: 'Planejamento',
    description: 'Cronograma da linha 2027 e suprimentos.',
    startDate: '2026-08-27',
    startTime: '14:00',
    endDate: '2026-08-27',
    endTime: '15:30',
    location: 'Espaço Inovação',
    color: '#06b6d4',
    participants: INITIAL_MEETINGS[3].participants,
    tags: ['tag_planejamento', 'tag_implementos'],
    meetingId: 'meet_planejamento_20260827'
  },
  {
    id: 'evt_tomorrow_1',
    calendarId: 'cal_nura_main',
    title: 'Alinhamento Produção & Montagem',
    description: 'Verificação da fila de pintura e montagem final dos guinchos.',
    startDate: '2026-08-28',
    startTime: '09:00',
    endDate: '2026-08-28',
    endTime: '10:00',
    location: 'Fábrica 1 - Chão de Fábrica',
    color: '#15803d',
    participants: [{ name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', status: 'accepted' }],
    tags: ['tag_implementos']
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_rev_google_ads',
    title: 'Revisar campanha Google Ads',
    description: 'Verificar palavras-chave negativas, termos de busca de alta conversão e ajustar lances das campanhas de Implementos Rodoviários.',
    status: 'in_progress',
    priority: 'urgent',
    assignee: 'Wagner Brammer',
    assigneeEmail: 'wagner.brammer@gmail.com',
    dueDate: '2026-08-28',
    projectId: 'proj_marketing',
    tags: ['tag_google_ads', 'tag_implementos', 'tag_urgente'],
    checklist: [
      { id: 'chk_g1', text: 'Analisar relatório de termos de pesquisa da última quinzena', completed: true },
      { id: 'chk_g2', text: 'Adicionar termos desqualificados à lista de exclusão', completed: false },
      { id: 'chk_g3', text: 'Ajustar orçamento da campanha de busca direta', completed: false }
    ],
    originType: 'meeting',
    originId: 'meet_agencia_20260827',
    originTitle: 'Reunião Agência',
    comments: [
      {
        id: 'comm_1',
        author: 'Juliana - MKT',
        authorEmail: 'juliana.mkt@nura.com.br',
        content: 'Lucas da agência já subiu os novos textos de anúncio para nossa aprovação.',
        createdAt: '2026-08-27T07:15:00Z'
      }
    ],
    attachmentsCount: 1,
    isFavorite: true,
    createdAt: '2026-08-27T07:00:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'task_criar_mat_comercial',
    title: 'Criar material comercial',
    description: 'Elaborar catálogo técnico e lâminas de venda em PDF com especificações atualizadas da linha de implementos para a equipe de vendas.',
    status: 'todo',
    priority: 'high',
    assignee: 'Juliana - MKT',
    assigneeEmail: 'juliana.mkt@nura.com.br',
    dueDate: '2026-08-29',
    projectId: 'proj_marketing',
    tags: ['tag_implementos', 'tag_comercial'],
    checklist: [
      { id: 'chk_m1', text: 'Obter desenhos técnicos vetorizados com engenharia', completed: false },
      { id: 'chk_m2', text: 'Diagramar ficha técnica com tabela de capacidades', completed: false }
    ],
    originType: 'meeting',
    originId: 'meet_agencia_20260827',
    originTitle: 'Reunião Agência',
    comments: [],
    isFavorite: false,
    createdAt: '2026-08-27T07:00:00Z',
    updatedAt: '2026-08-27T07:00:00Z'
  },
  {
    id: 'task_rev_landing_page',
    title: 'Revisar landing page',
    description: 'Testar formulário de contato integrado ao CRM, velocidade no mobile e chamadas para WhatsApp na nova LP de Implementos.',
    status: 'todo',
    priority: 'high',
    assignee: 'Wagner Brammer',
    assigneeEmail: 'wagner.brammer@gmail.com',
    dueDate: '2026-08-27', // Vencendo Hoje!
    projectId: 'proj_marketing',
    tags: ['tag_google_ads', 'tag_meta_ads'],
    checklist: [
      { id: 'chk_lp1', text: 'Validar formulário de orçamento no celular', completed: false },
      { id: 'chk_lp2', text: 'Verificar rastreamento de tags do Google Analytics 4', completed: false }
    ],
    originType: 'meeting',
    originId: 'meet_agencia_20260827',
    originTitle: 'Reunião Agência',
    comments: [],
    isFavorite: true,
    createdAt: '2026-08-27T07:00:00Z',
    updatedAt: '2026-08-27T07:00:00Z'
  },
  {
    id: 'task_aguardando_criativos',
    title: 'Aprovar vídeos dos novos criativos de Meta Ads',
    description: 'Aguardando agência enviar os 3 vídeos editados com cortes de teste de resistência dos implementos.',
    status: 'waiting',
    priority: 'medium',
    assignee: 'Wagner Brammer',
    dueDate: '2026-08-28',
    projectId: 'proj_marketing',
    tags: ['tag_meta_ads'],
    checklist: [],
    originType: 'meeting',
    originId: 'meet_agencia_20260813',
    originTitle: 'Reunião Agência (13/08)',
    waitingFor: {
      person: 'Lucas Ramos (Agência)',
      personEmail: 'lucas@agenciapartner.com.br',
      sinceDate: '2026-08-23',
      daysWaiting: 4,
      reason: 'Envio da renderização final com trilha sonora ajustada'
    },
    comments: [],
    createdAt: '2026-08-23T14:00:00Z',
    updatedAt: '2026-08-27T07:00:00Z'
  },
  {
    id: 'task_aguardando_orcamento_cilindros',
    title: 'Cotação de cilindros hidráulicos reforçados',
    description: 'Aguardando proposta comercial final com desconto para compra de 50 conjuntos de acionamento.',
    status: 'waiting',
    priority: 'high',
    assignee: 'Wagner Brammer',
    dueDate: '2026-08-26', // Atrasada!
    projectId: 'proj_implementos',
    tags: ['tag_implementos', 'tag_planejamento'],
    checklist: [],
    originType: 'manual',
    waitingFor: {
      person: 'Fornecedor HidroTech',
      personEmail: 'comercial@hidrotech.ind.br',
      sinceDate: '2026-08-20',
      daysWaiting: 7,
      reason: 'Aguardando validação da gerência financeira do fornecedor'
    },
    comments: [],
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-08-27T07:00:00Z'
  },
  {
    id: 'task_concluida_catalogo',
    title: 'Aprovar tabela de preços do trimestre',
    description: 'Validação final de margens brutas com a diretoria financeira.',
    status: 'done',
    priority: 'medium',
    assignee: 'Wagner Brammer',
    dueDate: '2026-08-25',
    projectId: 'proj_implementos',
    tags: ['tag_comercial', 'tag_diretoria'],
    checklist: [],
    originType: 'meeting',
    originTitle: 'Reunião Comercial',
    comments: [],
    completedAt: '2026-08-25T16:00:00Z',
    createdAt: '2026-08-22T10:00:00Z',
    updatedAt: '2026-08-25T16:00:00Z'
  }
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note_estrategia_implementos',
    title: 'Diretrizes Estratégicas - Implementos 2026/2027',
    type: 'text',
    content: `# Diretrizes Estratégicas da Linha de Implementos NuRa

## 1. Posicionamento de Mercado
- Foco em durabilidade extrema e menor custo total de propriedade (TCO) para o transportador e produtor rural.
- Estrutura em aço de alta resistência com solda robotizada.

## 2. Diferenciais Competitivos
- Tratamento de superfície anti-corrosivo patenteado.
- Agilidade na reposição de componentes de desgaste rápido.

## 3. Próximos Passos
- Fortalecer canais digitais de captação de leads qualificados.
- Treinamento técnico da rede de representantes autorizados em todo o país.`,
    tags: ['tag_implementos', 'tag_planejamento'],
    projectId: 'proj_implementos',
    privacy: 'private',
    isFavorite: true,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-26T18:00:00Z'
  },
  {
    id: 'note_esboco_canvas',
    title: 'Esboço Manual de Fluxo Hidráulico',
    type: 'drawing',
    content: 'Esboço conceitual feito com caneta stylus',
    drawingData: {
      background: 'grid',
      strokes: [
        {
          tool: 'pen',
          color: '#15803d',
          size: 3,
          points: [
            { x: 50, y: 100 },
            { x: 150, y: 100 },
            { x: 200, y: 150 },
            { x: 200, y: 250 },
            { x: 120, y: 250 }
          ]
        },
        {
          tool: 'highlighter',
          color: '#f59e0b',
          size: 12,
          points: [
            { x: 45, y: 95 },
            { x: 160, y: 95 }
          ]
        }
      ]
    },
    tags: ['tag_implementos'],
    projectId: 'proj_implementos',
    privacy: 'team',
    createdAt: '2026-08-24T14:30:00Z',
    updatedAt: '2026-08-24T14:45:00Z'
  },
  {
    id: 'note_audio_memo_1',
    title: 'Gravação Rápida: Ideia de Campanha Agrishow',
    type: 'audio',
    content: 'Áudio gravado durante deslocamento',
    audioData: {
      durationSeconds: 42,
      waveform: [15, 30, 45, 80, 65, 40, 90, 100, 75, 55, 30, 20, 60, 85, 95, 70, 45, 25, 10],
      transcript: 'Pensando na feira do próximo semestre, seria muito interessante posicionar uma bancada interativa com os testes de esforço do nosso guincho hidráulico, comparando o tempo de ciclo com os concorrentes. Juliana precisa orçar esse totem com a agência.',
      keyTopics: ['Agrishow', 'Bancada Interativa', 'Guincho Hidráulico', 'Orçamento'],
      suggestedActionItems: [
        'Pedir à agência projeto 3D do totem para a feira',
        'Alinhar cronograma de montagem com a equipe técnica'
      ]
    },
    tags: ['tag_implementos', 'tag_marketing'],
    projectId: 'proj_marketing',
    privacy: 'private',
    createdAt: '2026-08-26T17:20:00Z',
    updatedAt: '2026-08-26T17:20:00Z'
  }
];

export const INITIAL_EMAILS: EmailReference[] = [
  {
    id: 'email_1',
    subject: 'Relatório Preliminar de Tráfego Pago - Agosto/2026',
    from: { name: 'Lucas Ramos', email: 'lucas@agenciapartner.com.br' },
    to: [{ name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com' }],
    date: '2026-08-26 18:45',
    snippet: 'Wagner, segue anexo o compilado de métricas de Google Ads e Meta Ads com a projeção de fechamento do mês para a nossa reunião das 10h...',
    body: `Olá Wagner,\n\nConforme combinado para a nossa pauta de hoje às 10h, compilamos os resultados das campanhas de Implementos Rodoviários e Agrícolas.\n\nDestaques:\n- Google Ads teve aumento de 18% em ligações diretas para a central de vendas.\n- O criativo em carrossel no Meta reduziu o CPL para R$ 34,00.\n\nNos falamos em instantes no Meet!\n\nAtenciosamente,\nLucas Ramos - Agência Partner`,
    tags: ['tag_google_ads', 'tag_meta_ads'],
    projectId: 'proj_marketing',
    meetingId: 'meet_agencia_20260827',
    hasAttachment: true
  },
  {
    id: 'email_2',
    subject: 'Proposta Comercial Cotação Cilindros Reforçados',
    from: { name: 'Comercial HidroTech', email: 'comercial@hidrotech.ind.br' },
    to: [{ name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com' }],
    date: '2026-08-25 11:20',
    snippet: 'Prezado Wagner, estamos finalizando as condições de faturamento em 60 dias para o lote de 50 unidades solicitado...',
    body: `Prezado Wagner,\n\nAgradecemos a oportunidade de fornecimento. Nossa diretoria está aprovando a extensão do prazo de entrega com garantia estendida de 24 meses.\n\nRetornaremos com a minuta do contrato até amanhã.\n\nAbraços,\nEquipe HidroTech`,
    tags: ['tag_implementos'],
    projectId: 'proj_implementos',
    hasAttachment: true
  }
];

export const INITIAL_DRIVE_FILES: DriveReference[] = [
  {
    id: 'drive_1',
    name: 'Especificações_Técnicas_Implementos_v4.pdf',
    type: 'pdf',
    size: '8.7 MB',
    url: '#',
    lastModified: '2026-08-25',
    projectId: 'proj_implementos',
    tags: ['tag_implementos']
  },
  {
    id: 'drive_2',
    name: 'Planejamento_Financeiro_Expansao_2027.xlsx',
    type: 'sheet',
    size: '3.2 MB',
    url: '#',
    lastModified: '2026-08-26',
    projectId: 'proj_planejamento_2027',
    tags: ['tag_planejamento', 'tag_diretoria']
  },
  {
    id: 'drive_3',
    name: 'Apresentacao_Resultados_Marketing_Q3.pptx',
    type: 'slide',
    size: '15.4 MB',
    url: '#',
    lastModified: '2026-08-27',
    projectId: 'proj_marketing',
    meetingId: 'meet_agencia_20260827',
    tags: ['tag_google_ads', 'tag_meta_ads']
  }
];

export const INITIAL_USEFUL_LINKS: UsefulLink[] = [
  {
    id: 'link_gmail',
    title: 'Gmail',
    description: 'Caixa de entrada e referências de e-mail.',
    address: 'https://mail.google.com/',
    location: 'web',
    icon: 'mail',
    color: 'rose',
    category: 'Comunicação',
    isFavorite: true,
    createdAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z'
  },
  {
    id: 'link_google_drive',
    title: 'Google Drive',
    description: 'Documentos, planilhas e arquivos compartilhados.',
    address: 'https://drive.google.com/',
    location: 'web',
    icon: 'folder',
    color: 'blue',
    category: 'Arquivos',
    isFavorite: true,
    createdAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z'
  }
];

// Google Chat Mock Data
export const INITIAL_CHAT_SPACES: ChatSpace[] = [
  {
    id: 'space_marketing',
    name: 'spaces/marketing_equipe',
    displayName: '📈 Marketing & Performance',
    type: 'SPACE',
    spaceThreadingState: 'GROUPED_MESSAGES',
    createTime: '2026-07-15T10:00:00Z'
  },
  {
    id: 'space_implementos',
    name: 'spaces/implementos_projetos',
    displayName: '🚜 Implementos - Projetos',
    type: 'SPACE',
    spaceThreadingState: 'GROUPED_MESSAGES',
    createTime: '2026-07-20T09:00:00Z'
  },
  {
    id: 'space_diretoria',
    name: 'spaces/diretoria_executiva',
    displayName: '👔 Diretoria Executiva',
    type: 'SPACE',
    spaceThreadingState: 'GROUPED_MESSAGES',
    createTime: '2026-08-01T14:00:00Z'
  },
  {
    id: 'space_dm_lucas',
    name: 'spaces/dm_lucas_agencia',
    displayName: 'Lucas Ramos (Agência)',
    type: 'DIRECT_MESSAGE',
    createTime: '2026-08-10T11:00:00Z'
  },
  {
    id: 'space_dm_carlos',
    name: 'spaces/dm_carlos_vendas',
    displayName: 'Carlos - Vendas',
    type: 'DIRECT_MESSAGE',
    createTime: '2026-08-12T16:00:00Z'
  }
];

export const INITIAL_CHAT_MESSAGES: Record<string, GoogleChatMessage[]> = {
  'space_marketing': [
    {
      id: 'msg_mkt_1',
      spaceId: 'space_marketing',
      sender: { name: 'users/lucas_agencia', displayName: 'Lucas Ramos', type: 'HUMAN', avatarUrl: '' },
      text: 'Pessoal, subimos os novos criativos de vídeo para a campanha de Implementos Rodoviários. Podem revisar?',
      createTime: '2026-08-27T09:15:00Z',
      thread: { name: 'spaces/marketing_equipe/threads/creatives_review' }
    },
    {
      id: 'msg_mkt_2',
      spaceId: 'space_marketing',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Já vou dar uma olhada. O roteiro do vídeo de teste de carga ficou bom?',
      createTime: '2026-08-27T09:18:00Z',
      thread: { name: 'spaces/marketing_equipe/threads/creatives_review' }
    },
    {
      id: 'msg_mkt_3',
      spaceId: 'space_marketing',
      sender: { name: 'users/lucas_agencia', displayName: 'Lucas Ramos', type: 'HUMAN', avatarUrl: '' },
      text: 'Ficou! Mostra o guincho aguentando 15 toneladas sem deformar. Mandei o link no Drive da pasta "Criativos Aprovados".',
      createTime: '2026-08-27T09:22:00Z',
      thread: { name: 'spaces/marketing_equipe/threads/creatives_review' }
    },
    {
      id: 'msg_mkt_4',
      spaceId: 'space_marketing',
      sender: { name: 'users/juliana_mkt', displayName: 'Juliana - MKT', type: 'HUMAN', avatarUrl: '' },
      text: 'Perfeito! Vou subir no Meta Ads Manager ainda hoje. Wagner, aprova o texto do anúncio?',
      createTime: '2026-08-27T09:25:00Z',
      thread: { name: 'spaces/marketing_equipe/threads/creatives_review' }
    },
    {
      id: 'msg_mkt_5',
      spaceId: 'space_marketing',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Aprovo. Só muda "resistente" para "ultra-resistente" no headline principal. O resto tá bom.',
      createTime: '2026-08-27T09:28:00Z',
      thread: { name: 'spaces/marketing_equipe/threads/creatives_review' }
    }
  ],
  'space_implementos': [
    {
      id: 'msg_imp_1',
      spaceId: 'space_implementos',
      sender: { name: 'users/carlos_vendas', displayName: 'Carlos - Vendas', type: 'HUMAN', avatarUrl: '' },
      text: 'Equipe, cliente do Centro-Oeste pediu prazo de entrega de 15 dias pro lote de 5 caçambas. Conseguimos?',
      createTime: '2026-08-26T15:30:00Z',
      thread: { name: 'spaces/implementos_projetos/threads/entrega_centro_oeste' }
    },
    {
      id: 'msg_imp_2',
      spaceId: 'space_implementos',
      sender: { name: 'users/marcelo_eng', displayName: 'Eng. Marcelo', type: 'HUMAN', avatarUrl: '' },
      text: 'Tá apertado. A pintura tá com fila de 10 dias. Se priorizar esse lote, atrasa os guinchos da diretoria.',
      createTime: '2026-08-26T15:45:00Z',
      thread: { name: 'spaces/implementos_projetos/threads/entrega_centro_oeste' }
    },
    {
      id: 'msg_imp_3',
      spaceId: 'space_implementos',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Vou falar com a diretoria na reunião das 11:30. Se liberarem a prioridade, a gente consegue. Carlos, avisa o cliente que estamos verificando.',
      createTime: '2026-08-26T16:00:00Z',
      thread: { name: 'spaces/implementos_projetos/threads/entrega_centro_oeste' }
    }
  ],
  'space_diretoria': [
    {
      id: 'msg_dir_1',
      spaceId: 'space_diretoria',
      sender: { name: 'users/roberto_presidente', displayName: 'Roberto - Presidente', type: 'HUMAN', avatarUrl: '' },
      text: 'Pessoal, fechamento do mês precisa estar pronto até 4ª feira. Wagner, manda o relatório de performance pro conselho.',
      createTime: '2026-08-27T08:00:00Z'
    },
    {
      id: 'msg_dir_2',
      spaceId: 'space_diretoria',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Já tô preparando. Vou consolidar Marketing + Implementos + Planejamento 2027. Entreguem os números até terça 18h.',
      createTime: '2026-08-27T08:10:00Z'
    }
  ],
  'space_dm_lucas': [
    {
      id: 'msg_dm_lucas_1',
      spaceId: 'space_dm_lucas',
      sender: { name: 'users/lucas_agencia', displayName: 'Lucas Ramos', type: 'HUMAN', avatarUrl: '' },
      text: 'Wagner, bom dia! O relatório preliminar de agosto tá no seu e-mail. Dá uma olhada antes da reunião das 10h?',
      createTime: '2026-08-27T08:45:00Z'
    },
    {
      id: 'msg_dm_lucas_2',
      spaceId: 'space_dm_lucas',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Bom dia, Lucas! Já vi. O CPL do Google melhorou, mas o Meta ainda tá acima da meta. Vamos alinhar na reunião.',
      createTime: '2026-08-27T08:50:00Z'
    }
  ],
  'space_dm_carlos': [
    {
      id: 'msg_dm_carlos_1',
      spaceId: 'space_dm_carlos',
      sender: { name: 'users/carlos_vendas', displayName: 'Carlos - Vendas', type: 'HUMAN', avatarUrl: '' },
      text: 'Chefe, o cliente da HidroTech ligou. Eles tão pedindo desconto extra nos cilindros pro fechamento do mês.',
      createTime: '2026-08-27T07:30:00Z'
    },
    {
      id: 'msg_dm_carlos_2',
      spaceId: 'space_dm_carlos',
      sender: { name: 'users/wagner_brammer', displayName: 'Wagner Brammer', type: 'HUMAN', avatarUrl: '' },
      text: 'Já avisei: desconto só no frete pro Centro-Oeste, como combinamos na reunião comercial. Mantém a linha.',
      createTime: '2026-08-27T07:35:00Z'
    }
  ]
};

export const INITIAL_INBOX_ITEMS: InboxItem[] = [
  {
    id: 'inbox_1',
    type: 'text',
    content: 'Lembrar de falar com Dr. Eduardo sobre a cláusula de confidencialidade com a montadora parceira.',
    tags: ['tag_diretoria'],
    createdAt: '2026-08-27T06:50:00Z'
  },
  {
    id: 'inbox_2',
    type: 'voice',
    content: 'Nota de voz rápida capturada no carro sobre melhoria no engate do guincho.',
    tags: ['tag_implementos'],
    createdAt: '2026-08-26T20:10:00Z'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act_1',
    action: 'Reunião Realizada',
    details: 'Reunião Comercial finalizada com 1 decisão registrada e 1 anotação criada.',
    entityType: 'meeting',
    entityId: 'meet_comercial_20260827',
    entityTitle: 'Reunião Comercial',
    timestamp: '2026-08-27 09:30'
  },
  {
    id: 'act_2',
    action: 'Status Alterado',
    details: 'Tarefa "Revisar campanha Google Ads" alterada para Em Andamento.',
    entityType: 'task',
    entityId: 'task_rev_google_ads',
    entityTitle: 'Revisar campanha Google Ads',
    timestamp: '2026-08-27 07:30'
  },
  {
    id: 'act_3',
    action: 'Nota Criada',
    details: 'Criada anotação de pontos pré-reunião com dados de conversão de Google Ads.',
    entityType: 'note',
    entityId: 'note_ag_1',
    entityTitle: 'Pontos pré-reunião & métricas atuais',
    timestamp: '2026-08-27 08:15'
  }
];

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: 'tpl_semanal',
    name: 'Reunião Semanal',
    description: 'Pauta ágil para acompanhamento de resultados, bloqueios e metas da semana.',
    category: 'Gestão',
    agendaStructure: '1. Principais resultados da semana anterior\n2. Indicadores-chave e metas\n3. Bloqueios e problemas em aberto\n4. Decisões estratégicas\n5. Plano de ação para a próxima semana',
    defaultTags: ['tag_planejamento']
  },
  {
    id: 'tpl_projeto',
    name: 'Acompanhamento de Projeto',
    description: 'Status de entregas, análise de riscos e próximos marcos.',
    category: 'Projetos',
    agendaStructure: '1. Status geral do cronograma e entregas\n2. Riscos identificados e mitigações\n3. Bloqueios e dependências externas\n4. Decisões técnicas\n5. Próximos passos e responsáveis',
    defaultTags: ['tag_implementos']
  },
  {
    id: 'tpl_one_on_one',
    name: '1:1 Alinhamento Individual',
    description: 'Conversa de desenvolvimento, apoio mútuo e alinhamento de expectativas.',
    category: 'Pessoas',
    agendaStructure: '1. Como estão as coisas (clima e bem-estar)\n2. Assuntos prioritários do liderado\n3. Feedback mútuo e dificuldades\n4. Apoio necessário da liderança\n5. Acordos e próximos passos',
    defaultTags: ['tag_diretoria']
  },
  {
    id: 'tpl_brainstorming',
    name: 'Brainstorming & Inovação',
    description: 'Estrutura para geração de ideias, hipóteses de produto e testes.',
    category: 'Inovação',
    agendaStructure: '1. Definição clara do desafio/oportunidade\n2. Geração livre de ideias e hipóteses\n3. Agrupamento e priorização das melhores soluções\n4. Experimento rápido de validação\n5. Responsável pelo protótipo',
    defaultTags: ['tag_implementos', 'tag_google_ads']
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Reunião Agência em 15 min',
    message: 'Você tem a Reunião Agência às 10:00 com 3 tarefas pendentes associadas.',
    type: 'meeting_soon',
    timestamp: '2026-08-27 09:45',
    read: false,
    actionView: 'meetings',
    actionId: 'meet_agencia_20260827'
  },
  {
    id: 'notif_2',
    title: 'Tarefa Atrasada',
    message: 'A cotação de cilindros hidráulicos está aguardando retorno há 7 dias.',
    type: 'waiting_followup',
    timestamp: '2026-08-27 08:00',
    read: false,
    actionView: 'tasks',
    actionId: 'task_aguardando_orcamento_cilindros'
  },
  {
    id: 'notif_3',
    title: 'Tarefa Vencendo Hoje',
    message: 'A tarefa "Revisar landing page" tem prazo para conclusão hoje.',
    type: 'task_overdue',
    timestamp: '2026-08-27 07:30',
    read: false,
    actionView: 'tasks',
    actionId: 'task_rev_landing_page'
  }
];
