/**
 * Design principles:
 * 1. No backward compatibility is required. As the server and client's version are always in sync.
 * 2. Simplicity is preferred.
 */

export type SetMetadataParams = {
    /**
     * For example, ['global'] means global metadata,
     * ['user'] means current user's private metadata,
     * ['user', 'public' ] means current user's public metadata,
     * ['chat', '123'] means chat metadata for chat with id 123.
     * ['model', 'abc'] means model metadata for model with id abc.
     */
    path: Array<string>;
    entries: {
        [key: string]: any;
    };
};

export type GetMetadataParams = {
    path: Array<string>;
    keys: Array<string>;
};

export type GetMetadataResult = {
    [key: string]: any;
};

export type DeleteMetadataParams = {
    path: Array<string>;
    keys: Array<string>;
};

export type Message = {
    role: 'user' | 'assistant' | 'developer';
    content: Array<{
        type: 'text' | 'image_url' | 'refusal';
        data: string;
    }>;
};

export type MessageNode = {
    id: string;
    message: Message;
    parent?: string;
    children: Array<string>;
    timestamp: number;
}

export type LinearHistory = Array<Message>;

export type TreeHistory = {
    nodes: {
        [id: string]: MessageNode;
    };
};

export type GetChatListParams = {
    start: number;
    quantity: number;
    /** If no key is specified, no metadata will be returned. */
    metaDataKeys?: Array<string>;
};

export type GetChatListResult = {
    /** This list will be in the reverse order of creation */
    list: Array<{
        id: string;
        metadata?: {
            [key: string]: any;
        };
    }>;
};

export type ChatCompletionParams = {
    id: string;
    /** If parent is not present, treat as a new root. */
    parent?: string;
    modelId: string;
    userMessage: Message;
};

export type ChatCompletionInfo = {
    userMessageId: string;
    assistantMessageId: string;
};

export type executeGenerationTaskParams = {
    modelId: string;
    message: Message;
};

export type GetModelListParams = {
    metadataKeys?: Array<string>;
};

export type GetModelListResult = Array<{
    id: string;
    metadata?: {
        [key: string]: any;
    }
}>;

export type ModelSettings = {
    providerName: string;
    providerParams: any;
};

export type ModifyModelSettingsParams = {
    id: string;
    settings: ModelSettings;
};

export type UserAdminSettings = {
    role: 'admin' | 'user';
};

/** @todo: Update this type according to the cipher. */
export type UserCredential = any;

export type GetUserListParams = {
    metadataKeys?: Array<string>;
};

export type GetUserListResult = Array<{
    id: string;
    userName: string;
    adminSettings: UserAdminSettings;
    publicMetadata: {
        [key: string]: any;
    }
}>;

export type GetUserAnyParams = {
    /** 
     * For admin, the user id.
     * The current user has no knowledge of their id. It's provided by the authentication system.
     */
    id?: string;
};

export type NewUserParams = {
    /** User name cannot be changed. As this is how the admin identifies a user. */
    userName: string;
    adminSettings: UserAdminSettings;
    credential: UserCredential;
};

export type SetUserAdminSettingsParams = {
    id: string;
    adminSettings: UserAdminSettings;
};

/**
 * There are two types of data:
 * 1. Data related to server operations, such as chat history, model parameters, etc.
 *      This kind of data has their own get/set/delete/modify methods.
 *      Data access is controlled by each method.
 * 2. Data not related to server operations, such as chat name, model name, etc.
 *      This kind of data is stored as metadata. They are indexed by a resource path.
 *      | Resource path | Admin       | Current user | Other users |
 *      | --------------|-------------|--------------|-------------|
 *      | global        | Read/Write  | Read         | Read        |
 *      | model, <id>   | Read/Write  | Read         | Read        |
 *      | user          | None        | Read/Write   | None        |
 *      | chat, <id>    | None        | Read/Write   | None        |
 */

/**
 * The server manages each connection's data version.
 * When getting a resource, if the data is up-do-data, the call will fail with a NOT_MODIFIED error.
 * When modifying a resource, if the original data is outdated, the call will fail with a CONFLICT error.
 * The caller should then get the latest data and retry the operation.
 * When modifying a resource that is busy (e.g., a chat with active completion), the call will fail with a LOCKED error.
 * The caller should inform the user to take actions. Auto retry is not recommended.
 */

export interface IServer {
    /** Metadata, chat title, model name, etc. */
    setMetadataAsync(params: SetMetadataParams): Promise<void>;
    getMetadataAsync(params: GetMetadataParams): Promise<GetMetadataResult>;
    deleteMetadataAsync(params: DeleteMetadataParams): Promise<void>;

    /** Chat, current user. */
    getChatListAsync(params: GetChatListParams): Promise<GetChatListResult>;
    newChatAsync(): Promise<string>;
    getChatAsync(id: string): Promise<TreeHistory>;
    deleteChatAsync(id: string): Promise<void>;
    /** There is no set chat call. As modifying the chat content is a side effect of chat completion. */

    /** Model inference */
    /** Current user */
    chatCompletionAsync(params: ChatCompletionParams): AsyncGenerator<string, ChatCompletionInfo, void>;
    /**
     * Execute a one-off generation task. This task is not associated with any chat.
     * This can be used for generating chat titles, summaries, etc.
     * Any user.
     */
    executeGenerationTaskAsync(params: executeGenerationTaskParams): Promise<string>;

    /** Model */
    /** Any user */
    getModelListAsync(params: GetModelListParams): Promise<GetModelListResult>;
    /** Admin */
    newModelAsync(params: ModelSettings): Promise<string>;
    /** Admin */
    getModelAsync(id: string): Promise<ModelSettings>;
    /** Admin */
    deleteModelAsync(id: string): Promise<void>;
    /** Admin */
    modifyModelAsync(params: ModifyModelSettingsParams): Promise<void>;

    /** User management */
    /** Admin */
    getUserListAsync(): Promise<GetUserListResult>;
    /** Admin */
    newUserAsync(params: NewUserParams): Promise<string>;
    /** Admin, current user */
    deleteUserAsync(params: GetUserAnyParams): Promise<void>;
    /**
     * Admin settings: user role, permissions, etc.
     * Read/write for admin. Read only for current user.
     */
    /** Admin, current user */
    getUserAdminSettingsAsync(params: GetUserAnyParams): Promise<UserAdminSettings>;
    /** Admin */
    setUserAdminSettingsAsync(params: SetUserAdminSettingsParams): Promise<void>;
    /**
     * Credential, stuffs used for authentication.
     * Write only for current user.
     * No one should read the credential.
     * The Admin sets the initial credential for a new user.
     * The user should later change it to their own credential before generating any data.
     */
    /** Current user */
    setUserCredentialAsync(params: UserCredential): Promise<void>;
};
