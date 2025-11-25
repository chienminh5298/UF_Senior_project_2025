"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.hash(password, 12);
    });
}
// ------------------------
// Helpers
// ------------------------
function calcGross(side, entry, exit, qty) {
    // BUY: profit if exit > entry; SELL: profit if exit < entry
    return side === client_1.Side.BUY
        ? (exit - entry) * qty
        : (entry - exit) * qty;
}
function calcNet(side, entry, exit, qty, fee = 0) {
    const gross = calcGross(side, entry, exit, qty);
    const net = gross - (fee !== null && fee !== void 0 ? fee : 0);
    // round to 2dp like the rest of your app
    return Math.round(net * 100) / 100;
}
function within(d, start, end) {
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}
function iso(d) {
    return d.toISOString();
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        console.log('Starting database seeding...');
        try {
            yield prisma.$connect();
            console.log('Database connection established');
            // Clean in FK-safe order
            console.log('Cleaning existing data...');
            yield prisma.order.deleteMany();
            yield prisma.bill.deleteMany();
            yield prisma.userToken.deleteMany();
            yield prisma.voucher.deleteMany();
            yield prisma.claim.deleteMany();
            yield prisma.tokenStrategy.deleteMany();
            yield prisma.target.deleteMany();
            yield prisma.strategy.deleteMany();
            yield prisma.token.deleteMany();
            yield prisma.user.deleteMany();
            console.log('Existing data cleaned successfully');
            // ------------------------
            // Tokens
            // ------------------------
            // Using short names (BTC, ETH, SOL) to match original db.sql structure
            // This ensures compatibility with backtesting API and historical data files
            const tokens = yield Promise.all([
                prisma.token.create({ data: { name: 'BTC', stable: 'USDT', minQty: 0.002, isActive: true, leverage: 2 } }),
                prisma.token.create({ data: { name: 'ETH', stable: 'USDT', minQty: 0.01, isActive: true, leverage: 2 } }),
                prisma.token.create({ data: { name: 'SOL', stable: 'USDT', minQty: 0.03, isActive: true, leverage: 1 } }),
                prisma.token.create({ data: { name: 'ADA', stable: 'USDT', minQty: 1, isActive: true, leverage: 2 } }),
                prisma.token.create({ data: { name: 'MATIC', stable: 'USDT', minQty: 10, isActive: true, leverage: 2 } }),
                prisma.token.create({ data: { name: 'LINK', stable: 'USDT', minQty: 1, isActive: false, leverage: 1 } }),
            ]);
            const [BTC, ETH, SOL, ADA, MATIC, LINK] = tokens;
            console.log(`Created ${tokens.length} tokens`);
            // ------------------------
            // Users
            // ------------------------
            const user1 = yield prisma.user.create({
                data: {
                    fullname: 'John Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: yield hashPassword('password123'),
                    adminCommissionPercent: 0.3,
                    referralCommissionPercent: 0,
                    adminInsurance: 0,
                    referralInsurance: 0,
                    insurancePercent: 0,
                    profit: 3500,
                    isActive: true,
                    isVerified: true,
                    avatar: 1,
                    apiKey: 'api_key_john_001',
                    apiSecret: 'api_secret_john_001',
                    apiPassphrase: null,
                    referralUserId: null,
                    referralCode: 'REF-JOHN-001',
                    tradeBalance: 15000,
                    telegramChatId: '123456789',
                },
            });
            const user2 = yield prisma.user.create({
                data: {
                    fullname: 'Jane Smith',
                    username: 'janesmith',
                    email: 'jane@example.com',
                    password: yield hashPassword('password123'),
                    adminCommissionPercent: 0.3,
                    referralCommissionPercent: 0,
                    adminInsurance: 0,
                    referralInsurance: 0,
                    insurancePercent: 0,
                    profit: -800,
                    isActive: true,
                    isVerified: true,
                    avatar: 2,
                    apiKey: 'api_key_jane_002',
                    apiSecret: 'api_secret_jane_002',
                    apiPassphrase: null,
                    referralUserId: null,
                    referralCode: 'REF-JANE-002',
                    tradeBalance: 8000,
                    telegramChatId: '987654321',
                },
            });
            const user3 = yield prisma.user.create({
                data: {
                    fullname: 'Bob Johnson',
                    username: 'bobjohnson',
                    email: 'bob@example.com',
                    password: yield hashPassword('password123'),
                    adminCommissionPercent: 0.3,
                    referralCommissionPercent: 0,
                    adminInsurance: 0,
                    referralInsurance: 0,
                    insurancePercent: 0,
                    profit: 1200,
                    isActive: false,
                    isVerified: false,
                    avatar: 3,
                    apiKey: 'api_key_bob_003',
                    apiSecret: 'api_secret_bob_003',
                    apiPassphrase: null,
                    referralUserId: null,
                    referralCode: 'REF-BOB-003',
                    tradeBalance: 6000,
                    telegramChatId: null,
                },
            });
            const user4 = yield prisma.user.create({
                data: {
                    fullname: 'Alice Williams',
                    username: 'alicewilliams',
                    email: 'alice@example.com',
                    password: yield hashPassword('password123'),
                    adminCommissionPercent: 0.3,
                    referralCommissionPercent: 0,
                    adminInsurance: 0,
                    referralInsurance: 0,
                    insurancePercent: 0,
                    profit: 5200,
                    isActive: true,
                    isVerified: true,
                    avatar: 4,
                    apiKey: 'api_key_alice_004',
                    apiSecret: 'api_secret_alice_004',
                    apiPassphrase: null,
                    referralUserId: null,
                    referralCode: 'REF-ALICE-004',
                    tradeBalance: 20000,
                    telegramChatId: '555123456',
                },
            });
            const user5 = yield prisma.user.create({
                data: {
                    fullname: 'Charlie Brown',
                    username: 'charliebrown',
                    email: 'charlie@example.com',
                    password: yield hashPassword('password123'),
                    adminCommissionPercent: 0.3,
                    referralCommissionPercent: 0,
                    adminInsurance: 0,
                    referralInsurance: 0,
                    insurancePercent: 0,
                    profit: -1200,
                    isActive: true,
                    isVerified: true,
                    avatar: 5,
                    apiKey: 'api_key_charlie_005',
                    apiSecret: 'api_secret_charlie_005',
                    apiPassphrase: null,
                    referralUserId: null,
                    referralCode: 'REF-CHARLIE-005',
                    tradeBalance: 3000,
                    telegramChatId: null,
                },
            });
            yield prisma.user.update({ where: { id: user3.id }, data: { referralUserId: user1.id } });
            yield prisma.user.update({ where: { id: user4.id }, data: { referralUserId: user1.id } });
            yield prisma.user.update({ where: { id: user5.id }, data: { referralUserId: user2.id } });
            const users = [user1, user2, user3, user4, user5];
            console.log(`Created ${users.length} users`);
            // ------------------------
            // Strategies + Targets + TokenStrategy
            // ------------------------
            // Create multiple strategies for backtesting comparison
            // Strategy 1: Original from db.sql - Main strategy
            // Strategy 2: Original from db.sql - Trigger (child of 1)
            // Strategy 3: Tight Scalping Main
            // Strategy 4: Tight Scalping Trigger (child of 3)
            // Strategy 5-7: Legacy swing/trend strategies
            const strategies = yield Promise.all([
                // Original strategies from db.sql
                prisma.strategy.create({
                    data: {
                        description: '', // Original main strategy
                        contribution: 100,
                        isActive: true,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.OPPOSITE,
                    },
                }),
                prisma.strategy.create({
                    data: {
                        description: 'trigger', // Original trigger strategy
                        contribution: 100,
                        isActive: true,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.OPPOSITE,
                        parentStrategy: 1, // child of strategy 1
                    },
                }),
                // New scalping strategies with tighter stops
                prisma.strategy.create({
                    data: {
                        description: 'Tight Scalping',
                        contribution: 100,
                        isActive: true,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.SAME,
                    },
                }),
                prisma.strategy.create({
                    data: {
                        description: 'Tight Scalping Trigger',
                        contribution: 100,
                        isActive: true,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.OPPOSITE,
                        parentStrategy: 3, // child of strategy 3
                    },
                }),
                // Legacy quick scalping strategy
                prisma.strategy.create({
                    data: {
                        description: 'Scalping Strategy - quick moves',
                        contribution: 1000,
                        isActive: true,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.SAME,
                    },
                }),
                prisma.strategy.create({
                    data: {
                        description: 'Swing Trading - medium term',
                        contribution: 2500,
                        isActive: true,
                        isCloseBeforeNewCandle: true,
                        direction: client_1.DirectionType.OPPOSITE,
                    },
                }),
                prisma.strategy.create({
                    data: {
                        description: 'Trend Following - long term',
                        contribution: 5000,
                        isActive: false,
                        isCloseBeforeNewCandle: false,
                        direction: client_1.DirectionType.SAME,
                    },
                }),
            ]);
            const [mainStrategy, triggerStrategy, scalpingStrategy, scalpingTrigger, legacyQuickScalp, swingStrategy, trendStrategy,] = strategies;
            const targets = yield Promise.all([
                // ========== ORIGINAL STRATEGY (Strategy 1 & 2) - From db.sql ==========
                // SOL targets for original main strategy
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -1.85,
                        tokenId: SOL.id,
                        strategyId: mainStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 0.6,
                        stoplossPercent: 0.6,
                        tokenId: SOL.id,
                        strategyId: mainStrategy.id,
                    },
                }),
                // SOL targets for original trigger strategy
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -1.5,
                        tokenId: SOL.id,
                        strategyId: triggerStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 3,
                        stoplossPercent: 3,
                        tokenId: SOL.id,
                        strategyId: triggerStrategy.id,
                    },
                }),
                // ========== TIGHT SCALPING STRATEGY (Strategy 3 & 4) ==========
                // BTC - Tight scalping strategy (more frequent trades)
                // Main strategy: tight 0.4% target, -0.5% stop
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.35,
                        tokenId: BTC.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 0.7,
                        stoplossPercent: 0.7,
                        tokenId: BTC.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                // Trigger: slightly wider 1.2% target
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.5,
                        tokenId: BTC.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 1.2,
                        stoplossPercent: 1.2,
                        tokenId: BTC.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                // ETH - Slightly more aggressive than BTC
                // Main strategy: 0.5% target, -0.6% stop
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.45,
                        tokenId: ETH.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 0.8,
                        stoplossPercent: 0.8,
                        tokenId: ETH.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                // Trigger: 1.3% target
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.6,
                        tokenId: ETH.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 1.3,
                        stoplossPercent: 1.3,
                        tokenId: ETH.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                // SOL - Most aggressive (highest volatility)
                // Main strategy: 0.6% target, -0.8% stop
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.55,
                        tokenId: SOL.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 1.0,
                        stoplossPercent: 1.0,
                        tokenId: SOL.id,
                        strategyId: scalpingStrategy.id,
                    },
                }),
                // Trigger: 1.6% target
                prisma.target.create({
                    data: {
                        targetPercent: 0,
                        stoplossPercent: -0.8,
                        tokenId: SOL.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 1.6,
                        stoplossPercent: 1.6,
                        tokenId: SOL.id,
                        strategyId: scalpingTrigger.id,
                    },
                }),
                // ========== Legacy Strategies (Strategy 5-7) ==========
                prisma.target.create({
                    data: {
                        targetPercent: 2.5,
                        stoplossPercent: -1.0,
                        tokenId: BTC.id,
                        strategyId: legacyQuickScalp.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 3.0,
                        stoplossPercent: -1.5,
                        tokenId: ETH.id,
                        strategyId: legacyQuickScalp.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 4.0,
                        stoplossPercent: -2.0,
                        tokenId: SOL.id,
                        strategyId: legacyQuickScalp.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 5.0,
                        stoplossPercent: -2.0,
                        tokenId: ETH.id,
                        strategyId: swingStrategy.id,
                    },
                }),
                prisma.target.create({
                    data: {
                        targetPercent: 10.0,
                        stoplossPercent: -4.0,
                        tokenId: BTC.id,
                        strategyId: trendStrategy.id,
                    },
                }),
            ]);
            yield Promise.all([
                // Original strategy (1 & 2) - SOL only
                prisma.tokenStrategy.create({
                    data: { tokenId: SOL.id, strategyId: mainStrategy.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: SOL.id, strategyId: triggerStrategy.id },
                }),
                // Scalping strategy (3 & 4) - BTC, ETH, SOL
                prisma.tokenStrategy.create({
                    data: { tokenId: BTC.id, strategyId: scalpingStrategy.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: BTC.id, strategyId: scalpingTrigger.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: ETH.id, strategyId: scalpingStrategy.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: ETH.id, strategyId: scalpingTrigger.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: SOL.id, strategyId: scalpingStrategy.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: SOL.id, strategyId: scalpingTrigger.id },
                }),
                // Legacy strategies connections
                prisma.tokenStrategy.create({
                    data: { tokenId: BTC.id, strategyId: legacyQuickScalp.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: ETH.id, strategyId: legacyQuickScalp.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: SOL.id, strategyId: legacyQuickScalp.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: ETH.id, strategyId: swingStrategy.id },
                }),
                prisma.tokenStrategy.create({
                    data: { tokenId: BTC.id, strategyId: trendStrategy.id },
                }),
            ]);
            console.log(`Created ${strategies.length} strategies (Original + Tight Scalping + Legacy), ${targets.length} targets, and token-strategy connections`);
            // ------------------------
            // UserToken
            // ------------------------
            yield Promise.all([
                prisma.userToken.create({ data: { userId: user1.id, tokenId: BTC.id } }),
                prisma.userToken.create({ data: { userId: user1.id, tokenId: ETH.id } }),
                prisma.userToken.create({ data: { userId: user1.id, tokenId: SOL.id } }),
                prisma.userToken.create({ data: { userId: user2.id, tokenId: BTC.id } }),
                prisma.userToken.create({ data: { userId: user2.id, tokenId: ADA.id } }),
                prisma.userToken.create({ data: { userId: user3.id, tokenId: ETH.id } }),
                prisma.userToken.create({ data: { userId: user3.id, tokenId: MATIC.id } }),
                prisma.userToken.create({ data: { userId: user4.id, tokenId: BTC.id } }),
                prisma.userToken.create({ data: { userId: user4.id, tokenId: ETH.id } }),
                prisma.userToken.create({ data: { userId: user4.id, tokenId: ADA.id } }),
                prisma.userToken.create({ data: { userId: user4.id, tokenId: SOL.id } }),
                prisma.userToken.create({ data: { userId: user5.id, tokenId: MATIC.id } }),
            ]);
            console.log('Created userToken connections');
            // ------------------------
            // Orders
            // ------------------------
            // Times
            const now = new Date();
            const t_2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const t_1h = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            const t_30m = new Date(now.getTime() - 30 * 60 * 1000);
            // Finished order sell dates
            const sd_7d = daysAgo(7);
            const sd_6d = daysAgo(6);
            const sd_4d = daysAgo(4);
            const sd_3d = daysAgo(3);
            const sd_2d = daysAgo(2);
            const sd_1d = daysAgo(1);
            // ACTIVE
            const o1 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-001-BTC-BUY-ACTIVE',
                    side: client_1.Side.BUY,
                    timestamp: iso(t_2h),
                    entryPrice: 45000,
                    qty: 0.1,
                    budget: 4500,
                    status: client_1.Status.ACTIVE,
                    markPrice: 45150, // current mark
                    netProfit: 0, // not realized
                    strategyId: strategies[0].id,
                    currentTargetId: targets[0].id,
                    tokenId: BTC.id,
                    fee: 4.5,
                    stoplossOrderId: 'STOP-001-BTC',
                    leverage: 3,
                    userId: user1.id,
                },
            });
            const o2 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-002-ETH-SELL-ACTIVE',
                    side: client_1.Side.SELL,
                    timestamp: iso(t_1h),
                    entryPrice: 3200,
                    qty: 2.0,
                    budget: 6400,
                    status: client_1.Status.ACTIVE,
                    markPrice: 3240,
                    netProfit: 0,
                    strategyId: strategies[1].id,
                    currentTargetId: targets[3].id,
                    tokenId: ETH.id,
                    fee: 6.4,
                    stoplossOrderId: 'STOP-002-ETH',
                    leverage: 2,
                    userId: user2.id,
                },
            });
            const o3 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-003-SOL-BUY-ACTIVE',
                    side: client_1.Side.BUY,
                    timestamp: iso(t_30m),
                    entryPrice: 95,
                    qty: 10,
                    budget: 950,
                    status: client_1.Status.ACTIVE,
                    markPrice: 97.5,
                    netProfit: 0,
                    strategyId: strategies[0].id,
                    currentTargetId: targets[2].id,
                    tokenId: SOL.id,
                    fee: 0.95,
                    leverage: 5,
                    userId: user1.id,
                },
            });
            // FINISHED — use consistent netProfit based on entry/exit and fee
            // ORD-004 (BUY, profit)
            const o4_exit = 0.495;
            const o4_net = calcNet(client_1.Side.BUY, 0.45, o4_exit, 1000, 0.45);
            const o4 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-004-ADA-BUY-FINISHED',
                    side: client_1.Side.BUY,
                    timestamp: iso(daysAgo(5)),
                    entryPrice: 0.45,
                    qty: 1000,
                    budget: 450,
                    status: client_1.Status.FINISHED,
                    netProfit: o4_net, // 44.55
                    markPrice: o4_exit,
                    strategyId: strategies[0].id,
                    currentTargetId: targets[1].id,
                    tokenId: ADA.id,
                    fee: 0.45,
                    leverage: 2,
                    userId: user3.id, // Bob
                    sellDate: sd_4d,
                },
            });
            // ORD-005 (SELL, small profit)
            const o5_exit = 42750; // short: profit (43000 - 42750) * 0.05 = 12.5
            const o5_net = calcNet(client_1.Side.SELL, 43000, o5_exit, 0.05, 2.15); // 10.35
            const o5 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-005-BTC-SELL-FINISHED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(8)),
                    entryPrice: 43000,
                    qty: 0.05,
                    budget: 2150,
                    status: client_1.Status.FINISHED,
                    netProfit: o5_net,
                    markPrice: o5_exit,
                    strategyId: strategies[0].id,
                    currentTargetId: targets[0].id,
                    tokenId: BTC.id,
                    fee: 2.15,
                    leverage: 3,
                    userId: user1.id, // John
                    sellDate: sd_6d,
                },
            });
            // ORD-006 (BUY, profit)
            const o6_exit = 3220;
            const o6_net = calcNet(client_1.Side.BUY, 3100, o6_exit, 1.5, 4.65); // 175.35
            const o6 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-006-ETH-BUY-FINISHED',
                    side: client_1.Side.BUY,
                    timestamp: iso(daysAgo(3)),
                    entryPrice: 3100,
                    qty: 1.5,
                    budget: 4650,
                    status: client_1.Status.FINISHED,
                    netProfit: o6_net,
                    markPrice: o6_exit,
                    strategyId: strategies[1].id,
                    currentTargetId: targets[3].id,
                    tokenId: ETH.id,
                    fee: 4.65,
                    leverage: 2,
                    userId: user2.id, // Jane
                    sellDate: sd_2d,
                },
            });
            // ORD-007 (BUY, profit)
            const o7_exit = 93;
            const o7_net = calcNet(client_1.Side.BUY, 88, o7_exit, 15, 1.32); // 73.68
            const o7 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-007-SOL-BUY-FINISHED',
                    side: client_1.Side.BUY,
                    timestamp: iso(daysAgo(5)),
                    entryPrice: 88,
                    qty: 15,
                    budget: 1320,
                    status: client_1.Status.FINISHED,
                    netProfit: o7_net,
                    markPrice: o7_exit,
                    strategyId: strategies[0].id,
                    currentTargetId: targets[2].id,
                    tokenId: SOL.id,
                    fee: 1.32,
                    leverage: 5,
                    userId: user4.id, // Alice (matches later bill)
                    sellDate: sd_1d, // within last 3 days for an example bill window
                },
            });
            // ORD-008 (BUY, profit)
            const o8_exit = 44100;
            const o8_net = calcNet(client_1.Side.BUY, 42000, o8_exit, 0.08, 3.36); // 164.64
            const o8 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-008-BTC-BUY-FINISHED',
                    side: client_1.Side.BUY,
                    timestamp: iso(daysAgo(8)),
                    entryPrice: 42000,
                    qty: 0.08,
                    budget: 3360,
                    status: client_1.Status.FINISHED,
                    netProfit: o8_net,
                    markPrice: o8_exit,
                    strategyId: strategies[0].id,
                    currentTargetId: targets[1].id,
                    tokenId: BTC.id,
                    fee: 3.36,
                    leverage: 3,
                    userId: user2.id, // Jane
                    sellDate: sd_6d,
                },
            });
            // ORD-009 (SELL, profit)
            const o9_exit = 0.38; // short: profit (0.42 - 0.38) * 800 = 32
            const o9_net = calcNet(client_1.Side.SELL, 0.42, o9_exit, 800, 0.336); // 31.66
            const o9 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-009-ADA-SELL-FINISHED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(10)),
                    entryPrice: 0.42,
                    qty: 800,
                    budget: 336,
                    status: client_1.Status.FINISHED,
                    netProfit: o9_net,
                    markPrice: o9_exit,
                    strategyId: strategies[1].id,
                    currentTargetId: targets[3].id,
                    tokenId: ADA.id,
                    fee: 0.336,
                    leverage: 1,
                    userId: user4.id, // Alice
                    sellDate: sd_7d,
                },
            });
            // EXPIRED (not billed)
            const o10 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-010-SOL-SELL-EXPIRED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(4)),
                    entryPrice: 95,
                    qty: 10,
                    budget: 950,
                    status: client_1.Status.EXPIRED,
                    netProfit: -25,
                    markPrice: 97.5,
                    strategyId: strategies[0].id,
                    tokenId: SOL.id,
                    fee: 0.95,
                    leverage: 5,
                    userId: user4.id,
                },
            });
            const o11 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-011-MATIC-SELL-EXPIRED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(6)),
                    entryPrice: 0.85,
                    qty: 200,
                    budget: 170,
                    status: client_1.Status.EXPIRED,
                    netProfit: -8.5,
                    markPrice: 0.89,
                    strategyId: strategies[1].id,
                    tokenId: MATIC.id,
                    fee: 0.17,
                    leverage: 2,
                    userId: user1.id,
                },
            });
            const o12 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-012-ETH-SELL-EXPIRED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(8)),
                    entryPrice: 3000,
                    qty: 2.5,
                    budget: 7500,
                    status: client_1.Status.EXPIRED,
                    netProfit: -150,
                    markPrice: 3060,
                    strategyId: strategies[0].id,
                    tokenId: ETH.id,
                    fee: 7.5,
                    leverage: 2,
                    userId: user3.id,
                },
            });
            const o13 = yield prisma.order.create({
                data: {
                    orderId: 'ORD-013-ADA-SELL-EXPIRED',
                    side: client_1.Side.SELL,
                    timestamp: iso(daysAgo(4)),
                    entryPrice: 0.48,
                    qty: 500,
                    budget: 240,
                    status: client_1.Status.EXPIRED,
                    netProfit: -12,
                    markPrice: 0.456,
                    strategyId: strategies[1].id,
                    tokenId: ADA.id,
                    fee: 0.24,
                    leverage: 1,
                    userId: user3.id,
                },
            });
            const orders = [o1, o2, o3, o4, o5, o6, o7, o8, o9, o10, o11, o12, o13];
            console.log(`Created ${orders.length} orders`);
            // ------------------------
            // Claims
            // ------------------------
            const claims = yield Promise.all([
                prisma.claim.create({
                    data: {
                        status: client_1.ClaimStatus.NEW,
                        amount: 0,
                        userId: user1.id,
                        hashId: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
                        network: client_1.Network.ERC20,
                        address: '0x742d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
                    },
                }),
                prisma.claim.create({
                    data: {
                        status: client_1.ClaimStatus.FINISHED,
                        amount: 0,
                        userId: user2.id,
                        hashId: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234',
                        network: client_1.Network.BEP20,
                        address: '0x8f3d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
                    },
                }),
                prisma.claim.create({
                    data: {
                        status: client_1.ClaimStatus.FINISHED,
                        amount: 0,
                        userId: user3.id,
                        hashId: '0x3c4d5e6f7890abcdef1234567890abcdef123456',
                        network: client_1.Network.ERC20,
                        address: '0x9a4d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
                    },
                }),
                prisma.claim.create({
                    data: {
                        status: client_1.ClaimStatus.NEW,
                        amount: 0,
                        userId: user4.id,
                        network: client_1.Network.BEP20,
                        address: '0x1b5d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
                    },
                }),
                prisma.claim.create({
                    data: {
                        status: client_1.ClaimStatus.NEW,
                        amount: 0,
                        userId: user1.id,
                        network: client_1.Network.ERC20,
                        address: '0x2c6d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
                    },
                }),
            ]);
            console.log(`Created ${claims.length} claims`);
            // ------------------------
            // Bills (Derived, consistent)
            // We’ll create one bill per FINISHED order, windowed around sellDate,
            // correct user, and netProfit = sum(orders in window).
            // ------------------------
            const finishedOrders = orders.filter(o => o.status === client_1.Status.FINISHED);
            // map each user to a claim (prefer an existing claim for that user)
            const claimByUser = {};
            for (const c of claims) {
                if (c.userId && !claimByUser[c.userId]) {
                    claimByUser[c.userId] = c.id;
                }
            }
            const billsCreated = [];
            for (const fo of finishedOrders) {
                // make a 3-day window that includes the sellDate
                const sellDate = (_a = fo.sellDate) !== null && _a !== void 0 ? _a : daysAgo(0);
                const from = new Date(sellDate.getTime() - 2 * 24 * 60 * 60 * 1000);
                const to = new Date(sellDate.getTime() + 1 * 24 * 60 * 60 * 1000);
                // eligible orders for this bill (same user, FINISHED, sellDate within [from,to])
                const eligible = finishedOrders.filter(o => o.userId === fo.userId &&
                    o.sellDate &&
                    within(o.sellDate, from, to));
                const netSum = eligible.reduce((s, o) => { var _a; return s + ((_a = o.netProfit) !== null && _a !== void 0 ? _a : 0); }, 0);
                const adminPct = Math.round(((_c = (_b = users.find(u => u.id === fo.userId)) === null || _b === void 0 ? void 0 : _b.adminCommissionPercent) !== null && _c !== void 0 ? _c : 0) * 100);
                const referPct = Math.round(((_e = (_d = users.find(u => u.id === fo.userId)) === null || _d === void 0 ? void 0 : _d.referralCommissionPercent) !== null && _e !== void 0 ? _e : 0) * 100);
                const bill = yield prisma.bill.create({
                    data: {
                        adminCommissionPercent: adminPct, // e.g., 30
                        referralCommissionPercent: referPct, // e.g., 0
                        status: client_1.BillStatus.NEW,
                        userId: fo.userId,
                        from,
                        to,
                        note: `Bill for orders closed between ${from.toDateString()} and ${to.toDateString()}`,
                        netProfit: Math.round(netSum * 100) / 100,
                        claimId: claimByUser[fo.userId], // attach to a claim for that user
                        orders: {
                            connect: eligible.map(o => ({ id: o.id })),
                        },
                    },
                });
                billsCreated.push(bill);
            }
            console.log(`Created ${billsCreated.length} bills`);
            // ------------------------
            // Recompute claim amounts from their bills
            // ------------------------
            const claimsToUpdate = yield prisma.claim.findMany({
                include: { bills: true },
            });
            for (const c of claimsToUpdate) {
                const amount = ((_f = c.bills) !== null && _f !== void 0 ? _f : []).reduce((s, b) => { var _a; return s + ((_a = b.netProfit) !== null && _a !== void 0 ? _a : 0); }, 0);
                yield prisma.claim.update({
                    where: { id: c.id },
                    data: { amount: Math.round(amount * 100) / 100 },
                });
            }
            console.log('Claim amounts updated');
            // ------------------------
            // Vouchers
            // ------------------------
            yield Promise.all([
                prisma.voucher.create({
                    data: {
                        code: 'WELCOME100',
                        description: 'Welcome bonus for new users',
                        type: 'BONUS',
                        value: 100,
                        activeDate: new Date(),
                        effectDate: new Date(),
                        expireDate: daysAgo(-30),
                        status: client_1.VoucherStatus.unused,
                        userId: user1.id,
                    },
                }),
                prisma.voucher.create({
                    data: {
                        code: 'TRADE50',
                        description: 'Trading bonus voucher',
                        type: 'TRADING',
                        value: 50,
                        activeDate: new Date(),
                        effectDate: new Date(),
                        expireDate: daysAgo(-15),
                        status: client_1.VoucherStatus.inuse,
                        userId: user2.id,
                    },
                }),
                prisma.voucher.create({
                    data: {
                        code: 'EXPIRED25',
                        description: 'Expired voucher for testing',
                        type: 'BONUS',
                        value: 25,
                        activeDate: daysAgo(60),
                        effectDate: daysAgo(60),
                        expireDate: daysAgo(30),
                        status: client_1.VoucherStatus.expired,
                        userId: user3.id,
                    },
                }),
                prisma.voucher.create({
                    data: {
                        code: 'BONUS200',
                        description: 'Premium trading bonus',
                        type: 'BONUS',
                        value: 200,
                        activeDate: new Date(),
                        effectDate: new Date(),
                        expireDate: daysAgo(-45),
                        status: client_1.VoucherStatus.unused,
                        userId: user4.id,
                    },
                }),
                prisma.voucher.create({
                    data: {
                        code: 'REFERRAL75',
                        description: 'Referral bonus voucher',
                        type: 'REFERRAL',
                        value: 75,
                        activeDate: new Date(),
                        effectDate: new Date(),
                        expireDate: daysAgo(-20),
                        status: client_1.VoucherStatus.unused,
                        userId: user5.id,
                    },
                }),
            ]);
            console.log('Created 5 vouchers');
            console.log('Database seeding completed successfully!');
            console.log('Summary:');
            console.log(`   - ${tokens.length} tokens created`);
            console.log(`   - ${users.length} users created`);
            console.log(`   - ${strategies.length} strategies created`);
            console.log(`   - ${targets.length} targets created`);
            console.log(`   - ${orders.length} orders created`);
            console.log(`   - ${claims.length} claims created`);
            console.log(`   - ${billsCreated.length} bills created`);
            console.log('   - 5 vouchers created');
            console.log('   - Token strategies connected');
            console.log('   - User tokens connected');
            console.log('   - Referral relationships established');
        }
        catch (error) {
            console.error('Error during seeding:', error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
            console.log('Database connection closed');
        }
    });
}
main().catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
});
