import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
      readReceipt: false,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      setConversations(prev =>
        prev.map((convo) => {
          if (convo.otherUser.id === recipientId) {
            const convoCopy = { ...convo };
            convoCopy.messages = [...convoCopy.messages, message];
            convoCopy.latestMessageText = message.text;
            convoCopy.id = message.conversationId;
            convoCopy.numUnread = 1;
            return convoCopy;
          } else {
            return convo;
          }
        }));
    },
    []
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
        };
        newConvo.latestMessageText = message.text;
        setConversations((prev) => [newConvo, ...prev]);
      }
      setConversations(prev =>
        prev.map((convo) => {
          if (convo.id === message.conversationId) {
            const convoCopy = { ...convo };
            convoCopy.messages = [...convoCopy.messages, message];
            convoCopy.latestMessageText = message.text;
            // if this is the active conversation, mark incoming message as read, otherwise update the unread count 
            if (activeConversation === convoCopy.otherUser.username) {
              const body = { convoId: convo.id };
              markRead(body);
              console.log("convo: ", convoCopy);
              console.log("senderid: ", message.senderId);
              if (message.senderId === convoCopy.otherUser.id) {
                // convoCopy.lastReadMessageId = message.id;
                console.log('emitted');
                socket.emit('current-active-chat', {
                  convoId: convo.id,
                  recipientId: convoCopy.otherUser.id,
                  senderId: message.senderId,
                  messageId: message.id,
                });
              }
            } else if (message.senderId === convoCopy.otherUser.id) {
              convoCopy.numUnread += 1;
            }
            return convoCopy;
          } else {
            return convo;
          }
        })
      );
    }, [activeConversation, socket]);

  const setActiveChat = (username) => {
    if (conversations) {
      setConversations(prev =>
        prev.map((convo) => {
          if (username === convo.otherUser.username) {
            convo.numUnread = 0;
            const body = { convoId: convo.id };
            markRead(body);
          }
          return convo;
        })
      );
    }
    setActiveConversation(username);
  };

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const testSocket = useCallback((id) => {
    console.log('testing sockets');
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const markRead = async (body) => {
    const { data } = await axios.post('/api/markRead', body);
    return data;
  };

  const updateActive = (body) => {
    console.log("updated");
    // const { convoId, senderId, messageId } = body; //recipientId
    // setConversations((prev) =>
    //   prev.map((convo) => {
    //     const convoCopy = { ...convo };
    //     console.log(convoCopy);
    //     if (convoCopy.id === convoId && convoCopy.otherUser.id === senderId) {
    //       convoCopy.lastReadMessageId = messageId;
    //       return convoCopy;
    //     } else {
    //       return convo;
    //     }
    //   })
    // );
  }

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);
    socket.on('current-active-chat', testSocket);
    socket.on('current-active-chat', updateActive);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
      socket.off('current-active-chat', testSocket);
      socket.off('current-active-chat', updateActive);
    };
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, socket, testSocket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        data.forEach(convo => {
          convo.messages.sort((message, nextMessage) => {
            if (message.createdAt < nextMessage.createdAt) {
              return -1
            }
            else {
              return 1
            }
          })
        })
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
