/**
 * DONNÉES DE DÉMONSTRATION — remplacées par l'API réelle en production.
 *
 * IMPORTANT — Isolation multi-tenant :
 * Ces données mock appartiennent toutes implicitement à une seule boutique
 * (Phone Shop Dakar). Il n'y a PAS d'isolation multi-tenant côté frontend
 * en mode démo — c'est intentionnel et documenté.
 *
 * L'isolation réelle se fait côté backend via :
 *   - BelongsToTenant global scope (filtre SQL automatique par tenant_id)
 *   - EnsureTenantAccess middleware (bind current_tenant_id avant chaque requête)
 *   - SalePolicy / ClientPolicy (double vérification)
 *
 * En production, le frontend ne reçoit que les données de son tenant via l'API.
 */

export const MOCK_USERS = {
  vendeur: {
    id: 1,
    name: 'Moussa Diallo',
    email: 'moussa@phoneshop-dakar.com',
    role: 'vendeur',
    shop: 'Phone Shop Dakar',
    avatar: 'MD',
  },
  client: {
    id: 2,
    name: 'Aminata Ndiaye',
    email: 'aminata@gmail.com',
    role: 'client',
    avatar: 'AN',
  },
}

export const MOCK_CLIENTS = [
  { id: 1, name: 'Aminata Ndiaye', phone: '+221 77 234 56 78', email: 'aminata@gmail.com', city: 'Dakar', created_at: '2026-01-15' },
  { id: 2, name: 'Ibrahima Fall', phone: '+221 76 890 12 34', email: null, city: 'Thiès', created_at: '2026-02-03' },
  { id: 3, name: 'Fatou Sarr', phone: '+221 78 456 78 90', email: 'fatou.sarr@outlook.fr', city: 'Dakar', created_at: '2026-03-20' },
  { id: 4, name: 'Cheikh Mbaye', phone: '+221 70 123 45 67', email: null, city: 'Saint-Louis', created_at: '2026-04-10' },
  { id: 5, name: 'Rokhaya Diop', phone: '+221 77 567 89 01', email: 'rokhaya.diop@gmail.com', city: 'Dakar', created_at: '2026-05-05' },
]

export const MOCK_ARTICLES = [
  { id: 1, name: 'iPhone 15 Pro Max 256Go', category: 'Téléphone', price: 850000 },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', category: 'Téléphone', price: 720000 },
  { id: 3, name: 'Laptop HP Victus 15', category: 'Informatique', price: 550000 },
  { id: 4, name: 'Tablette iPad Air 5', category: 'Tablette', price: 480000 },
  { id: 5, name: 'AirPods Pro 2ème Gen', category: 'Accessoire', price: 185000 },
]

export const MOCK_SALES = [
  {
    id: 1,
    reference: 'VT-2026-0001',
    qr_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    client: MOCK_CLIENTS[0],
    article: MOCK_ARTICLES[0],
    total_amount: 850000,
    down_payment: 200000,
    paid_amount: 450000,
    remaining_amount: 400000,
    installment_count: 6,
    installment_amount: 108334,
    frequency: 'mensuel',
    start_date: '2026-02-01',
    end_date: '2026-08-01',
    status: 'retard',
    payments: [
      { id: 1, amount: 200000, date: '2026-02-01', type: 'acompte', receipt_no: 'RC-001' },
      { id: 2, amount: 108334, date: '2026-03-01', type: 'tranche', receipt_no: 'RC-002' },
      { id: 3, amount: 141666, date: '2026-04-15', type: 'tranche', receipt_no: 'RC-003' },
    ],
    schedule: [
      { num: 1, due_date: '2026-03-01', amount: 108334, status: 'paye', paid_date: '2026-03-01' },
      { num: 2, due_date: '2026-04-01', amount: 108334, status: 'paye', paid_date: '2026-04-15' },
      { num: 3, due_date: '2026-05-01', amount: 108334, status: 'retard', paid_date: null },
      { num: 4, due_date: '2026-06-01', amount: 108334, status: 'en_attente', paid_date: null },
      { num: 5, due_date: '2026-07-01', amount: 108334, status: 'en_attente', paid_date: null },
      { num: 6, due_date: '2026-08-01', amount: 108330, status: 'en_attente', paid_date: null },
    ],
  },
  {
    id: 2,
    reference: 'VT-2026-0002',
    qr_uuid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    client: MOCK_CLIENTS[1],
    article: MOCK_ARTICLES[2],
    total_amount: 550000,
    down_payment: 100000,
    paid_amount: 550000,
    remaining_amount: 0,
    installment_count: 5,
    installment_amount: 90000,
    frequency: 'mensuel',
    start_date: '2026-01-15',
    end_date: '2026-06-15',
    status: 'solde',
    payments: [],
    schedule: [
      { num: 1, due_date: '2026-02-15', amount: 90000, status: 'paye', paid_date: '2026-02-15' },
      { num: 2, due_date: '2026-03-15', amount: 90000, status: 'paye', paid_date: '2026-03-14' },
      { num: 3, due_date: '2026-04-15', amount: 90000, status: 'paye', paid_date: '2026-04-15' },
      { num: 4, due_date: '2026-05-15', amount: 90000, status: 'paye', paid_date: '2026-05-10' },
      { num: 5, due_date: '2026-06-15', amount: 90000, status: 'paye', paid_date: '2026-06-01' },
    ],
  },
  {
    id: 3,
    reference: 'VT-2026-0003',
    qr_uuid: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    client: MOCK_CLIENTS[2],
    article: MOCK_ARTICLES[1],
    total_amount: 720000,
    down_payment: 150000,
    paid_amount: 150000,
    remaining_amount: 570000,
    installment_count: 6,
    installment_amount: 95000,
    frequency: 'mensuel',
    start_date: '2026-06-01',
    end_date: '2026-12-01',
    status: 'actif',
    payments: [
      { id: 1, amount: 150000, date: '2026-06-01', type: 'acompte', receipt_no: 'RC-007' },
    ],
    schedule: [
      { num: 1, due_date: '2026-07-01', amount: 95000, status: 'en_attente', paid_date: null },
      { num: 2, due_date: '2026-08-01', amount: 95000, status: 'en_attente', paid_date: null },
      { num: 3, due_date: '2026-09-01', amount: 95000, status: 'en_attente', paid_date: null },
      { num: 4, due_date: '2026-10-01', amount: 95000, status: 'en_attente', paid_date: null },
      { num: 5, due_date: '2026-11-01', amount: 95000, status: 'en_attente', paid_date: null },
      { num: 6, due_date: '2026-12-01', amount: 95000, status: 'en_attente', paid_date: null },
    ],
  },
  {
    id: 4,
    reference: 'VT-2026-0004',
    qr_uuid: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    client: MOCK_CLIENTS[3],
    article: MOCK_ARTICLES[3],
    total_amount: 480000,
    down_payment: 80000,
    paid_amount: 240000,
    remaining_amount: 240000,
    installment_count: 4,
    installment_amount: 100000,
    frequency: 'mensuel',
    start_date: '2026-03-10',
    end_date: '2026-07-10',
    status: 'retard',
    payments: [],
    schedule: [
      { num: 1, due_date: '2026-04-10', amount: 100000, status: 'paye', paid_date: '2026-04-10' },
      { num: 2, due_date: '2026-05-10', amount: 100000, status: 'paye', paid_date: '2026-05-15' },
      { num: 3, due_date: '2026-06-10', amount: 100000, status: 'retard', paid_date: null },
      { num: 4, due_date: '2026-07-10', amount: 100000, status: 'en_attente', paid_date: null },
    ],
  },
  {
    id: 5,
    reference: 'VT-2026-0005',
    qr_uuid: 'e5f6a7b8-c9d0-1234-efab-567890123456',
    client: MOCK_CLIENTS[4],
    article: MOCK_ARTICLES[4],
    total_amount: 185000,
    down_payment: 50000,
    // BUG2 fix: paid = acompte 50000 + tranche1 45000 = 95000
    paid_amount: 95000,
    remaining_amount: 90000,
    installment_count: 3,
    installment_amount: 45000,
    frequency: 'mensuel',
    start_date: '2026-05-20',
    end_date: '2026-08-20',
    status: 'actif',
    // BUG2 fix: tranche 1 présente dans payments pour cohérence avec schedule
    payments: [
      { id: 1, amount: 50000, date: '2026-05-20', type: 'acompte', receipt_no: 'RC-008', payment_method: 'especes' },
      { id: 2, amount: 45000, date: '2026-06-19', type: 'tranche', receipt_no: 'RC-009', payment_method: 'wave' },
    ],
    schedule: [
      { num: 1, due_date: '2026-06-20', amount: 45000, status: 'paye', paid_date: '2026-06-19' },
      { num: 2, due_date: '2026-07-20', amount: 45000, status: 'en_attente', paid_date: null },
      { num: 3, due_date: '2026-08-20', amount: 45000, status: 'en_attente', paid_date: null },
    ],
  },
]

export const DASHBOARD_STATS = {
  // sum(paid_amounts) = 450000+550000+150000+240000+95000 = 1485000
  total_encaisse: 1485000,
  // sum(remaining_amounts) = 400000+0+570000+240000+90000 = 1300000
  total_restant: 1300000,
  ventes_actives: 3,
  ventes_en_retard: 2,
  ventes_soldees: 1,
  encaisse_ce_mois: 241666,
  monthly_data: [
    { month: 'Fév', encaisse: 308334, objectif: 350000 },
    { month: 'Mar', encaisse: 276668, objectif: 350000 },
    { month: 'Avr', encaisse: 341666, objectif: 350000 },
    { month: 'Mai', encaisse: 220000, objectif: 350000 },
    { month: 'Jun', encaisse: 243332, objectif: 350000 },
    { month: 'Jul', encaisse: 241666, objectif: 350000 },
  ],
}

export function formatAmount(amount) {
  return new Intl.NumberFormat('fr-SN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getProgressPercent(paid, total) {
  if (!total) return 0
  return Math.round((paid / total) * 100)
}

export function getStatusConfig(status) {
  const configs = {
    actif:      { label: 'Actif',      className: 'badge-active',  dot: '#1D4ED8' },
    paye:       { label: 'Payé',       className: 'badge-paid',    dot: '#15803D' },
    retard:     { label: 'Retard',     className: 'badge-late',    dot: '#C2410C' },
    litige:     { label: 'Litige',     className: 'badge-dispute', dot: '#BE123C' },
    solde:      { label: 'Soldé',      className: 'badge-settled', dot: '#475569' },
    en_attente: { label: 'En attente', className: 'badge-pending', dot: '#64748B' },
  }
  return configs[status] || configs['en_attente']
}
