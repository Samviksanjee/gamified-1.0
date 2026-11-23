import { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import { api } from '../../api.js';

export default function SystemStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Add superadmin stats endpoint to API
      // const data = await api.superadminStats();
      setStats({
        activeUsers: 0,
        activeTeachers: 0,
        activeStudents: 0,
        systemHealth: 'Healthy',
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="system-stats">
      <div className="stats-grid">
        <StatCard 
          label="Active Users" 
          value={stats?.activeUsers || 0} 
          icon="👤"
        />
        <StatCard 
          label="Active Teachers" 
          value={stats?.activeTeachers || 0} 
          icon="👨‍🏫"
        />
        <StatCard 
          label="Active Students" 
          value={stats?.activeStudents || 0} 
          icon="👨‍🎓"
        />
        <StatCard 
          label="System Status" 
          value={stats?.systemHealth || 'Unknown'} 
          icon="✓"
        />
      </div>
    </div>
  );
}
