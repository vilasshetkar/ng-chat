import { Component, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  public message: string = '';
  public errorMessage: string = '';

  public userLoggedIn: boolean = false;
  public registerForm: boolean = false;

  public selectedUser: any;
  public loggedInUser: any;
  public users: any[] = [];

  public username: string = '';
  public password: string = '';
  public confirmPassword: string = '';

  constructor(public socket: SocketService) {

    // socket.loginUser('vilas');

    console.log(socket.users);

    this.getSession();

    this.handleSocket();

  }

  ngOnInit() {

  }

  login(username: string, password: string) {
    this.socket.loginUser(username, password);
  }

  register(username: string, password: string, confirmPassword: string) {
    if (password == confirmPassword) {
      this.socket.loginUser(username, password, confirmPassword);
    } else {
      alert("Password mismatch!");
    }
  }

  logout() {
    let confrm: boolean = confirm("Are you sure want to logout?");
    if (confrm) {
      this.socket.socket.disconnect();
      localStorage.clear();
      this.loggedInUser = null;
      this.userLoggedIn = false;
      this.registerForm = false;
    }
  }

  onSelectUser(user: any) {
    this.selectedUser = user;
    this.selectedUser.hasNewMessages = false;
  }

  onMessage(content: any) {
    if (this.selectedUser) {
      this.socket.socket.emit("private message", {
        content,
        to: this.selectedUser.userID
      });
      this.selectedUser.messages.push({
        content,
        fromSelf: true,
        date: new Date
      });
    }

    this.message = '';
  }

  getSession() {

    const sessionID = localStorage.getItem("sessionID");

    if (sessionID) {
      this.userLoggedIn = true;
      this.socket.socket.auth = { sessionID };
      this.socket.socket.connect();
    }

    this.socket.socket.on("session", ({ sessionID, userID }: any) => {
      console.log(sessionID, userID);

      this.userLoggedIn = true;

      // attach the session ID to the next reconnection attempts
      this.socket.socket.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem("sessionID", sessionID);
      localStorage.setItem("userID", userID);
      // save the ID of the user
      this.socket.socket.userID = userID;
    });

    this.socket.socket.on("connect_error", (err: any) => {
      console.log(err)
      this.errorMessage = err.message;
      if (this.errorMessage == 'Session Expired!') {
        this.logout();
      }
      alert(this.errorMessage);
    });

  }

  handleSocket() {
    this.socket.socket.on("user connected", (user: any) => {
      console.log('user connected...', user);
      let existingUser = this.users.find(item => item.userID == user.userID);

      console.log(existingUser, this.users);

      if (existingUser) {
        existingUser.connected = user.connected;
      } else {
        this.users.push(user);
      }
    });

    this.socket.socket.on("user disconnected", (id: any) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.userID === id) {
          user.connected = false;
          break;
        }
      }
    });

    this.socket.socket.on("users", (users: any[]) => {
      console.log(users);
      users.forEach((user) => {
        user.messages.forEach((message: any) => {
          message.fromSelf = message.from === this.socket.socket.userID;
        });
        for (let i = 0; i < this.users.length; i++) {
          const existingUser = this.users[i];
          if (existingUser.userID === user.userID) {
            existingUser.connected = user.connected;
            existingUser.messages = user.messages;
            return;
          }
        }
        user.self = user.userID === this.socket.socket.userID;
        if (user.self) {
          this.loggedInUser = user;
        }
        this.users.push(user);
      });
      // put the current user first, and sort by username
      this.users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });
    });


    this.socket.socket.on("private message", ({ content, from, to, date }: any) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        const fromSelf = this.socket.socket.userID === from;
        if (user.userID === (fromSelf ? to : from)) {
          user.messages.push({
            content,
            fromSelf,
            from,
            to,
            date
          });
          if (user !== this.selectedUser) {
            user.hasNewMessages = true;
          }
          break;
        }
      }
    });


  }

  ngOnDestroy() {
    this.socket.socket.off("connect_error");
  }


}
