const express = require("express");
const http = require("http");
const cors = require("cors");

const db = require("./models");
const error = require("./middlewares/error");
const { user } = require("./models");
const { initializeWebSocket } = require("./socket");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const driverRouter = require("./routes/driver");
const restaurantRouter = require("./routes/restaurant");
const frontSite = require("./routes/frontsite");
const retailerRoute = require("./routes/retailer");
const retailerController = require("./controllers/retailer");
const app = express();
const server = http.createServer(app);

// Define a middleware function to set CORS headers
const setCorsHeaders = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS"); // Allow specific HTTP methods
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); // Allow specific headers
  next();
};

// Apply the middleware function to set CORS headers for all routes
app.use(setCorsHeaders);

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/driver", driverRouter);
app.use("/restaurant", restaurantRouter);
app.use("/frontsite", frontSite);
app.use("/retailer", retailerRoute);

const wss = initializeWebSocket(server);

wss.on("connection", async (ws) => {
  console.log(`User connected: ${ws._socket.remoteAddress}`);
  ws.on("message", async (message) => {
    try {
      const newMessage = JSON.parse(message);
      console.log(`type of event ${message}`)
      if (newMessage.type == "connected") {
        await user.update(
          { ip: ws._socket.remoteAddress },
          { where: { id: newMessage.userId } }
        );
      } else if (newMessage.type == "orderAccepted") {
        await retailerController.acceptOrderForSocket(newMessage.orderId, newMessage.restaurantId, newMessage.customTime);
      }
    } catch (error) {
      console.log({ success: false, error: error.message });
    }
  });
  ws.on("close", () => {
    console.log("Disconnected from user");
  });
});

// Handle OPTIONS requests
app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.use(error);

db.sequelize.sync().then(() => {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Starting the server at port ${PORT} ...`);
  });
});
