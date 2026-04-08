import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Filter, RefreshCw, ShoppingBag } from 'lucide-react';
import { useStageAuth } from '../context/StageAuthContext';
import { API } from '../config/api';

const selectClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all";

function StatusPill({ status }) {
  if (status === 'sold') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        Sold
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
      Unsold
    </span>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white"
          : "px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      }
      type="button"
    >
      {children}
    </button>
  );
}

const ShopkeeperPackets = ({ onBack }) => {
  const { stageUser } = useStageAuth();

  const shopkeeperId = useMemo(() => stageUser?.username || stageUser?.id || '', [stageUser?.username, stageUser?.id]);

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | sold | unsold

  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingPackets, setLoadingPackets] = useState(false);
  const [markingSold, setMarkingSold] = useState({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [counts, setCounts] = useState({ total: 0, sold: 0, unsold: 0 });
  const [packets, setPackets] = useState([]);

  const loadBatches = async () => {
    setLoadingBatches(true);
    setError('');
    try {
      const res = await API.getAllBatches();
      setBatches(res.data.batches || []);
    } catch (e) {
      setError(e.message || 'Failed to load batches.');
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadPackets = async ({ batchId, status } = {}) => {
    const b = batchId ?? selectedBatch;
    if (!b) return;
    setLoadingPackets(true);
    setError('');
    try {
      const res = await API.getShopkeeperBatchPackets(b, status ?? statusFilter);
      setPackets(res.data.packets || []);
      setCounts(res.data.counts || { total: 0, sold: 0, unsold: 0 });
    } catch (e) {
      setError(e.message || 'Failed to load packets.');
      setPackets([]);
      setCounts({ total: 0, sold: 0, unsold: 0 });
    } finally {
      setLoadingPackets(false);
    }
  };

  useEffect(() => {
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBatch) loadPackets({ batchId: selectedBatch, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, statusFilter]);

  const handleMarkSold = async (packet_id) => {
    if (!selectedBatch) return;
    setSuccess('');
    setError('');

    const ok = window.confirm(`Mark this packet as SOLD?\n\n${packet_id}\n\nThis cannot be undone.`);
    if (!ok) return;

    setMarkingSold((m) => ({ ...m, [packet_id]: true }));
    try {
      const res = await API.markPacketSold(packet_id, shopkeeperId);
      setSuccess(res.data.message || 'Marked as sold.');

      // Optimistic update in list
      setPackets((prev) =>
        prev.map((p) => (p.packet_id === packet_id ? { ...p, is_sold: true, sold_tx_hash: res.data.txHash } : p))
      );
      if (res.data.counts) setCounts(res.data.counts);
    } catch (e) {
      setError(e.message || 'Failed to mark sold.');
    } finally {
      setMarkingSold((m) => ({ ...m, [packet_id]: false }));
      // refresh current filter view (keeps list consistent if we were viewing "unsold")
      await loadPackets({ batchId: selectedBatch, status: statusFilter });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
          )}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Packets Inventory</h1>
              <p className="text-white/90">Select a batch, filter sold/unsold, and mark packets as sold (one-way).</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <ShoppingBag className="text-white" size={20} />
              <div className="text-left">
                <p className="text-xs text-white/80">Shopkeeper</p>
                <p className="text-sm font-semibold text-white">{shopkeeperId || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: controls */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">Batch Selection</h2>
                <button
                  type="button"
                  onClick={loadBatches}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  disabled={loadingBatches}
                >
                  <RefreshCw className={loadingBatches ? "animate-spin" : ""} size={16} />
                  Refresh
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch ID</label>
              <select
                className={selectClass}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={loadingBatches}
              >
                <option value="">{loadingBatches ? 'Loading...' : batches.length ? 'Select Batch' : 'No batches found'}</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-900">{counts.total}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-700">Sold</p>
                  <p className="text-xl font-bold text-green-800">{counts.sold}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs text-yellow-700">Unsold</p>
                  <p className="text-xl font-bold text-yellow-800">{counts.unsold}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-800">
                  <Filter size={16} /> Filter
                </div>
                <div className="flex gap-2 flex-wrap">
                  <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                    All
                  </FilterButton>
                  <FilterButton active={statusFilter === 'unsold'} onClick={() => setStatusFilter('unsold')}>
                    Unsold
                  </FilterButton>
                  <FilterButton active={statusFilter === 'sold'} onClick={() => setStatusFilter('sold')}>
                    Sold
                  </FilterButton>
                </div>
              </div>
            </div>
          </div>

          {/* Right: packets list */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Packets</h2>
                  <p className="text-sm text-gray-500">
                    {selectedBatch ? (
                      <>
                        Showing <span className="font-semibold">{statusFilter}</span> packets for batch{' '}
                        <span className="font-semibold">{selectedBatch}</span>
                      </>
                    ) : (
                      'Select a batch to view packets.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPackets({ batchId: selectedBatch, status: statusFilter })}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={!selectedBatch || loadingPackets}
                >
                  <RefreshCw className={loadingPackets ? "animate-spin" : ""} size={16} />
                  Refresh
                </button>
              </div>

              {!selectedBatch ? (
                <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-6">
                  Select a batch from the left to load packet inventory.
                </div>
              ) : loadingPackets ? (
                <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-6">
                  Loading packets…
                </div>
              ) : packets.length === 0 ? (
                <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-6">
                  No packets found for this batch at the shopkeeper stage (or for this filter).
                </div>
              ) : (
                <div className="space-y-3">
                  {packets.map((p) => {
                    const isSold = Boolean(p.is_sold);
                    const isBusy = Boolean(markingSold[p.packet_id]);
                    return (
                      <div
                        key={p.packet_id}
                        className="flex items-center justify-between gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500">Packet ID</p>
                          <p className="font-semibold text-gray-900 truncate">{p.packet_id}</p>
                          <div className="mt-2">
                            <StatusPill status={isSold ? 'sold' : 'unsold'} />
                          </div>
                          {isSold && p.sold_tx_hash ? (
                            <p className="mt-2 text-xs text-gray-500 break-all">
                              Tx: <span className="font-mono">{p.sold_tx_hash}</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0">
                          {isSold ? (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
                              title="This packet is sold and cannot be reverted."
                            >
                              Sold (locked)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkSold(p.packet_id)}
                              disabled={isBusy || !shopkeeperId}
                              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                              title={!shopkeeperId ? 'Shopkeeper ID missing' : 'Mark as sold'}
                            >
                              {isBusy ? 'Marking…' : 'Mark Sold'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopkeeperPackets;

