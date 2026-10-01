import { verifyAuthToken } from '../utils/authToken.js';

export function isAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: 'Please sign in to continue' });
    }

    try {
        const decoded = verifyAuthToken(token);
        req.user = decoded.id;
        return next();
    } catch {
        return res.status(401).json({ error: 'Your session is invalid or expired' });
    }
}