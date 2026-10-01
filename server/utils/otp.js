import { randomInt } from 'node:crypto';

const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export default generateOtp;