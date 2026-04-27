export const GAMES = [
  'League of Legends',
  'Valorant', 
  'Overwatch',
  'CS:GO',
  'Dota 2',
  'Other'
];

export const SERVICE_TYPES = {
  RANK_BOOST: 'rank_boost',
  PLACEMENT_MATCHES: 'placement_matches',
  COACHING: 'coaching',
  WIN_BOOST: 'win_boost',
  DIVISION_BOOST: 'division_boost'
};

export const RANKS = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
  'Challenger'
];

export const SERVERS = {
  'League of Legends': [
    'NA', 'EUW', 'EUNE', 'LAN', 'LAS', 'BR', 'OCE', 'RU', 'TR', 'JP', 'KR'
  ],
  'Valorant': [
    'NA', 'EU', 'BR', 'LATAM', 'AP', 'KR'
  ],
  'Default': [
    'NA', 'EU', 'Asia', 'Other'
  ]
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_METHODS = [
  'credit_card',
  'paypal',
  'wallet',
  'crypto'
];