const EventEmitter = require('events');
import { ipcMain as ipc } from 'electron';
import MulticastSocket from './multicastSocket';

class Server {
  constructor() {
    this.ip = '239.1.1.11';
    this.port = 3000;
    this.webContents = null;
    this.ready = false;
    this.eventBus = new EventEmitter();
    this.mSocket = new MulticastSocket(this.eventBus, this.ip, this.port);
    this.eventBus.on('multicast:ready', this.readyEvent.bind(this));
    this.eventBus.on('multicast:error', this.errorEvent.bind(this));
    this.eventBus.on('multicast:message', this.messageEvent.bind(this));
    ipc.on('start:multicast', this.start.bind(this));
    ipc.on('status:multicast', (event) => {
      event.returnValue = this.ready
    })
    this.data = [];
  }
  start() {
    if (this.mSocket) this.mSocket.off();
    this.ready = true;
    this.mSocket.start();
  }
  setWin(webContents) {
    this.webContents = webContents;
  }
  readyEvent() {
    if (this.webContents) this.webContents.send('multicast:ready');
  }
  errorEvent(err) {
    console.log('error');
    this.ready = false;
    if (this.webContents) this.webContents.send('multicast:error', err);
  }
  messageEvent(ev) {
    const data = parserData(ev);
    if (this.webContents) this.webContents.send('multicast:message', data);
  }
}

const parserData = buf => {
  const data = {};
  data.type = buf.readUInt8(7);
  data.address = buf.readUInt16BE(3);
  switch (data.type) {
    /* Тип 1 (Дискретное значение) 1 byte */
    case 1:
      data.value = buf.readUInt8(8);
      break;
    /* Тип 2 (Беззнаковое число)  1 byte */
    case 2:
      data.value = buf.readUInt8(8);
      break;
    /* Тип 5 ( Беззнаковое число) 2 byte */
    case 5:
      data.value = buf.readUInt16BE(8);
      break;
    /* Тип 3 ( Знаковое число) 1 byte */
    case 3:
      data.value = buf.readInt8(8);
      break;
    /* Тип 6 ( Знаковое число с запятой) 4 byte */
    case 6:
      data.value = buf.readFloatBE(8).toFixed(2);
      break;
    default:
      console.log('Неизвестный тип');
  }
  console.log(data);
  return data;
};

module.exports = Server;
