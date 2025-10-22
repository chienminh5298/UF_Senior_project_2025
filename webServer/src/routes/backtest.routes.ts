import { Router } from 'express';
import { backtestController } from '../controllers/backtest.controller';

const router = Router();

// GET  /api/backtest/tokens         # Available tokens
router.get('/tokens', (req, res) => backtestController.getAvailableTokens(req, res));

// GET  /api/backtest/strategies     # Available strategies (static list)
router.get('/strategies', (req, res) => backtestController.getAvailableStrategies(req, res));

// POST /api/backtest/execute        # Run backtest
router.post('/execute', (req, res) => backtestController.executeBacktest(req, res));

// GET /api/backtest/candles         # Get candle data for charting
router.get('/candles', (req, res) => backtestController.getCandles(req, res));

export default router;
