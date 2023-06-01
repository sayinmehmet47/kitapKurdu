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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const Messages_1 = require("../../models/Messages");
const router = express_1.default.Router();
router.get('/userMessages', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userMessages = yield Messages_1.Messages.find({}).populate('sender', 'username email _id isAdmin createdAt updatedAt messages');
    res.json(userMessages);
}));
router.post('/userMessages', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, sender } = req.body;
    const userMessages = new Messages_1.Messages({
        text,
        date: new Date(),
        sender,
    });
    yield userMessages.save();
    res.json({ status: 'Message Sent' });
}));
router.delete('/deleteMessage', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body.id;
    if (!req.body.user.isAdmin) {
        return res.status(401).json({ msg: 'Not authorized to delete message' });
    }
    if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
    }
    Messages_1.Messages.findByIdAndDelete(id, (err, data) => {
        if (err)
            console.log(err);
        if (!data) {
            return res.status(404).json({ msg: 'Message not found' });
        }
        res.json(data);
    });
}));
module.exports = router;
