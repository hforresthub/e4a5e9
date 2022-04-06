const { Op } = require("sequelize");
const db = require("../db");
const Message = require("./message");

const Conversation = db.define("conversation", {});

// find conversation given two user Ids

Conversation.findConversation = async function (user1Id, user2Id) {
  const conversation = await Conversation.findOne({
      include: { 
        model: User,
        where: { 
          [Op.or]: {
                  id: user1Id,
                  id: user2Id,
                },
         }, 
      },
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

module.exports = Conversation;
