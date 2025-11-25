"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const prismaClient_1 = __importDefault(require("../src/models/prismaClient"));
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prismaClient_1.default.$connect();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
});
exports.connectDatabase = connectDatabase;
// Graceful shutdown - disconnect on process termination
process.on('beforeExit', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient_1.default.$disconnect();
}));
exports.default = prismaClient_1.default;
