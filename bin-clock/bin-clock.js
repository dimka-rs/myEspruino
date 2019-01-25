var ssid = 'AP';
var password = 'KEY';

var wifi = require('Wifi');
var http = require("http");

var h=0, m=0, s=0;
var digits = {};
var connected = false;

const TIME_URL = "http://ya.ru";
const TIME_OFFSET = 3*3600; //offset in seconds
const DIGIT_X_STEP = 10;
const DIGIT_Y_STEP = 5;
const BLOCK_X_SIZE = 10;
const BLOCK_Y_SIZE = 10;
const COLUMNS_STEP = 7;
const MAX_Y = 60;
const MAX_BITS = {0:2,1:4,2:3,3:4,4:3,5:4};

I2C1.setup({scl:D15,sda:D4});
var g = require("SSD1306").connect(I2C1, undefined, { address : 0x3C, rst : 16, });
g.setRotation(2, 0); //rotate, mirror
D2.mode('output');

function oledDisplay(){
  let date = new Date();
  h = date.getHours();
  m = date.getMinutes();
  s = date.getSeconds();

  digits[0] = Math.floor(h/10);
  digits[1] = h%10;
  digits[2] = Math.floor(m/10);
  digits[3] = m%10;
  digits[4] = Math.floor(s/10);
  digits[5] = s%10;

  D2.toggle(); //just blink for fun

  g.clear();
  g.setFontVector(10);
  if(!connected) {g.drawString("X",0,0);}  //indicate no connection
  //loop through digits
  for(let d=0; d<6; d++){
    //calculate column positions
    let x = d * (BLOCK_X_SIZE + DIGIT_X_STEP) + Math.floor(d/2)*COLUMNS_STEP;
    //draw digit, loop through bits
    for(let b=0; b<MAX_BITS[d]; b++){
      //calculate bit position
      let y = MAX_Y - b * (BLOCK_Y_SIZE + DIGIT_Y_STEP);
      //fill/draw if bit is set/clear
      if(digits[d] & (1<<b)){
        g.fillRect(x, y, x+BLOCK_X_SIZE, y-BLOCK_Y_SIZE);
      } else {
        g.drawRect(x, y, x+BLOCK_X_SIZE, y-BLOCK_Y_SIZE);
      }
    }
  }
  //send to screen
  g.flip();
}

function connectWifi(){
  console.log("Connecting to "+ssid);
  wifi.connect(ssid, {password: password});
  wifi.on("connected", function(details) {
    connected = true;
    console.log("AP: "+ssid);
    console.log("IP: " + details.ip);
    console.log("NM: " + details.netmask);
    console.log("GW: " + details.gw);
    //get time from http response
    http.get(TIME_URL, function(res) {
      setTime(Date.parse(res.headers.Date)/1000+TIME_OFFSET);
      d = new Date();
      console.log(d);
      res.on('data', function(data) {

      });
    });
  });
  wifi.on("disconnected", function(details) {
    connected = false;
    console.log("Disconnected from " + ssid);
    wifi.connect(ssid, {password: password});
  });
  wifi.on("dhcp_timeout", function() {
    console.log("DHCP timeout!");
  });
}

// === MAIN ===
//clearInterval();
wifi.disconnect(); //helps to reconnect on start
connectWifi();
setInterval(oledDisplay, 1000);
