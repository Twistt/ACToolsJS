/* Main Objects */
function ChatUser(req, res, app) {
	var me = this;
    this.UserName = "";
    this.Password = "";
    this.ID = "";
    this.Messages = [];
    this.Response = res;
    this.Request = req;
	this.BlockedUsers = [];
    this.MyLibrary = [];
	this.TotalShares = 0;
    this.TotalMessages =0;
	this.HasLibraryCard = false;
    this.LoggedIn = false;
	this.isBanned = false;
	this.isCurator = false;
	this.SystemMessages = [];
	this.LastMessage = {};
	this.App = app;
	this.PrivateMessage = function(user, message){
		me.Response.write(message.Message);
	}
	this.onChat = function(user, message){
		me.Response.write(message.Message);
	}
	this.onDisconnect = function(){
		me.LoggedIn = false;
		//req.connection.removeListener('close', me.onDisconnect);
		//app.onChat.removeListener("chat", me.onChat);
		console.log("closed and unsubscribed");
	}
	this.onConnect = function(){
        me.WriteHead();
		me.Response.write(app.Pages.Chatpage);
        me.Response.write(CannedMessages.welcome);
	}
	this.WriteHead = function(){
		res.writeHead(404, {
            'Content-Type': 'text/html; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff'
        });
	}
	this.onChatMessage = function(message){
		me.Response.write(message.Message);
	}
    this.Init = function () {
        me.Request.connection.on('close', me.onDisconnect);
		me.App.onPulse.on("pulse", function(data){
			console.log("doing pulse");
			me.Response.write(data);
		});
    }
	this.Init();
}
function Library(){
	
}
function Application(){
	var http = require("http");
	var qs = require('querystring');
	var uuid = require('uuid');
	var Cookies = require( "cookies" )
	var EventEmitter = require('events');
	var me = this;
	this.Pages = new HtmlPages();
	this.Library = null;
	this.Users =[];
	this.Messages = [];
	this.KeywordBanList =[];
	this.LeywordBlockList =[];
	this.Autoshare = false;
	this.ServerTimeout = 200000;
	this.PortNumber =3000;
	this.onChat = new EventEmitter();
	this.onBan = new EventEmitter();
	this.onPulse = new EventEmitter();
	this.ParseChatMessage = function(m, user){
		return '<div class= "user_'+ m.UserName+' ' + (m.UserName === "System" ? "systemMessage" : "message") + " " + (m.UserName === "Paranoia" ? "paranoiaPink" : "") + " " + (m.UserName === "Library" ? "libraryBlue" : "") +'">' + m.TimeStamp +": " + (sendingUser !== null && sendingUser.HasLibraryCard ? " <span style='color:gold;'>&copy;</span> " : "") + '<span>' + m.UserName + '</span>: ' + m.Message + '</div>'
	}
	
	this.ProcessMessage = function(message, user){
		console.log(message.UserName + ": " + message.Message);
		var parts = message.Message.trim().split(" ");
		var pf = parts[0].trim();
		
		var isPM = (pf === "/pm");
		var isHelp = (pf === "/help");
		var isList = (pf === "/list");
		var isUsers = (pf === "/users");
		var isBlock = (pf === "/block");
		var isSearch = (pf === "/search");
		var isLibrary = (pf === "/library");
		var isLink =  (pf === "/random");
	
		if (message.Message.contains("throbbie.com") || message.Message.length === 0) {
			return;
		}
		//This posts a random link from the filehost (running on the same box).
		if (isLink) {
			GetExternalData();
			return;
		}
		//Check for repeated messages (before parsing)
		try {
			if (user.LastMessage !== undefined) 
			{
				if (message.Message.toString() === user.LastMessage){
					console.log("Found duplicate message.");
					user.Messages.push(new ChatMessage("System", "Your message was rejected by the server (duplicate)."));
					return;
				}
			}
		}
		catch (err){
			//console.log("something went wrong with detecting duplicates - did you just do an admin command?");
		}
		user.LastMessage = message.Message;
		
		
		if (isHelp) {
			var messageText = "Thank you for using Paranoia Chat! <br /> <span style='color:red;'>{ALPHA v1.2}</span><h3>Rules:</h3> <ul>";
			messageText += "<li>Sharing: Users who SHARE content will be ranked up - the blue number next to a poster's name <span style='color:lightblue;'>(99)</span> is indicative of their rank (based on shares)</li>"
			messageText += "<li>Libary: Users who SHARE content and rank up will be given access to the Library (the Library is a <i>searchable</i> database of images)</li>"
			messageText += "<li>Content: Any content goes as long as it is tagged with [tagname].</li>";
			messageText += "<li>Bans: if 3 Library Card holders vote to ban you you will be kicked/blocked and your library points reset to Zero.</li>";
			messageText += "</ul > <br /> Working commands are as follows / help, /users, /list, /library, /search {keywords -eg girl, blah} /block { user }, /pm {name} {message}";
			user.onChatMessage(new ChatMessage("System", messageText));
			return;
		}
		if (isSearch && !user.HasLibraryCard || isLibrary && !user.HasLibraryCard) {
			user.onChatMessage(new ChatMessage("Library", "You must possess a library card to use the search feature. You earn a library card by sharing content with tags [image/movie/gif][subject ie girl] [description ie kissing] http://filehost.onion/blah.jpg "));
			return;
		}
		if (isSearch && user.HasLibraryCard || isLibrary && user.HasLibraryCard) {
			var libraryMessage = "<h4>Library (shhh) Phase 1 of 3</h4>";
			libraryMessage+= "Phase One Library Stats: Items (" + (library.length) + ") ::Phase one allows the search of only ParaChat posted links <b>NOT</b> Paranoia Filehost uploads.<br />";
			libraryMessage+= "Commands: /search {term} or /library {term} - Example: /library toys will produce a list of all library items with the tag '[toy]'<br />";
			var results =[];
			var searchterm = message.Message.substr(message.Message.indexOf(" ")+1, message.Message.length - message.Message.indexOf(" ")).trim().toLowerCase();

			if (searchterm.length > 0){
				libraryMessage+= "Doing search for: <span style='color:yellow;'>" + searchterm + "</span>";
				for (var i =0; i < library.length; i++){
					var book = library[i];
					if (book.Link.toLowerCase().contains(searchterm)) results.push(book);
					if (book.Tags.contains("["+searchterm+"]")) results.push(book);
				}
		
				results.take(25).forEach(function(result){
					libraryMessage += "<br /><a style='margin-left:15px;' href='"+result.Link.replace(" ","%20").replace("paranoia3xj7iobb", "paranoia3nflqz3y")+"' target='_new'>"+result.Tags.join(" ")+" ParaChat=> "+result.Link.replace(" ","%20").replace("paranoia3xj7iobb", "paranoia3nflqz3y.onion")+"</a>";		
				});
				libraryMessage += "<br />" + results.length + " Total Results. Limited to 5 results for phase 1.";	
			}
			
			user.onChatMessage(new ChatMessage("Library", libraryMessage));
			return;
		}

		if (isList || isUsers) {
			var userlist = "";
			for (var i = 0; i < users.where("LoggedIn", true).length; i++) {

				userlist += users[i].UserName;
				if (i < users.length - 1) userlist += ", ";
			}
			user.onChatMessage(new ChatMessage("System", users.length + " Total Users: " + userlist));
			return;
		}
		if (isPM) {
			message.isPrivate = true;
			message.Message = message.Message.substr(4, message.Message.length - 4);
			var usernamepos = message.Message.indexOf(" ");
			if (usernamepos === -1) {
				user.onChatMessage(new ChatMessage("System", "You must enter a message when Privately Messaging someone."));
				return;
			}
			var username = message.Message.substr(0, message.Message.indexOf(" "));
			var pmuser = users.first("UserName", username);
			pmuser.Messages.push(new ChatMessage(user.UserName, "<span style='color:yellow; text-decoration:italic;'>[PM from " + user.UserName + "] " + message.Message + "</span>"));
			user.onChatMessage(new ChatMessage(user.UserName, "<span style='color:yellow; text-decoration:italic;'>[PM to " + pmuser.UserName + "] " + message.Message + "</span>"));
			return;
		}
		if (isBlock) {
			message.Message = message.Message.substr(7, message.Message.length - 7);
			var username = message.Message.substr(0, message.Message.length);
			var pmuser = users.first("UserName", username);
			user.onChatMessage(new ChatMessage(user.UserName, "<span style='color:red; text-decoration:italic;'>[Blocking " + username + "] </span>"));
			user.BlockedUsers.push(pmuser);
			return;
		}
		//everthing thats not a slash command should fall through to this.
		var regex = "((http|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?)";
		var links = message.Message.match(regex);
		while (links != null && links.index > 0) {
			message.Links.push(links[0]);
			message.Message = message.Message.replaceAll(links[0], "");
			if (library.first("Link", links[0]) === null){
				user.TotalShares += 1;
				if (links[0].contains("http://paranoia3nflqz3y.onion/")){
					user.TotalShares += 1;
				}	
			}
			links = message.Message.match(regex);
		}
		
		

		// [tag] [tags] https://www.bing.com/search?q=nodejs+save+file&PC=U316&FORM=CHROMN
		if (message.Links !== null && message.Links.length >0){
			while (message.Message.contains("[") && message.Message.contains("]")) {
				var firstpos = message.Message.indexOf("[");
				var secondpos = message.Message.indexOf("]");
				var tag = message.Message.substr(firstpos, secondpos + 1);
				message.Tags.push(tag);
				message.Message = message.Message.replaceAll(tag, "");
			}
		}
		if (message.Message.contains("localhost")){
			console.log("we found a system generated message.");
			message.Message = message.Message.replace("localhost", "http://paranoia3nflqz3y.onion/P/U/");
			var post = message.Message.split(" ");
			for ( var i=0; i < post.length; i++) {
				if (post[i].contains("[")) message.Tags.push(post[i]);
				if (post[i].contains("http")) message.Links.push(post[i]);
			}
		}
		//[test] [test] http://www.test.com/rawr
		//[est] [test] http://ww.test.com http://test.opnion/asdf.jpg
		if (message.Links.length >0){
			
			for (var i=0; i < message.Links.length; i++){
				if (library.first("Link", message.Links[0]) === null){
					var book = new LibraryBook();
					book.Link = message.Links[i];
					book.Tags = message.Tags;
					book.UserName = user.UserName;
					library.push(book);
					console.log("Added post by " + book.UserName + " to library.");
				} else {
					message.Links[i] += " (REPOST)"
				}
			}
		}
		
		if (!user.HasLibraryCard && user.TotalShares >= 100) {
			var libraryCardMessage = "<center><h4 style='color:yellow;'>Contratulations!</h4></center>";
			libraryCardMessage += "<div>";
			libraryCardMessage += "Due to your commitment to share content on Paranoia Chat you have been granted access to the <span>Library</span>.<br />  ";
			libraryCardMessage += "As a Library Card holder your name will now appear with like this \"<span style='color:yellow;'>&copy;</span> " + user.UserName + "\" symbol next to it which means you can now use the /search and /library features to look for content by tag/keyword.";
			libraryCardMessage += "<br /><br />Currently due to Operational Security (opsec) the Chat isn't talking to the API until we are confident that all the crash bugs are fixed. <b>WE WILL ADD THE LIBRARY SOON!</b>";
			libraryCardMessage += "</div>";
			user.HasLibraryCard = true;
			user.Messages.push(new ChatMessage("System", libraryCardMessage));
			
			var sysUser = new ChatUser();
			sysUser.UserName == "System";
			me.ProcessMessage(new ChatMessage("System", "<span style='color:yellow; font-weight:bold;'>Congratulations to "+user.UserName+"!</span> "+user.UserName+ " now possesses a <span style='color:gold;'>&copy</span>Library Card! Enabling them to use /library. "),sysUser);

		}
		
		var chatMessage = me.ParseChatMessage(message, user);
		message.Message = chatMessage;
		user.TotalMessages+= 1;
		me.onChat.emit("chat", user, message)
		me.Messages.push(message);
	}
	this.PostLogin = function(req, res){
		var cookies = new Cookies( req, res);
		//Ban Check
		if (cookies.get("paranoia_ban") === "true"){
			res.end("The site is not available.");
			console.log("Blocking banned actor by ban cookie.");
			return;
		}
		var cuuid = null;
		if (cookies.get("paranoia_id") === null || cookies.get("paranoia_id") === undefined){
			cuuid = uuid.v4();
			cookies.set("paranoia_id", cuuid);
		} 
		else {
			cuuid = cookies.get("paranoia_id");

			var user = me.Users.first("ID", cuuid);

			if (user !== null && user.isBanned){
				res.end("The site is not available.");
				console.log(user.UserName + " - Blocking banned actor by user from id cookie.");
			}
		}
		if (cookies.get("paranoia_ban") === "true"){
			res.end("The site is not available.");
			return;
		}
		
        var body = "";
		var user = new ChatUser(req, res, me);

        req.on('data', function (chunk) {
            body += chunk;
        });
        req.on('end', function () {
            var data = qs.parse(body);
            if (data.username != undefined && data.username.contains("&nbsp")) {
                try {
                    cookies.set("paranoia_ban", "true");
                }
                catch (er) { }
                res.end("The system is not available");
                return;
            }
			if (data.username === "System" || data.username === "Library" || data.username === "Admin"  || data.username === "Moderator" || data.username.contains("<") || data.username.contains(">")) {
				res.end(login.toString('UTF8').replace("{{error}}", "This username is reserved and you cannot have it."));
			}
			//var regex = /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/g; 
			var okname = data.username.match(/^[\w&.\-]*$/)=== null? false: true;
			var oklen = data.username.match(/^.{3,}$/) === null? false: true;

            if (!okname || !oklen || data.username.contains("&")) {
                console.log(data.username + " - OK length?:" , oklen, "OK chars?:", okname);

				res.end(login.toString('UTF8').replace("{{error}}", "This username is invalid."));
				return;
			}

			//cookies.set( "paranoia_ban", "true," { httpOnly: false } );
			
            var existingUser = me.Users.first("UserName", data.username);
			if (existingUser !== null && existingUser.isBanned){
				res.end("The site is not available.");
				return;
			}
			
            if (existingUser !== undefined && existingUser !== null) {
                if (data.password == existingUser.Password) {
                    user = existingUser;
					user.Request = req;
					user.Response = res;
					user.App = me;
					user.ID = cuuid;
                    if (user.UserName === undefined) user.UserName = data.username;
                } else {
                    res.end(login.toString('UTF8').replace("{{error}}", "This username is taken and the password does not match."));
                    user.LoggedIn = false;
                    return;
                }
            } else {
                user.ID = cuuid;
                user.UserName = data.username;
                user.Password = data.password;
				
				console.log("Creating a new user." + data.username);
				user.ID = cuuid;
				//subscribe to the global message list
				user.onConnect();
				me.Users.push(user);

            }
			me.onChat.on("chat", user.onChat);
            console.log("Logged In: " + user.UserName);
			user.LoggedIn = true;
            res.write(me.Pages.Chatpage.toString('UTF8').replaceAll("{{UserID}}", user.ID));

		});
		
	}
	this.ChatMessageRecieved = function(req,res){
        //res.end("ok we hit this method...");
        var body = '';
        req.on('data', function (chunk) {
            body += chunk;
        });
        req.on('end', function () {
            var data = qs.parse(body);
            var user = me.Users.first("ID", data.UserID);
            
			if (user !== null && user.isBanned){
				try {
					cookies.set("paranoia_ban", "true");
				}
				catch (er){}
				res.end("The system is not available");
				return;
			};
			//user.WriteHead();
            
			try {

                data.message = data.message.replaceAll("<", "");
                data.message = data.message.replaceAll(">", "");
                var message = new ChatMessage(user.UserName, data.message.toString());
                console.log(`${user.UserName}==>${data.message}`);
				me.ProcessMessage(message, user);
                res.end(me.Pages.chatform.toString('UTF8').replaceAll("{{UserID}}", user.ID));
            }
            catch (err) {
                console.log(err);
            }
            res.end();
		});
	}
	this.onConnect = function (req, res) {
		if (req.method === 'GET' && req.url.toLowerCase().includes("/chat")) res.end(me.Pages.login.toString('UTF8').replace("{{error}}", ""));
		if (req.method === 'POST' && req.url.toLowerCase().includes("/chat")) me.PostLogin(req,res);
		if (req.method === 'POST' && req.url === '/send') me.ChatMessageRecieved(req,res);

	}
	this.Server = http.createServer(me.onConnect);
	this.ServerStart = function(){
		me.Server.timeout = me.ServerTimeout;
		me.Server.maxHeadersCount = 0;
        me.Server.on("connect", me.onConnect);
		me.Server.listen(me.PortNumber, '127.0.0.1');  // start
		console.log("Server startd on port " + me.PortNumber);
	}
	this.AdminInterfaceStart = function(){
		var readline = require('readline');
		var rl = readline.createInterface(process.stdin, process.stdout);
		rl.setPrompt('guess> ');
		rl.prompt(true);
		rl.on('line', function (line) {
			me.onChat.emit("chat", null, "<br />" + new Date() + " got data");
			rl.prompt();
		});
	}
	this.AppPulse = setInterval(function () {
		me.onPulse.emit("pulse", `...<style type='text/css'>#UserList { border-color: pink; content:'test';}</style>`);
	}, 30000);
	this.Init = function(){
		//unlimited listeners
		me.onChat.setMaxListeners(0);
	}
	this.Init();
}
function ChatMessage(username, message) {
	var me = this;
    this.UserName = username;
    this.Message = message;
    this.TimeStamp = getTime();
    this.isPrivate = false;
    this.Links = [];
    this.Tags = [];
	this.Hidden = false;
}
function LibraryBook() {
	var me = this;
    this.Link = "";
    this.Tags = [];
    this.UserName = "";
    this.ShareDate = getTime();
	this.Date = null;
	this.Init = function(){}
	this.Init();
}

/* Helpers */
function getTime() {
    var time = new Date();
    var hh = time.getHours();
    var mm = time.getMinutes();
    var ss = time.getSeconds()
    return hh + ":" + mm + ":" + ss;
}
var CannedMessages = {
	welcome: "<div>Welcome!</div>"
}
function HtmlPages(){
	var fs = require('fs');  // file system
	var me = this;
	this.Chatpage = null;
	this.chatform = null;
	this.login = null;
	this.init = function(){
		fs.readFile('chatbar.html', function read(err, data) { me.Chatpage = data; });
		fs.readFile('chatform.html', function read(err, data) { me.chatform = data; });
		fs.readFile('login.html', function read(err, data) { me.login = data; });
	}
	this.init();
}

/* Prototypes */
String.prototype.replaceAll = function (str1, str2) {
    var str = this;
    while (str.indexOf(str1) !== -1) {
        str = str.replace(str1, str2);
    }
    return str;
}
String.prototype.contains = function (data) {
    if (this.indexOf(data) !== -1) return true;
    else return false;
}
Array.prototype.contains = function (value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === value) return true;
    }
    return false;
}
Array.prototype.whereDate = function (propName, value) {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
        obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            var prop = new Date(obj[propName]).setHours(0, 0, 0, 0);
            var val = new Date(value).setHours(0, 0, 0, 0);
            if (prop === val) ar.push(obj);
        }
    }
    return ar;
}
Array.prototype.where = function (propName, value) {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
        obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            if (obj[propName] === value) ar.push(obj);
        }
    }
    return ar;
}
Array.prototype.count = function (propName, value) {
    var count = 0;
    for (var i = 0; i < this.length; i++) {
        obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            if (obj[propName] === value) count++;
        }
    }
    return count;
}
Array.prototype.whereContains = function (propName, value) {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
        obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            if (obj[propName].toString().contains(value.toString())) ar.push(obj);
        }
    }
    return ar;
}
Array.prototype.first = function (propName, value) {
    for (var i = 0; i < this.length; i++) {

        var obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            if (obj[propName] === value) return obj;
        }
    }
    return null;
}
Array.prototype.take = function (amount) {
    var returnArray = [];
    for (var i = 0; i < this.length; i++) {
        var obj = this[i];
        returnArray.push(obj);
        if (i === amount) return returnArray;
    }
    return returnArray;
}
Array.prototype.skip = function (amount) {
    var returnArray = [];
    for (var i = 0; i < this.length; i++) {
        var obj = this[i];
        if (i >= amount) returnArray.push(obj);
    }
    return returnArray;
}
Array.prototype.position = function (propName, value) {
    for (var i = 0; i < this.length; i++) {
        obj = this[i];
        if (obj.hasOwnProperty(propName)) {
            if (obj[propName] === value) return i;
        }
    }
    return null;
}
Array.prototype.clone = function () {
    return this.slice(0);
};
Array.prototype.remove = function (index) {
    return this.splice(index, 1);
};
Array.prototype.insert = function (index, item) {
    return this.splice(index, 0, item);
};
Array.prototype.last = function (amt) {
    if (amt === undefined || amt === null) return this[this.length - 1];
    var sliceamt = (this.length - amt);
    if (sliceamt < 0) return this;
    else {
        return this.slice(sliceamt, this.length);
    }
}
Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}
Date.prototype.subtractHours = function (h) {
    this.setHours(this.getHours() - h);
    return this;
}
Date.prototype.formatMMDDYYYY = function () {
    return (this.getMonth() + 1) +
        "/" + this.getDate() +
        "/" + this.getFullYear();
}
Date.prototype.Dotnet = function () {
    var date = new Date();
    var day = date.getDay();        // yields day
    var month = date.getMonth();    // yields month
    var year = date.getFullYear();  // yields year
    var hour = date.getHours();     // yields hours 
    var minute = date.getMinutes(); // yields minutes
    var second = date.getSeconds(); // yields seconds

    // After this construct a string with the above results as below
    return day + "/" + month + "/" + year + " " + hour + ':' + minute + ':' + second;

}
Date.prototype.getTime = function () {
    var time = new Date();

    var hh = time.getHours();
    var mm = time.getMinutes();
    var ss = time.getSeconds()

    return hh + ":" + mm + ":" + ss;
}
String.prototype.IsValidDate = function () {
    var regEx = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (this != null)
        return this.match(regEx) != null;
    else
        return false;
}


module.exports = {
    ChatUser : ChatUser,
    ChatMessage : ChatMessage,
    LibraryBook : LibraryBook,
    Application : Application,
    Library: Library
}
