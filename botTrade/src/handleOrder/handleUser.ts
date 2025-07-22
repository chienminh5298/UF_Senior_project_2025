import { Order, User, UserOrder } from "@prisma/client";

import prisma from "@root/prisma/database";
import { lossMess, profitMess } from "@src/utils/notification";

/*----------------------------------------------------------------------------------------------*
 * Function will calculate earn, profit then update for user and insert into notification table *
 *----------------------------------------------------------------------------------------------*/
export const calculateEarnAndProfitForEachUser = async (order: Order) => {
    let userOrders = await prisma.userOrder.findMany({ where: { orderId: order.orderId }, include: { user: true } });

    if (userOrders) {
        for (const userOrder of userOrders) {
            processUserOrder({ order, userOrder });
        }
    }
};

type ProcessUserOrderType = {
    userOrder: UserOrder & { user: User };
    order: Order;
};

const processUserOrder = async ({ userOrder, order }: ProcessUserOrderType): Promise<void> => {
    const user = userOrder.user;
    const netProfit = userOrder.contributionPercent * order.netProfit;
    const commission = order.netProfit < 0 ? 0 : netProfit * (userOrder.commissionPercent / 100);

    // update userorder commission
    await prisma.userOrder.update({
        where: {
            id: userOrder.id,
        },
        data: { commission },
    });

    const newProfit = user.profit + netProfit;
    const newCommission = user.commission + commission;
    const insurance = user.insurance + commission;

    // update user table
    if (netProfit < 0 && user.availableBalance + netProfit < 0) {
        const left = user.availableBalance + netProfit;

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: { commission: newCommission, profit: newProfit, insurance, availableBalance: 0, tradeBalance: user.tradeBalance + left },
        });
    } else {
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: { commission: newCommission, profit: newProfit, insurance, availableBalance: user.availableBalance + netProfit },
        });
    }

    insertNotification({ netProfit, userId: user.id });

    await prisma.activity.create({
        data: {
            userId: user.id,
            type: 2,
            value: netProfit,
        },
    });
};

const insertNotification = async ({ netProfit, userId }: { netProfit: number; userId: number }): Promise<void> => {
    if (netProfit >= 0) {
        await prisma.notification.create({
            data: { type: "PROFIT", status: true, message: profitMess(netProfit), userId },
        });
    } else {
        await prisma.notification.create({
            data: { type: "LOSS", status: true, message: lossMess(netProfit), userId },
        });
    }
};
