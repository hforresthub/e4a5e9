const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");
const { Messages } = require("../../../client/src/components/ActiveChat");

// get current number of unread messages for all convos for a user

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.post("/", async (req, res, next) => {
  try {
    console.log('test');
    if (!req.user) {
      console.log('no user');
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const convoId = req.body.convoId;
    // const readMessages = await Messages.update({ readReceipt: true }, {
    //   where: { conversationId: convoId },
    // })

    // unnecessary?
    const conversation = await Conversation.findOne({
      where: { id: convoId },
      attributes: ["id"],
      order: [[Message, "createdAt", "DESC"]],
      include: [
        { model: Message, order: ["createdAt", "DESC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });
    const convoJSON = conversation.toJSON();
    
    // set a property "otherUser" so that frontend will have easier access
    if (convoJSON.user1) {
      convoJSON.otherUser = convoJSON.user1;
      delete convoJSON.user1;
    } else if (convoJSON.user2) {
      convoJSON.otherUser = convoJSON.user2;
      delete convoJSON.user2;
    }
    
    // set read receipts to true for other user
    convoJSON.messages.forEach((currentMessage) => {
      if (currentMessage.senderId === convoJSON.otherUser.id) {
        currentMessage.readReceipt = true;
        // currentMessage.save();
      }
    })

    conversation = convoJSON;
    console.log(convoJSON);
    res.json(convoJSON);
  } catch (error) {
    next(error);
  }
});

module.exports = router;