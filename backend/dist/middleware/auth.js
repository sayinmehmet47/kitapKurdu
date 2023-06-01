"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
require('dotenv').config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    // Check for token
    if (!token)
        return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, '' + process.env.JWT_SECRET);
        req.body.user = decoded;
        next();
    }
    catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};
exports.auth = auth;
