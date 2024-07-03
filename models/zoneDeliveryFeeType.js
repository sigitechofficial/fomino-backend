module.exports = (sequelize, DataTypes) =>{
    const zoneDeliveryFeeType = sequelize.define('zoneDeliveryFeeType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        fixedCharges: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        baseCharge: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        baseDistance: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        chargePerExtraUnit: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        extraUnitDistance: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        baseCharge: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    zoneDeliveryFeeType.associate = (models)=>{
        
        // deliveryFeeType.hasMany(models.restaurant);
        // models.restaurant.belongsTo(deliveryFeeType);
    };
    
    return zoneDeliveryFeeType;
};