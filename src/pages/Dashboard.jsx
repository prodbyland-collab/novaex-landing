import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLivePrices } from '../lib/useLivePrices';
import { MARKETS, MARKET_MAP, formatUsd, formatNum } from '../lib/markets';
import { fetchHoldings, ensureUsdBalance } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const prices = useLivePrices();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    await ensureUsdBalance(user.id);
    const data = await fetchHoldings(user.id);
    setHoldings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Calculate portfolio value
  const portfolio = holdings.map(h => {
    const market = MARKET_MAP[h.symbol];
    const price = h.symbol === 'USD' ? 1 : (prices[h.symbol]?.price ?? market?.price ?? 0);
    return { ...h, price, value: h.amount * price };
  });
  const totalValue = portfolio.reduce((s, h) => s + h.value, 0);
  const usdBalance = portfolio.find(h => h.symbol === 'USD')?.value ?? 0;
  const cryptoValue = totalValue - usdBalance;

  // Allocation
  const nonZero = portfolio.filter(h => h.value > 0.01);
  const allocColors = { USD: '#52d6a1', BTC: '#ed941e', ETH: '#6179db', SOL: '#58ecbc', XRP: '#3b82f6', ADA: '#0a6cf5', AVAX: '#e84142', DOT: '#e6007a', LINK: '#2a5ada' };

  return (
    <div className="fade-up">
      <h1 className="page-title">Portfolio</h1>
      <p className="page-sub">Your balances and market value at a glance.</p>

      <div className="dash-grid">
        <div className="dash-main">
          {/* Portfolio value card */}
          <div className="portfolio-card">
            <p className="eyebrow">Total portfolio value</p>
            <div className="portfolio-value">{formatUsd(totalValue)}</div>
            <div className="portfolio-change gain">
              + {formatUsd(cryptoValue)} in crypto assets
            </div>

            {/* Allocation bar */}
            {nonZero.length > 0 && (
              <div className="alloc-chart">
                <div className="alloc-bar">
                  {nonZero.map(h => (
                    <div
                      key={h.symbol}
                      style={{
                        width: `${(h.value / totalValue) * 100}%`,
                        background: allocColors[h.symbol] || '#c15df5',
                      }}
                    />
                  ))}
                </div>
                <div className="alloc-legend">
                  {nonZero.map(h => (
                    <div key={h.symbol}>
                      <i style={{ background: allocColors[h.symbol] || '#c15df5' }}></i>
                      {h.symbol} — {((h.value / totalValue) * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Holdings table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Your holdings</h3>
              <Link className="text-link" to="/app/markets">Trade →</Link>
            </div>
            {loading ? (
              <p className="muted">Loading...</p>
            ) : nonZero.length === 0 ? (
              <div className="empty-state">
                <span>📊</span>
                <p>No holdings yet. Start trading to build your portfolio.</p>
                <Link className="btn small" to="/app/markets" style={{ marginTop: 16 }}>Go to Markets</Link>
              </div>
            ) : (
              nonZero.map(h => (
                <div key={h.symbol} className="holding-row">
                  <div className="holding-left">
                    <b className="asset-icon" style={{ background: allocColors[h.symbol] || '#c15df5', fontSize: h.symbol === 'USD' ? 11 : 16 }}>
                      {h.symbol === 'USD' ? '$' : (MARKET_MAP[h.symbol]?.icon || h.symbol[0])}
                    </b>
                    <div>
                      <strong style={{ fontSize: 14 }}>{MARKET_MAP[h.symbol]?.name || 'US Dollar'}</strong>
                      <div className="muted-2" style={{ fontSize: 11 }}>{h.symbol}</div>
                    </div>
                  </div>
                  <div className="holding-amount">
                    <strong>{formatNum(h.amount, h.symbol === 'USD' ? 2 : 6)} {h.symbol}</strong>
                    <small>{formatUsd(h.value)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="dash-side">
          <div className="card-2">
            <p className="eyebrow" style={{ marginBottom: 14 }}>Available cash</p>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>{formatUsd(usdBalance)}</div>
            <Link className="btn small" to="/app/markets" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>Trade now</Link>
          </div>

          <div className="card-2">
            <p className="eyebrow" style={{ marginBottom: 14 }}>Quick actions</p>
            <div className="quick-actions">
              <Link className="quick-action" to="/app/markets">
                <span>↗</span>
                <strong>Spot trade</strong>
                <small>Buy or sell instantly</small>
              </Link>
              <Link className="quick-action" to="/app/orders">
                <span>⏱</span>
                <strong>Limit order</strong>
                <small>Set your price</small>
              </Link>
              <Link className="quick-action" to="/app/recurring">
                <span>↻</span>
                <strong>Recurring</strong>
                <small>Automate buys</small>
              </Link>
              <Link className="quick-action" to="/app/security">
                <span>🛡</span>
                <strong>Security</strong>
                <small>Review settings</small>
              </Link>
            </div>
          </div>

          {/* Watchlist */}
          <div className="card-2">
            <p className="eyebrow" style={{ marginBottom: 14 }}>Watchlist</p>
            {MARKETS.slice(0, 4).map(m => {
              const p = prices[m.symbol];
              const up = (p?.price ?? m.price) >= (p?.prevPrice ?? m.price);
              return (
                <div key={m.symbol} className="holding-row">
                  <div className="holding-left">
                    <b className="asset-icon" style={{ background: m.color, fontSize: 14 }}>{m.icon}</b>
                    <strong style={{ fontSize: 13 }}>{m.symbol}</strong>
                  </div>
                  <div className="holding-amount">
                    <strong className={up ? 'gain' : 'loss'}>{formatUsd(p?.price ?? m.price)}</strong>
                    <small className={p?.change >= 0 ? 'gain' : 'loss'}>{p?.change >= 0 ? '+' : ''}{(p?.change ?? m.change).toFixed(2)}%</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
