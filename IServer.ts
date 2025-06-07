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
    version?: number;
    start: number;
    quantity: number;
};

export type GetChatListResult = {
    list: Array<{
        id: string;
        title: string;
        timestamp: number;
    }>;
    hasMore: boolean;
};

export type NewChatResult = {
    id: string;
    version: number;
};

export type LockChatParams = {
    id: string;
};

export type LockChatResult = {
    alreadyHeld: boolean;
};

export type GenerateChatTitleParams = {
    modelId: string;
};

export type GenerateChatTitleResult = {
    title: string;
    version: number;
};

export type SetChatTitleParams = {
    title: string;
};

export type SetChatTitleResult = {
    version: number;
};

export type SetMetadataParams = {
    entries: {
        [key: string]: any;
    };
};

export type GetMetadataParams = {
    keys: Array<string>;
};

export type GetMetadataResult = {
    entries: {
        [key: string]: any;
    };
};

export type DeleteMetadataParams = {
    keys: Array<string>;
};

export type ChatCompletionParams = {
    parent?: string;
    modelId: string;
    userMessage: Message;
};

export type GetLastCompletionInfoResult = {
    userMessageId: string;
    assistantMessageId: string;
};

export type ModelInfo = {
    name: string;
};

export type GetModelsResult = {
    [id: string]: ModelInfo;
};

export type ProviderParams = any;

export type NewModelParams = {
    info: ModelInfo;
    providerName: string;
    providerParams: any;
};

export type GetModelParamsParams = {
    id: string;
};

export type ModifyModelParams = {
    id: string;
    info: ModelInfo;
    providerParams: any;
};

export type DeleteModelParams = {
    id: string;
};

export interface IServer {
    /** Chat list */
    /**
     * Get the latest chat list version.
     * The version number is used for syncing the chat list among multiple sessions of the same user.
     * Every write operation to the chat list will change this version number.
     * And should have the new version number returned.
     * The server will call all the user's sessions postChatVersion when the version number changes.
     * If a client find the version number different from its local value, it needs to update the chat list.
     */
    getChatListVersion(): Promise<number>;
    /**
     * If the given chat list version does not match the current one,
     * this call will fail with OUTDATED exception
     */
    getChatList(params: GetChatListParams): Promise<GetChatListResult>;

    /** Chat */
    /**
     * @note This call updates the chat list version.
     */
    newChat(): Promise<NewChatResult>;
    /**
     * This call locks the chat lossy for this session.
     * All chat related calls are only valid when the lock is held by this session.
     * The returned value shows wether the lock was already held by this session.
     * If the lock was not held before, the client's data should be considered outdated.
     * 
     * A newly held lock will deny any other previous session from accessing this chat. 
     * The lock cannot be held if a stream request is in progress. And will fail with a BUSY exception.
     * 
     * If the lock is not held, all chat API calls will fail with a LOCK_NOT_HELD exception.
     * 
     * There is no unlock call. As the lock will be taken if the chat is not busy and requested by another session.
     * This avoids a idle session to hold the lock forever.
     * 
     * @warning Be sensible with the lock. If the lock is taken away. DO NOT take it back right away.
     * @warning DO NOT call this unless you have a good reason. DO NOT call this before all other calls.
     */
    lockChat(params: LockChatParams): Promise<LockChatResult>;
    DeleteChat(): Promise<void>;
    getChat(): Promise<TreeHistory>;

    /** Chat title */
    generateChatTitle(params: GenerateChatTitleParams): Promise<GenerateChatTitleResult>;
    setChatTitle(params: SetChatTitleParams): Promise<SetChatTitleResult>;
  
    /** Chat metadata */
    setChatMetadata(params: SetMetadataParams): Promise<void>;
    getChatMetadata(params: GetMetadataParams): Promise<GetMetadataResult>;
    deleteChatMetadata(params: DeleteMetadataParams): Promise<void>;

    /** Chat */
    chatCompletion(params: ChatCompletionParams): AsyncGenerator<string, void, void>;
    /**
     * You need to get the id of the last user message and last assistant message
     * once the chat completion is done.
     */
    getLastCompletionInfo(): Promise<GetLastCompletionInfoResult>;

    /**
     * Admin/Global settings
     * No locks and versions for settings to avoid unnecessary complication.
     * It is not a common operation for two admins to change settings at the same time.
     * When settings change, the server will call all user's sessions postSettingsChanged method.
     */
    getModels(): Promise<GetModelsResult>;
    /**
     * @note Admin only.
     */
    newModel(params: NewModelParams): Promise<ModelInfo>;
    /**
     * @note Admin only. The params WILL contain credentials.
     */
    getModelParams(params: GetModelParamsParams): Promise<ProviderParams>;
    /**
     * @note Admin only.
     */
    modifyModel(params: ModifyModelParams): Promise<void>;
    /**
     * @note Admin only.
     */
    deleteModel(params: DeleteModelParams): Promise<void>;

    /**
     * DO NOT store sensitive data in the global metadata.
     * The global metadata is read only for all non-admin users.
     */
    // getGlobalMetadata(params: GetMetadataParams): Promise<GetMetadataResult>;
    /**
     * @note Admin only.
     */
    // setGlobalMetadata(params: SetMetadataParams): Promise<void>;
    /**
     * @note Admin only.
     */
    // deleteGlobalMetadata(params: DeleteMetadataParams): Promise<void>;

    /**
     * User settings
     */
    // setUserMetadata(params: SetMetadataParams): Promise<void>;
    // getUserMetadata(params: GetMetadataParams): Promise<GetMetadataResult>;
    // deleteUserMetadata(params: DeleteMetadataParams): Promise<void>;

    /** @todo account settings, user management */
};

type PostChatListVersionParams = {
    version: number;
};

export interface IClient {
    postChatListVersion(params: PostChatListVersionParams) : void;
    postSettingsChanged(): void;
};

