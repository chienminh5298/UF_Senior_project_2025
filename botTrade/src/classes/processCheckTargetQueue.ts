let storage: string[] = [];

class ProcessCheckTargetQueue {
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

export default ProcessCheckTargetQueue;
