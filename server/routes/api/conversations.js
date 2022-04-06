const router = require("express").Router();
const { User, Conversation, Message, UsersConversations } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      // include: { 
      //   model: User,
      //   where: { id: userId }, 
      // },
      attributes: ["id"],
      order: [[Message, "createdAt", "DESC"]],
      include: [
        { model: Message, order: ["createdAt", "DESC"] },
        {
          model: User,
          // as: "user1",
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
          // as: "user2",
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
    // console.log(conversations);
    // const conversations = await Conversation.findAll({
    //   where: {
    //     [Op.or]: {
    //       user1Id: userId,
    //       user2Id: userId,
    //     },
    //   },
    //   attributes: ["id"],
    //   order: [[Message, "createdAt", "DESC"]],
    //   include: [
    //     { model: Message, order: ["createdAt", "DESC"] },
    //     {
    //       model: User,
    //       // as: "user1",
    //       where: {
    //         id: {
    //           [Op.not]: userId,
    //         },
    //       },
    //       attributes: ["id", "username", "photoUrl"],
    //       required: false,
    //     },
    //     {
    //       model: User,
    //       // as: "user2",
    //       where: {
    //         id: {
    //           [Op.not]: userId,
    //         },
    //       },
    //       attributes: ["id", "username", "photoUrl"],
    //       required: false,
    //     },
    //   ],
    // });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();
      console.log('json convo: ', convoJSON);

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.users[0]) {
        convoJSON.otherUser = convoJSON.users[0];
        // delete convoJSON.user1;
      } else if (convoJSON.users[1]) {
        convoJSON.otherUser = convoJSON.users[1];
        // delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // count number of unread messages for a convo
      const numUnread = await Message.count({
        where: {
          [Op.and]: {
            senderId: convoJSON.otherUser.id,
            readReceipt: false,
          }
        },
      });
      convoJSON.numUnread = numUnread;
      convoJSON.lastReadMessage = await Message.findOne({
        where: {
          [Op.and]: {
            senderId: userId,
            readReceipt: true,
          }
        },
        order: [ [ 'createdAt', 'DESC' ]],
      });
      convoJSON.lastReadMessageId = convoJSON.lastReadMessage ? convoJSON.lastReadMessage.dataValues.id : 0;

      // set properties for notification count and latest message preview
      // convoJSON.latestMessageText = convoJSON.messages[0].text;
      convoJSON.latestMessageText = 0;
      console.log('finished convo: ', convoJSON);
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
