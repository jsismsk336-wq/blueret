import type { Team, Jersey } from '../types';

export const teams: Team[] = [
  {
    id: 'arsenal',
    name: 'Arsenal',
    league: 'Premier League',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    color: '#EF0107',
    description: 'Arsenal Football Club is a professional football club based in Islington, London, England. They are one of the most successful clubs in English football.',
    squadPhoto: 'https://images.unsplash.com/photo-1518605368461-1ee7c5320c78?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    league: 'La Liga',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    color: '#FEBE10',
    description: 'Real Madrid Club de Fútbol, commonly referred to as Real Madrid, is a Spanish professional football club based in Madrid. Known as Los Blancos.',
    squadPhoto: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'milan',
    name: 'AC Milan',
    league: 'Serie A',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    color: '#FB090B',
    description: 'Associazione Calcio Milan, commonly referred to as AC Milan or simply Milan, is a professional football club in Milan, Italy.',
    squadPhoto: 'https://images.unsplash.com/photo-1556816723-1ce827b9efce?q=80&w=2000&auto=format&fit=crop'
  }
];

export const jerseys: Jersey[] = [
  {
    id: 'j1',
    teamId: 'arsenal',
    name: 'Arsenal Home 23/24',
    type: 'Home',
    season: '23/24',
    image: 'https://images.unsplash.com/photo-1614631446501-abcf76949eca?q=80&w=1000&auto=format&fit=crop',
    description: 'A classic red and white design featuring gold details.'
  },
  {
    id: 'j2',
    teamId: 'arsenal',
    name: 'Arsenal Away 23/24',
    type: 'Away',
    season: '23/24',
    image: 'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?q=80&w=1000&auto=format&fit=crop',
    description: 'Fluorescent yellow away kit with striking black lines.'
  },
  {
    id: 'j3',
    teamId: 'real-madrid',
    name: 'Real Madrid Home 23/24',
    type: 'Home',
    season: '23/24',
    image: 'https://images.unsplash.com/photo-1606100224168-b71cb61d9a5b?q=80&w=1000&auto=format&fit=crop',
    description: 'Iconic all-white kit with gold and navy trims.'
  },
  {
    id: 'j4',
    teamId: 'milan',
    name: 'AC Milan Home 23/24',
    type: 'Home',
    season: '23/24',
    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1000&auto=format&fit=crop',
    description: 'Red and black stripes forming an elegant V shape pattern.'
  }
];
