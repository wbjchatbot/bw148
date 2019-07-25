// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

//为 UserState 和 ConversationState 创建属性访问器。 
//每个状态属性访问器允许获取或设置关联状态属性的值。 
//我们使用每个访问器从存储加载关联的属性，并从缓存中检索其当前状态。
class StateManagementBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        // Create the state property accessors for the conversation data and user profile.
        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;
        //从机器人访问状态
        //前面几个部分介绍了将状态属性访问器添加到机器人的初始化时步骤。 现在，我们可以在运行时使用这些访问器来读取和写入状态信息。 
        //如果 userProfile.Name 为空且 conversationData.PromptedUserForName 为 true，我们会检索提供的用户名并将其存储在用户状态中。
        //userProfile.Name 为空且 conversationData.PromptedUserForName 为 false，我们会请求用户提供其名称。
        //如果 userProfile.Name 以前已存储，我们会从用户输入中检索消息时间和通道 ID，将所有数据回显给用户，然后将检索的数据存储在聊天状态中。
        this.onMessage(async (turnContext, next) => {
            // Get the state properties from the turn context.
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationData.get(
                turnContext, { promptedForUserName: false });
        
            if (!userProfile.name) {
                // First time around this is undefined, so we will prompt user for name.
                if (conversationData.promptedForUserName) {
                    // Set the name to what the user provided.
                    userProfile.name = turnContext.activity.text;
        
                    // Acknowledge that we got their name.
                    await turnContext.sendActivity(`Thanks ${ userProfile.name }.`);
        
                    // Reset the flag to allow the bot to go though the cycle again.
                    conversationData.promptedForUserName = false;
                } else {
                    // Prompt the user for their name.
                    await turnContext.sendActivity('What is your name?');
        
                    // Set the flag to true, so we don't prompt in the next turn.
                    conversationData.promptedForUserName = true;
                }
            } else {
                // Add message details to the conversation data.
                conversationData.timestamp = turnContext.activity.timestamp.toLocaleString();
                conversationData.channelId = turnContext.activity.channelId;
        
                // Display state data.
                await turnContext.sendActivity(`${ userProfile.name } sent: ${ turnContext.activity.text }`);
                await turnContext.sendActivity(`Message received at: ${ conversationData.timestamp }`);
                await turnContext.sendActivity(`Message received from: ${ conversationData.channelId }`);
            }
            this.onDialog(async (turnContext, next) => {
                // Save any state changes. The load happened during the execution of the Dialog.
                await this.conversationState.saveChanges(turnContext, false);
                await this.userState.saveChanges(turnContext, false);
            
                // By calling next() you ensure that the next BotHandler is run.
                await next();
            });
        } 
,)}}