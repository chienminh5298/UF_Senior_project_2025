let storage: string[] = [];

class ProcessCloseOrderQueue {
    constructor() {}
    addOrder(orderId: string) {
        storage.push(orderId);
    }
    isProcess(orderId: string) {
        return storage.includes(orderId);
    }
    removeOrder(orderId: string) {
        storage = storage.filter((item) => item != orderId);
    }
}

export default ProcessCloseOrderQueue;
