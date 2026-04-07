import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import api from '../../services/api';
import { Asset } from '../../types';
import toast from 'react-hot-toast';

export default function MyAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/assets/my');
        setAssets(data);
      } catch { toast.error('Failed to fetch assets'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Assets</h1>
        <p className="text-dark-400 text-sm mt-1">{assets.length} assets assigned to you</p>
      </div>

      {assets.length === 0 ? (
        <div className="text-center text-dark-500 py-16">No assets assigned to you</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(a => (
            <div key={a._id} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{a.name}</h3>
                  <p className="text-dark-400 text-xs capitalize">{a.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-dark-400">
                {a.brand && <p>Brand: <span className="text-dark-300">{a.brand} {a.model}</span></p>}
                {a.serialNumber && <p>S/N: <span className="text-dark-300 font-mono">{a.serialNumber}</span></p>}
                {a.assignedDate && <p>Assigned: <span className="text-dark-300">{new Date(a.assignedDate).toLocaleDateString()}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
