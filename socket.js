
const WebSocket = require("ws");
const { user } = require("./models");

const { v4: uuidv4 } = require('uuid');
const { Op } = require("sequelize");
let wssInstance;
const userConnections = new Map();
const {formatTokens} = require('./helper/getTokens')
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  wssInstance = wss;

 wss.on("connection", async (ws, req) => {
    const clientId = uuidv4(); // Generate unique ID for client
    userConnections.set(clientId, ws);

    ws.on("message", async (newMessage) => {
        try {
            let message = JSON.parse(newMessage);
            //  triggerDummyEvent();
  
            if (message.type === "connected") {
                console.log("Received message:", message);
                let userData = await user.findOne({ where: { id: message.userId } });

                if (userData) {
                    let userClientsIds = [];
                    if (userData.ip) {
                        // Ensure userData.ip is parsed correctly
                        try {
                            userClientsIds = JSON.parse(userData?.ip);
                        } catch (e) {
                            console.log('Error parsing userData.ip:', e);
                        }
                    }

                    if (!Array.isArray(userClientsIds)) {
                        userClientsIds = [];
                    }

                    userClientsIds.push(clientId);
                    userData.ip = JSON.stringify(userClientsIds);
                    await userData.save();
                } else {
                    console.log("User data not found for id:", message.userId);
                }
            }
        } catch (error) {
            console.log(error);
        }
    });

    ws.on("close", async () => {
        console.log(`Client ${clientId} disconnected`);

        // Remove WebSocket connection when client disconnects
        userConnections.delete(clientId);

        // Remove clientId from user's ip column
        try {
            let users = await user.findAll({
                where: {
                    ip: {
                        [Op.like]: `%${clientId}%` // Find users whose ip column contains the clientId
                    }
                }
            });

            users.forEach(async (userData) => {
                try {
                    let userClientsIds = JSON.parse(userData.ip);
                    if (Array.isArray(userClientsIds)) {
                        const index = userClientsIds.indexOf(clientId);
                        if (index !== -1) {
                            userClientsIds.splice(index, 1);
                            userData.ip = JSON.stringify(userClientsIds);
                            if (userData.lastOnline) {
                            const currentTime = new Date();
                            const hoursWorked = (currentTime - driver.lastOnline) / (1000 * 60 * 60); // convert milliseconds to hours
                            userData.totalHours += hoursWorked;
                            userData.online = false;
                            userData.lastOffline = currentTime;
                            }
                            // await userData.save();
                            
                            
                            await userData.save();
                            console.log("Client ID removed from user IP list");
                        }
                    }
                } catch (e) {
                    console.log('Error parsing userData.ip during disconnect:', e);
                }
            });
        } catch (error) {
            console.log(error);
        }
    });
//     const triggerDummyEvent = () => {
//     console.log("Triggering dummy event...");

//     // Create a dummy event message
//     const dummyEventMessage = {
//         type: "dummy_event",
//         message: "This is a dummy event triggered after user connection",
//     };

//     // Send the dummy event message to the WebSocket server
//     ws.send(JSON.stringify(dummyEventMessage));
// };
});

  return wss;
};

const sendEvent = (clientId, eventData) => {
    console.log("event Dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",clientId);
    console.log(eventData)
  try {
    console.log("Sending event to client:", clientId);
      if(clientId){
        let ids = JSON.parse(clientId);
        for(const id of ids){
            const client = userConnections.get(id);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(eventData));
            } else {
              console.log(`Client with ID ${client} is not connected.`);
            }
        }
    }
    // const client = userConnections.get(clientId);
    // if (client && client.readyState === WebSocket.OPEN) {
    //   client.send(JSON.stringify(eventData));
    // } else {
    //   console.log(`Client with ID ${clientId} is not connected.`);
    // }
  } catch (error) {
    console.log(error);
  }
};



module.exports = { initializeWebSocket, sendEvent };

























// const WebSocket = require("ws");
// const { user } = require("./models");
// let wssInstance;
// const { v4: uuidv4 } = require('uuid');
// const userConnections = new Map();

// const initializeWebSocket = (server) => {
//   const wss = new WebSocket.Server({ server });
//   wssInstance = wss;

//   wss.on("connection", async (ws) => {
//     const clientId = uuidv4(); // Generate unique ID for client
//     console.log(
//       `User connected with ID ${clientId}: ${ws._socket.remoteAddress}`
//     );
// userConnections.set(clientId, ws);
//     ws.on("message", async (newMessage) => {
//       try {
//         let message = JSON.parse(newMessage);
//         console.log("***********************************");
//         console.log(message);
//         if (message.type == "connected") {
//           // Update user with the unique client ID and IP address
//           await user.update(
//             { 
//               ip: clientId,
//             },
//             { where: { id: message.userId } }
//           );
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     });

//      ws.on("close", () => {
//       console.log(`Client ${clientId} disconnected`);
//       // Remove WebSocket connection when client disconnects
//       userConnections.delete(clientId);
//     });
//   });

//   return wss;
// };
// const sendEvent = (ip, eventData) => {
//   try {
      
//     console.log("event calledddddddddddddddddddddd")
//     wssInstance.clients.forEach((client) => {
//       console.log(`client wla hai yar : ${client._socket.remoteAddress}`);
//       console.log(`ye ip wala hia bsdk ${ip}`);
//       if (client._socket.remoteAddress == ip) {
//         if (client.readyState === WebSocket.OPEN) {
         
//           client.send(JSON.stringify(eventData));
//         }
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// module.exports = { initializeWebSocket, sendEvent };



// const initializeWebSocket = (server) => {
//   const wss = new WebSocket.Server({ server });
//   wssInstance = wss;
//   wss.on("connection", async (ws) => {
//     console.log(`User connected: ${ws._socket.remoteAddress}`);

//     ws.on("message", async (newMessage) => {
//       try {
        
//         let message = JSON.parse(newMessage);
//         console.log("***********************************");
//         console.log(message);
//         if (message.type == "connected") {
//           await user.update(
//             { ip: ws._socket.remoteAddress },
//             { where: { id: message.userId } }
//           );
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     });

//     ws.on("close", () => {
//       console.log("Disconnected from user");
//     });
//   });

//   return wss;
// };