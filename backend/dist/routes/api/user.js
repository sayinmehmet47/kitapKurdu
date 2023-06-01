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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../../models/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../middleware/auth");
const mongoose_1 = require("mongoose");
const router = express_1.default.Router();
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield User_1.User.findOne({ username });
        if (!user)
            throw new mongoose_1.Error('User not found');
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            throw new mongoose_1.Error('Incorrect password');
        const token = jsonwebtoken_1.default.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || '', { expiresIn: '4h' });
        res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
}));
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, isAdmin } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
            msg: 'Please enter all fields',
        });
    }
    try {
        const user = yield User_1.User.findOne({ email });
        if (user)
            throw new mongoose_1.Error('User already exists');
        const salt = yield bcrypt_1.default.genSalt(10);
        if (!salt)
            throw new mongoose_1.Error('Something went wrong with bcrypt');
        const hash = yield bcrypt_1.default.hash(password, salt);
        if (!hash)
            throw new mongoose_1.Error('Something went wrong hashing the password');
        const newUser = new User_1.User({
            username,
            email,
            password: hash,
            isAdmin,
        });
        const savedUser = yield newUser.save();
        if (!savedUser)
            throw new mongoose_1.Error('Something went wrong saving the user');
        const token = jsonwebtoken_1.default.sign({ id: savedUser._id, isAdmin: savedUser.isAdmin }, process.env.JWT_SECRET || '', { expiresIn: '4h' });
        res.status(200).json({
            token,
            user: {
                id: savedUser.id,
                username: savedUser.username,
                email: savedUser.email,
            },
        });
    }
    catch (e) {
        res.status(400).json({ msg: e.message });
    }
}));
router.get('/auth', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById(req.body.user.id).select('-password');
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        res.json({
            user: {
                _id: user === null || user === void 0 ? void 0 : user._id,
                username: user === null || user === void 0 ? void 0 : user.username,
                isAdmin: user === null || user === void 0 ? void 0 : user.isAdmin,
                email: user === null || user === void 0 ? void 0 : user.email,
                createdAt: user === null || user === void 0 ? void 0 : user.createdAt,
                updatedAt: user === null || user === void 0 ? void 0 : user.updatedAt,
            },
            token: token,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
// router.post('/updateUser', auth, async (req, res) => {
//   Books.find({}).then((books) => {
//     User.findOne({ username: 'mehmesayin' }).then((user) => {
//       user.booksUploaded = books;
//       user.save();
//     });
//   });
// });
module.exports = router;
