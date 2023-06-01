"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Books = exports.schema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.schema = new mongoose_1.default.Schema({
    name: {
        type: String,
    },
    file: {
        type: String,
    },
    size: {
        type: Number,
    },
    url: {
        type: String,
    },
    date: {
        type: Date,
    },
    uploader: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { collection: 'ilkparti' });
exports.Books = mongoose_1.default.model('Books', exports.schema);
