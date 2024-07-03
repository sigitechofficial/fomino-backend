module.exports = (sequelize, DataTypes) =>{
    const productCollections = sequelize.define('productCollections', {
        
        minAllowed:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxAllowed:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
       
    });
    productCollections.associate = (models)=>{
        
    };
    return productCollections;
};
