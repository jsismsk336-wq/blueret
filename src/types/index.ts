export interface Team {
  id: string;
  name: string;
  league: string;
  logo: string;
  color: string; // Theme color (hex)
  description: string;
  squadPhoto: string;
}

export interface Jersey {
  id: string;
  teamId: string;
  name: string; // e.g., "Arsenal Home 23/24"
  type: 'Home' | 'Away' | 'Third' | 'Special';
  season: string;
  image: string;
  description: string;
}
