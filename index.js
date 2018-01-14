/**
 * @file   index.js
 * @author Peter Züger
 * @date   14.01.2018
 * @brief  zApp
 */
const request = require('request');
const WebSocket = require('ws');

/**
 * zApp addresses
 */
const ZRAP_SYS      = '/zrap/sys';
const ZRAP_CHSCAN   = '/zrap/chscan';
const ZRAP_CHNOTIFY = '/zrap/chnotify';
const ZRAP_CHCTRL   = '/zrap/chctrl';
const ZRAP_CHDES    = '/zrap/chdes';
const ZRAP_NETSCAN  = '/zrap/netscan';
const ZRAP_NET      = '/zrap/net';
const ZRAP_RSSI     = '/zrap/rssi';
const ZRAP_ID       = '/zrap/id';
const ZRAP_LOC      = '/zrap/loc';
const ZRAP_DATE     = '/zrap/date';
const ZRAP_SCHED    = '/zrap/scheduler';
const ZRAP_NTP      = '/zrap/ntp';
const ZAPI_ID       = '/zapi/smartfront/id';
const ZAPI_SENSOR   = '/zapi/smartfront/sensor';
const ZAPI_LED      = '/zapi/smartfront/led';
const ZAPI_PRGM     = '/zapi/smartbt/prgm';
const ZAPI_PRGN     = '/zapi/smartbt/prgn';
const ZAPI_PRGS     = '/zapi/smartbt/prgs';

/**
 * @brief constructor
 * 
 * @param ip ip address as string
 *           for testing when connecting directly use '192.168.0.1'
 * @note more Support is on the way
 * @warning -
 */
function zApp(ip){
    self = this;
    this.ip = ip;
    this.ws_stat = WebSocket.CONNECTING;
    this.ws = new WebSocket('ws://'+this.ip);

    this.ws.on('close'  ,this.ws_onclose  );
    this.ws.on('error'  ,this.ws_onerror  );
    this.ws.on('message',this.ws_onmessage);
    this.ws.on('open'   ,this.ws_onopen   );
}

/**
 * Zeptrion.ws handlers
 */
zApp.prototype.ws_onclose   = function(code,reason){
    self.ws_stat = WebSocket.CLOSED;
    console.log('WebSocket to '+self.ip+': closed; code: '+code+' ,reason: '+reason);
};
zApp.prototype.ws_onerror   = function(error){
    self.ws_stat = WebSocket.CLOSED;
    console.log('WebSocket to '+self.ip+': error; .: '+error);
};
zApp.prototype.ws_onmessage = function(data){
    console.log(data);
};
zApp.prototype.ws_onopen    = function(){
    self.ws_stat = WebSocket.OPEN;
    console.log('WebSocket to '+self.ip+': open');
};

/**
 * Utility functions
 */
zApp.prototype.url = function(loc){
    return 'http://'+this.ip+loc;
}
zApp.prototype.request_opt = function(loc,method,body){
    return {
        url: this.url(loc),
        method: method,
        //headers: {'Content-type': 'application/json'},
        body: body
    };
}
zApp.prototype.callback = function(error, response, body) {
    console.log('error:', error);
    console.log('statusCode:', response && response.statusCode);
    console.log('body:', body);
}

/**
 * @brief   /zrap/sys
 * @note    after reboot the websocket must be reconnected
 * @warning hard_reset and network_reset will disconnect the device
 * @warning and will have to be mannualy reconnected
 */
zApp.prototype.reboot = function(){
    request(this.request_opt(ZRAP_SYS,"POST",'cmd=reboot'),this.callback);
}
zApp.prototype.hard_reset = function(){
    request(this.request_opt(ZRAP_SYS,"POST",'cmd=factory-default'),this.callback);
}
zApp.prototype.network_reset = function(){
    request(this.request_opt(ZRAP_SYS,"POST",'cmd=network-default'),this.callback);
}

/**
 * @brief     sets a channel to a specific value
 * @param ch  array of channels to be affected
 * @param val values matching the channels
 * @note values from 0->49 are off and 50->100 are on
 */
zApp.prototype.set_channel = function(ch,val){
    if(ch.length != val.length) throw "Zeptrion.set_channel: Length missmatch";
    var msg = '';
    for(var i=0;i<ch.length;i++)
      msg = msg.concat('cmd'+ch[i].toString()+'='+(val[i]?'on&':'off&'));
    msg = msg.replace(/.$/,'');
    request.post(this.request_opt(ZRAP_CHCTRL,"POST",msg),this.callback);
}

/**
 * @brief     sets the background color of the front led's
 * @param led array of leds to be affected
 * @param col values matching the leds
 * @note the color must be in the Format : '#RRGGBB'
 * @note the value is a hexadecimal from 00 -> FF
 */
const RED     = '#FF0000';
const GREEN   = '#00FF00';
const BLUE    = '#0000FF';
const WHITE   = '#FFFFFF';
const BLACK   = '#000000';
const YELLOW  = '#FFFF00';
const MAGENTA = '#FF00FF';
const CYAN    = '#00FFFF';
zApp.prototype.set_led = function(led,col){
    if(led.length != col.length) throw "Zeptrion.set_led: Length missmatch";
    var msg = '[';
    for(var i=0;i<led.length;i++)
        msg = msg.concat('{"id":'+led[i].toString()+',"bg":"'+col[i]+'"},');
    msg = msg.replace(/.$/,']');
    request.post(this.request_opt(ZAPI_LED,"POST",msg),this.callback);
}

/**
 * @brief set or clear button
 * @param btn button to set or clear from 1 - 9
 * @param val value of the button 0 or 1
 */
zApp.prototype.set_button = function(btn,val){
    if((btn < 1 )||(btn > 9)) throw "Zeptrion.set_button: Button out of range";
    var x = '{"pid2":{"bta":"........."}}';
    if(val==1){x=x.substring(0, 15+btn)+'P'+x.substring(btn+16);}
    this.ws.send(x);
}

module.exports = zApp;

/******************************************************************************
 ******************************************************************************
 ***                                  Tests                                 ***
 ******************************************************************************
 ******************************************************************************/
function test(){
    var z = new zApp("192.168.1.132");
    try{
        z.set_led([1],['#FF00FF']);
        z.set_led([2,3,4],['#FFFF00','#00FFFF','#00FFFF']);
        z.set_channel([1],[0]);
    }
    catch(err){
        console.log(err);
    }
}
