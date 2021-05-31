import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

import { io } from "socket.io-client";

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  users: any;
  messages: any;
  socket: any;

  constructor(
  ) {

    const URL = "http://localhost:3000";
    this.socket = io(URL, { autoConnect: false });

    this.socket.onAny((event: any, ...args: any) => {
      console.log(event, args);
    });
  }

  loginUser(username: string, password: string, confirmPassword?: string) {
    this.socket['auth'] = { username, password, confirmPassword };
    this.socket.connect();
    console.log(this.socket);
  }

  sendMessage(message: string) {
    this.socket.emit('sendMessage', message);
  }


}
