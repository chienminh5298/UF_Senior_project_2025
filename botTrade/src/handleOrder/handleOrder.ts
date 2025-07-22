import { adjustLeverage, API_getRecentFilledOrder, API_newOrder, API_verifyOrder, getPrice } from "../api/binance";
import { __payloadNewOrder } from "../payload/binance";

export const openOrder = async (token: Token, strategy: Strategy, side: "BUY" | "SELL") => {
    try {
        const strategyId = strategy.id;
        const orderToken = token.name + token.stable;
        let queryMarketPrice = await getPrice(orderToken);

        const price = +queryMarketPrice.data.markPrice;

        let users = await prisma.user.findMany({ where: { isActive: true } });
        const userBudget = await createUserBudgets({ token, strategyId, price, users });

        await handleOpenOrder({ strategyId, token, userBudget, side, price });
    } catch (err) {
        handleError(`Can't get price to open root order - openOrder - handleRootOrders`, "error", [queryMarketPrice]);
    }
};

export const handleOpenOrder = async ({ strategyId, token, userBudget, side, price }: HandleOpenRootOrderType) => {
    const orderToken = token.name + token.stable;

    // Adjust leverange
    await adjustLeverage(orderToken, token.leverage);

    // 1. Calculate total budget of 1 order (sum from budget of each user)
    const totalBudget = userBudget.reduce((sum, user) => sum + user.budget, 0);
    const qty = userBudget.reduce((sum, user) => sum + user.qty, 0);

    if (userBudget.length !== 0) {
        if (qty < token.minQty) {
            const log = `Can't open rootorder for ${orderToken} with ${qty} at ${price}$. Min qty is ${token.minQty}`;
            writeLog([log]);
            console.log(log);
            return { status: 400, message: log };
        }
        // 2. Open root order
        else if (userBudget.length !== 0) {
            const payload = __payloadNewOrder({ token: orderToken, side, qty }, token.minQty);
            let response = await API_newOrder(payload);

            if (response.status === 200) {
                let responseData = response.data;
                await handleAfterOpenNewOrder({ responseData, orderToken, strategyId, token, totalBudget, userBudget });
            } else {
                // If failed we try recovery in case it placed successfully but error message sent
                const recoveryOrder = await recoverLatestOpenOrder({ symbol: orderToken, side });
                if (recoveryOrder === null) {
                    console.log(response);
                    sendTelegramAdminMessage(`Can't open new order - openOrder - handleOrders`);
                    const log = `Can't open new order - openOrder - handleOrders`;
                    handleError(log, "error", [response]);
                    return { status: 400, message: log };
                } else {
                    await handleAfterOpenNewOrder({ responseData: recoveryOrder, orderToken, strategyId, token, totalBudget, userBudget });
                }
            }
        }
    }
    return { status: 400, message: "No user budget!" };
};

const handleAfterOpenNewOrder = async ({ responseData, orderToken, strategyId, token, totalBudget, userBudget }: { responseData: any; token: Token; totalBudget: number; strategyId: number; userBudget: userBudgets[]; orderToken: string }) => {
    writeLog([`Open root order successfully --- ${orderToken}`, { ...responseData }]);

    // 1. Find the first target to set stoploss
    let target = await prisma.target.findFirst({
        where: {
            strategyId: strategyId,
            tokenId: token.id,
        },
        orderBy: {
            targetPercent: "asc",
        },
        take: 1,
    });

    // 2. Find the next target to reach
    let nextTarget = await getNextTarget(target!.id, token.id, strategyId);

    if (target && nextTarget) {
        // 3. Insert order to table
        const order = await insertOrder({ responseData, totalBudget, nextTargetId: nextTarget.id, token, strategyId });

        // 4. Insert order to userorder table
        insertOrderIntoUserOrderTable(userBudget, totalBudget, order.orderId);

        // 5. set target's Storage
        let markPrice = calculateMarkPrice(nextTarget.targetPercent, order.entryPrice, order.side);
        targetStorageInstance.addTarget(order.orderId, { targetId: nextTarget.id, markPrice });

        // 6. Set stoploss
        await newStoploss(target, order, token);

        // 7. create interval token's price check
        intervalPriceOrderInstance.createIntervalPriceCheck(orderToken, token.id);

        // 8 Send message to TELEGRAM
        const telegramMessage = telegramNewOrderPayload({
            entryTime: order.createdAt,
            entryPrice: order.entryPrice,
            orderId: order.orderId,
            stoplossPrice: calculateMarkPrice(target.stoplossPercent, order.entryPrice, order.side),
            targetPrice: markPrice,
            side: order.side,
        });
        await sendTelegramMessage(telegramMessage);

        return { status: 200 };
    } else {
        const log = `Can't find any target - openRootOrder - handleRootOrders`;
        sendTelegramAdminMessage(log);
        handleError(log, "error", [target, nextTarget]);
        return { status: 400, message: log };
    }
};

const insertOrder = async ({ responseData, totalBudget, nextTargetId, token, strategyId }: InsertOrderType): Promise<Order> => {
    const entryPrice = parseFloat(responseData.avgPrice);
    const qty = parseFloat(responseData.origQty);
    const order = await prisma.order.create({
        data: {
            orderId: jsonbig.stringify(responseData.orderId),
            side: responseData.side === "SELL" ? "short" : "long",
            timestamp: responseData.updateTime.toString(),
            entryPrice,
            qty,
            budget: totalBudget,
            status: "ACTIVE",
            currentTargetId: nextTargetId,
            tokenId: token.id,
            strategyId,
            fee: entryPrice * qty * setting.BINANCE.TAKER_FEE,
            leverage: token.leverage, // leverage of this order
        },
    });

    return order;
};

const createUserBudgets = async ({ token, strategyId, price, users, budgetPercent }: CreateUserBudgetsType) => {
    let data: userBudgets[] = [];
    const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });

    for (const user of users) {
        let isSupriseThisToken = await prisma.userToken.findFirst({ where: { userId: user.id, tokenId: token.id } });
        if (isSupriseThisToken && strategy) {
            let budget = 0;
            if (budgetPercent) {
                budget = user.tradeBalance * (budgetPercent / 100); //Calculate budget per order
            } else {
                const strategiesCount = await countUserTokenStrategies(user, strategyId);

                budget = (user.tradeBalance * (strategy.contribution / 100)) / strategiesCount; //Calculate budget per order
            }

            const qty = roundQtyToNDecimal(budget / price, token.minQty) * token.leverage; //Calculate qty per order
            if (qty >= token.minQty) {
                data.push({
                    userId: user.id,
                    budget: qty * price,
                    commissionPercent: await calculateCommissionPercent(user),
                    qty,
                });
            }
        }
    }
    return data;
};

/* --------------------------------------------------------------------------*
 * When order closed => all sub orders are closed and calculated profit *
 *---------------------------------------------------------------------------*/
let processCloseQueue = new Set<string>();
let processQueue = new Set<string>();
export const closeOrderAndStoploss = async (order: Order, token: Token, allowTrigger = true) => {
    if (!processCloseQueue.has(order.orderId)) {
        processCloseQueue.add(order.orderId);
        const tokenUSDT = token.name + token.stable;
        const side = order.side === "short" ? "BUY" : "SELL";
        const qty = order.qty;
        const payload = __payloadCloseOrder({ token: tokenUSDT, side, qty }, token.minQty);

        // 1. Close order
        const response = await API_closeOrder(payload);

        if (response.status == 200) {
            const markPrice = parseFloat(response.data.avgPrice);

            if (!processQueue.has(order.orderId)) {
                processQueue.add(order.orderId);
                await cancelStoplossAndUpdateOrder(order, token, markPrice);
                processQueue.delete(order.orderId);

                // Nếu cho phép mở thêm 1 lệnh
                if (allowTrigger) {
                    const strategy = await prisma.strategy.findUnique({ where: { id: order.strategyId } });
                    const last5Dcandles = await getLastNDayCandle(token.name, 6);
                    // Kiểm tra chỉ có parent strategy được phép mở thêm 1 lệnh
                    if (strategy && strategy.parentStrategy === null && last5Dcandles) {
                        const isAllGreen = last5Dcandles.slice(0, 5).every((candle: candleType) => candle.Close > candle.Open);
                        const isAllRed = last5Dcandles.slice(0, 5).every((candle: candleType) => candle.Close < candle.Open);

                        const rule = isAllGreen || isAllRed ? "FIVE_SAME_COLOR" : "DEFAULT";

                        const triggerStrategies = await prisma.strategy.findMany({
                            where: {
                                triggerRule: rule,
                                isActive: true,
                                parentStrategy: order.strategyId, // bảo đảm chỉ lấy strategy gốc
                            },
                        });

                        if (triggerStrategies.length > 0) {
                            let side = order.side;
                            if (triggerStrategies[0].direction === "OPPOSITE") {
                                if (order.side === "long") side = "short";
                                else side = "long";
                            }

                            setTimeout(async () => {
                                await openRootOrder(token!, triggerStrategies[0], side);
                            }, 5000);
                        }
                    }
                }
            }
            processCloseQueue.delete(order.orderId);
            return { status: 200 };
        } else {
            const errorLog = `Can't cancel root order id: ${order.orderId} - handleRootOrder`;
            sendTelegramAdminMessage(`Can't cancel root order id: ${order.orderId} - handleRootOrder`);
            writeLog([errorLog, response]);
            logging("error", errorLog);
            return { status: 400 };
        }
    }
};

const recoverLatestOpenOrder = async ({ symbol, side }: { symbol: string; side: "BUY" | "SELL" }) => {
    const positionRes = await API_getOpenPosition(symbol);
    const positionData = positionRes?.data?.[0]; // lấy phần tử đầu tiên

    const positionAmt = Number(positionData?.positionAmt || 0);

    // Step 1
    if (positionAmt === 0) {
        console.log(`Error recoverLatestOpenOrder step 1 ${symbol}`);
        writeLog([`Error recoverLatestOpenOrder step 1 ${symbol}`, positionRes]);
        return null;
    }

    const tradesRes = await API_getRecentFilledOrder(symbol);
    const trades = tradesRes?.data || [];

    const latestSideTrade = trades.filter((t: any) => t.side === side).sort((a: any, b: any) => b.time - a.time)[0];

    // Step 2
    if (!latestSideTrade) {
        console.log(`Error recoverLatestOpenOrder step 2 ${symbol}`);
        writeLog([`Error recoverLatestOpenOrder step 2 ${symbol}`, tradesRes]);
        return null;
    }

    // Step 3
    const orderId = latestSideTrade.orderId;

    const orderDetailRes = await API_verifyOrder(symbol, orderId);

    if (orderDetailRes.status !== 200 || orderDetailRes.data.status !== "FILLED") {
        const log = `Error recoverLatestOpenOrder step 3 ${symbol}`;
        console.log(log);
        sendTelegramAdminMessage(log);
        writeLog([`Error recoverLatestOpenOrder step 3 ${symbol}`, orderDetailRes]);
        return null;
    }

    const orderData = orderDetailRes.data;
    return orderData;
};
