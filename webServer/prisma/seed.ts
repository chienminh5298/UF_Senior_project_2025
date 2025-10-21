
import {
  PrismaClient,
  Side,
  Status,
  DirectionType,
  VoucherStatus,
  BillStatus,
  Network,
  ClaimStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('Starting database seeding aligned to UPDATED schema...');

await prisma.order.deleteMany();
await prisma.bill.deleteMany();
await prisma.userToken.deleteMany();
await prisma.voucher.deleteMany();
await prisma.claim.deleteMany();
await prisma.strategy.deleteMany();
await prisma.token.deleteMany();
await prisma.user.deleteMany();


  console.log('Cleaned existing data');

  const tokens = await Promise.all([
    prisma.token.create({ data: { name: 'Bitcoin',  stable: 'USDT', minQty: 0.001, isActive: true,  leverage: 3 } }),
    prisma.token.create({ data: { name: 'Ethereum', stable: 'USDT', minQty: 0.01,  isActive: true,  leverage: 3 } }),
    prisma.token.create({ data: { name: 'Cardano',  stable: 'USDT', minQty: 1,     isActive: true,  leverage: 2 } }),
    prisma.token.create({ data: { name: 'Solana',   stable: 'USDT', minQty: 0.1,   isActive: true,  leverage: 5 } }),
    prisma.token.create({ data: { name: 'Polygon',  stable: 'USDT', minQty: 10,    isActive: true,  leverage: 2 } }),
    prisma.token.create({ data: { name: 'Chainlink',stable: 'USDT', minQty: 1,     isActive: false, leverage: 1 } }),
  ]);
  console.log('Created tokens:', tokens.length);

  const strategies = await Promise.all([
    prisma.strategy.create({
      data: {
        description: 'Scalping Strategy - quick moves',
        contribution: 1000,
        isActive: true,
        isCloseBeforeNewCandle: false,
        direction: DirectionType.SAME,
      },
    }),
    prisma.strategy.create({
      data: {
        description: 'Swing Trading - medium term',
        contribution: 2500,
        isActive: true,
        isCloseBeforeNewCandle: true,
        direction: DirectionType.OPPOSITE,
      },
    }),
    prisma.strategy.create({
      data: {
        description: 'Trend Following - long term',
        contribution: 5000,
        isActive: false,
        isCloseBeforeNewCandle: false,
        direction: DirectionType.SAME,
      },
    }),
  ]);
  console.log('Created strategies:', strategies.length);

  const targets = await Promise.all([
    prisma.target.create({
      data: {
        targetPercent: 2.5,
        stoplossPercent: 1.0,
        tokenId: tokens[0].id,
        strategyId: strategies[0].id,
      },
    }),
    prisma.target.create({
      data: {
        targetPercent: 5.0,
        stoplossPercent: 2.0,
        tokenId: tokens[1].id,
        strategyId: strategies[1].id,
      },
    }),
    prisma.target.create({
      data: {
        targetPercent: 8.0,
        stoplossPercent: 3.0,
        tokenId: tokens[2].id,
        strategyId: strategies[2].id,
      },
    }),
  ]);
  console.log('Created targets:', targets.length);

  await Promise.all([
    prisma.tokenStrategy.create({ data: { tokenId: tokens[0].id, strategyId: strategies[0].id } }),
    prisma.tokenStrategy.create({ data: { tokenId: tokens[1].id, strategyId: strategies[1].id } }),
    prisma.tokenStrategy.create({ data: { tokenId: tokens[2].id, strategyId: strategies[2].id } }),
    prisma.tokenStrategy.create({ data: { tokenId: tokens[3].id, strategyId: strategies[0].id } }),
  ]);
  console.log('Created tokenStrategies: 4');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        fullname: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: await hashPassword('password123'),
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0,
        adminInsurance: 0,
        referralInsurance: 0,
        insurancePercent: 0,
        profit: 3500,
        isActive: true,
        isVerified: true,
        avatar: 1,
        apiKey: 'api_key_john',
        apiSecret: 'api_secret_john',
        apiPassphrase: null,
        referralUserId: null,
        referralCode: 'REF-JOHN',
        tradeBalance: 15000,
        telegramChatId: null,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: await hashPassword('password123'),
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0,
        adminInsurance: 0,
        referralInsurance: 0,
        insurancePercent: 0,
        profit: -800,
        isActive: true,
        isVerified: true,
        avatar: 2,
        apiKey: 'api_key_jane',
        apiSecret: 'api_secret_jane',
        apiPassphrase: null,
        referralUserId: null,
        referralCode: 'REF-JANE',
        tradeBalance: 8000,
        telegramChatId: null,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Bob Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        password: await hashPassword('password123'),
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0,
        adminInsurance: 0,
        referralInsurance: 0,
        insurancePercent: 0,
        profit: 1200,
        isActive: false,
        isVerified: false,
        avatar: 3,
        apiKey: 'api_key_bob',
        apiSecret: 'api_secret_bob',
        apiPassphrase: null,
        referralUserId: null,
        referralCode: 'REF-BOB',
        tradeBalance: 6000,
        telegramChatId: null,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Alice Williams',
        username: 'alicewilliams',
        email: 'alice@example.com',
        password: await hashPassword('password123'),
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0,
        adminInsurance: 0,
        referralInsurance: 0,
        insurancePercent: 0,
        profit: 5200,
        isActive: true,
        isVerified: true,
        avatar: 4,
        apiKey: 'api_key_alice',
        apiSecret: 'api_secret_alice',
        apiPassphrase: null,
        referralUserId: null,
        referralCode: 'REF-ALICE',
        tradeBalance: 20000,
        telegramChatId: null,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Charlie Brown',
        username: 'charliebrown',
        email: 'charlie@example.com',
        password: await hashPassword('password123'),
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0,
        adminInsurance: 0,
        referralInsurance: 0,
        insurancePercent: 0,
        profit: -1200,
        isActive: true,
        isVerified: true,
        avatar: 5,
        apiKey: 'api_key_charlie',
        apiSecret: 'api_secret_charlie',
        apiPassphrase: null,
        referralUserId: null,
        referralCode: 'REF-CHARLIE',
        tradeBalance: 3000,
        telegramChatId: null,
      },
    }),
  ]);
  console.log('Created users:', users.length);

  await Promise.all([
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[3].id } }),
    prisma.userToken.create({ data: { userId: users[1].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[1].id, tokenId: tokens[2].id } }),
    prisma.userToken.create({ data: { userId: users[2].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[2].id, tokenId: tokens[4].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[2].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[3].id } }),
    prisma.userToken.create({ data: { userId: users[4].id, tokenId: tokens[4].id } }),
  ]);
  console.log('Created userTokens: 12');

  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderId: 'ORD-001-BTC-BUY',
        side: Side.BUY,
        timestamp: new Date().toISOString(),
        entryPrice: 45000,
        qty: 0.1,
        budget: 4500,
        status: Status.ACTIVE,
        netProfit: 150,
        markPrice: 45150,
        strategyId: strategies[0].id,
        currentTargetId: targets[0].id,
        tokenId: tokens[0].id,
        fee: 4.5,
        stoplossOrderId: 'STOP-001-BTC',
        leverage: 3,
        userId: users[0].id,
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-002-ETH-SELL',
        side: Side.SELL,
        timestamp: new Date().toISOString(),
        entryPrice: 3200,
        qty: 2.0,
        budget: 6400,
        status: Status.ACTIVE,
        netProfit: -80,
        markPrice: 3240,
        strategyId: strategies[1].id,
        currentTargetId: targets[1].id,
        tokenId: tokens[1].id,
        fee: 6.4,
        stoplossOrderId: 'STOP-002-ETH',
        leverage: 2,
        userId: users[1].id,
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-003-ADA-BUY',
        side: Side.BUY,
        timestamp: new Date().toISOString(),
        entryPrice: 0.45,
        qty: 1000,
        budget: 450,
        status: Status.FINISHED,
        netProfit: 45,
        markPrice: 0.495,
        strategyId: strategies[2].id,
        currentTargetId: targets[2].id,
        tokenId: tokens[2].id,
        fee: 0.45,
        leverage: 1,
        userId: users[2].id,
        sellDate: new Date(),
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-004-SOL-SELL',
        side: Side.SELL,
        timestamp: new Date().toISOString(),
        entryPrice: 95,
        qty: 10,
        budget: 950,
        status: Status.EXPIRED,
        netProfit: -25,
        markPrice: 97.5,
        strategyId: strategies[0].id,
        tokenId: tokens[3].id,
        fee: 0.95,
        leverage: 5,
        userId: users[3].id,
      },
    }),
    // Additional completed and cancelled orders for History page
    prisma.order.create({
      data: {
        orderId: 'ORD-005-BTC-SELL',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        entryPrice: 43000,
        qty: 0.05,
        budget: 2150,
        status: Status.FINISHED,
        netProfit: 125,
        markPrice: 43250,
        strategyId: strategies[0].id,
        currentTargetId: targets[0].id,
        tokenId: tokens[0].id,
        fee: 2.15,
        leverage: 3,
        userId: users[0].id,
        sellDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-006-ETH-BUY',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        entryPrice: 3100,
        qty: 1.5,
        budget: 4650,
        status: Status.FINISHED,
        netProfit: 180,
        markPrice: 3220,
        strategyId: strategies[1].id,
        currentTargetId: targets[1].id,
        tokenId: tokens[1].id,
        fee: 4.65,
        leverage: 2,
        userId: users[1].id,
        sellDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-007-ADA-SELL',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        entryPrice: 0.48,
        qty: 500,
        budget: 240,
        status: Status.EXPIRED,
        netProfit: -12,
        markPrice: 0.456,
        strategyId: strategies[2].id,
        tokenId: tokens[2].id,
        fee: 0.24,
        leverage: 1,
        userId: users[2].id,
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-008-SOL-BUY',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        entryPrice: 88,
        qty: 15,
        budget: 1320,
        status: Status.FINISHED,
        netProfit: 75,
        markPrice: 93,
        strategyId: strategies[0].id,
        currentTargetId: targets[0].id,
        tokenId: tokens[3].id,
        fee: 1.32,
        leverage: 5,
        userId: users[3].id,
        sellDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-009-MATIC-SELL',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        entryPrice: 0.85,
        qty: 200,
        budget: 170,
        status: Status.EXPIRED,
        netProfit: -8.5,
        markPrice: 0.89,
        strategyId: strategies[1].id,
        tokenId: tokens[4].id,
        fee: 0.17,
        leverage: 2,
        userId: users[0].id,
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-010-BTC-BUY',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        entryPrice: 42000,
        qty: 0.08,
        budget: 3360,
        status: Status.FINISHED,
        netProfit: 168,
        markPrice: 44100,
        strategyId: strategies[2].id,
        currentTargetId: targets[2].id,
        tokenId: tokens[0].id,
        fee: 3.36,
        leverage: 3,
        userId: users[1].id,
        sellDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-011-ETH-SELL',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        entryPrice: 3000,
        qty: 2.5,
        budget: 7500,
        status: Status.EXPIRED,
        netProfit: -150,
        markPrice: 3060,
        strategyId: strategies[0].id,
        tokenId: tokens[1].id,
        fee: 7.5,
        leverage: 2,
        userId: users[2].id,
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-012-ADA-BUY',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
        entryPrice: 0.42,
        qty: 800,
        budget: 336,
        status: Status.FINISHED,
        netProfit: 33.6,
        markPrice: 0.462,
        strategyId: strategies[1].id,
        currentTargetId: targets[1].id,
        tokenId: tokens[2].id,
        fee: 0.336,
        leverage: 1,
        userId: users[3].id,
        sellDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
    }),
  ]);
  console.log('Created orders:', orders.length);

  // Create additional orders for more comprehensive bills
  const additionalOrders = await Promise.all([
    prisma.order.create({
      data: {
        orderId: 'ORD-004',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: 45000,
        qty: 0.02,
        budget: 900,
        status: Status.FINISHED,
        netProfit: 45.50,
        markPrice: 45227.50,
        strategyId: strategies[0].id,
        tokenId: tokens[0].id, // Bitcoin
        fee: 0.9,
        leverage: 3,
        userId: users[0].id,
        sellDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-005',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: 3200,
        qty: 0.5,
        budget: 1600,
        status: Status.FINISHED,
        netProfit: -25.30,
        markPrice: 3150,
        strategyId: strategies[1].id,
        tokenId: tokens[1].id, // Ethereum
        fee: 1.6,
        leverage: 2,
        userId: users[0].id,
        sellDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-006',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: 0.45,
        qty: 1000,
        budget: 450,
        status: Status.FINISHED,
        netProfit: 78.90,
        markPrice: 0.528,
        strategyId: strategies[0].id,
        tokenId: tokens[2].id, // Cardano
        fee: 0.45,
        leverage: 2,
        userId: users[1].id,
        sellDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-007',
        side: Side.BUY,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: 95,
        qty: 2,
        budget: 190,
        status: Status.FINISHED,
        netProfit: 15.20,
        markPrice: 102.60,
        strategyId: strategies[1].id,
        tokenId: tokens[3].id, // Solana
        fee: 0.19,
        leverage: 5,
        userId: users[1].id,
        sellDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-008',
        side: Side.SELL,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: 0.85,
        qty: 500,
        budget: 425,
        status: Status.FINISHED,
        netProfit: -12.50,
        markPrice: 0.82,
        strategyId: strategies[0].id,
        tokenId: tokens[4].id, // Polygon
        fee: 0.425,
        leverage: 2,
        userId: users[2].id,
        sellDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('Created additional orders:', additionalOrders.length);

  // Create multiple claims with different statuses
  const claims = await Promise.all([
    // Claim 1: NEW status with multiple bills
    prisma.claim.create({
      data: {
        status: ClaimStatus.NEW,
        amount: 1250.75,
        userId: users[0].id,
        hashId: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        network: Network.ERC20,
        address: '0x742d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
      },
    }),
    // Claim 2: FINISHED status (processing)
    prisma.claim.create({
      data: {
        status: ClaimStatus.FINISHED,
        amount: 850.30,
        userId: users[1].id,
        hashId: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234',
        network: Network.BEP20,
        address: '0x8f3d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
      },
    }),
    // Claim 3: FINISHED status (completed)
    prisma.claim.create({
      data: {
        status: ClaimStatus.FINISHED,
        amount: 2100.50,
        userId: users[2].id,
        hashId: '0x3c4d5e6f7890abcdef1234567890abcdef123456',
        network: Network.ERC20,
        address: '0x9a4d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
      },
    }),
    // Claim 4: NEW status (rejected)
    prisma.claim.create({
      data: {
        status: ClaimStatus.NEW,
        amount: 500.00,
        userId: users[3].id,
        network: Network.BEP20,
        address: '0x1b5d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
      },
    }),
    // Claim 5: NEW status with no transaction hash yet
    prisma.claim.create({
      data: {
        status: ClaimStatus.NEW,
        amount: 750.25,
        userId: users[0].id,
        network: Network.ERC20,
        address: '0x2c6d35Cc6634C0532925a3b8D0C4C3C2C1B0A9F8E7D6C5B4A3928171615141312111',
      },
    }),
  ]);
  console.log('Created claims:', claims.length);

  // Create comprehensive bills for each claim
  const bills = await Promise.all([
    // Bills for Claim 1 (NEW)
    prisma.bill.create({
      data: {
        adminCommissionPercent: 30,
        referralCommissionPercent: 5,
        status: BillStatus.NEW,
        userId: users[0].id,
        from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        to: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        note: 'Weekly trading bill - Bitcoin and Ethereum trades',
        netProfit: 450.25,
        claimId: claims[0].id,
        orders: { 
          connect: [
            { id: orders[0].id },
            { id: additionalOrders[0].id },
            { id: additionalOrders[1].id }
          ] 
        },
      },
    }),
    prisma.bill.create({
      data: {
        adminCommissionPercent: 30,
        referralCommissionPercent: 5,
        status: BillStatus.NEW,
        userId: users[0].id,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        to: new Date(), // now
        note: 'Current week trading bill - Mixed results',
        netProfit: 800.50,
        claimId: claims[0].id,
        orders: { 
          connect: [
            { id: orders[1].id },
            { id: orders[2].id }
          ] 
        },
      },
    }),
    
    // Bills for Claim 2 (PROCESSING)
    prisma.bill.create({
      data: {
        adminCommissionPercent: 25,
        referralCommissionPercent: 0,
        status: BillStatus.PROCESSING,
        userId: users[1].id,
        from: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        note: 'Cardano and Solana trading period',
        netProfit: 650.30,
        claimId: claims[1].id,
        orders: { 
          connect: [
            { id: additionalOrders[2].id },
            { id: additionalOrders[3].id }
          ] 
        },
      },
    }),
    prisma.bill.create({
      data: {
        adminCommissionPercent: 25,
        referralCommissionPercent: 0,
        status: BillStatus.PROCESSING,
        userId: users[1].id,
        from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        to: new Date(),
        note: 'Recent trading activity',
        netProfit: 200.00,
        claimId: claims[1].id,
        orders: { 
          connect: [
            { id: orders[3].id }
          ] 
        },
      },
    }),
    
    // Bills for Claim 3 (COMPLETED)
    prisma.bill.create({
      data: {
        adminCommissionPercent: 20,
        referralCommissionPercent: 10,
        status: BillStatus.CLAIMED,
        userId: users[2].id,
        from: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        to: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        note: 'Successful trading period - High profits',
        netProfit: 1200.75,
        claimId: claims[2].id,
        orders: { 
          connect: [
            { id: orders[0].id },
            { id: orders[1].id }
          ] 
        },
      },
    }),
    prisma.bill.create({
      data: {
        adminCommissionPercent: 20,
        referralCommissionPercent: 10,
        status: BillStatus.CLAIMED,
        userId: users[2].id,
        from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        note: 'Second week of successful trading',
        netProfit: 899.75,
        claimId: claims[2].id,
        orders: { 
          connect: [
            { id: orders[2].id },
            { id: orders[3].id }
          ] 
        },
      },
    }),
    
    // Bills for Claim 4 (REJECTED)
    prisma.bill.create({
      data: {
        adminCommissionPercent: 30,
        referralCommissionPercent: 0,
        status: BillStatus.REJECTED,
        userId: users[3].id,
        from: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        note: 'Trading period with losses - insufficient profit',
        netProfit: -150.25,
        claimId: claims[3].id,
        orders: { 
          connect: [
            { id: additionalOrders[4].id }
          ] 
        },
      },
    }),
    
    // Bills for Claim 5 (NEW - no hash yet)
    prisma.bill.create({
      data: {
        adminCommissionPercent: 30,
        referralCommissionPercent: 0,
        status: BillStatus.NEW,
        userId: users[0].id,
        from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        to: new Date(),
        note: 'Recent trading activity - pending review',
        netProfit: 750.25,
        claimId: claims[4].id,
        orders: { 
          connect: [
            { id: orders[0].id },
            { id: additionalOrders[0].id }
          ] 
        },
      },
    }),
  ]);
  console.log('Created bills:', bills.length);

  // Update claim amounts to match the sum of their bills
  await Promise.all([
    prisma.claim.update({
      where: { id: claims[0].id },
      data: { amount: 1250.75 } // 450.25 + 800.50
    }),
    prisma.claim.update({
      where: { id: claims[1].id },
      data: { amount: 850.30 } // 650.30 + 200.00
    }),
    prisma.claim.update({
      where: { id: claims[2].id },
      data: { amount: 2100.50 } // 1200.75 + 899.75
    }),
    prisma.claim.update({
      where: { id: claims[3].id },
      data: { amount: 500.00 } // Fixed amount for rejected claim
    }),
    prisma.claim.update({
      where: { id: claims[4].id },
      data: { amount: 750.25 } // 750.25
    }),
  ]);
  console.log('Updated claim amounts');

  await Promise.all([
    prisma.voucher.create({
      data: {
        code: 'WELCOME100',
        description: 'Welcome bonus for new users',
        type: 'BONUS',
        value: 100,
        activeDate: new Date(),
        effectDate: new Date(),
        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: VoucherStatus.unused,
        userId: users[0].id,
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
        expireDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: VoucherStatus.inuse,
        userId: users[1].id,
      },
    }),
    prisma.voucher.create({
      data: {
        code: 'EXPIRED25',
        description: 'Expired voucher for testing',
        type: 'BONUS',
        value: 25,
        activeDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        effectDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expireDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: VoucherStatus.expired,
        userId: users[2].id,
      },
    }),
  ]);
  console.log('Created vouchers: 3');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
