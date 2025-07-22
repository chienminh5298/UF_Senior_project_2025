let storage: string[] = [];

class ProcessOrderQueue {
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

export default ProcessOrderQueue;
