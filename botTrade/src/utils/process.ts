import { Order, Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import { closeOrderAndStoploss, openOrder } from "@src/handleOrders/handleOrder";
import { getLastNDayCandle } from "../api/binance";
import { getOrderSideDependOnDirection } from "../utils";

export const checkStrategies = async (token: Token) => {
    if (token.isActive) {
        const strategies = await prisma.strategy.findMany({
            where: {
                isActive: true,
                parentStrategy: null,
            },
            include: {
                tokenStrategies: {
                    where: {
                        tokenId: token.id,
                    },
                },
                targets: {
                    where: {
                        tokenId: token.id,
                    },
                },
            },
        });

        for (const strategy of strategies) {
            // dieu kien dam bao strategy co token nay va co it nhat 2 targets
            if (strategy.tokenStrategies.length > 0 && strategy.targets.length > 1) {
                const childStrategies = (await prisma.strategy.findMany({ where: { parentStrategy: strategy.id }, select: { id: true } })).map((stra: { id: number }) => stra.id);

                const orders: Order[] = await prisma.order.findMany({
                    where: { tokenId: token.id, status: "ACTIVE", strategyId: { in: [strategy.id, ...childStrategies] } },
                });

                const queryLastDayCandle = await getLastNDayCandle(token.name, 1);
                let side = "long" as "long" | "short";
                if (queryLastDayCandle) {
                    const prevCandleData = queryLastDayCandle[0];
                    side = getOrderSideDependOnDirection({ direction: strategy.direction, prevClose: prevCandleData.Close, prevOpen: prevCandleData.Open });
                }

                if (strategy.isCloseBeforeNewCandle) {
                    // Close all root
                    for (const order of orders) {
                        await closeOrderAndStoploss(order, token, false);
                    }

                    // Open new root order
                    await openOrder(token, strategy, side);
                } else if (orders.length === 0) {
                    // Open new root order
                    await openOrder(token, strategy, side);
                }
            }
        }
    }
};
