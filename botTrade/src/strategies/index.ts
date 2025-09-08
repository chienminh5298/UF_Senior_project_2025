import { closeOrderAndStoploss, openRootOrder } from "@src/handleOrders/handleOrder";
import brokerInstancePool from "@src/classes/brokerInstancePool";
import { getOrderSideDependOnDirection } from "@src/utils";
import { Order, Token } from "@prisma/client";
import prisma from "@root/prisma/database";

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

                const broker = brokerInstancePool.getBroker();
                const queryLastDayCandle = await broker!.getLastNDayCandle(token.name, 1);
                let side = "BUY" as "BUY" | "SELL";
                if (queryLastDayCandle) {
                    const prevCandleData = queryLastDayCandle[0];
                    side = getOrderSideDependOnDirection({ direction: strategy.direction, prevClose: prevCandleData.Close, prevOpen: prevCandleData.Open });
                }

                if (strategy.isCloseBeforeNewCandle) {
                    // Close all root
                    await closeAllOrderByToken(token, orders);
                    await openRootOrder({ token, strategy, side });
                } else if (orders.length === 0) {
                    // Open new root order
                    await openRootOrder({ token, strategy, side });
                }
            }
        }
    }
};

const closeAllOrderByToken = async (token: Token, orders: Order[]) => {
    await Promise.all(orders.map((order) => closeOrderAndStoploss(order, token, false)));
};
