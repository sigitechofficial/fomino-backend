
module.exports = function ( deviceToken,title, body,data) {
    // console.log(deviceToken)
    console.log("noti data ++++++++++++++++++++++++++++++++++++++++++");
    
    let FCM = require("fcm-node");
    let serverKey = process.env.FIREBASE_SERVER_KEY1;
   console.log(serverKey);
    let fcm = new FCM(serverKey);
    let message = {
      registration_ids: deviceToken,
    //   registration_ids: ["fiGE6eLLTsOC3-PaBi39zi:APA91bFxeituxeBToGVCVEbyze8u-5HkbUsIcTHnl6zEz1RFu2x2vlQufImwFjINPmbjknux-3rJLay2tEfuBFCc3ARcXQ2W1xaruKo3_tVlZA3l4Vqv3ajOSSf2iFBxzISvRnZNoZxx"],
      notification: {
        title: title,
        body: body,
       
      },
       data:data
    };  
    fcm.send(message, function (error, result) {
      if (error) {
        console.log(error);
      }
      console.log(result);
    });
  };
  