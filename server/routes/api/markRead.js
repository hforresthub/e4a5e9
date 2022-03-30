const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get current number of unread messages for all convos for a user

router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const convoId = req.body.convoId;

    // update messages not sent by user, for that convo, to read
    const readMessages = await Message.update({ readReceipt: true }, {
      where: { senderId: { [Op.not]: userId, }, conversationId: convoId },
    })

    res.json("");

  } catch (error) {
    next(error);
  }
});

module.exports = router;
