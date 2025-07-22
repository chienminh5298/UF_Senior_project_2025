interface targetType {
    targetId: number;
    markPrice: number;
}

let storage: {
    [orderId: string]: targetType;
} = {};

class TargetStorage {
    constructor() {}
    addTarget(orderId: string, target: targetType) {
        storage[orderId] = target;
    }
    getTarget(orderId: string) {
        return storage[orderId];
    }
    removeTarget(orderId: string) {
        delete storage[orderId];
    }
    updateTarget(orderId: string, newTarget: targetType) {
        storage[orderId] = newTarget;
    }
    getStorage() {
        return storage;
    }
}

export default TargetStorage;
