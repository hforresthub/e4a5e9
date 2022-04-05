const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");

// get current number of unread messages for all convos for a user

router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const convoId = req.body.convoId;

    const currentConvo = await Conversation.findOne({ where: { id: convoId } });
    if (userId !== currentConvo.user1Id && userId !== currentConvo.user2Id) {
      // return res.sendStatus(403);
    }

    // update messages not sent by user, for that convo, to read
    const readMessages = await Message.update({ readReceipt: true }, {
      where: { senderId: { [Op.not]: userId, }, conversationId: convoId },
    })

    return res.sendStatus(204);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
