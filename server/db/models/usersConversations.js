const Sequelize = require("sequelize");
const db = require("../db");
const Conversation = require("./conversation");
const User = require("./user");

const UsersConversations = db.define("users_conversations", {});
  
  module.exports = UsersConversations;
  
