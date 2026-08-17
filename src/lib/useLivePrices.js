import { useEffect, useState, useRef } from 'react';
import { MARKETS } from './markets';

// Simulated live price feed: every 2 seconds each asset's price drifts by a
// small random percentage. Returns a map of symbol -> { price, change, prevPrice }.
export function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(
      MARKETS.map(m => [m.symbol, { price: m.price, change: m.change, prevPrice: m.price }])
    )
  );
  const ref = useRef(prices);
  ref.current = prices;

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = {};
        for (const m of MARKETS) {
          const cur = prev[m.symbol] ?? { price: m.price, change: m.change };
          const drift = (Math.random() - 0.48) * 0.004; // slight upward bias
          const newPrice = Math.max(0.01, cur.price * (1 + drift));
          next[m.symbol] = {
            price: newPrice,
            prevPrice: cur.price,
            change: cur.change + drift * 100,
          };
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return prices;
}
