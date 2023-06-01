"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validator: {
            validator: function (v) {
                return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    booksUploaded: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Book',
        },
    ],
    messages: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Messages',
        },
    ],
}, {
    timestamps: true,
});
exports.User = mongoose_1.default.model('User', userSchema);
