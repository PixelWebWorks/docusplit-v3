import React, { useState } from 'react';
import { Search, Loader2, Database, AlertCircle, Calendar, Store, Filter } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface InvoiceRecord {
  invoiceNo: string;
  shipTo: string;
  branchId: string;
  timestamp: string;
  downloadUrl: string;
}

const SearchModule: React.FC = () => {
  const { branchId, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [results, setResults] = useState<InvoiceRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = role === 'admin';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError('');
    setHasSearched(true);
    setResults([]);

    try {
      // Create a query against the collection.
      const invoicesRef = collection(db, "invoices");
      
      // If global search is ON and user is admin, we don't filter by branchId
      const constraints = [];
      if (!isGlobalSearch || !isAdmin) {
        constraints.push(where("branchId", "==", branchId));
      }
      constraints.push(where("invoiceNo", "==", searchTerm.trim()));

      const q = query(invoicesRef, ...constraints);

      const querySnapshot = await getDocs(q);
      const foundInvoices: InvoiceRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateObj = data.timestamp || data.updatedAt;
        foundInvoices.push({
          invoiceNo: data.invoiceNo,
          shipTo: data.shipTo,
          branchId: data.branchId,
          timestamp: dateObj?.toDate()?.toLocaleString() || 'Unknown Date',
          downloadUrl: data.downloadUrl
        });
      });

      setResults(foundInvoices);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || 'Error occurred while connecting to database.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchRecent = async () => {
    setIsSearching(true);
    setError('');
    setHasSearched(true);
    setSearchTerm('');
    
    try {
      const invoicesRef = collection(db, "invoices");
      const constraints = [orderBy("updatedAt", "desc"), limit(10)];
      
      if (!isGlobalSearch || !isAdmin) {
        constraints.unshift(where("branchId", "==", branchId));
      }

      const q = query(invoicesRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const recentInvoices: InvoiceRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateObj = data.timestamp || data.updatedAt;
        recentInvoices.push({
          invoiceNo: data.invoiceNo,
          shipTo: data.shipTo,
          branchId: data.branchId,
          timestamp: dateObj?.toDate()?.toLocaleString() || 'Unknown Date',
          downloadUrl: data.downloadUrl
        });
      });

      setResults(recentInvoices);
    } catch (err: any) {
      console.error("Fetch recent error:", err);
      setError("Cannot fetch recent without creating a composite index in Firestore first! For now, please search by exact Invoice Number.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit mx-auto md:mx-0">
        <Database className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Firestore Connected</span>
      </div>

      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
          <Search className="text-[#f84827]" />
          Audit History & Search
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Look up processed invoices by their unique Ticket ID. All historical audits across your branches are securely stored here.
        </p>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter exact Invoice / Ticket ID (e.g. INV-20593)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
            />
          </div>
          <button 
            type="submit"
            disabled={!searchTerm.trim() || isSearching}
            className="px-8 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search DB'}
          </button>
        </form>

        <div className="mt-4 flex justify-between items-center text-sm">
          <button 
            onClick={handleFetchRecent}
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Show 10 Latest Uploads
          </button>

          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className={`font-bold transition-colors ${isGlobalSearch ? 'text-orange-500' : 'text-slate-500'}`}>
                GLOBAL SEARCH
              </span>
              <div 
                onClick={() => setIsGlobalSearch(!isGlobalSearch)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isGlobalSearch ? 'bg-orange-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isGlobalSearch ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
          )}
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {hasSearched && !isSearching && !error && (
        <section className="glass p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 border border-white/10">
          <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
            Results Found: {results.length}
          </h3>

          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No records match your search criteria.</p>
              <p className="text-xs mt-2 opacity-50">Please verify the Ticket ID and ensure it was successfully uploaded to the cloud.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 border-b border-white/5">
                  <tr>
                    <th className="p-4 text-slate-300">Invoice / Ticket ID</th>
                    <th className="p-4 text-slate-300">Target Store (ShipTo)</th>
                    {isAdmin && isGlobalSearch && <th className="p-4 text-slate-300">Branch</th>}
                    <th className="p-4 text-slate-300 text-center">Processing Date</th>
                    <th className="p-4 text-slate-300 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-medium text-white">{r.invoiceNo}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-slate-400" />
                          {r.shipTo}
                        </div>
                      </td>
                      {isAdmin && isGlobalSearch && (
                        <td className="p-4">
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 font-mono">
                            {r.branchId}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {r.timestamp}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <a 
                          href={r.downloadUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-white/5 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-white/10 hover:border-blue-500/30 rounded-lg transition-all inline-block"
                        >
                          View PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SearchModule;
