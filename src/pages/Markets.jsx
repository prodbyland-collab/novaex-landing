import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { useLivePrices } from '../lib/useLivePrices';
import { MARKETS, formatUsd, formatNum } from '../lib/markets';
import { executeMarketOrder, createLimitOrder, fetchHoldings, ensureUsdBalance } from '../lib/api';

export default function Markets() {
  const { user } = useAuth();
  const prices = useLivePrices();
  const [holdings, setHoldings] = useState([]);
  const [selected, setSelected] = useState('BTC');
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    await ensureUsdBalance(user.id);
    const data = await fetchHoldings(user.id);
    setHoldings(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const market = MARKETS.find(m => m.symbol === selected);
  const currentPrice = prices[selected]?.price ?? market?.price ?? 0;
  const usdHolding = holdings.find(h => h.symbol === 'USD')?.amount ?? 0;
  const assetHolding = holdings.find(h => h.symbol === selected)?.amount ?? 0;

  const total = orderType === 'market'
    ? (side === 'buy' ? parseFloat(amount) * currentPrice : 0)
    : (side === 'buy' ? parseFloat(amount) * (parseFloat(limitPrice) || 0) : 0);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }

    setLoading(true);
    try {
      if (orderType === 'market') {
        await executeMarketOrder(user.id, selected, side, amt, currentPrice);
        showToast(`${side === 'buy' ? 'Bought' : 'Sold'} ${formatNum(amt)} ${selected} at ${formatUsd(currentPrice)}`, 'success');
      } else {
        const lp = parseFloat(limitPrice);
        if (!lp || lp <= 0) { showToast('Enter a valid limit price', 'error'); setLoading(false); return; }
        await createLimitOrder(user.id, selected, side, amt, lp);
        showToast(`Limit ${side} order placed: ${formatNum(amt)} ${selected} @ ${formatUsd(lp)}`, 'success');
      }
      setAmount('');
      setLimitPrice('');
      await load();
    } catch (err) {
      showToast(err.message || 'Trade failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <h1 className="page-title">Markets</h1>
      <p className="page-sub">Trade spot or set limit orders on live prices.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Markets table */}
        <div className="card">
          <div className="market-table">
            <div className="table-head">
              <span>Asset</span><span>Last price</span><span>24h change</span><span>Market cap</span><span></span>
            </div>
            {MARKETS.map(m => {
              const p = prices[m.symbol];
              const up = (p?.price ?? m.price) >= (p?.prevPrice ?? m.price);
              return (
                <div
                  key={m.symbol}
                  className={`table-row ${selected === m.symbol ? 'flash-up' : ''}`}
                  style={{
                    cursor: 'pointer',
                    background: selected === m.symbol ? 'rgba(193,93,245,0.06)' : 'transparent',
                    borderRadius: selected === m.symbol ? 8 : 0,
                  }}
                  onClick={() => { setSelected(m.symbol); setLimitPrice(''); }}
                >
                  <span className="asset-cell">
                    <b className="asset-icon" style={{ background: m.color }}>{m.icon}</b>
                    <span><span className="asset-name">{m.name}</span><span className="asset-symbol">{m.symbol}</span></span>
                  </span>
                  <span className={up ? 'flash-up' : 'flash-down'} style={{ borderRadius: 4, padding: '2px 4px' }}>{formatUsd(p?.price ?? m.price)}</span>
                  <span className={p?.change >= 0 ? 'gain' : 'loss'}>{p?.change >= 0 ? '+' : ''}{(p?.change ?? m.change).toFixed(2)}%</span>
                  <span className="muted">{m.cap}</span>
                  <span className="badge badge-purple" style={{ justifySelf: 'end' }}>{selected === m.symbol ? 'Selected' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade panel */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <b className="asset-icon" style={{ background: market?.color }}>{market?.icon}</b>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selected} / USD</h3>
            </div>
            <div style={{ font: '24px var(--mono)', fontWeight: 700 }}>{formatUsd(currentPrice)}</div>
          </div>

          <form onSubmit={handleSubmit} className="trade-panel">
            <div className="trade-tabs">
              <button type="button" className={`trade-tab ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</button>
              <button type="button" className={`trade-tab ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</button>
            </div>

            <div className="side-toggle">
              <button type="button" className={`side-btn buy ${side === 'buy' ? 'active' : ''}`} onClick={() => setSide('buy')}>Buy</button>
              <button type="button" className={`side-btn sell ${side === 'sell' ? 'active' : ''}`} onClick={() => setSide('sell')}>Sell</button>
            </div>

            {orderType === 'limit' && (
              <div className="field">
                <label>Limit price (USD)</label>
                <input type="number" step="0.01" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder={currentPrice.toFixed(2)} />
              </div>
            )}

            <div className="field">
              <label>Amount ({selected})</label>
              <input type="number" step="0.0001" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>

            <div className="trade-summary">
              <div><span>Available</span><span>{side === 'buy' ? `${formatUsd(usdHolding)}` : `${formatNum(assetHolding, 6)} ${selected}`}</span></div>
              {orderType === 'market' && <div><span>Current price</span><span>{formatUsd(currentPrice)}</span></div>}
              <div><span>Total</span><span>{formatUsd(total || 0)}</span></div>
            </div>

            <button className={`btn ${side === 'sell' ? 'danger' : ''}`} style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${selected}`}
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
