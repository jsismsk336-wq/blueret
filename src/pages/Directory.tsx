import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { jerseys, teams } from '../data/mockData';

export function Directory() {
  const [filter, setFilter] = useState<string>('all');

  const filteredJerseys = filter === 'all' 
    ? jerseys 
    : jerseys.filter(j => j.teamId === filter);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter mb-6">THE ARCHIVE</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border ${
              filter === 'all' 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
            }`}
          >
            All Teams
          </button>
          {teams.map(team => (
            <button 
              key={team.id}
              onClick={() => setFilter(team.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border ${
                filter === team.id 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredJerseys.map((jersey, idx) => {
          const team = teams.find(t => t.id === jersey.teamId);
          return (
            <motion.div 
              key={jersey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <Link to={`/team/${jersey.teamId}`} className="block relative aspect-[4/5] rounded-2xl overflow-hidden glass-panel mb-4">
                <img 
                  src={jersey.image} 
                  alt={jersey.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white text-sm">Click to view team details</p>
                </div>
              </Link>
              <div>
                <h3 className="text-lg font-bold">{jersey.name}</h3>
                <p className="text-gray-400 text-sm">{team?.name} &bull; {jersey.season}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
