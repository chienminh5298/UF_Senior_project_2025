import { Router } from 'express';
import { backtestController } from '../controllers/backtest.controller';

const router = Router();

// GET  /api/backtest/tokens     # Available tokens
// GET  /api/backtest/strategies # Available strategies
// POST /api/backtest/execute    # Run backtest

// Add routes from controller
router.get('/tokens', (req, res) =>
  backtestController.getAvailableTokens(req, res)
);

router.get('/strategies', (req, res) =>
  backtestController.getAvailableStrategies(req, res)
);

// Execute backtest - authentication optional (for public landing page)
router.post('/execute', (req, res) =>
  backtestController.executeBacktest(req, res)
);

export default router;
