const { Op } = require('sequelize');
const { driverOnlineSession } = require('../models');

async function getTotalOnlineTimeToday(driver_id) {
   
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const sessions = await driverOnlineSession.findAll({
        where: {
            userId: driver_id,
            start_time: {
                [Op.between]: [startOfDay, endOfDay]
            }
        }
    });
    console.log("*************************************")
 console.log(sessions)
    if (sessions.length == 0) {
        return 0; // No sessions found, return zero
    }

    let totalMilliseconds = 0;
    for (const session of sessions) {
        const endTime = session.end_time || new Date(); // Use current time if end_time is null
        totalMilliseconds += (endTime - new Date(session.start_time));
    }
    return totalMilliseconds / (1000 * 60 * 60); // Convert to hours
}

module.exports = {
    getTotalOnlineTimeToday
};
