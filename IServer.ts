/**
 * Design principles:
 * 1. No backward compatibility is required. As the server and client's version are always in sync.
 * 2. Simplicity is preferred.
 */

export type SetMetadataParams = {
    /**
     * For example, ['global'] means global metadata,
     * ['user'] means current user's metadata,
     * ['chat', '123'] means chat metadata for chat with id 123.
     * ['model, 'abc'] means model metadata for model with id abc.
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
    head: string;
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

export type GetLastCompletionInfoResult = {
    userMessageId: string;
    assistantMessageId: string;
};

export type executeGenerationTaskParams = {
    modelId: string;
    promptTemplateName: string;
    promptTemplateParams: Array<string>;
};

export type GetModelListParams = {
    metadataKeys?: Array<string>;
};

export type GetModelListResult = Array<{
    id: string;
    providerName: string;
    metadata?: {
        [key: string]: any;
    }
}>;

export type ProviderParams = any;

export type NewModelParams = {
    providerName: string;
    providerParams: ProviderParams;
};

export type ModifyModelParams = {
    id: string;
    providerParams: ProviderParams;
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

    /** Chat list */
    getChatListAsync(params: GetChatListParams): Promise<GetChatListResult>;

    /** Chat */
    newChatAsync(): Promise<string>;
    getChatAsync(id: string): Promise<TreeHistory>;
    deleteChatAsync(id: string): Promise<void>;

    /** Model inference */
    chatCompletionAsync(params: ChatCompletionParams): AsyncGenerator<string, void, void>;
    /**
     * You need to get the id of the last user message and last assistant message
     * once the chat completion is done.
     */
    getLastCompletionInfoAsync(id: string): Promise<GetLastCompletionInfoResult>;
    /**
     * Execute a one-off generation task. This task is not associated with any chat.
     * This can be used for generating chat titles, summaries, etc.
     */
    executeGenerationTaskAsync(params: executeGenerationTaskParams): Promise<string>;

    /** Model */
    getModelListAsync(params: GetModelListParams): Promise<GetModelListResult>;
    newModelAsync(params: NewModelParams): Promise<string>;
    getModelAsync(id: string): Promise<ProviderParams>;
    deleteModelAsync(id: string): Promise<void>;
    modifyModelAsync(params: ModifyModelParams): Promise<void>;

    /** @todo User management */
};
