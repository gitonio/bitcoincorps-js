var net = require('net');

var client = new net.Socket();
//client.setNoDelay();
const args = process.argv

function sendMessage(message) {
    //var client = this;
    return new Promise((resolve, reject) => {
   
     client.write(message);
   
     client.on('data', (data) => {
      resolve(data);
      if (data.toString().endsWith('exit')) {
       client.destroy();
      }
     });
   
     client.on('error', (err) => {
      reject(err);
     });
   
    });
   }

  

client.connect(1337, '127.0.0.1', function () {
    console.log('Connected', args[2], args[3]);
    cw = ''
    res = ''
    if (args[2] == 'ping') {
        cw = { command: 'pong', data: '' }
        sendMessage(JSON.stringify(cw))
        .then((data)=> { console.log(`Received1: ${data}`);  client.end();} )

    } else if (args[2] == 'balance') {
        cw = { command: 'balance', from: args[3] }
        sendMessage(JSON.stringify(cw))
        .then((data)=> { console.log(`Received1: ${data}`);  client.end();} )
        
    } else if (args[2] == 'tx') {
        cw = { command: 'tx', from: args[3], to: args[4], amount: args[5] }
        //console.log(JSON.stringify(cw))
        sendMessage(JSON.stringify(cw))
        .then((data)=> { console.log(`Received1: ${data}`);  return sendMessage(`${data}`);} )
        .then((data)=> { console.log(`Received2: ${data}`);  return client.end();} )
         
    } else {
        console.log('Invalid command')
    }

});


client.on('close', function () {
    console.log('Connection closed');
});

    // client.on('data', function (data) {
    //     console.log(data.toString('utf8'))
    //     client.end()
    // })
    client.on('error', function (error) {
        console.log(error, null)
    })
