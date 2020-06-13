// Upon refresh of page the following happing in order:
//1. initWeb3();
//2. initContract();
//3. getContractProperties();
//4. displayMyAccountInfo();
//5. checkUserRegistration();
//6. registerUser() getMyInboxSize();
//7. receiveMessages();

var myInboxSize = 0;
var myGroupInboxSize=0;
var replyToAddress="0x";
var sendsingle="";
var sendmultiple="";
var sendgroup="";
var usermap=new Map();
var currentUser="";
usermap.set("0x60e2b4be07c73e0b895e7d6ad58040a1c12232d1","Rohit Kumar");
usermap.set("0xcf2f658e915cbd7b2a7c481e6ae9f58683cde91d","Admin");
usermap.set("0xbec7ff2c7bfdab56aa9e3fe0cf9e4de8e98839cc","Aryan Kapoor");
  usermap.set("0xa23d8a5c23c0e79932f07b64475bf41138ffcac1","Apoorv Setpal");
usermap.set("0x0e556ffac0bcc317dc7d43febcf28457245d7392","Paritosh Jacob");

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Initialize web3 and set the provider to the testRPC.
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      App.web3Provider = web3.currentProvider;
      App.setStatus("Voila! MetaMask detected");
    } else {
      // set the provider you want from Web3.providers
      alert("Error: Please install MetaMask then refresh this page.")
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      return null;
    }
    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your account, please try again later.");
        return;
      }
      account = accs[0];
      if (!account) {
        App.setStatus("Please login to MetaMask");
        //alert("Could not fetch your account. Make sure you are logged in to MetaMask, then refresh the page.");
        return;
      }
      return App.initContract();
    });
  },

  initContract: function() {
    $.getJSON('BlockChat.json', function(BlockChatArtifact) {
      // Get the necessary contract artifact file and use it to instantiate a truffle contract abstraction.
      App.contracts.BlockChat = TruffleContract(BlockChatArtifact);
      // Set the provider for our contract.
      App.contracts.BlockChat.setProvider(App.web3Provider);
      return App.getContractProperties();
    });
  },

  getContractProperties: function() {
    var self = this;
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.getContractProperties.call({from: account});
    }).then(function(value) {
      var networkAddress = App.contracts.BlockChat.address;
      document.getElementById("contractAddress").innerHTML = networkAddress;
      var by = value[0];
      var registeredUsersAddress = value[1];
      var numRegisteredUsers = registeredUsersAddress.length;
      var select = '';
      for (i = 0; i < numRegisteredUsers; i++) {
        select += '<option val=' + i + '>' + registeredUsersAddress[i] + '</option>';
      }
      $('#registeredUsersAddressMenu').html(select);
      document.getElementById("contractOwner").innerHTML = by;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("");
    });
    return App.displayMyAccountInfo();
  },

  displayMyAccountInfo: function() {
    web3.eth.getAccounts(function(err, account) {
      if (err === null) {
        App.account = account;
        document.getElementById("myAddress").innerHTML = account[0];
        currentUser=account[0];
        web3.eth.getBalance(account[0], function(err, balance) {
          if (err === null) {
            if (balance == 0) {
              alert("Your account has zero balance. You must transfer some Ether to your MetaMask account to be able to send messages with BlockChat. Just come back and refresh this page once you have transferred some funds.");
              App.setStatus("Please buy more Ether");
              return;
            } else {
              document.getElementById("myBalance").innerHTML = web3.fromWei(balance, "ether").toNumber() + " Ether";
              return App.checkUserRegistration();
            }
          } else {
            console.log(err);
          }
        });
      }
    });
    
  },
  setStatus: function(message) {
    document.getElementById("status").innerHTML = message;
  },
  checkUserRegistration: function() {
    var self = this;
    self.setStatus("Checking user registration...please wait");
    //populating group picker
    var s='';
    for (var i = 0; i < sessionStorage.length; i++){
      //validating if user belongs in that group
      var user=JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
      var user=user.replace(/,\s*$/, "");
      console.log("all users:"+user);
      var userarray=user.split(",");
      console.log("user array:"+userarray);
      console.log("isarray:"+Array.isArray(userarray));
      var curruseraddress=currentUser;
      console.log("curruseraddress:"+curruseraddress)
      console.log("real test:"+userarray.includes(curruseraddress));
      if(userarray.includes(curruseraddress)) {
      s += '<option val=' + i + '>' +sessionStorage.key(i)+ '</option>';
      console.log("key:"+sessionStorage.key(i));
      }
    }
    $('#registeredGroups').html(s);
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.checkUserRegistration.call({from: account});
    }).then(function(value) {
      if (value) {
        console.log(value);
        self.setStatus("User is registered...ready");
      } else {
        if (confirm("New user: we need to setup an inbox for you on the Ethereum blockchain.")) {
          App.registerUser();
        } else {
          return null;
        }
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error checking user registration; see log");
    });
    return App.getMyInboxSize();
  },

  registerUser: function() {
    var self = this;
    App.setStatus("User registration:(open MetaMask->submit->wait)");
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.registerUser({}, {
        from: account,
        gas: 6385876,
        gasPrice: 20000000000
      });
    }).then(function(result) {
      var gasUsedWei = result.receipt.gasUsed;
      var gasUsedEther = web3.fromWei(gasUsedWei, "ether");
      self.setStatus("User is registered\n\nMoney spent: " + gasUsedWei*0.000000000000000001*15032.47 + "Rupees");
      alert("A personal inbox has been established for you on the Ethereum blockchain. You're all set!");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error logging in; see log");
    });

    return null;
  },

  getMyInboxSize: function() {
    var self = this;
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.getMyInboxSize.call({from: account});
    }).then(function(value) {
      // Set global variable
      myInboxSize = value[1];
      if (myInboxSize > 0) {
        document.getElementById("receivedTable").style.display = "inline";
        return App.receiveMessages();
      } else {
        document.getElementById("receivedTable").style.display = "none";
        return null;
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("");
    });
    return App.getMyGroupInboxSize();
  },
  //get group size
  getMyGroupInboxSize: function() {
    var self = this;
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.getMyGroupInboxSize.call({from: account});
    }).then(function(value) {
      // Set global variable
      myGroupInboxSize = value[1];
      if (myGroupInboxSize > 0) {
        document.getElementById("receivedGroupTable").style.display = "inline";
        return App.receiveGroupMessages();
      } else {
        document.getElementById("receivedGroupTable").style.display = "none";
        return null;
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("");
    });
  },
  sendMessage: function() {
    //var receiver = document.getElementById("receiver").value;
    var receiver=sendsingle;
    if (receiver == "") {
      App.setStatus("Send address cannot be empty");
      return null;
    }
    if (!web3.isAddress(receiver)) {
      App.setStatus("You did not enter a valid Ethereum address");
      return null;
    }
    var myAddress = document.getElementById("myAddress").innerHTML;
    var newMessage = document.getElementById("message").value;
    if (newMessage == "") {
      App.setStatus("Oops! Message is empty");
      return null;
    }
    document.getElementById("message").value = "";
    document.getElementById("sendMessageButton").disabled = true;
    this.setStatus("Sending message:(open MetaMask->submit->wait)");
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.sendMessage(receiver, newMessage, {
        from: account,
        gas: 6385876,
        gasPrice: 20000000000
      });
    }).then(function(result) {
      console.log(result);
      var gasUsedWei = result.receipt.gasUsed;
      var gasUsedEther = web3.fromWei(gasUsedWei, "ether");
      console.log("we are above message change in single send");
      if(usermap.has(receiver)) {
      App.setStatus("Message successfully sent to : "+usermap.get(receiver)+"\n\nMoney spent: "+ gasUsedWei*0.000000000000000001*15032.47 + "Rupees");
      }
      else {
        App.setStatus("Message successfully sent to : abcde\n\nMoney spent: " + gasUsedWei*0.000000000000000001*15032.47 + "Rupees");

      }
      document.getElementById("sendMessageButton").disabled = false;
      document.getElementById("message").value = "";
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending message; see log");
    });
  },
  //send group message start
  sendGroupMessage: function() {
    var selectgroup= document.getElementById("registeredGroups");
    var groupname = selectgroup.options[selectgroup.selectedIndex].innerHTML;
    console.log("current group:"+groupname);
    var strwithoutcomma=sessionStorage.getItem(groupname);
    console.log("retireved from session storage:"+JSON.parse(strwithoutcomma));
    strwithoutcomma=JSON.parse(strwithoutcomma);
    strwithoutcomma = strwithoutcomma.replace(/,\s*$/, "");
    var receiver = strwithoutcomma.split(",");
    if (receiver == "") {
      App.setStatus("Send address cannot be empty");
      return null;
    }
    var myAddress = document.getElementById("myAddress").innerHTML;
    var newMessage = document.getElementById("message").value;
    if (newMessage == "") {
      App.setStatus("Oops! Message is empty");
      return null;
    }
    document.getElementById("message").value = "";
    document.getElementById("sendMessageButton").disabled = true;
    this.setStatus("Sending message:(open MetaMask->submit->wait)");
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.sendGroupMessage(receiver, groupname, newMessage, {
        from: account,
        gas: 6385876,
        gasPrice: 20000000000
      });
    }).then(function(result) {
      console.log(result);
      var gasUsedWei = result.receipt.gasUsed;
      var gasUsedEther = web3.fromWei(gasUsedWei, "ether");
      console.log("we are above message change in single send");
      App.setStatus("Message successfully sent to : "+groupname+"\n\nMoney spent: "+ gasUsedWei*0.000000000000000001*15032.47 + "Rupees");
      document.getElementById("sendMessageButton").disabled = false;
      document.getElementById("message").value = "";
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending message; see log");
    });
  },
  //send group message end
  //broadcasting message
  broadcastMessages:function(){
    var self=this;
    //var strwithoutcomma=document.getElementById("multiplereceiver").value;
    var namestoprintinstatus=document.getElementById("multiplereceiver").value;
    namestoprintinstatus=namestoprintinstatus.replace(/,\s*$/, "");
    var strwithoutcomma=sendmultiple;
    strwithoutcomma = strwithoutcomma.replace(/,\s*$/, "");
    var receiver = strwithoutcomma.split(",");
    if (receiver == "") {
      App.setStatus("Send address cannot be empty");
      return null;
    }
    var newMessage = document.getElementById("message").value;
    if (newMessage == "") {
      App.setStatus("Oops! Message is empty");
      return null;
    }
    document.getElementById("message").value = "";
    document.getElementById("sendMessageButton").disabled = true;
    this.setStatus("Sending message:(open MetaMask->submit->wait)");
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.broadcastMessage(receiver, newMessage, {
        from: account,
        gas: 6385876,
        gasPrice: 20000000000
      });
    }).then(function(result) {
      console.log(result);
      var gasUsedWei = result.receipt.gasUsed;
      var gasUsedEther = web3.fromWei(gasUsedWei, "ether");
      console.log("we are above message change in broadcast");
      self.setStatus("Message successfully broadcasted to: "+receiver.length+" users\n\nUsers are:"+namestoprintinstatus+"\n\nMoney spent: " + gasUsedWei*0.000000000000000001*15032.47 + "Rupees");
      document.getElementById("sendMessageButton").disabled = false;
      document.getElementById("message").value = "";
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending message; see log");
    });
  },

  receiveMessages: function() {
    var self = this;
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.receiveMessages.call({}, {from: account});
    }).then(function(value) {
      var content = value[0];
      console.log(content);
      var timestamp = value[1];
      var sender = value[2];
      for (var m = 0; m < myInboxSize; m++) {
        var tbody = document.getElementById("mytable-tbody");
        var row = tbody.insertRow();
        var cell1 = row.insertCell();
        //coverting date accurately
        var d=new Date(0);
        d.setUTCSeconds(timestamp[m]);
        var month = d.getUTCMonth() + 1; //months from 1-12
        var day = d.getUTCDate();
        var year = d.getUTCFullYear();
        var hours = d.getHours();
        var min = d.getMinutes();
        var sec= d.getSeconds();
        var time=hours+":"+min+":"+sec
        var newdate = year + "/" + month + "/" + day+ " "+time;
        console.log(newdate);
        cell1.innerHTML = newdate;
        var cell2 = row.insertCell();
        cell2.innerHTML = sender[m];
        var cell3 = row.insertCell();
        var thisRowReceivedText = content[m].toString();
        console.log("recieved before ascii:"+thisRowReceivedText);
        var receivedAscii = web3.toAscii(thisRowReceivedText);
        console.log("recieved after ascii:"+receivedAscii);
        var thisRowSenderAddress = sender[m];
        cell3.innerHTML = receivedAscii;
        cell3.hidden = true;
      }
      var table = document.getElementById("mytable");
      var rows = table.rows;
      for (var i = 1; i < rows.length; i++) {
        rows[i].onclick = (function(e) {
          replyToAddress = this.cells[1].innerHTML;
          var thisRowContent = (this.cells[2].innerHTML);
          document.getElementById("reply").innerHTML = thisRowContent;
        });
      }
      // create inbox clear all button
      var clearInboxButton = document.createElement("button");
      clearInboxButton.id = "clearInboxButton";
      clearInboxButton.type = "clearInboxButton";
      clearInboxButton.disabled = false;
      clearInboxButton.style.width = "100%";
      clearInboxButton.style.height = "30px";
      clearInboxButton.style.margin = "15px 0px";
      clearInboxButton.innerHTML = "Clear inbox";
      document.getElementById("receivedTable").appendChild(clearInboxButton);
      clearInboxButton.addEventListener("click", function() {
        document.getElementById("clearInboxButton").disabled = true;
        App.clearInbox();
      });
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting messages; see log");
    });
    return;
  },
  //group message recieve
  receiveGroupMessages: function() {
    var self = this;
    var meta;
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.receiveGroupMessages.call({}, {from: account});
    }).then(function(value) {
      var content = value[0];
      var groupname=value[1];
      var timestamp = value[2];
      var sender = value[3];
      for (var m = 0; m < myGroupInboxSize; m++) {
        var tbody = document.getElementById("myGrouptable-tbody");
        var row = tbody.insertRow();
        var cell1 = row.insertCell();
        //coverting date accurately
        var d=new Date(0);
        d.setUTCSeconds(timestamp[m]);
        var month = d.getUTCMonth() + 1; //months from 1-12
        var day = d.getUTCDate();
        var year = d.getUTCFullYear();
        var hours = d.getHours();
        var min = d.getMinutes();
        var sec= d.getSeconds();
        var time=hours+":"+min+":"+sec
        var newdate = year + "/" + month + "/" + day+ " "+time;
        console.log(newdate);
        cell1.innerHTML = newdate;
        cell1.innerHTML = timestamp[m];
        var cell2 = row.insertCell();
        cell2.innerHTML = sender[m];
        var cell3= row.insertCell();
        var showgroupname=groupname[m].toString();
        var groupnameAscii=web3.toAscii(showgroupname);
        cell3.innerHTML=groupnameAscii;
        var cell4 = row.insertCell();
        var thisRowReceivedText = content[m].toString();
        var receivedAscii = web3.toAscii(thisRowReceivedText);
        console.log("message is:"+receivedAscii);
        var thisRowSenderAddress = sender[m];
        cell4.innerHTML = receivedAscii;
        cell4.hidden = true;
      }
      var table = document.getElementById("myGrouptable");
      var rows = table.rows;
      for (var i = 1; i < rows.length; i++) {
        rows[i].onclick = (function(e) {
          replyToAddress = this.cells[1].innerHTML;
          var thisRowContent = (this.cells[3].innerHTML);
          console.log("messagetoprint:"+thisRowContent);
          document.getElementById("replygroup").innerHTML = thisRowContent;
        });
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting messages; see log");
    });
    return;
  },
  clearInbox: function() {
    var self = this;
    var meta;
    this.setStatus("Clearing inbox:(open MetaMask->submit->wait)");
    App.contracts.BlockChat.deployed().then(function(instance) {
      meta = instance;
      return meta.clearInbox({}, {
        from: account,
        gas: 6385876,
        gasPrice: 20000000000
      });
    }).then(function(value) {
      var clearInboxButton = document.getElementById("clearInboxButton");
      clearInboxButton.parentNode.removeChild(clearInboxButton);
      $("#mytable tr").remove();
      document.getElementById("receivedTable").style.display = "none";
      alert("Your inbox was cleared");
      self.setStatus("Inbox cleared");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error clearing inbox; see log");
    });
  },

  replyToMessage: function() {
    document.getElementById("message").focus();
    document.getElementById("message").select();
    sendsingle=replyToAddress;
    if(usermap.has(replyToAddress)) {
    document.getElementById("receiver").value = usermap.get(replyToAddress);
    }
    else {
      document.getElementById("receiver").value = "abcde"; 
    }
  },

  copyAddressToSend: function() {
    var sel = document.getElementById("registeredUsersAddressMenu");
    var copyText = sel.options[sel.selectedIndex];
    sendsingle=copyText.innerHTML;
    console.log(copyText.innerHTML);
    console.log(usermap.has(copyText.outerHTML));
    if(usermap.has(copyText.innerHTML)) {
    document.getElementById("receiver").value = usermap.get(copyText.innerHTML);
    }
    else{
    document.getElementById("receiver").value = "abcde"; 
    }
    document.getElementById("message").focus();
    document.getElementById("message").select();
  },
  //broadcast
  copyAddressToMultipleSend: function() {
    var sel = document.getElementById("registeredUsersAddressMenu");
    var copyText = sel.options[sel.selectedIndex];
    sendmultiple+=copyText.innerHTML+",";
    if(usermap.has(copyText.innerHTML)) {
    document.getElementById("multiplereceiver").value += usermap.get(copyText.innerHTML)+",";
    }
    else{
    document.getElementById("multiplereceiver").value += "abcde"+",";
    }
    //document.getElementById("message").focus();
    document.getElementById("message").select();
  },
  copyAddressToGroupSend: function() {
    var sel = document.getElementById("registeredUsersAddressMenu");
    var copyText = sel.options[sel.selectedIndex];
    sendgroup+=copyText.innerHTML+",";
    if(usermap.has(copyText.innerHTML)) {
    document.getElementById("groupreceiver").value += usermap.get(copyText.innerHTML)+",";
    }
    else{
    document.getElementById("groupreceiver").value += "abcde"+",";
    }
    //document.getElementById("message").focus();
    //document.getElementById("message").select();
  },
  createGroup: function() {
    var self=this;
    var groupname=document.getElementById("groupname").value;
    sessionStorage.setItem(groupname, JSON.stringify(sendgroup));
    self.setStatus("group created:"+groupname);
    for (var i = 0; i < sessionStorage.length; i++){
      //validating if user belongs in that group
    var user=JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
    var user=user.replace(/,\s*$/, "");
    console.log("all users:"+user);
    var userarray=user.split(",");
    console.log("user array:"+userarray);
    console.log("isarray:"+Array.isArray(userarray));
    var curruseraddress=currentUser;
    console.log("curruseraddress:"+curruseraddress)
    console.log("real test:"+userarray.includes(curruseraddress));
    var select='';
    if(userarray.includes(curruseraddress)) {
      select += '<option val=' + i + '>' +sessionStorage.key(i)+ '</option>';
      }
    }
    $('#registeredGroups').html(select);
  }

};

$(document).ready(function() {
App.init();
});
