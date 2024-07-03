module.exports = (sequelize, DataTypes) =>{
    const invitation = sequelize.define('invitation', {
       
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        }
    });
    return invitation;
};