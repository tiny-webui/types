/**
 * There are three types of interactions:
 * 1. Request: request + response / error
 * 2. Stream request: request + stream responses + end response / error
 * 3. Post: request
 */

export type Request = {
    id: number;
    method: string;
    params: unknown;
};

export type Response = {
    id: number;
    result: unknown;
};

export type ErrorResponse = {
    id: number;
    error: {
        code: number;
        message: string;
    }
};

export type StreamEndResponse = {
    id: number;
    end: true;
    result: unknown;
};

export enum ErrorCode {
    NOT_MODIFIED = 304,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    CONFLICT = 409,
    LOCKED = 423,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
};
