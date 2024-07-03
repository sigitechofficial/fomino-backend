module.exports = (sequelize, DataTypes) =>{
    const configuration = sequelize.define('configuration', {
       
       //Open Case
        isOpen_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isOpen_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isOpen_schedule_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isOpen_schedule_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
  
        //Close Case
        
        isClose_schedule_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isClose_schedule_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
        //Temporary Close Case
        temporaryClose_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        temporaryClose_schedule_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        temporaryClose_schedule_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
        //Rush Mode Case
        isRushMode_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isRushMode_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isRushMode_schedule_pickupOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isRushMode_schedule_deliveryOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
  
        
        
        delivery: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        takeAway: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        scheduleOrders: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        tableBooking: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        stampCard: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        cod: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
     
        euro: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        print: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
        selfDelivery: {
           type: DataTypes.BOOLEAN,
            allowNull: true,
        },
       
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    configuration.associate = (models)=>{
       
    };
    return configuration;
};
