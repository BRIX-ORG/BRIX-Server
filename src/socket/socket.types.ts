import { Socket } from 'socket.io';

export interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}

export interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
    };
}
