import { useState, useMemo } from 'react';
import { calculateRoiMetrics } from '../helpers/impactHelpers';

export function useImpactCalculator(initialOrders = 40, initialTicket = 22000) {
  const [dailyOrders, setDailyOrders] = useState(initialOrders);
  const [ticketBase, setTicketBase] = useState(initialTicket);
  const [timeframe, setTimeframe] = useState('month'); // 'month' | 'day'

  const math = useMemo(() => {
    return calculateRoiMetrics({ dailyOrders, ticketBase, days: 30 });
  }, [dailyOrders, ticketBase]);

  return {
    dailyOrders,
    setDailyOrders,
    ticketBase,
    setTicketBase,
    timeframe,
    setTimeframe,
    math
  };
}
