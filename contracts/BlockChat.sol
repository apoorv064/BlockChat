pragma solidity ^0.4.18;

contract BlockChat {
  // Users transmit "Message" objects that contain the content and data of the intended message
  struct Message {
    address sender;
    bytes32 content;
    uint timestamp;
  }
  //GroupMessage
  struct GroupMessage {
    address sender;
    bytes32 content;
    bytes32 groupname;
    uint timestamp;
  }

  struct ContractProperties {
    address BlockChatOwner;
    address[] registeredUsersAddress;
  }

  struct Inbox {
    uint numSentMessages;
    uint numReceivedMessages;
    mapping (uint => Message) sentMessages;
    mapping (uint => Message) receivedMessages;
  }
  //group
  struct GroupInbox {
    uint numSentGroupMessages;
    uint numReceivedGroupMessages;
    mapping (uint => GroupMessage) sentGroupMessages;
    mapping (uint => GroupMessage) receivedGroupMessages;
  }
  //Inbox mapping
  mapping (address => Inbox) userInboxes;
  mapping (address => bool) hasRegistered;

  //group mapping
  mapping (address => GroupInbox) userGroupInboxes;
  mapping (address => bool) hasRegisteredGroupInbox;

  //Inbox instance
  Inbox newInbox;

  //Message instance
  Message newMessage;

  //GroupMessage instance
  GroupMessage newGroupMessage;

  //group instance
  GroupInbox newGroupInbox;


  uint donationsInWei = 0;
  ContractProperties contractProperties;

  function BlockChat() public {
    // Constructor
    registerUser();
    contractProperties.BlockChatOwner = msg.sender;
  }

  function checkUserRegistration() public view returns (bool) {
    return hasRegistered[msg.sender];
  }

  function clearInbox() public {
    userInboxes[msg.sender] = newInbox;
  }

  function registerUser() public  {
    if(!hasRegistered[msg.sender]) {
      userInboxes[msg.sender] = newInbox;
      hasRegistered[msg.sender] = true;
      contractProperties.registeredUsersAddress.push(msg.sender);
    }
    //registering group for
    if(!hasRegisteredGroupInbox[msg.sender]) {
      userGroupInboxes[msg.sender] = newGroupInbox;
      hasRegisteredGroupInbox[msg.sender] = true;
    }
  }

  function getContractProperties() public view returns (address, address[]) {
    return (contractProperties.BlockChatOwner, contractProperties.registeredUsersAddress);
  }

  function sendMessage(address _receiver, bytes32 _content) public {
    newMessage.content = _content;
    newMessage.timestamp = now;
    newMessage.sender = msg.sender;
    
    // Update senders inbox
    Inbox storage sendersInbox = userInboxes[msg.sender];
    sendersInbox.sentMessages[sendersInbox.numSentMessages] = newMessage;
    sendersInbox.numSentMessages++;

    // Update receivers inbox
    Inbox storage receiversInbox = userInboxes[_receiver];
    receiversInbox.receivedMessages[receiversInbox.numReceivedMessages] = newMessage;
    receiversInbox.numReceivedMessages++;
    return;
  }
   //group messages
   function sendGroupMessage(address[] _receiver, bytes32 _groupname, bytes32 _content) public {
    newGroupMessage.content = _content;
    newGroupMessage.timestamp = now;
    newGroupMessage.groupname=_groupname;
    newGroupMessage.sender = msg.sender;
    
    // Update senders groupinbox
    GroupInbox storage sendersGroupInbox = userGroupInboxes[msg.sender];
    sendersGroupInbox.sentGroupMessages[sendersGroupInbox.numSentGroupMessages] = newGroupMessage;
    sendersGroupInbox.numSentGroupMessages++;

    // Update receivers inbox
    for(uint i=0;i<_receiver.length;i++) {
    GroupInbox storage receiversGroupInbox = userGroupInboxes[_receiver[i]];
    receiversGroupInbox.receivedGroupMessages[receiversGroupInbox.numReceivedGroupMessages] = newGroupMessage;
    receiversGroupInbox.numReceivedGroupMessages++;
    }
    return;
  }
  //broadcast message
  function broadcastMessage(address[] _receiver, bytes32 _content) public {
    newMessage.content = _content;
    newMessage.timestamp = now;
    newMessage.sender = msg.sender;
    // Update senders inbox
    Inbox storage sendersInbox = userInboxes[msg.sender];
    sendersInbox.sentMessages[sendersInbox.numSentMessages] = newMessage;
    sendersInbox.numSentMessages++;

    // Update receivers inbox
    for(uint i=0;i<_receiver.length;i++) {
    Inbox storage receiversInbox = userInboxes[_receiver[i]];
    receiversInbox.receivedMessages[receiversInbox.numReceivedMessages] = newMessage;
    receiversInbox.numReceivedMessages++;
    }
    return;
  }

  function receiveMessages() public view returns (bytes32[16], uint[], address[]) {
    Inbox storage receiversInbox = userInboxes[msg.sender];
    bytes32[16] memory content;
    address[] memory sender = new address[](16);
    uint[] memory timestamp = new uint[](16);
    for (uint m = 0; m < 15; m++) {
      Message memory message = receiversInbox.receivedMessages[m];
      content[m] = message.content;
      sender[m] = message.sender;
      timestamp[m] = message.timestamp;
    }
    return (content, timestamp, sender);
  }

  //recieve group messages
  function receiveGroupMessages() public view returns (bytes32[16], bytes32[16], uint[], address[]) {
    GroupInbox storage receiversGroupInbox = userGroupInboxes[msg.sender];
    bytes32[16] memory content;
    bytes32[16] memory groupname;
    address[] memory sender = new address[](16);
    uint[] memory timestamp = new uint[](16);
    for (uint m = 0; m < 15; m++) {
      GroupMessage memory groupmessage = receiversGroupInbox.receivedGroupMessages[m];
      content[m] = groupmessage.content;
      sender[m] = groupmessage.sender;
      timestamp[m] = groupmessage.timestamp;
      groupname[m]=groupmessage.groupname;
    }
    return (content,groupname, timestamp, sender);
  }


  function getMyInboxSize() public view returns (uint, uint) {
    return (userInboxes[msg.sender].numSentMessages, userInboxes[msg.sender].numReceivedMessages);
  }
  //group getgroupsize
  function getMyGroupInboxSize() public view returns (uint, uint) {
    return (userGroupInboxes[msg.sender].numSentGroupMessages, userGroupInboxes[msg.sender].numReceivedGroupMessages);
  }

}
