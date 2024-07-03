module.exports = (sequelize, DataTypes) =>{
    const director = sequelize.define('director', {
        firstName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
         dob: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        bankName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        accountHolderName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        accountNo: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       
        IBAN: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        swiftCode: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        bankAddress: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        bankCountry: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        streetAddress: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        zip: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
         status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    return director;
};