import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive database seeding...');

  // Clean existing data in correct order (respecting foreign key constraints)
  await prisma.userOrder.deleteMany();
  await prisma.userToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.target.deleteMany();
  await prisma.tokenStrategy.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.token.deleteMany();

  console.log('Cleaned existing data');

  // Create comprehensive tokens
  const tokens = await Promise.all([
    prisma.token.create({
      data: {
        name: 'Bitcoin',
        stable: 'USDT',
        minQty: 0.001,
        isActive: true,
      },
    }),
    prisma.token.create({
      data: {
        name: 'Ethereum',
        stable: 'USDT',
        minQty: 0.01,
        isActive: true,
      },
    }),
    prisma.token.create({
      data: {
        name: 'Cardano',
        stable: 'USDT',
        minQty: 1,
        isActive: true,
      },
    }),
    prisma.token.create({
      data: {
        name: 'Solana',
        stable: 'USDT',
        minQty: 0.1,
        isActive: true,
      },
    }),
    prisma.token.create({
      data: {
        name: 'Polygon',
        stable: 'USDT',
        minQty: 10,
        isActive: true,
      },
    }),
    prisma.token.create({
      data: {
        name: 'Chainlink',
        stable: 'USDT',
        minQty: 1,
        isActive: false, 
      },
    }),
  ]);

  console.log('Created 6 tokens');

  // Create comprehensive users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        fullname: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        availableBalance: 25000,
        tradeBalance: 15000,
        profit: 3500,
        commission: 750,
        commissionPercent: 30,
        insurance: 500,
        isActive: true,
        isVerified: true,
        avatar: 1,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password123',
        availableBalance: 18000,
        tradeBalance: 8000,
        profit: -800,
        commission: 400,
        commissionPercent: 25,
        insurance: 300,
        isActive: true,
        isVerified: true,
        avatar: 2,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Bob Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        password: 'password123',
        availableBalance: 12000,
        tradeBalance: 6000,
        profit: 1200,
        commission: 300,
        commissionPercent: 35,
        insurance: 200,
        isActive: false,
        isVerified: false,
        avatar: 3,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Alice Williams',
        username: 'alicewilliams',
        email: 'alice@example.com',
        password: 'password123',
        availableBalance: 35000,
        tradeBalance: 20000,
        profit: 5200,
        commission: 1200,
        commissionPercent: 28,
        insurance: 800,
        isActive: true,
        isVerified: true,
        avatar: 4,
      },
    }),
    prisma.user.create({
      data: {
        fullname: 'Charlie Brown',
        username: 'charliebrown',
        email: 'charlie@example.com',
        password: 'password123',
        availableBalance: 8000,
        tradeBalance: 3000,
        profit: -1200,
        commission: 150,
        commissionPercent: 32,
        insurance: 100,
        isActive: true,
        isVerified: true,
        avatar: 5,
      },
    }),
  ]);

  console.log('Created 5 users');

  // Create comprehensive strategies
  const strategies = await Promise.all([
    prisma.strategy.create({
      data: {
        description: 'Scalping Strategy - Quick profits on small price movements',
        contribution: 1000,
        isActive: true,
        isCloseBeforeNewCandle: false,
        triggerBy: 1,
        direction: 'SAME',
      },
    }),
    prisma.strategy.create({
      data: {
        description: 'Swing Trading - Medium-term position holding',
        contribution: 2500,
        isActive: true,
        isCloseBeforeNewCandle: true,
        triggerBy: 2,
        direction: 'OPPOSITE',
      },
    }),
    prisma.strategy.create({
      data: {
        description: 'Trend Following - Long-term trend analysis',
        contribution: 5000,
        isActive: false,
        isCloseBeforeNewCandle: false,
        triggerBy: 3,
        direction: 'SAME',
      },
    }),
  ]);

  console.log('Created 3 strategies');

  // Create targets for strategies
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

  console.log('Created 3 targets');

  // Create token strategies
  await Promise.all([
    prisma.tokenStrategy.create({
      data: {
        tokenId: tokens[0].id,
        strategyId: strategies[0].id,
      },
    }),
    prisma.tokenStrategy.create({
      data: {
        tokenId: tokens[1].id,
        strategyId: strategies[1].id,
      },
    }),
    prisma.tokenStrategy.create({
      data: {
        tokenId: tokens[2].id,
        strategyId: strategies[2].id,
      },
    }),
    prisma.tokenStrategy.create({
      data: {
        tokenId: tokens[3].id,
        strategyId: strategies[0].id,
      },
    }),
  ]);

  console.log('Created 4 token strategies');

  // Create comprehensive orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderId: 'ORD-001-BTC-LONG',
        side: 'long',
        timestamp: new Date().toISOString(),
        entryPrice: 45000,
        qty: 0.1,
        budget: 4500,
        status: 'ACTIVE',
        netProfit: 150,
        markPrice: 45150,
        strategyId: strategies[0].id,
        currentTargetId: targets[0].id,
        tokenId: tokens[0].id,
        fee: 4.5,
        stoplossOrderId: 'STOP-001-BTC',
        last5HeikinAshi: 'GREEN',
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-002-ETH-SHORT',
        side: 'short',
        timestamp: new Date().toISOString(),
        entryPrice: 3200,
        qty: 2.0,
        budget: 6400,
        status: 'ACTIVE',
        netProfit: -80,
        markPrice: 3240,
        strategyId: strategies[1].id,
        currentTargetId: targets[1].id,
        tokenId: tokens[1].id,
        fee: 6.4,
        stoplossOrderId: 'STOP-002-ETH',
        last5HeikinAshi: 'RED',
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-003-ADA-LONG',
        side: 'long',
        timestamp: new Date().toISOString(),
        entryPrice: 0.45,
        qty: 1000,
        budget: 450,
        status: 'FINISHED',
        netProfit: 45,
        markPrice: 0.495,
        strategyId: strategies[2].id,
        currentTargetId: targets[2].id,
        tokenId: tokens[2].id,
        fee: 0.45,
        last5HeikinAshi: 'MIXED',
      },
    }),
    prisma.order.create({
      data: {
        orderId: 'ORD-004-SOL-SHORT',
        side: 'short',
        timestamp: new Date().toISOString(),
        entryPrice: 95,
        qty: 10,
        budget: 950,
        status: 'EXPIRED',
        netProfit: -25,
        markPrice: 97.5,
        strategyId: strategies[0].id,
        tokenId: tokens[3].id,
        fee: 0.95,
        last5HeikinAshi: 'RED',
      },
    }),
  ]);

  console.log('Created 4 orders');

  // Create user orders
  await Promise.all([
    prisma.userOrder.create({
      data: {
        contributionPercent: 30,
        commission: 135,
        commissionPercent: 30,
        orderId: orders[0].orderId,
        userId: users[0].id,
      },
    }),
    prisma.userOrder.create({
      data: {
        contributionPercent: 25,
        commission: 160,
        commissionPercent: 25,
        orderId: orders[1].orderId,
        userId: users[1].id,
      },
    }),
    prisma.userOrder.create({
      data: {
        contributionPercent: 20,
        commission: 9,
        commissionPercent: 20,
        orderId: orders[2].orderId,
        userId: users[2].id,
      },
    }),
    prisma.userOrder.create({
      data: {
        contributionPercent: 35,
        commission: 33.25,
        commissionPercent: 35,
        orderId: orders[3].orderId,
        userId: users[3].id,
      },
    }),
  ]);

  console.log('Created 4 user orders');

  // Create comprehensive user tokens
  await Promise.all([
    // John Doe's tokens
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[0].id, tokenId: tokens[3].id } }),
    
    // Jane Smith's tokens
    prisma.userToken.create({ data: { userId: users[1].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[1].id, tokenId: tokens[2].id } }),
    
    // Bob Johnson's tokens
    prisma.userToken.create({ data: { userId: users[2].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[2].id, tokenId: tokens[4].id } }),
    
    // Alice Williams' tokens
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[0].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[1].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[2].id } }),
    prisma.userToken.create({ data: { userId: users[3].id, tokenId: tokens[3].id } }),
    
    // Charlie Brown's tokens
    prisma.userToken.create({ data: { userId: users[4].id, tokenId: tokens[4].id } }),
  ]);

  console.log('Created 13 user tokens');

  // Create comprehensive transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        amount: 5000,
        type: 'DEPOSIT',
        status: 'FINISHED',
        info: 'Initial deposit via bank transfer',
        userId: users[0].id,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 2000,
        type: 'WITHDRAW',
        status: 'PENDING',
        info: 'Withdrawal to bank account',
        userId: users[0].id,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 3000,
        type: 'DEPOSIT',
        status: 'FINISHED',
        info: 'Crypto deposit - Bitcoin',
        userId: users[1].id,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 1000,
        type: 'WITHDRAW',
        status: 'CANCELLED',
        info: 'Cancelled withdrawal request',
        userId: users[1].id,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 8000,
        type: 'DEPOSIT',
        status: 'FINISHED',
        info: 'Large deposit for trading',
        userId: users[3].id,
      },
    }),
  ]);

  console.log('Created 5 transactions');

  // Create invoices for transactions
  await Promise.all([
    prisma.invoice.create({
      data: {
        link: 'https://invoice.example.com/inv-001',
        transactionId: 1,
      },
    }),
    prisma.invoice.create({
      data: {
        link: 'https://invoice.example.com/inv-002',
        transactionId: 2,
      },
    }),
    prisma.invoice.create({
      data: {
        link: 'https://invoice.example.com/inv-003',
        transactionId: 5,
      },
    }),
  ]);

        console.log('Created 3 invoices');

  // Create comprehensive assets
  await Promise.all([
    prisma.asset.create({
      data: {
        asset: 25000,
        userId: users[0].id,
      },
    }),
    prisma.asset.create({
      data: {
        asset: 18000,
        userId: users[1].id,
      },
    }),
    prisma.asset.create({
      data: {
        asset: 35000,
        userId: users[3].id,
      },
    }),
  ]);

  console.log('Created 3 assets');

  // Create comprehensive notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        type: 'PROFIT',
        message: 'Your Bitcoin trade generated a profit of $150!',
        status: false,
        userId: users[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'LOSS',
        message: 'Your Ethereum trade resulted in a loss of $80',
        status: true,
        userId: users[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'INFO',
        message: 'Welcome to the trading platform! Start your journey now.',
        status: false,
        userId: users[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'PROFIT',
        message: 'Congratulations! You made $45 profit on Cardano',
        status: true,
        userId: users[2].id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'INFO',
        message: 'New trading strategy available: Trend Following',
        status: false,
        userId: users[3].id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'LOSS',
        message: 'Your Solana trade hit stop loss. Loss: $25',
        status: true,
        userId: users[4].id,
      },
    }),
  ]);

  console.log('Created 6 notifications');

  // Create comprehensive activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 1,
        userId: users[0].id,
        availableBalance: 25000,
        tradeBalance: 15000,
        value: 5000,
      },
    }),
    prisma.activity.create({
      data: {
        type: 2,
        userId: users[0].id,
        availableBalance: 24000,
        tradeBalance: 16000,
        value: 1000,
      },
    }),
    prisma.activity.create({
      data: {
        type: 3,
        userId: users[0].id,
        availableBalance: 22000,
        tradeBalance: 15000,
        value: 2000,
      },
    }),
    prisma.activity.create({
      data: {
        type: 1,
        userId: users[1].id,
        availableBalance: 18000,
        tradeBalance: 8000,
        value: 3000,
      },
    }),
    prisma.activity.create({
      data: {
        type: 2,
        userId: users[1].id,
        availableBalance: 17500,
        tradeBalance: 8500,
        value: 500,
      },
    }),
    prisma.activity.create({
      data: {
        type: 1,
        userId: users[3].id,
        availableBalance: 35000,
        tradeBalance: 20000,
        value: 8000,
      },
    }),
  ]);

  console.log('Created 6 activities');

  // Create comprehensive vouchers
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
        status: 'unused',
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
        status: 'inuse',
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
        status: 'expired',
        userId: users[2].id,
      },
    }),
    prisma.voucher.create({
      data: {
        code: 'PREMIUM200',
        description: 'Premium user bonus',
        type: 'PREMIUM',
        value: 200,
        activeDate: new Date(),
        effectDate: new Date(),
        expireDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'unused',
        userId: users[3].id,
      },
    }),
  ]);

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