export type TargetType = {
    orderId: string;
    targetId: number;
    markPrice: number;
    side: "BUY" | "SELL";
    stoplossId: string | null;
};

let storage: {
    // e.t BTC, SOL, ETH, ....
    [token: string]: {
        [orderId: string]: TargetType;
    };
} = {};

class TargetStorage {
    addTarget({ target, token }: { target: TargetType; token: string }) {
        if (!storage[token]) {
            storage[token] = {};
        }

        storage[token][target.orderId] = target;
    }
    getOrderTargetOfToken(token: string) {
        return storage[token];
    }
    removeTarget({ orderId, token }: { orderId: string; token: string }) {
        if (storage[token][orderId]) {
            delete storage[token][orderId];
        }
    }

    updateTarget({ newTarget, token }: { newTarget: TargetType; token: string }) {
        storage[token][newTarget.orderId] = newTarget;
    }

    getOrder({ token, orderId }: { token: string; orderId: string }) {
        return storage[token][orderId];
    }

    getAll(): typeof storage {
        return storage;
    }
}

// 👉 Export a single shared instance
const targetStorageInstance = new TargetStorage();
export default targetStorageInstance;
