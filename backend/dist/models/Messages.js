"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    text: {
        type: String,
    },
    date: {
        type: Date,
    },
    sender: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { collection: 'messages' });
exports.Messages = mongoose_1.default.model('Messages', schema);
