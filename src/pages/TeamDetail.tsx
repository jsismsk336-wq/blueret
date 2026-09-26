import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { teams, jerseys } from '../data/mockData';
import { InteractiveLogo } from '../components/shared/InteractiveLogo';

export function TeamDetail() {
  const { teamId } = useParams();
  const team = teams.find(t => t.id === teamId);
  const teamJerseys = jerseys.filter(j => j.teamId === teamId);

  if (!team) {
    return <Navigate to="/jerseys" replace />;
  }

  return (
    <div className="min-h-screen relative pb-24">
      {/* Dynamic Background Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 pointer-events-none z-0"
        style={{ backgroundColor: team.color }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header Section */}
        <div className="grid md:grid-cols-12 gap-12 items-center mb-24">
          <div className="md:col-span-4">
            <InteractiveLogo src={team.logo} alt={team.name} color={team.color} />
          </div>
          <div className="md:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-2" style={{ color: team.color }}>
                {team.league}
              </p>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">{team.name}</h1>
              <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
                {team.description}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Squad Photo Parallax */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full h-[60vh] rounded-3xl overflow-hidden relative mb-24 glass-panel"
        >
          <img 
            src={team.squadPhoto} 
            alt={`${team.name} Squad`} 
            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-12">
            <h2 className="text-4xl font-bold text-white">The Squad</h2>
          </div>
        </motion.div>

        {/* Kits Gallery */}
        <div>
          <h2 className="text-4xl font-bold mb-12">Current Kits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {teamJerseys.map((jersey, idx) => (
              <motion.div 
                key={jersey.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="flex flex-col md:flex-row gap-8 items-center bg-white/5 rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-full md:w-1/2 aspect-[4/5] rounded-xl overflow-hidden">
                  <img 
                    src={jersey.image} 
                    alt={jersey.name} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <p className="text-sm font-bold tracking-widest uppercase mb-2 text-gray-400">{jersey.type} Kit</p>
                  <h3 className="text-3xl font-bold mb-4">{jersey.name}</h3>
                  <p className="text-gray-400 leading-relaxed mb-6">{jersey.description}</p>
                  <button className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
                    View Details (Zoom)
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
