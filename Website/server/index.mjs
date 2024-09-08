import express from 'express';
import cors from 'cors';

import paymentRouter from './routes/paymentRouter.mjs';
import loginRouter from './routes/loginRouter.mjs';

import { startPacketCapture } from './middleware/packetAnalyzer.mjs';

const app = express();

app.use(express.json());
app.use(cors());


app.use('/loginApi',loginRouter);
app.use('/payApi',paymentRouter);

app.listen(3000, () => {
    console.log('Server running on port 3000');
    startPacketCapture();
});