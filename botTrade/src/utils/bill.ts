import { calculateCommissionPercent } from "@src/utils";
import prisma from "@root/prisma/database";
import { sendTelegramMessage, telegramNewPillNeedToPayPayload } from "./telegram";

type GenerateBillPayload = {
    referralUserId: number | null;
    status: "NEW";
    userId: number;
    from: Date;
    to: Date;
    netProfit: number;
    adminCommissionPercent: number;
    referralCommissionPercent: number;
    currentUserProfit: number;
};

export const checkGenerateBill = async () => {
    const { orders, from, to } = await getOrdersForBilling();

    let userMap = new Map<number, GenerateBillPayload>();

    // Calculate netProfit of bills
    if (orders.length && from && to) {
        for (const order of orders) {
            const userId = order.userId;
            const refId = order?.user?.referralUserId ?? null;

            if (userMap.has(userId)) {
                const v = userMap.get(userId)!;
                v.netProfit += order.netProfit;
                // giữ các field khác nguyên trạng
            } else {
                const { adminPercent, referralPercent } = await calculateCommissionPercent(order.user!); // Calculate commission percent applied voucher

                userMap.set(userId, {
                    adminCommissionPercent: adminPercent,
                    referralCommissionPercent: referralPercent,
                    referralUserId: refId,
                    status: "NEW",
                    from,
                    to,
                    netProfit: order.netProfit,
                    userId,
                    currentUserProfit: order.user!.profit,
                });
            }
        }
    }

    if (userMap.size === 0) return;

    for (const payload of userMap.values()) {
        // Nếu net profit của bill <= 0 thì không có commission
        if (payload.netProfit <= 0) {
            payload.adminCommissionPercent = 0;
            payload.referralCommissionPercent = 0;
        }
        // Ghi bill xuống DB
        const { userId, currentUserProfit, ...billData } = payload;
        const bill = await prisma.bill.create({
            data: {
                ...billData, // all real Bill columns
                user: { connect: { id: userId } }, // <─ instead of userId: …
            },
        });

        /* Gắn billId vào mọi order thuộc kỳ */
        await prisma.order.updateMany({
            where: {
                userId: payload.userId,
                createdAt: { gte: payload.from },
                updatedAt: { lt: payload.to },
                billId: null, // chỉ update nếu chưa gắn
            },
            data: { billId: bill.id },
        });

        // Update profit for user
        const commission = bill.netProfit > 0 ? bill.netProfit * (bill.adminCommissionPercent + bill.referralCommissionPercent) : 0;
        const user = await prisma.user.update({
            where: {
                id: payload.userId,
            },
            data: {
                profit: payload.currentUserProfit + payload.netProfit - commission,
            },
        });

        // Send telegram message
        const beforeDate = addDays(bill.to, 7); // 7 ngày sau ngày kết thúc kỳ
        const beforeString = formatYYYYMMDD(beforeDate);
        const telegramMessage = telegramNewPillNeedToPayPayload({
            amount: billData.netProfit * (billData.adminCommissionPercent + billData.referralCommissionPercent),
            before: beforeString,
        });
        sendTelegramMessage(telegramMessage, user.telegramChatId);
    }
};

const getOrdersForBilling = async () => {
    const now = new Date(); // 00:00:05 hôm nay
    const day = now.getDate();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0‑based

    let rangeStart: Date; // inclusive
    let rangeEnd: Date; // exclusive

    if (day === 1) {
        // Đang 01/tháng N  ⇒ kỳ cần chốt: 15‑end của tháng N‑1
        rangeStart = new Date(y, m - 1, 15, 0, 0, 0, 0); // 00:00 15 tháng trước
        rangeEnd = new Date(y, m, 1, 0, 0, 0, 0); // 00:00 01 tháng này
    } else if (day === 15) {
        // Đang 15/tháng N  ⇒ kỳ cần chốt: 01‑14 tháng N
        rangeStart = new Date(y, m, 1, 0, 0, 0, 0); // 00:00 01 tháng này
        rangeEnd = new Date(y, m, 15, 0, 0, 0, 0); // 00:00 15 tháng này
    } else {
        // Không phải ngày chốt kỳ
        return {
            orders: [],
            from: null,
            to: null,
        };
    }

    const orders = await prisma.order.findMany({
        where: {
            buyDate: { gte: rangeStart },
            sellDate: { lt: rangeEnd },
            status: "FINISHED",
            billId: null,
        },
        include: {
            user: true,
        },
    });

    /* Prisma query */
    return {
        orders,
        from: rangeStart,
        to: rangeEnd,
    };
};

export const checkAccountNotPayBill = async () => {
    try {
        // 1️⃣  Tạo mốc thời gian 7 ngày trước
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        /* 2️⃣  Lấy ra danh sách userId có bill quá hạn
           - Giả sử bill.status === "NEW" là "chưa thanh toán".
           - Chỉ cần userId nên select nhẹ. */
        const overdueBills = await prisma.bill.findMany({
            where: {
                status: "NEW", // hoặc isPaid: false ...
                createdAt: { lte: oneWeekAgo },
            },
            select: { userId: true },
        });

        if (overdueBills.length === 0) return; // không có ai quá hạn

        /* 3️⃣  Lọc trùng userId */
        const userIds: number[] = Array.from(
            new Set(
                overdueBills.map((b) => b.userId).filter((id): id is number => id !== null) // type‑guard
            )
        );

        /* 4️⃣  Update nhiều user cùng lúc */
        await prisma.user.updateMany({
            where: { id: { in: userIds }, isActive: true },
            data: { isActive: false },
        });
    } catch (err) {
        console.error("⚠️  checkAccountNotPayBill error:", err);
    }
};

// helper (đặt ở utils.ts nếu muốn tái dùng)
const addDays = (date: Date | string, days: number): Date => {
    const d = new Date(date); // luôn tạo bản sao, tránh mutate gốc
    d.setDate(d.getDate() + days); // tự xử lý nhảy tháng/năm, DST
    return d;
};

const formatYYYYMMDD = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
