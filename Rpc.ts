/**
 * There are three types of interactions:
 * 1. Request: request + response / error
 * 2. Stream request: request + stream responses + end response / error
 * 3. Post: request
 */

export type Request = {
    id: number;
    method: string;
    params: any;
};

export type Response = {
    id: number;
    result: any;
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
};

export enum ErrorCode {
    OUTDATED,
    BUSY,
    LOCK_NOT_HELD,
    STREAM_INTERRUPTED,
    NOT_FOUND,
};
