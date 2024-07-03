module.exports = (sequelize, DataTypes) =>{
    const cusineRestaurant = sequelize.define('cusineRestaurant', {
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    cusineRestaurant.associate = (models)=>{
       
    };
    
    return cusineRestaurant;
};