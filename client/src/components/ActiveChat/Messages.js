import React from 'react';
import { Box } from '@material-ui/core';
import { SenderBubble, OtherUserBubble } from '.';
import moment from 'moment';

const Messages = (props) => {
  const { messages, otherUser, userId } = props;

  const checkId = (message) => {
    const lastReadMessage = messages.slice().reverse().find(message => {
      return message.readReceipt && message.senderId === userId;
    });
    const lastReadMessageId = (lastReadMessage ? lastReadMessage.id : messages.slice().reverse().find(message => {
      return message.senderId === userId;
    }).id);

    return lastReadMessageId === message.id;
  }

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format('h:mm');

        return message.senderId === userId ? (
          <SenderBubble
            key={message.id}
            text={message.text}
            time={time}
            readReceipt={message.readReceipt}
            currentUnread={checkId(message)}
            otherUser={otherUser}
          />
        ) : (
          <OtherUserBubble
            key={message.id}
            text={message.text}
            time={time}
            otherUser={otherUser}
          />
        );
      })}
    </Box>
  );
};

export default Messages;
