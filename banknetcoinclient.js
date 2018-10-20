var net = require('net');

var client = new net.Socket();
client.setNoDelay();
const args = process.argv

client.connect(1337, '127.0.0.1', function () {
    console.log('Connected', args[2], args[3]);
    cw = ''
    res = ''
    if (args[2] == 'ping') {
        cw = { command: 'ping' }
    } else if (args[2] == 'balance') {
        cw = { command: 'balance ', from: args[3], balance: '1000' }
        client_write(JSON.stringify(cw), function (error, data) {
            res = data.toString('utf8')
            console.log('Balance:', res)
            client.end()
            //return res
        })
    } else if (args[2] == 'tx') {
        cw = { command: 'utxos' }
        // client_write(JSON.stringify(cw), function (error, data) {
        //     res = data.toString('utf8')
        //     console.log('utxos:', res)
        //     //client.end()
        //     //return res
        // })
        let rv = client.write(JSON.stringify(cw), function (data) {
            client.on('data', function (data) {
                res = ''
                res = data.toString('utf8')+'\r\n'
                console.log('utxos:', res)
                //callback(data)
            });

            //console.log('cb',  data.toString('utf8'))
        })
        console.log('rv', rv)
        cw = { command: 'tx ', from: args[3], to: args[4], amount: args[5] }
        client.write(JSON.stringify(cw))
        client.end()

        // client_write(JSON.stringify(cw)
        //     , function (error, data) {
        //         res = data.toString('utf8')
        //         console.log('Received2:', res)
        //         client.end()
        //         //return res
        //     })

        //cw = {command:'tx ' ,from: args[3], to: args[4], amount : args[5]}
        // rv = client.write(JSON.stringify(cw), function (data) {
        //     client.on('data', function (data) {
        //         console.log('Received2: ' + data);
        //         //callback(data)
        //     });

        //     //console.log('cb',  data.toString('utf8'))
        // })
        // console.log('rv', rv)
        // client.end()
 
    } else {
        console.log('Invalid command')
    }

    //client.write(JSON.stringify(cw))
    // client_write(JSON.stringify(cw), function(error,data){
    //     res = data.toString('utf8')
    //     console.log('Received:' ,res)
    //     return res
    // })
    //console.log('x',x)
    //client.end()
});

//client.on('data', function(data) {
//    console.log('Received2: ' + data);
//callback(data)
//});

client.on('close', function () {
    console.log('Connection closed');
});

client_write = function (cmd, callback) {
    client.write(cmd)
    client.on('data', function (data) {
        callback(null, data)
    })
    client.on('error', function (error) {
        callback(error, null)
    })
    //client.end()
}