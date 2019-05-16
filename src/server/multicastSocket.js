/**
 *
 * Sender and receiver of multicast
 *
 */
import getIP from './getIP';
const dgram = require('dgram');

let timerCheckConnection = null;

export default class MulticastSocket {
  constructor(eventEmitter, ip, port) {
    this.data = null;
    this.eventEmitter = eventEmitter;
    this.socket = null;
    this.multicastIP = ip;
    this.multicastPORT = port;
    this.ready = false;
  }

  start() {
    try {
      this.off();
      this.socket = dgram.createSocket('udp4');
      this.socket.on('error', (err) => {
        this.catchErrorEvent(err);
      });
      this.socket.on('listening', () => {
        this.socketStartMulticast();
      });

      if (this.socket) this.socket.bind(this.multicastPORT);
    } catch (err) {
      this.catchErrorEvent(err);
    }
  }

  off() {
    clearInterval(timerCheckConnection);
    try {
      if (this.socket) this.socket.close((err) => {
        console.log('Закрыли сокет. Ошибка:', err);
      });
    } catch (err) {
      console.log('Неуспешная попытка закрыть сокет. Уже закрыт');
    }
    this.ready = false;
    this.socket = null;
  }

  // Send msg to multicast channel
  send(msg) {
    return new Promise((resolve, reject) => {
      try {
        this.socket.send(msg, this.multicastPORT, this.multicastIP, err => {
          // console.log('Multicast socket отправил данные. Ошибка:', err);
          if (err) reject(err);
          else resolve();
        });
      } catch (err) {
        console.log('Сообщение не отправлено на multicast socket');
        reject(err);
        this.catchErrorEvent(err);
      }
    });
  }

  socketStartMulticast() {
    try {
      this.socket.addMembership(this.multicastIP);
      this.socket.setMulticastTTL(128);

      this.eventEmitter.emit('multicast:ready');
      // Temporary  method. Every 5 sec request IP address, if it's 127.0.0.1 - eth connection is lost.
      timerCheckConnection = setInterval(() => {
        this.checkLocalIP();
      }, 5000);
      console.log(`Multicast server listening ${this.multicastIP}:${this.multicastPORT}`);
      this.socket.on('message', (data, remote) => {
        this.incommingMsg(data, remote);
      });
      this.ready = true;
      console.log('Multicast socket запущен');
    } catch (err) {
      console.log('Ошибка во время старта сокета');
      this.catchErrorEvent(err);
    }
  }
  catchErrorEvent() {
    console.log('Отработала ошибка на уровне socket');
    clearInterval(timerCheckConnection);
    this.eventEmitter.emit('multicast:error');
    this.off();
  }
  checkLocalIP() {
    const myIP = getIP();
    if (myIP === '127.0.0.1' || !myIP) this.catchErrorEvent('Устройство не подключено к сети');
  }
  //
  incommingMsg(message, remote) {
    try {
      // console.log('Входящее сообщение_____________')
      if (message)
        if (remote.address !== getIP()) {
          // console.log('Сообщение по multicast socket')
          console.log(`from:${remote.address} message:`);
          console.log(message);
          
          // Проверка, чтобы не показывать свои телеграммы;
          this.eventEmitter.emit('multicast:message', message);
        }
    } catch (err) {
      console.log('Multicast ERROR');
    }
  }
}
