"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const books = require('./routes/api/books');
const user = require('./routes/api/user');
const messages = require('./routes/api/messages');
app.use(express_1.default.json());
require('dotenv').config();
mongoose_1.default.connect(process.env.MONGO_URI || '').then(() => {
    console.log('Connected to MongoDB');
});
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use('/books', books);
app.use('/user', user);
app.use('/messages', messages);
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express_1.default.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}
const listener = app.listen(process.env.PORT || 5000, () => {
    console.log(`Server started on port pro` + process.env.PORT || 5000);
});
module.exports = listener;
