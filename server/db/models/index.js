const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const UsersConversations = require("./usersConversations");

// associations

User.belongsToMany(Conversation, { through: UsersConversations });
Conversation.belongsToMany(User, { through: UsersConversations });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);

module.exports = {
  User,
  Conversation,
  Message
};
