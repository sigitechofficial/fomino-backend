require("dotenv").config();
//importing Models
const {
  appPage,
  rolePermissions,
  appLink,
  socialLink,
  charge,
  setting,
  zoneDetails,
  country,
  city,
  director,
  productCollections,
  collection,
  cusineRestaurant,
  collectionAddons,
  zoneRestaurants,
  zone,
  orderType,
zoneDeliveryFeeType,
  user,
  cutlery,
  userType,
  driverEarning,
  role,
  restaurant_cultery,
  addressType,
  menuCategory,
  cuisine,
  paymentMethod,
  deliveryType,
  deliveryFeeType,
  unit,
  restaurant,
  deliveryFee,
  addOnCategory,
  addOn,
  product,
  R_PLink,
  P_AOLink,
  defaultValues,
  R_CLink,
  voucher,
  R_MCLink,
  vehicleType,
  wallet,
  order,
  orderStatus,
  driverDetails,
  serviceType,
  vehicleDetails,
  vehicleImages,
  driverRating,
  permissions,
  P_A_ACLink,
  orderApplication,
  orderMode,
  address,
  orderCharge,
  orderHistory,
  orderItems,
  orderAddOns,
  pushNotification,
  payout,
  restaurantRating,
} = require("../models");
// Importing Custom exception
const CustomException = require("../middlewares/errorObject");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const redis_Client = require("../routes/redis_connect");
const { sign } = require("jsonwebtoken");
const sendNotification = require("../helper/notifications");
const sequelize = require("sequelize");
const admin = require("firebase-admin");
const fs = require('fs');
const API_KEY = "AIzaSyCMpAm-zhl2E4HupCiS3HEvkxi67gKZAG8";
// Initialize Firebase Admin SDK once
const axios = require("axios");
const ApiResponse = require("../helper/ApiResponse");
const GeoPoint = require('geopoint');
const { QueryTypes } = require('sequelize');
async function testing_link(req, res) {
  const link = "https://tedeep.page.link/shareText";
  const domainUriPrefix = `https://tedeep.page.link`;

  const dynamicLinkParams = {
    dynamicLinkInfo: {
      domainUriPrefix: domainUriPrefix,
      link: link,
      androidInfo: {
        androidPackageName: "com.example.deeplinking",
      },
      iosInfo: {
        iosBundleId: "com.example.ios",
      },
    },
    suffix: {
      option: "SHORT",
    },
  };

  try {
    const response = await axios.post(
      `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${API_KEY}`,
      dynamicLinkParams
    );
    console.log("Generated short link:", response.data);
    res.json({ shortLink: response.data });
  } catch (error) {
    console.error(
      "Error generating short link:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error });
  }
}

async function getSpecificRestOrders(req,res){
    const { restId } = req.params;
    let orders = await order.findAll({where:{restaurantId :restId}})
    let data = {
        orders
    };
    let response = ApiResponse("1","data","",data);
    return res.json(response)
}
async function getRestOrders(req,res){
    const { restId } = req.params;
    let orders = await order.findAll({where:{restaurantId :restId}})
    let data = {
        orders
    };
    let response = ApiResponse("1","data","",data);
    return res.json(response)
}
async function get_all_culteries(req,res){
    let culteries = await cutlery.findAll({});
    let data = {
        culteries
    };
    let response = ApiResponse("1","data","",data);
    return res.json(response)
}

async function get_all_business_types(req, res) {
  const types = await orderApplication.findAll({});
  return res.json(ApiResponse("1", "All Business Types", "", types));
}

async function all_order_applications(req, res) {
  const data = await orderApplication.findAll({});
  const response = ApiResponse("1", "All Order applications", "", data);
  return res.json(response);
}

//Module 1 - Auth
/*
        1. Add User Type
*/
async function addUserType(req, res) {
  const { name } = req.body;
  userType
    .create({ name })
    .then((dat) => {
      const response = ApiResponse("1", "User type added successfully", "", {
        name: dat.name,
      });
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in adding User Type",
        "Writing to database failed",
        {}
      );
      return res.json(response);
    });
}
/*
        2. Add Role
*/
async function addRole(req, res) {
  const { name } = req.body;
  const exist = await role.findOne({ where: { name: name } });
  if (exist) {
    const response = ApiResponse(
      "0",
      "The role with same name already exist",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  role
    .create({ name, status: true })
    .then((dat) => {
      const response = ApiResponse("1", "Role added successfully", "", {
        name: dat.name,
      });
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in adding Role",
        "Writing to database failed",
        {}
      );
      return res.json(response);
    });
}

/*
        4. Login Admin
*/
async function login(req, res) {
  const { email, password } = req.body;
  const userTypes = await userType.findOne({ where: { name: "Admin" } });

  const existUser = await user.findOne({
    where: { email: email, userTypeId: userTypes.id },
  });

  const perms = await rolePermissions.findAll({
    where: { roleId: existUser.roleId, status: true },
    attributes: [],
    include: { model: permissions, attributes: ["id", "title"] },
  });

  if (!existUser) {
    const response = ApiResponse(
      "0",
      "User not found",
      "No user exists against this email",
      {}
    );
    return res.json(response);
  }
  let isMatch = await bcrypt.compare(password, existUser.password);
  if (!isMatch) {
    const response = ApiResponse("0", "Bad Credentials", "Login Error", {});
    return res.json(response);
  }
  if (!existUser.status) {
    const response = ApiResponse(
      "0",
      "You are not authorized to login. Please contact admin",
      "Access denied",
      {}
    );
    return res.json(response);
  }
  const accessToken = sign(
    { id: existUser.id, email: existUser.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );
  redis_Client.set(`fom${existUser.id}`, accessToken);
  const data = {
    id: existUser.id,
    name: `${existUser.firstName}${existUser.lastName}`,
    email: existUser.email,
    accessToken: accessToken,
    permissions: perms,
  };
  const response = ApiResponse("1", "Login successfull", "", data);
  return res.json(response);
}
/*
        5. logout Admin
*/
async function logout(req, res) {
  redis_Client
    .del(req.user.id)
    .then((upData) => {
      const response = ApiResponse("1", "Logout successfully", "", {});
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "There is some error logging out. Please try again",
        {}
      );
      return res.json(response);
    });
}
/*
       6. Change password
*/
async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;
  const currUser = await user.findOne({ where: { id: userId } });
  bcrypt
    .compare(oldPassword, currUser.password)
    .then((match) => {
      if (!match) {
        const response = ApiResponse(
          "0",
          "Please enter correct password",
          "Your old password is incorrect",
          {}
        );
        return res.json(response);
      }
      bcrypt.hash(newPassword, 10).then((hashedPassword) => {
        user
          .update({ password: hashedPassword }, { where: { id: userId } })
          .then((passData) => {
            const response = ApiResponse(
              "1",
              "Password changed successfully",
              "",
              {}
            );
            return res.json(response);
          });
      });
    })
    .catch((err) => {
      const response = ApiResponse("0", "Invalid data", err.message, {});
      return res.json(response);
    });
}
/*
       6. Get Currency Unit
*/
async function getUnits(req, res) {
  const userId = req.user.id;
  wallet
    .findAll({
      where: { userId },
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("currencyUnitId")),
          "currencyUnitId",
        ],
      ],
    })
    .then((walletData) => {
      let outArr = walletData.map((ele) => {
        return ele.currencyUnitId;
      });
      unit
        .findAll({
          where: { id: { [Op.in]: outArr } },
        })
        .then((unitData) => {
          const response = ApiResponse("1", "Currency Units", "", unitData);
          return res.json(response);
        });
    })
    .catch((err) => {
      const response = ApiResponse("0", "Invalid Data", "", {});
      return res.json(response);
    });
}
/*
       6. Get Currency Unit
*/
async function getWallet(req, res) {
  const userId = req.user.id;
  const unitId = req.body.unitId;
  wallet
    .findAll({
      where: {
        [Op.and]: [{ userId }, { currencyUnitId: unitId }],
      },
    })
    .then((walletData) => {
      const response = ApiResponse("1", "Currency Units", "", walletData);
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse("0", "Invalid Data", err.message, {});
      return res.json(response);
    });
}

//Module 2 : Address
/*
        1. Add Address Label
*/
async function addAddressType(req, res) {
  const { name } = req.body;
  addressType
    .create({ name, status: true })
    .then((dat) => {
      const response = ApiResponse("1", "Address type added successfully", "", {
        name: dat.name,
      });
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in adding Address Type",
        "Error",
        {}
      );
      return res.json(response);
    });
}
/*
        2. Get All Address labels which are active
*/
async function getAddressType(req, res) {
  const addressLabels = await addressType.findAll();
  const response = ApiResponse("1", "All Address labels", "", addressLabels);
  return res.json(response);
}

/*
        3. Delte Address labels which are active
*/
async function deleteAddressType(req, res) {
  const { addressTypeId } = req.body;
  addressType
    .update({ status: false }, { where: { id: addressTypeId } })
    .then((upData) => {
      const response = ApiResponse("1", "Address label deleted", "", {});
      return res.json(response);
    });
}
/*
        4. Edit address Label
*/
async function editAddressType(req, res) {
  const { id, name } = req.body;
  const exist = await addressType.findOne({
    where: { name: name, [Op.not]: [{ id: id }] },
  });
  if (exist) {
    const response = ApiResponse(
      "0",
      "Address Type with this name already exist",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  addressType.update({ name: name }, { where: { id: id } }).then((upData) => {
    const response = ApiResponse(
      "1",
      "Address Type updated successfully",
      "",
      {}
    );
    return res.json(response);
  });
}

// MODULE 3: Restuarant
/*
        1. Add Menu Category
*/
async function addMenuCategory(req, res) {
  const { name } = req.body;
  const businessTypeId = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  // check if already exists
  const menuCategoryExist = await menuCategory.findOne({
    where: { name: name },
  });
  if (menuCategoryExist) {
    const response = ApiResponse(
      "0",
      "Category with this name already exists",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  menuCategory
    .create({ name, businessType: businessTypeId.name, status: true })
    .then((dat) => {
      const response = ApiResponse(
        "1",
        "Menu Category added successfully",
        "",
        {}
      );
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in adding menu category",
        "Error",
        {}
      );
      return res.json(response);
    });
}
// 1. Add Menu Category for Store

async function addMenuCategoryStore(req, res) {
  const { name, businessType } = req.body;
  const businessTypeId = await orderApplication.findOne({
    where: { name: "store" },
  });
  // check if already exists
  const menuCategoryExist = await menuCategory.findOne({
    where: { name: name },
  });
  if (menuCategoryExist) {
    const response = ApiResponse(
      "0",
      "Category with this name already exists",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  menuCategory
    .create({ name, businessType: businessTypeId.id, status: true })
    .then((dat) => {
      const response = ApiResponse(
        "1",
        "Menu Category added successfully",
        "",
        { name: dat.name }
      );
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in adding maneu category",
        "Error",
        {}
      );
      return res.json(response);
    });
}

async function get_module_types(req, res) {
  const types = await orderApplication.findAll({
    where: { name: { [Op.notLike]: "%taxi%" } },
  });
  const response = ApiResponse("1", "Modules types", "", types);
  return res.json(response);
}
/*
        2. Get All Menu Category
*/
async function allMenuCategories(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  const menuCategories = await menuCategory.findAll({
    where: { businessType: "restaurant" },
    order: [["id", "desc"]],
  });
  let data = [];
  for (var i = 0; i < menuCategories.length; i++) {
    const type = await orderApplication.findOne({
      where: { id: menuCategories[i].businessType },
    });
    let obj = {
      id: menuCategories[i].id,
      name: menuCategories[i]?.name,
      image: menuCategories[i]?.image,
      // businessType: type.name,
      status: menuCategories[i].status,
      createdAt: menuCategories[i].createdAt,
      updatedAt: menuCategories[i].updatedAt,
    };
    data.push(obj);
  }
  const response = ApiResponse("1", "All Menu Categories", "", data);
  return res.json(response);
}
async function allMenuCategoriesStore(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "store" },
  });
  const menuCategories = await menuCategory.findAll({
    where: { businessType: type.id },
    order: [["id", "desc"]],
  });
  let data = [];
  for (var i = 0; i < menuCategories.length; i++) {
    const type = await orderApplication.findOne({
      where: { id: menuCategories[i].businessType },
    });
    let obj = {
      id: menuCategories[i].id,
      name: menuCategories[i].name,
      businessType: type.name,
      status: menuCategories[i].status,
      createdAt: menuCategories[i].createdAt,
      updatedAt: menuCategories[i].updatedAt,
    };
    data.push(obj);
  }
  const response = ApiResponse("1", "All Menu Categories", "", data);
  return res.json(response);
}
/*
        2.1. Get active Menu Category
*/
async function activeMenuCategories(req, res) {
  const menuCategories = await menuCategory.findAll({
    where: { status: true },
  });
  let outArr = [];
  menuCategories.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
    };
    outArr.push(tmpObj);
  });
  const response = ApiResponse("1", "Active Menu Categories", "", outArr);
  return res.json(response);
}
/*
        3. Edit Menu Category
*/
async function editMenuCategories(req, res) {
  const { id, name, businessType } = req.body;
  const exist = await menuCategory.findOne({ where: { id: id } });
  if (exist) {
    if (exist.name === name && exist.businessType === businessType) {
      const response = ApiResponse(
        "0",
        "Menu Category with this name exists",
        "Please try some other name",
        {}
      );
      return res.json(response);
    }

    exist.name = name;
    exist.businessType = businessType;
    exist
      .save()
      .then((dat) => {
        const response = ApiResponse(
          "1",
          "Menu Category updated successfully",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", "Something went wrong", "", {});
        return res.json(response);
      });
    // exist.update({ name: name }, { businessType: businessType }, { where: { id: id } })
    //     .then(upData => {
    //         return res.json({
    //             status: "1",
    //             message: "Menu Category updated successfully",
    //             data: {},
    //             error: ""
    //         });
    //     })
    //     .catch((error) => {
    //         return res.json({
    //             status: "0",
    //             message: "Something went wrong!",
    //             data: {},
    //             error: ""
    //         });
    //     })
  }
}
/*
        4. Change Status of Menu Category
*/
async function changeStatusMenuCategories(req, res) {
  const { status, id } = req.body;
  menuCategory
    .update({ status: status }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Status updated successfully",
        data: {},
        error: "",
      });
    });
}
/*
        5. Add cuisine
*/
// async function addCuisine(req, res) {
//   const { name, businessType } = req.body;
//   const businessTypeId = await orderApplication.findOne({
//     where: { name: "restaurant" },
//   });
//   // check if already exists
//   const cuisineExist = await cuisine.findOne({ where: { name: name } });
//   if (cuisineExist) {
//     const response = ApiResponse(
//       "0",
//       "Cuisine with this name exist",
//       "Please try some other name",
//       {}
//     );
//     return res.json(response);
//   }
//   //in path changing \\ to /
//   let tmpPath = req.file.path;
//   let path = tmpPath.replace(/\\/g, "/");
//   //return res.json(path)

//   newc = new cuisine();
//   newc.name = name;
//   newc.businessType = businessTypeId.id;
//   newc.status = true;
//   newc.image = path;
//   newc
//     .save()
//     .then((dat) => {
//       const response = ApiResponse("1", "Cuisine added successfully", "", {});
//       return res.json(response);
//     })
//     .catch((err) => {
//       const response = ApiResponse("0", "Error in adding Cuisine", "Error", {});
//       return res.json(response);
//     });
//   // cuisine.create({name,businessType:"2" ,status: true, image: path})
//   // .then(dat =>{
//   //     return res.json({
//   //         status: '1',
//   //         message: 'Cuisine added successfully',
//   //         data:{
//   //             name: dat.name,
//   //         },
//   //         error: '',
//   //     });
//   // })
//   // .catch(err=>{
//   //     return res.json({
//   //         status: '0',
//   //         message: 'Error in adding Cuisine',
//   //         data:[],
//   //         error: 'Writing to database failed',
//   //     });
//   // });
// }

async function addCuisineStore(req, res) {
  const { name, businessType } = req.body;
  const businessTypeId = await orderApplication.findOne({
    where: { name: "store" },
  });
  // check if already exists
  const cuisineExist = await cuisine.findOne({ where: { name: name } });
  if (cuisineExist) {
    const response = ApiResponse(
      "0",
      "Cuisine with this name exist",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  //in path changing \\ to /
  let tmpPath = req.file.path;
  let path = tmpPath.replace(/\\/g, "/");
  //return res.json(path)

  newc = new cuisine();
  newc.name = name;
  newc.businessType = businessTypeId.id;
  newc.status = true;
  newc.image = path;
  newc
    .save()
    .then((dat) => {
      const response = ApiResponse("1", "Cusine added successfully!", "", {
        name: dat.name,
      });
      return re.json(response);
    })
    .catch((err) => {
      const response = ApiResponse("0", "Error in adding Cuisine", "Error", {});
      return res.json(response);
    });
  // cuisine.create({name,businessType:"2" ,status: true, image: path})
  // .then(dat =>{
  //     return res.json({
  //         status: '1',
  //         message: 'Cuisine added successfully',
  //         data:{
  //             name: dat.name,
  //         },
  //         error: '',
  //     });
  // })
  // .catch(err=>{
  //     return res.json({
  //         status: '0',
  //         message: 'Error in adding Cuisine',
  //         data:[],
  //         error: 'Writing to database failed',
  //     });
  // });
}
/*
        6. Get All cuisines
*/
async function getRestaurantCuisines(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  const cuisineList = await R_CLink.findAll({
    where: [ { restaurantId: req.params.restaurantId }],
    include:{model:cuisine}
  });
  if (!cuisineList) {
    const response = ApiResponse(
      "0",
      "No data available",
      "Please add cusines to show here",
      {}
    );
    return res.json(response);
  }
 

  const response = ApiResponse("1", "List of Cuisine", "", cuisineList);
  return res.json(response);
}
async function getAllCuisines(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  const cuisineList = await cuisine.findAll({
    where: [ { businessType: type.id }],
  });
  if (!cuisineList) {
    const response = ApiResponse(
      "0",
      "No data available",
      "Please add cusines to show here",
      {}
    );
    return res.json(response);
  }
  let outArr = [];
  cuisineList.map((ele, id) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
      path: ele.image,
      status: ele.status,
    };
    outArr.push(tmpObj);
  });
  const response = ApiResponse("1", "List of Cuisine", "", outArr);
  return res.json(response);
}
async function getAllCuisinesStore(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "store" },
  });
  const cuisineList = await cuisine.findAll({
    where: [ { businessType: type.id }],
  });
  if (!cuisineList) {
    const response = ApiResponse(
      "0",
      "No data available",
      "Please add cuisines to show here",
      {}
    );
    return res.json(response);
  }

  const response = ApiResponse("1", "List of Cuisine", "", cuisineList);
  return res.json(response);
}
async function restAddOns(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  const list = await addOn.findAll({
    where: [{ status: true }, { orderApplicationName: type.id }],
  });
  if (!list) {
    const response = ApiResponse(
      "0",
      "No data available",
      "Please add cuisines to show here",
      {}
    );
    return res.json(response);
  }
 
  const response = ApiResponse("1", "List of Cuisine", "", list);
  return res.json(response);
}
async function storeAddOns(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "store" },
  });
  const list = await addOn.findAll({
    where: [{ status: true }, { orderApplicationName: type.id }],
  });
  if (!list) {
    const response = ApiResponse(
      "0",
      "No data available",
      "Please add cuisines to show here",
      {}
    );
    return res.json(response);
  }
 
  const response = ApiResponse("1", "List of Cuisine", "", list);
  return res.json(response);
}
/*
        2.1. Get active Menu Category
*/
async function getActiveCuisines(req, res) {
  // return res.json(req.params.restId)
  const restaurant_cusines = await R_CLink.findAll({
    where: [{ restaurantId: req.params.restId }],
    include: [{ model: cuisine }],
  });
  const cuisineList = await cuisine.findAll({
    where: [{ status: true }, { businessType: 1 }],
  });
  let outArr = [];
  cuisineList.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
    };
    outArr.push(tmpObj);
  });
  const data = {
    data: outArr,
    restaurant_cusines: restaurant_cusines,
  };
  const response = ApiResponse("1", "Active Cuisines", "", data);
  return res.json(response);
}
/*
        7. Edit cuisines
*/
async function editCuisine(req, res) {
  const { id, name } = req.body;
  const exist = await cuisine.findOne({
    where: { name: name, id: { [Op.ne]: id } },
  });
  if (exist) {
    const response = ApiResponse(
      "0",
      "Menu category with this name exists",
      "Error",
      {}
    );
    return res.json(response);
  }
  if (req.file) {
    let tmpPath = req.file.path;
    let path = tmpPath.replace(/\\/g, "/");
    cuisine
      .update({ name: name, image: path }, { where: { id: id } })
      .then((upData) => {
        const response = ApiResponse(
          "1",
          "Menu Category updated successfully",
          "",
          {}
        );
        return res.json(response);
      });
  } else {
    cuisine.update({ name: name }, { where: { id: id } }).then((upData) => {
      const response = ApiResponse(
        "1",
        "Menu Category updated successfully",
        "",
        {}
      );
      return res.json(response);
    });
  }
}


async function addCuisine(req, res) {
  
  
  try {
    const { name, restaurantId } = req.body;
    let type = await restaurant.findOne({ where: { id: restaurantId }, attributes: ['businessType'] });
    // return res.json(type)

    let check = await cuisine.findOne({ where: { name: name, businessType: type.businessType } });
    if (check) {
      let response = ApiResponse("0", "Already exists with this name", {});
      return res.json(response);
    } else {
      let cus = new cuisine();
      cus.name = name;
      cus.businessType = type.businessType;

      let tmpPath = req.file.path;
      let path = tmpPath.replace(/\\/g, "/");
      cus.image = path;

      await cus.save();
      
      let cusRest = new cusineRestaurant();
      cusRest.cusineId = cus.id;
      cusRest.restaurantId = restaurantId;
      cusRest.status = true;

      await cusRest.save();
      
     
      
      let response = ApiResponse("1", "Added successfully","", {});
      return res.json(response);
    }
  } catch (error) {
    // Rollback the transaction if there's an error
  
    
    let response = ApiResponse("0", error.message,"", {});
    return res.json(response);
  }
}


/*
        8. Change status of cuisine
*/
async function changeCuisineStatus(req, res) {
  const { id, status } = req.body;
  cuisine.update({ status: status }, { where: { id: id } }).then((upData) => {
    const response = ApiResponse("1", "Status updated successfully", "", {});
    return res.json(response);
  });
}
/*
        9. Add Delivery Type
*/
async function addPaymentMethod(req, res) {
  const { name } = req.body;
  // check if already exists
  const methodExist = await paymentMethod.findOne({ where: { name: name } });
  if (methodExist) {
    const response = ApiResponse(
      "0",
      "This payment method already exists",
      "Please try some other name",
      {}
    );
    return res.json(response);
  }
  paymentMethod
    .create({ name, status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "Payment method added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding payment method",
        data: [],
        error: "Writing to database failed",
      });
    });
}

/*
        10. Get All Payment Methods
*/
async function getAllPaymentMethods(req, res) {
  const paymentList = await paymentMethod.findAll();
  return res.json({
    status: "1",
    message: "List of Cuisine",
    data: paymentList,
    error: "",
  });
}
/*
        10.1. Get active payment methods
*/
async function getactivePaymentMethods(req, res) {
  const paymentList = await paymentMethod.findAll({ where: { status: true } });
  let outArr = [];
  paymentList.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "Active Payment methods",
    data: outArr,
    error: "",
  });
}
/*
        11. Edit payment methods
*/
async function editPaymentMethod(req, res) {
  const { id, name } = req.body;
  const exist = await paymentMethod.findOne({
    where: { name: name, [Op.not]: [{ id: id }] },
  });
  if (exist)
    return res.json({
      status: "0",
      message: "Payment Method with this name already exists",
      data: {},
      error: "",
    });
  paymentMethod.update({ name: name }, { where: { id: id } }).then((upData) => {
    return res.json({
      status: "1",
      message: "Payment Method updated successfully",
      data: {},
      error: "",
    });
  });
}
/*
        12. Change Status of payment method
*/
async function changePaymentMethodStatus(req, res) {
  const { id, status } = req.body;
  paymentMethod
    .update({ status: status }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Status updated successfully",
        data: {},
        error: "",
      });
    });
}
/*
        13. Add Delivery Type
*/
async function addDeliveryType(req, res) {
  const { name } = req.body;
  // check if already exists
  const typeExist = await deliveryType.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This delivery type already exits",
      "Please try some other name"
    );
  deliveryType
    .create({ name: name, status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "Delivery Type added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding Delivery Type",
        data: [],
        error: "Writing to database failed",
      });
    });
}

/*
        14. Get All Delivery Types
*/
/*
        14.1. Get active Delivery Types
*/
async function activeDeliveryTypes(req, res) {
  const list = await deliveryType.findAll({ where: { status: true } });
  let outArr = [];
  list.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "Active Payment methods",
    data: outArr,
    error: "",
  });
}
/*
        15. Edit delivery type
*/
/*
        16. Change delivery type Status
*/

/*
        17. Add Delivery Fee Type
*/
async function addDeliveryFeeType(req, res) {
  const { name } = req.body;
  // check if already exists
  const typeExist = await deliveryFeeType.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This delivery fee type already exits",
      "Please try some other name"
    );
  deliveryFeeType
    .create({ name, status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "Delivery Fee Type added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding Delivery Fee Type",
        data: [],
        error: "Writing to database failed",
      });
    });
}
/*
        18. Get All Delivery Fee Type
*/
/*
        18.1. Get active Delivery Fee Type
*/
async function activeDeliveryFeeType(req, res) {
  const list = await deliveryFeeType.findAll({ where: { status: true } });
  let outArr = [];
  list.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: ele.name,
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "Active Delivery Fee Type",
    data: outArr,
    error: "",
  });
}
/*
        19. Edit Delivery Fee Type
*/
/*
        20. Change Status of Delivery Fee Type
*/

/*
        13. Add unit
*/
async function addUnit(req, res) {
  const { name, type, symbol } = req.body;
  // check if already exists
  const typeExist = await unit.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This unit already exits",
      "Please try some other name"
    );
  unit
    .create({ name, type, symbol, status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "Unit added successfully",
        data: {
          name: dat.name,
          symbol: dat.symbol,
          type: dat.type,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding unit ",
        data: [],
        error: "Writing to database failed",
      });
    });
}
/*
        14. Get All units
*/
async function getAllUnits(req, res) {
  const listOfUnits = await unit.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });
  let currencyUnits = listOfUnits.filter((ele) => ele.type === "currency");
  let distanceUnits = listOfUnits.filter((ele) => ele.type === "distance");

  return res.json({
    status: "1",
    message: "Active Delivery Fee Type",
    data: {
      currencyUnits,
      distanceUnits,
    },
    error: "",
  });
}
async function getAllActiveUnits(req, res) {
  const listOfUnits = await unit.findAll({
    where: { status: true },
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });
  let currencyUnits = listOfUnits.filter((ele) => ele.type === "currency");
  let distanceUnits = listOfUnits.filter((ele) => ele.type === "distance");

  return res.json({
    status: "1",
    message: "Active Delivery Fee Type",
    data: {
      currencyUnits,
      distanceUnits,
    },
    error: "",
  });
}
/*
        15. Get specific unit by type
*/
async function getSpecificUnits(req, res) {
  const type = req.params.type;
  const list = await unit.findAll({ where: { type: type, status: true } });
  let outArr = [];
  list.map((ele) => {
    let tmpObj = {
      id: ele.id,
      name: `${ele.name}(${ele.symbol})`,
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: `Active units of ${type}`,
    data: outArr,
    error: "",
  });
}
/*
        15. Edit unit
*/
async function editUnit(req, res) {
  const { id, name, type, symbol } = req.body;
  const exist = await unit.findOne({
    where: { name: name, [Op.not]: [{ id: id }] },
  });
  if (exist)
    throw new CustomException(
      "Unit with this name exists",
      "Please try some other name"
    );
  unit
    .update({ name: name, type: type, symbol: symbol }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Unit updated successfully",
        data: {},
        error: "",
      });
    });
}
/*
        15. Change status of Unit
*/
async function changeUnitStatus(req, res) {
  const { id, status } = req.body;
 const data = await unit.findOne({where:{id:id}});
  if(data)
  {
      data.status = status;  
     
      data.save().then(dat =>{
          const response = ApiResponse("1","Status Updated successfully","",{});
          return res.json(response);
      })
      .catch((error) =>{
          const response = ApiResponse("0",error.message,"Error",{});
          return res.json(response);
      })
  }
  else{
      const response = ApiResponse("0","Sorry not found","",{});
      return res.json(response);
  }
}
async function updateUnit(req, res) {
  const { id, name,symbol,shortcode } = req.body;
  const data = await unit.findOne({where:{id:id}});
  if(data)
  {
      data.name = name;  
      data.symbol = symbol;  
      data.shortcode = shortcode;  
      data.save().then(dat =>{
          const response = ApiResponse("1","Updated success fully","",{});
          return res.json(response);
      })
      .catch((error) =>{
          const response = ApiResponse("0",error.message,"Error",{});
          return res.json(response);
      })
  }
  else{
      const response = ApiResponse("0","Sorry not found","",{});
      return res.json(response);
  }
  
}
/*
        16. Add restaurant
*/
async function addRestaurant(req, res) {
  //console.log(req.body)
//   return res.json(req.body.email)
  const {
    businessName,
    businessEmail,
   
    firstName,
    lastName,
    password,
    email,
    countryCode,
    phoneNum,
    city,
    lat,
    lng,
    zipCode,
    description,
    address,
    logo,
    image,
    approxDeliveryTime,
    packingFee,
    zoneId
  
   
   
  } = req.body;
//   return res.json(req.body)
  // check if already exists
  const checkUser = await user.findOne({where:{[Op.or]:[{email:email},{phoneNum:phoneNum}]}});
  if(checkUser){
    return res.json({
      status: "0",
      message: "Email or Phone already taken",
      data: {},
      error: "Email or Phone already taken",
    });
  }
  const exist = await restaurant.findOne({
    where: { businessName: businessName },
  });
  if(exist){
      let response = ApiResponse("0","Restaurant with this business Name already exist","",{});
      return res.json(response);
  }
  const restType = await userType.findOne({where:{name:'Retailer'}})
  const newUser = new user();
  newUser.firstName = firstName;
  newUser.lastName = lastName;
  newUser.email = email;
  newUser.phoneNum = phoneNum;
  newUser.countryCode = countryCode;
  newUser.status = 1;
  newUser.userTypeId = restType.id;
  newUser.password = await bcrypt.hash(password, 10);
  await newUser.save();



  //in path changing \\ to /
  let logoPathTemp = req.files.logo[0].path;
  let logoPath = logoPathTemp.replace(/\\/g, "/");
  let imagePathTemp = req.files.coverImage[0].path;
  let imagePath = imagePathTemp.replace(/\\/g, "/");

    const deliveryCharge = await defaultValues.findOne({ where: { name: "deliveryCharge" } });
    const businessTypeId = await defaultValues.findOne({ where: { name: "businessType" } });
    const serviceChargesTypeId = await defaultValues.findOne({ where: { name: "serviceChargesType" } });
    const serviceCharges = await defaultValues.findOne({ where: { name: "serviceCharges" } });
    const deliveryFeeTypeId = await defaultValues.findOne({ where: { name: "deliveryFeeTypeId" } });
    const deliveryTypeId = await defaultValues.findOne({ where: { name: "deliveryTypeId" } });
    const paymentMethodId = await defaultValues.findOne({ where: { name: "paymentMethodId" } });
    const deliveryRadius = await defaultValues.findOne({ where: { name: "deliveryRadius" } });
    const deliveryFeeFixed = await defaultValues.findOne({ where: { name: "deliveryFeeFixed" } });
    const distanceUnitId = await defaultValues.findOne({ where: { name: "distanceUnitId" } });
    const comission = await defaultValues.findOne({ where: { name: "comission" } });
    const closingTime = await defaultValues.findOne({ where: { name: "closingTime" } });
    const openingTime = await defaultValues.findOne({ where: { name: "openingTime" } });
    const minOrderAmount = await defaultValues.findOne({ where: { name: "minOrderAmount" } });
    const VATpercent = await defaultValues.findOne({ where: { name: "VATpercent" } });
    const pricesIncludeVAT = await defaultValues.findOne({ where: { name: "pricesIncludeVAT" } });
    const businessType = await defaultValues.findOne({ where: { name: "businessType" } });

    
  restaurant
    .create({
      deliveryTypeId:deliveryTypeId.value,
      distanceUnitId:distanceUnitId.value,
      deliveryCharge:deliveryCharge.value,
      comission:comission.value,
      businessName,
      businessEmail,
      businessType:businessType.id,
      
      email,
      countryCode:countryCode,
      phoneNum:phoneNum,
      city,
      paymentMethodId : paymentMethodId.value,
      businessType : businessTypeId.value,
      lat,
      lng,
      zipCode,
      description,
      serviceChargesType:serviceChargesTypeId.value,
      address,
      logo: logoPath,
      image: imagePath,
      openingTime:openingTime.value,
      closingTime:closingTime.value,
      approxDeliveryTime,
      deliveryFeeFixed:deliveryFeeFixed.value,
      minOrderAmount:minOrderAmount.value,
      
      packingFee,
      deliveryRadius:deliveryRadius.value,
     
      comission:comission.value,
      deliveryTypeId:deliveryTypeId.value,
     
      deliveryFeeTypeId:deliveryFeeFixed.value,
      status: true,
     
      pricesIncludeVAT:pricesIncludeVAT.value,
      VATpercent:VATpercent.value,
      userId:newUser.id
    })
    .then((rData) => {
      return res.json({
          status: "1",
          message: "Restaurant Added successfully",
          data: {},
          error: "",
        });
    })
    .catch((error) => {
      let response = ApiResponse("0",error.message,"",{});
      return res.json(response)
    });
}
/*
        17. Get All restaurants
*/
async function getAllRestaurants(req, res) {
 const type = await orderApplication.findOne({where:{name:"restaurant"}});
  const list = await restaurant.findAll({where:{businessType:type.id}});
  let outArr = [];
  list.map((ele) => {
    let opTime = new Date(ele.openingTime);
    let clTime = new Date(ele.closingTime);
    let cAt = new Date(ele.createdAt);
    let tmpObj = {
      id: ele.id,
      logo: ele.logo,
      businessName: ele.businessName,
      city: ele.city,
      ownerName: ele.name,
      status: ele.status,
      operatingTime: `${opTime.toLocaleTimeString(
        "en-US"
      )} - ${clTime.toLocaleTimeString("en-US")}`,
      joinedAt: cAt.toLocaleDateString("en-US"),
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "All restaurants",
    data: outArr,
    error: "",
  });
}
async function getAllStores(req, res) {
  const type = await orderApplication.findOne({where:{name:"store"}});
  
  const list = await restaurant.findAll({where:{businessType:type?.id}});
  let outArr = [];
  list.map((ele) => {
    let opTime = new Date(ele.openingTime);
    let clTime = new Date(ele.closingTime);
    let cAt = new Date(ele.createdAt);
    let tmpObj = {
      id: ele.id,
      logo: ele.logo,
      businessName: ele.businessName,
      city: ele.city,
      ownerName: ele.name,
      status: ele.status,
      operatingTime: `${opTime.toLocaleTimeString(
        "en-US"
      )} - ${clTime.toLocaleTimeString("en-US")} `,
      joinedAt: cAt.toLocaleDateString("en-US"),
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "All restaurants",
    data: outArr,
    error: "",
  });
}
async function getAllRelatedRestaurants(req, res) {
  const unitId = req.body.unitId;
  const list = await restaurant.findAll({ where: { unitId } });
  let outArr = [];
  list.map((ele) => {
    let opTime = new Date(ele.openingTime);
    let clTime = new Date(ele.closingTime);
    let cAt = new Date(ele.createdAt);
    let tmpObj = {
      id: ele.id,
      logo: ele.logo,
      businessName: ele.businessName,
      city: ele.city,
      ownerName: ele.name,
      status: ele.status,
      operatingTime: `${opTime.toLocaleTimeString(
        "en-US"
      )} - ${clTime.toLocaleTimeString("en-US")} `,
      joinedAt: cAt.toLocaleDateString("en-US"),
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "All restaurants",
    data: outArr,
    error: "",
  });
}
/*
        18. Update Restaurant
*/
//18.1 General
//get
async function getResGeneral(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({ where: { id: id } });
  let opTime = new Date(resData.openingTime);
  let clTime = new Date(resData.closingTime);
  let outObj = {
    id: resData.id,
    businessEmail: resData.businessEmail,
    businessName: resData.businessName,
    description: resData.description,
    logo: resData.logo,
    countryCode: resData.countryCode,
    phoneNum: resData.phoneNum,
    openingTime: opTime.toLocaleTimeString("en-US"),
    closingTime: clTime.toLocaleTimeString("en-US"),
    certificateCode: resData.certificateCode,
  };
  return res.json({
    status: "1",
    message: "Restaurant General Data",
    data: outObj,
    error: "",
  });
}
//update
async function editResGeneral(req, res) {
  const {
    businessName,
    description,
    businessEmail,
    countryCode,
    phoneNum,
    openingTime,
    closingTime,
    certificateCode,
    id,
  } = req.body;
  if(!id){
      let response = ApiResponse("0","Restaurant ID is required","",{});
      return res.json(response)
  }
  
  const rest = await restaurant.findOne({where:{id:id}});
  if(rest){
      rest.businessName = businessName;
      rest.description = description;
      rest.businessEmail = businessEmail;
      rest.countryCode = countryCode;
      rest.phoneNum = phoneNum;
      rest.closingTime = closingTime;
      rest.openingTime = openingTime;
      rest.certificateCode = certificateCode;
     rest.save().then(dat =>{
         return res.json({
        status: "1",
        message: "General Data Updated",
        data: {},
        error: "",
      });
     })
     .catch((error)=>{
         return res.json({
        status: "0",
        message: error.message,
        data: {},
        error: `Error`,
      });
     })
  }
  else{
    let response = ApiResponse("0","Restaurant not found","",{});
      return res.json(response)  
  }
  
}

//18.2 Meta Data
//get
async function getResMetaData(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({ where: { id: id },include:[{model:director}, { model: deliveryType },
      { model: deliveryFeeType },
      { model: deliveryFee },
      { model: zoneRestaurants,include:{model:zone ,attributes:['id'],include:{model:zoneDetails,include:[{ model: unit, as: "distanceUnit"},{ model: unit, as: "currencyUnit"}],attributes:['id']} } },] });
  
    let rmc = await R_MCLink.findAll({attributes:[],where:{restaurantId:id},include:[{model:menuCategory,attributes:['name']},{model:R_PLink}]});

  let outObj = {
      general:{
          businessName:resData.businessName,
          businessEmail:resData.businessEmail,
          openingTime:resData.openingTime,
          closingTime:resData.closingTime,
          coverImage:resData.coverImage ?resData.coverImage:null ,
          logo:resData.logo,
          phoneNum:resData.phoneNum,
          countryCode:resData.countryCode,
          certificateCode:resData.certificateCode,
          description:resData.description,
      },
      metaData:{
          address: resData.address,
            city: resData.city,
            lat: resData.lat,
            lng: resData.lng,
            zipCode: resData.zipCode,
            deliveryRadius: resData.deliveryRadius,
            approxDeliveryTime: `${resData.approxDeliveryTime}`,
            isPureVeg: resData.isPureVeg,
            isFeatured: resData.isFeatured,
      },
    charges:{
        minOrderAmount:resData?.minOrderAmount,
        packingFee:resData?.packingFee,
        comission:resData?.comission,
        pricesIncludeVAT:resData?.pricesIncludeVAT,
        VATpercent:resData?.VATpercent,
    },
    menuSetting:{
        rmc
    },
    bankDetails:{
        bankDetails:resData?.director
    },
    deliveryData:{
        
    deliveryTypeId: resData.deliveryTypeId,
    deliveryTypeName: resData.deliveryType.name,
    deliveryFeeTypeId: resData.deliveryFeeTypeId,
    deliveryFeeTypeName: resData.deliveryFeeType.name,
    deliveryFeeValues: resData.deliveryFee,
    // deliveryFee:
    //   resData.deliveryFeeTypeId === 2
    //     ? resData.deliveryFee
    //     : { deliveryFeeFixed: resData.deliveryFeeFixed },
    distanceUnit: resData?.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.name,
    currencyUnit: resData?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol,
    deliveryFeeFixed: resData?.deliveryFeeFixed,
 
    }
    
  };
  return res.json({
    status: "1",
    message: "Restaurant Meta Data",
    data: outObj,
    error: "",
  });
}
//update
async function editResMetaData(req, res) {
  const {
    address,
    city,
    lat,
    lng,
    zipCode,
    deliveryRadius,
    approxDeliveryTime,
    isPureVeg,
    isFeatured,
    id,
  } = req.body;
  const rest = await restaurant.findOne({where:{id:id}});
//   return res.json(rest)
  if(rest){
      rest.city = city;
      rest.address = address;
      rest.lat = lat;
      rest.lng = lng;
      rest.zipCode = zipCode;
      rest.deliveryRadius = deliveryRadius;
      rest.isPureVeg = isPureVeg;
      rest.isFeatured = isFeatured;
      if(approxDeliveryTime){
        rest.approxDeliveryTime = approxDeliveryTime;
      }
      rest.save().then(dat =>{
          const response = ApiResponse("1","Restaurant Udpated Successfully","",{});
          return res.json(response);
      })
      .catch((error)=>{
          const response = ApiResponse("0",error.message,"Error",{});
          return res.json(response);
      })
  }
  else{
      const response = ApiResponse("0","Sorry! Restaurant not found","Error",{});
      return res.json(response);
  }
//   restaurant
//     .update(
//       {
//         address,
//         city,
//         lat,
//         lng,
//         zipCode,
//         deliveryRadius,
//         approxDeliveryTime,
//         isPureVeg,
//         isFeatured,
//       },
//       { where: { id: id } }
//     )
//     .then((upData) => {
//       return res.json({
//         status: "1",
//         message: "Meta Data Updated",
//         data: {},
//         error: "",
//       });
//     })
//     .catch((err) => {
//       return res.json({
//         status: "0",
//         message: "Database error",
//         data: { err },
//         error: `${err.parent.code}. Please try again later.`,
//       });
//     });
}
//18.3 Delivery Settings
//get
async function getResDeliverySettings(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({
    where: { id: id },
    include: [
      { model: deliveryType },
      { model: deliveryFeeType },
      { model: deliveryFee },
      { model: zoneRestaurants,include:{model:zone ,attributes:['id'],include:{model:zoneDetails,include:[{ model: unit, as: "distanceUnit"},{ model: unit, as: "currencyUnit"}],attributes:['id']} } },
    //   { model: unit, as: "distanceUnitID" },
    //   { model: unit, as: "currencyUnitID" },
    ],
  });
//   return res.json(resData);
  let outObj = {
    deliveryTypeId: resData.deliveryTypeId,
    deliveryTypeName: resData.deliveryType.name,
    deliveryFeeTypeId: resData.deliveryFeeTypeId,
    deliveryFeeTypeName: resData.deliveryFeeType.name,
    deliveryFeeValues: resData.deliveryFee,
    // deliveryFee:
    //   resData.deliveryFeeTypeId === 2
    //     ? resData.deliveryFee
    //     : { deliveryFeeFixed: resData.deliveryFeeFixed },
    distanceUnit: resData?.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.name,
    currencyUnit: resData?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol,
    deliveryFeeFixed: resData?.deliveryFeeFixed,
  };
  return res.json({
    status: "1",
    message: "Restaurant Delivery Settings",
    data: outObj,
    error: "",
  });
}
//update
async function editResDeliverySettings(req, res) {
  const {
    deliveryTypeId,
    deliveryFeeTypeId,
    deliveryFeeFixed,
    deliveryFees,
    baseCharge,
    baseDistance,
    chargePerExtraUnit,
    extraUnitDistance,
    id,
  } = req.body;

  let restData = await restaurant.findOne({ where: { id: id } });
  if (restData) {
    if (parseInt(deliveryTypeId) === 1 || parseInt(deliveryTypeId) === 3) {
      if (parseInt(deliveryFeeTypeId) === 2) {
        restData.deliveryTypeId = deliveryTypeId;
        restData.deliveryFeeTypeId = deliveryFeeTypeId;
        restData.deliveryFeeFixed = deliveryFeeFixed;

        restData
          .save()
          .then(async (dat) => {
            let deliveryData = await deliveryFee.findOne({
              where: { restaurantId: restData.id },
            });
            if (deliveryData) {
              deliveryData.baseCharge = baseCharge;
              deliveryData.baseDistance = baseDistance;
              deliveryData.chargePerExtraUnit = chargePerExtraUnit;
              deliveryData.extraUnitDistance = extraUnitDistance;
              await deliveryData.save();

              let response = ApiResponse("1", "Updated successfully", "", {});
              return res.json(response);
            } 
            else {
              let newData = new deliveryFee();
              newData.baseCharge = baseCharge;
              newData.baseDistance = baseDistance;
              newData.chargePerExtraUnit = chargePerExtraUnit;
              newData.extraUnitDistance = extraUnitDistance;
              newData.restaurantId = restData.id;
              await newData.save();
              let response = ApiResponse("1", "Updated successfully", "", {});
              return res.json(response);
            }

            let response = ApiResponse("1", "Updated successfully", "", {});
            return res.json(response);
          })
          .catch((error) => {
            let response = ApiResponse("0", error.message, "Error", {});
            return res.json(response);
          });
      } 
      else {
        restData.deliveryTypeId = deliveryTypeId;
        restData.deliveryFeeTypeId = deliveryFeeTypeId;
        restData.deliveryFeeFixed = deliveryFeeFixed;
        restData
          .save()
          .then(async (dat) => {
            //   let deliveryData = await deliveryFee.findOne({where:{restaurantId : restData.id}});

            let response = ApiResponse("1", "Updated successfully", "", {});
            return res.json(response);
          })
          .catch((error) => {
            let response = ApiResponse("0", error.message, "Error", {});
            return res.json(response);
          });
      }
    } else {
      restData.deliveryTypeId = deliveryTypeId;
      restData.deliveryFeeTypeId = deliveryFeeTypeId;
      restData.deliveryFeeFixed = deliveryFeeFixed;
      restData
        .save()
        .then(async (dat) => {
          //   let deliveryData = await deliveryFee.findOne({where:{restaurantId : restData.id}});

          let response = ApiResponse("1", "Updated successfully", "", {});
          return res.json(response);
        })
        .catch((error) => {
          let response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    }
  } else {
    let response = ApiResponse("0", "Restaurant not found!", "", {});
    return res.json(response);
  }
}
//18.4 Delivery Settings
//get
async function getResPaymentSettings(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({
    where: { id: id },
    include: [{ model: paymentMethod }, { model: unit, as: "currencyUnitID" }],
  });
  //return res.json(resData);
  let outObj = {
    paymentMethodId: resData.paymentMethodId,
    paymentMethodName: resData.paymentMethod.name,
    distanceUnit: resData.currencyUnitID,
  };
  return res.json({
    status: "1",
    message: "Restaurant Payment Settings",
    data: outObj,
    error: "",
  });
}
//update
async function editResPaymentSettings(req, res) {
  const { paymentMethodId, distanceUnitId, id } = req.body;
  restaurant
    .update({ paymentMethodId, distanceUnitId }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Restaurant Payment Settings Updated",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Database error",
        data: {},
        error: `${err}. Please try again later.`,
      });
    });
}
//18.5 Charges
//get
async function getResCharges(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({ where: { id: id } });
  //return res.json(resData);
  let outObj = {
    minOrderAmount: resData.minOrderAmount,
    packingFee: resData.packingFee,
    comission: resData.comission,
    pricesIncludeVAT: resData.pricesIncludeVAT,
    VATpercent: resData.VATpercent,
  };
  return res.json({
    status: "1",
    message: "Restaurant Payment Settings",
    data: outObj,
    error: "",
  });
}
//update
async function editResCharges(req, res) {
  const {
    minOrderAmount,
    packingFee,
    comission,
    pricesIncludeVAT,
    VATpercent,
    id,
  } = req.body;
  restaurant
    .update(
      { minOrderAmount, packingFee, comission, pricesIncludeVAT, VATpercent },
      { where: { id: id } }
    )
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Restaurant Charges Updated",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Database error",
        data: {},
        error: `${err}. Please try again later.`,
      });
    });
}
//18.6 Charges
//get
async function getResImages(req, res) {
  const id = req.params.id;
  const resData = await restaurant.findOne({ where: { id: id } });
  //return res.json(resData);
  let outObj = {
    businessName: resData.businessName,
    logo: resData.logo,
    image: resData.image,
  };
  return res.json({
    status: "1",
    message: "Restaurant Payment Settings",
    data: outObj,
    error: "",
  });
}
//update
async function editResImages(req, res) {
  const { id } = req.body;
  //return res.json(req.files);
  let logoPathTemp = req.files.logo[0].path;
  let logoPath = logoPathTemp.replace(/\\/g, "/");
  let imagePathTemp = req.files.coverImage[0].path;
  let imagePath = imagePathTemp.replace(/\\/g, "/");
  restaurant
    .update({ logo: logoPath, image: imagePath }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Restaurant Images Updated",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Database error",
        data: {},
        error: `${err}. Please try again later.`,
      });
    });
}

/*
        19. Change Restaurant Status
*/
async function changeRestaurantStatus(req, res) {
  const { status, id } = req.body;
  restaurant
    .update({ status: status }, { where: { id: id } })
    .then((upData) => {
      return res.json({
        status: "1",
        message: "Restaurant status updated",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Database error",
        data: {},
        error: `${err}. Please try again later.`,
      });
    });
}

/*
        20. Get menu settings (Link of restaurant with Menu Categories & Cuisines)
*/
async function getMenuSettings(req, res) {
  const id = req.params.id;
  const mCListRaw = await R_MCLink.findAll({
    where: { restaurantId: id },
    include: [
      { model: menuCategory, attributes: ["name"] },
      { model: R_PLink, attributes: ["name", "image", "discountPrice"] },
    ],
    attributes: ["id"],
  });
  //return res.json(mCListRaw);
  const cListRaw = await R_CLink.findAll({
    where: { restaurantId: id },
    include: [{ model: cuisine }],
  });
  let mCList = [],
    cList = [];
  // mCListRaw.map(ele=>{
  //     let tmpObj = {
  //         mCId: ele.menuCategory.id,
  //         name: ele.menuCategory.name
  //     };
  //     mCList.push(tmpObj);
  // });
  cListRaw.map((ele) => {
    let tmpObj = {
      cId: ele.cuisine.id,
      name: ele.cuisine.name,
    };
    cList.push(tmpObj);
  });

  return res.json({
    status: "1",
    message: "Menu Settings",
    data: {
      menuCategories: mCListRaw,
      cuisines: cList,
    },
    error: "",
  });
}
/*
        21. Edit / Update / Add Menu setting to a restaurant
*/
async function updateMenuSettings(req, res) {
  const { mCIds, cIds, id } = req.body;
  //return res.json(mCIds)
  let destroyMC = await R_MCLink.destroy({ where: { restaurantId: id } });
  let destroyC = await R_CLink.destroy({ where: { restaurantId: id } });
  R_MCLink.bulkCreate(mCIds);
  R_CLink.bulkCreate(cIds);
  return res.json({
    status: "1",
    message: "Menu setting updated",
    data: {},
    error: "",
  });
}

async function updatecuisineSettings(req, res) {
  const { cIds, id } = req.body;
  let destroyC = await R_CLink.destroy({ where: { restaurantId: id } });
  R_CLink.bulkCreate(cIds);
  return res.json({
    status: "1",
    message: "Cuisines setting updated",
    data: {},
    error: "",
  });
}

//Module 4 -  Products
/*
        1. Get All restaurants for Adding Product
*/
async function allRestaurantsforProd(req, res) {
  const orderApp = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  const restData = await restaurant.findAll({
    where: [{ status: true }, { businessType: orderApp.id }],
    attributes: ["id", "businessName"],
  });
  return res.json({
    status: "1",
    message: "All active restaurants for adding products ",
    data: restData,
    error: "",
  });
}

/*
        1. Get All Stores for Adding Product
*/
async function allStoresforProd(req, res) {
  const orderApp = await orderApplication.findOne({
    where: { name: "store" },
  });
  const restData = await restaurant.findAll({
    where: [{ status: true }, { businessType: orderApp.id }],
    attributes: ["id", "businessName"],
  });
  return res.json({
    status: "1",
    message: "All active restaurants for adding products ",
    data: restData,
    error: "",
  });
}
/*
        2. Get All menucategories of restaurant for Adding Product
*/
async function menuCategoriesOfRestaurant(req, res) {
  const restaurantId = req.params.id;
  const menuCatData = await R_MCLink.findAll({
    where: { restaurantId: restaurantId },
    include: { model: menuCategory, attributes: ["name"] },
    attributes: ["id"],
  });
  return res.json({
    status: "1",
    message: "Menu Categories for restaurant",
    data: menuCatData,
    error: "",
  });
}

/*
        3. Add product
*/
async function addProduct(req, res) {
  let {
    name,
    description,
    originalPrice,
    discountPrice,
    discountValue,
    currencyUnitId,
    discountLimit,
    isPopular,
    isNew,
    isRecommended,
    isAdult,
    priceAddOn,
    RMCLinkId,
  } = req.body;
  //return res.json(priceAddOn)
  // changing in the path of image from \\ to //
  let imagePathTemp = req.file.path;
  let imagePath = imagePathTemp.replace(/\\/g, "/");
  product
    .create()
    .then((dat) => {
      R_PLink.create({
        name,
        description,
        originalPrice,
        image: imagePath,
        status: true,
        discountPrice,
        discountValue,
        currencyUnitId,
        discountLimit,
        isPopular,
        isNew,
        isRecommended,
        isAdult,
        RMCLinkId,
        productId: dat.id,
      }).then((pData) => {
        return res.json({
          status: "1",
          message: "Product added successfully",
          data: {},
          error: "",
        });
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding Product",
        data: [],
        error: "Writing to database failed",
      });
    });
}

/*
        4. Get all products
*/
async function getAllProducts(req, res) {
//   const type = await orderApplication.findOne({
//     where: { name: "restaurant" },
//   });
//   let restIds = [];
//   const rests = await restaurant.findAll({
//     where: [{ status: true }, { businessType: type.id }],
//   });

//   rests.map((rst) => {
//     restIds.push(rst.id);
//   });

//   var rmcIds = [];
//   const rmcLink = await R_MCLink.findAll({
//     where: { restaurantId: { [Op.in]: restIds } },
//   });
//   rmcLink.map((rmc) => {
//     rmcIds.push(rmc.id);
//   });

  const productData = await R_PLink.findAll({
    // where: { RMCLinkId: { [Op.in]: rmcIds } },
    include:{model:R_MCLink,attributes:['id'],include:[{model:menuCategory,attributes:['name']},{model:restaurant,attributes:['businessName']}]},
    attributes: [
      "id",
      "name",
      "image",
      "originalPrice",
      "isPopular",
      "isNew",
      "isRecommended",
      "isAdult",
    ],
  });

  return res.json({
    status: "1",
    message: "All Products",
    data: productData,
    error: "",
  });

  // const productsData = await R_PLink.findAll({
  //   include: {
  //     model: R_MCLink,
  //     include: [
  //       { model: menuCategory, attributes: ["id", "name"] },
  //       {
  //         model: restaurant,
  //         where: { businessType: type.id },
  //         include: {
  //           model: unit,
  //           as: "currencyUnitID",
  //           attributes: ["symbol"],
  //         },
  //         attributes: ["id", "businessName"],
  //       },
  //     ],
  //     attributes: ["id"],
  //   },
  //   attributes: [
  //     "id",
  //     "name",
  //     "image",
  //     "originalPrice",
  //     "isPopular",
  //     "isNew",
  //     "isRecommended",
  //     "isAdult",
  //   ],
  // });
  // return res.json({
  //   status: "1",
  //   message: "All Products",
  //   data: productsData,
  //   error: "",
  // });
}
async function getAllProductsStore(req, res) {
  const type = await orderApplication.findOne({
    where: { name: "store" },
  });
  let restIds = [];
  const rests = await restaurant.findAll({
    where: [{ status: true }, { businessType: type.id }],
  });

  rests.map((rst) => {
    restIds.push(rst.id);
  });

  var rmcIds = [];
  const rmcLink = await R_MCLink.findAll({
    where: { restaurantId: { [Op.in]: restIds } },
  });
  rmcLink.map((rmc) => {
    rmcIds.push(rmc.id);
  });

  const productData = await R_PLink.findAll({
    where: { RMCLinkId: { [Op.in]: rmcIds } },
    attributes: [
      "id",
      "name",
      "image",
      "originalPrice",
      "isPopular",
      "isNew",
      "isRecommended",
      "isAdult",
    ],
  });
  return res.json({
    status: "1",
    message: "All Products",
    data: productData,
    error: "",
  });

  //   const type = await orderApplication.findOne({ where: { name: "store" } });
  //   const productsData = await R_PLink.findAll({
  //     include: {
  //       model: R_MCLink,
  //       include: [
  //         { model: menuCategory, attributes: ["id", "name"] },
  //         {
  //           model: restaurant,
  //           where: { businessType: type.id },
  //           include: {
  //             model: unit,
  //             as: "currencyUnitID",
  //             attributes: ["symbol"],
  //           },
  //           attributes: ["id", "businessName"],
  //         },
  //       ],
  //       attributes: ["id"],
  //     },
  //     attributes: [
  //       "id",
  //       "name",
  //       "image",
  //       "originalPrice",
  //       "isPopular",
  //       "isNew",
  //       "isRecommended",
  //       "isAdult",
  //     ],
  //   });
  //   return res.json({
  //     status: "1",
  //     message: "All Products",
  //     data: productsData,
  //     error: "",
  //   });
}

/*
        5. Get product details by ID
*/

async function getProductbyId(req, res) {
    
   let rpId = req.params.id;

  try {
    const productData = await R_PLink.findOne({
      where: {
        id: rpId,
      },
      include: [
        {
          model: productCollections,
          include: {
            model: collection,
            include: {
              model: collectionAddons,
              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          },
        },
        {
          model: P_AOLink,

          include: [
            {
              model: addOnCategory,
              where: {
                status: true,
              },
            },
            {
              model: P_A_ACLink,
              where: {
                status: true,
              },
              required: false,
              include: {
                model: addOn,
              },
            },
          ],
          where: {
            status: true,
          },
          required: false,
        },
        {
          model: R_MCLink,

          include: {
            model: restaurant,
          },
        },
      ],
    });
   
    let addOnArr = [];
    const zonedetails = await zoneRestaurants.findOne({
      where: {
        restaurantId: productData.R_MCLink.restaurant.id,
      },
      include: {
        model: zone,
        include: {
          model: zoneDetails,
          include: [
            {
              model: unit,
              as: "currencyUnit",
            },
            {
              model: unit,
              as: "distanceUnit",
            },
          ],
        },
      },
    });
    //   return res.json(zonedetails)
    if (!productData) {
      return {};
    }

    //   return res.json(productData);
    let currencySign =
      zonedetails.zone.zoneDetail?.currencyUnit?.symbol ?? "USD";
    if (productData) {
      if (productData?.productCollections.length > 0) {
        for (const cat of productData?.productCollections) {
          let category = {
            name: cat?.collection?.title,
            id: cat?.collection?.id,
            maxAllowed: cat?.collection?.maxAllowed,
            minAllowed: cat?.collection?.minAllowed,
          };
          let addList = [];
          for (const add of cat?.collection?.collectionAddons) {
            addList.push({
              id: add?.addOn?.id,
              collectionAddonId: cat?.collection?.id,
              name: add?.addOn?.name,
              minAllowed: add.minAllowed,
              maxAllowed: add.maxAllowed,
              status: add.status,
              isPaid: add.isPaid,
              price: add.price,
              isAvailable: add.isAvaiable,
            });
          }
          addOnArr.push({
            category,
            addons: addList,
          });
        }
      }
    }

    let retObj = {
      RPLinkId: productData.id,
      countryOfOrigin: productData.countryOfOrigin,
      ingredients: productData.ingredients,
      allergies: productData.allergies,
      nutrients: productData.nutrients,
      image: productData.image,
      name: productData?.name,
      isPopular: productData?.isPopular,
      description: productData.description,
      currencySign: `${currencySign}`,
      originalPrice: `${productData.originalPrice}`,
      discountPrice: `${productData.discountPrice} `,
      addOnArr: addOnArr,
    };
    
    const response = ApiResponse("1", "Product Details", "", retObj);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        6. Add AddOn category
*/
async function addAddonCategory(req, res) {
  const { name } = req.body;
console.log(req.body)
  // check if already exists
  const typeExist = await addOnCategory.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This AddOn category already exits",
      "Please try some other name"
    );
  addOnCategory
    .create({ name, orderApplicationName: "restaurant", status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "AddOn added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding AddOn",
        data: [],
        error: "Writing to database failed",
      });
    });
}
async function addOnCategoryRest(req, res) {
 
    let type = await orderApplication.findOne({where:{name:"restaurant"}});
    let coll = await collection.findAll({include:{model:restaurant,where:{businessType:type.id}}});
    let list = [];
    coll.map((dat)=>{
        list.push({
          title:dat.title,  
          minAllowed:dat.minAllowed,  
          maxAllowed:dat.maxAllowed,  
          status:dat.status,  
          restaurant:dat?.restaurant?.businessName,  
        })
    })
    let response = ApiResponse("1","data","",{list});
    
    return res.json(response)
    
}
async function addOnCategoryStore(req, res) {
 
    let type = await orderApplication.findOne({where:{name:"store"}});
    let coll = await collection.findAll({include:{model:restaurant,where:{businessType:type.id}}});
    let list = [];
    coll.map((dat)=>{
        list.push({
          title:dat.title,  
          minAllowed:dat.minAllowed,  
          maxAllowed:dat.maxAllowed,  
          status:dat.status,  
          restaurant:dat?.restaurant?.businessName,  
        })
    })
    let response = ApiResponse("1","data","",{list});
    
    return res.json(response)
    
}
async function addAddonCategoryStore(req, res) {
  const { name } = req.body;

  // check if already exists
  const typeExist = await addOnCategory.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This AddOn category already exits",
      "Please try some other name"
    );
  addOnCategory
    .create({ name, orderApplicationName: "store", status: true })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "AddOn added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding AddOn",
        data: [],
        error: "Writing to database failed",
      });
    });
}

/*
        7. Get all AddOn categories 
*/
async function getAddOnCats(req, res) {
  const addOnCatsData = await addOnCategory.findAll({
    where: [{ status: true }, { orderApplicationName: "restaurant" }],
    attributes: ["id", "name"],
  });
  return res.json({
    status: "1",
    message: "Active AddOn Categories",
    data: addOnCatsData,
    error: "",
  });
}
async function getAddOnCatsStore(req, res) {
  const addOnCatsData = await addOnCategory.findAll({
    where: [{ status: true }, { orderApplicationName: "store" }],
    attributes: ["id", "name", "createdAt", "status"],
  });
  return res.json({
    status: "1",
    message: "Active AddOn Categories",
    data: addOnCatsData,
    error: "",
  });
}

/*
        8. Add AddOn for Restaurant
*/
async function addAddon(req, res) {
  const { name, addOnCategoryId } = req.body;
  // check if already exists
  const typeExist = await addOn.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This AddOn already exits",
      "Please try some other name"
    );
  addOn
    .create({
      name,
      status: true,
      addOnCategoryId,
      orderApplicationName: "restaurant",
    })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "AddOn added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding AddOn",
        data: [],
        error: "Writing to database failed",
      });
    });
}
/*
        8. Add AddOn for Store
*/
async function addaddonStore(req, res) {
  const { name, addOnCategoryId } = req.body;
  // check if already exists
  const typeExist = await addOn.findOne({ where: { name: name } });
  if (typeExist)
    throw new CustomException(
      "This AddOn already exits",
      "Please try some other name"
    );
  addOn
    .create({
      name,
      status: true,
      addOnCategoryId,
      orderApplicationName: "store",
    })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "AddOn added successfully",
        data: {
          name: dat.name,
        },
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error in adding AddOn",
        data: [],
        error: "Writing to database failed",
      });
    });
}
/*
        9. Get all AddOn categories 
*/
async function getAddOns(req, res) {
  const addOnCatsData = await addOn.findAll({
    where: { status: true },
    attributes: ["id", "name"],
  });
  return res.json({
    status: "1",
    message: "Active AddOn Categories",
    data: addOnCatsData,
    error: "",
  });
}

/*
        10. Assign Add On with category to product
*/
async function assignAddOnProd(req, res) {
  const {
    minAllowed,
    maxAllowed,
    displayText,
    RPLinkId,
    addOnCategoryId,
    addOnData,
  } = req.body;
  P_AOLink.create({
    minAllowed,
    maxAllowed,
    displayText,
    RPLinkId,
    addOnCategoryId,
    status: true,
  }).then((PAOLink) => {
    addOnData.map((ele) => {
      ele.PAOLinkId = PAOLink.id;
      ele.status = true;
    });
    P_A_ACLink.bulkCreate(addOnData);
    return res.json({
      status: "1",
      message: "AddOn Added",
      data: {},
      error: "",
    });
  });
}
/*
        11. Change Product Status
*/
async function changeProductStatus(req, res) {
  const id = req.params.id;
  const { status } = req.body;
  R_PLink.update({ status: status }, { where: { id: id } });
  return res.json({
    status: "1",
    message: "Prodcut status updated",
    data: {},
    error: "",
  });
}

/*
        12. Update Product details
*/
async function updateProduct(req, res) {
  const {
    name,
    description,
    originalPrice,
    discountPrice,
    isPopular,
    isNew,
    isRecommended,
    isAdult,
    RMCLinkId,
  } = req.body;
  let result;
  const id = req.params.id;
  //If image is udated as well
  if (req.file) {
    let imagePathTemp = req.file.path;
    let imagePath = imagePathTemp.replace(/\\/g, "/");
    result = R_PLink.update(
      {
        name,
        description,
        originalPrice,
        discountPrice,
        image: imagePath,
        isPopular,
        isNew,
        isRecommended,
        isAdult,
        RMCLinkId,
      },
      {
        where: { id: id },
      }
    );
  } else {
    result = R_PLink.update(
      {
        name,
        description,
        originalPrice,
        discountPrice,
        isPopular,
        isNew,
        isRecommended,
        isAdult,
        RMCLinkId,
      },
      {
        where: { id: id },
      }
    );
  }
  return res.json({
    status: "1",
    message: "Product updated",
    data: {},
    error: "",
  });
}
/*
        13. Update Product Add Ons
*/
async function updateProductAddOn(req, res) {
  const {
    minAllowed,
    maxAllowed,
    displayText,
    addOnCategoryId,
    P_AOLinkId,
    addOnData,
  } = req.body;
  P_AOLink.update(
    { minAllowed, maxAllowed, displayText, addOnCategoryId },
    { where: { id: P_AOLinkId } }
  );
  //return res.json(addOnData)
  P_A_ACLink.bulkCreate(addOnData, {
    updateOnDuplicate: ["price", "status", "addOnId"],
  });
  return res.json({
    status: "1",
    message: "Product AddOns updated",
    data: {},
    error: "",
  });
}

/*
        14. Change Status/Deactivate Product Add On Category 
*/
async function changeStatusOfProdAddOnCat(req, res) {
  const { P_AOLinkId, status } = req.body;
  P_AOLink.update({ status: status }, { where: { id: P_AOLinkId } })
    .then((dat) => {
      return res.json({
        status: "1",
        message: "Add On Category status changed",
        data: {},
        error: {},
      });
    })
    .catch((err) => {
      return res.json({
        status: "1",
        message: "Error updating status",
        data: {},
        error: `${err}`,
      });
    });
}

//Module 5 - Users
/*
        1. Get all users
*/
async function getAllUsers(req, res) {
  const usersData = await user.findAll({
    include: { model: userType },
    order: [["id", "desc"]],
  });
  let outArr = [];
  usersData.map((dat) => {
    let retObj = {
      id: dat.id,
      name: `${dat?.firstName} ${dat?.lastName}`,
      email: dat.email,
      phoneNum: `${dat.countryCode}${dat.phoneNum}`,
      status: dat.status,
      role: dat.userType?.name,
    };
    outArr.push(retObj);
  });
  return res.json({
    status: "1",
    message: "All Users Data",
    data: outArr,
    error: "",
  });
}

/*
        2. Get all Customers
*/
async function getAllCustomers(req, res) {
  const customersData = await user.findAll({
    where: { userTypeId: 1 },
    include: { model: wallet },
    order: [["id", "desc"]],
  });
  let outArr = [];
  customersData.map((dat) => {
    // let balance = dat.wallets.reduce((previousValue, curentValue) => previousValue + curentValue.amount, 0);
    let retObj = {
      id: dat.id,
      name: `${dat.firstName} ${dat.lastName}`,
      email: dat.email,
      phoneNum: `${dat.countryCode}${dat.phoneNum}`,
      status: dat.status === true ? "Active" : "Inactive",
      // balance: `${balance}`
    };
    outArr.push(retObj);
  });
  return res.json({
    status: "1",
    message: "All Customers Data",
    data: outArr,
    error: "",
  });
}

/*
        3. Get all drivers
*/
async function getAllDrivers(req, res) {
  const driversData = await user.findAll({
    where: { userTypeId: 2 },
    include: { model: wallet },
    order: [["id", "desc"]],
  });
  let outArr = [];
  driversData.map((dat) => {
    let balance = dat.wallets.reduce(
      (previousValue, curentValue) => previousValue + curentValue.amount,
      0
    );
    let retObj = {
      id: dat.id,
      name: `${dat.firstName} ${dat.lastName}`,
      email: dat.email,
      phoneNum: `${dat.countryCode}${dat.phoneNum}`,
      status: dat.status === true ? "Active" : "Inactive",
      balance: `${balance.toFixed(2)}`,
    };
    outArr.push(retObj);
  });
  return res.json({
    status: "1",
    message: "All Drivers Data",
    data: outArr,
    error: "",
  });
}

/*
        4. Get all Employees
*/
async function getAllEmployees(req, res) {
  const employeesData = await user.findAll({
    where: { userTypeId: 4 },
    include: { model: role },
    order: [["id", "desc"]],
  });
//   return res.json(employeesData)
  let outArr = [];
  employeesData.map((dat) => {
    let retObj = {
      id: dat.id,
      name: `${dat.firstName} ${dat.lastName}`,
      email: dat.email,
      phoneNum: `${dat.countryCode}${dat.phoneNum}`,
      status: dat.status === true ? "Active" : "Inactive",
      role: dat.roleId ? dat.role.name : "Role not assigned",
    };
    outArr.push(retObj);
  });
  return res.json({
    status: "1",
    message: "All Employees Data",
    data: outArr,
    error: "",
  });
}
/*
        5. Add User
*/
async function addUser(req, res) {
  const {
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,
    roleId,
    userTypeId,
  } = req.body;
  // check if user with same eamil and phoneNum exists
  const userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
      ],
    },
  });
  //return res.json(userExist)
  if (userExist) {
    if (email === userExist.email)
      throw new CustomException(
        "Users exists",
        "The email you entered is already taken"
      );
    else
      throw new CustomException(
        "Users exists",
        "The phone number you entered is already taken"
      );
  }
  //The user type is Employee

  bcrypt.hash(password, 10).then((hashedPassword) => {
    user
      .create({
        firstName,
        lastName,
        email,
        status: true,
        countryCode,
        phoneNum,
        password: hashedPassword,
        userTypeId,
        roleId,
      })
      .then((userData) => {
        return res.json({
          status: "1",
          message: "New user Added",
          data: {},
          error: "",
        });
      });
  });
}
/*
        6. Get all active Roles
*/

async function allRoles(req,res){
    const roles = await role.findAll({});
    const response = ApiResponse("1","roles","",roles);
    return res.json(response)
}

async function changeStatusOfRole(req,res){
    const {roleId , status } = req.body;
    const dd = await role.findOne({where:{id:roleId}});
    if(dd){
        dd.status = status;
        dd.save().then(dat =>{
            const response = ApiResponse("1","Role Updated","",{});
            return res.json(response);
        })
        .catch((error)=>{
            const response = ApiResponse("0",error.message,"",{});
            return res.json(response);
        })
    }
}

async function roleDetails(req,res){
    const rolepermissions = await rolePermissions.findAll({where:{roleId : req.body.roleId}});
    let list = [];
    if(rolepermissions.length > 0){
        rolepermissions.map((dat)=>{
            list.push(dat.permissionId)
        })
    }
    const response = ApiResponse("1","Role permissions","",list);
    return res.json(response);
}

async function getAllActiveRoles(req, res) {
  const rolesData = await role.findAll({
    where: { status: true },
    attributes: ["id", "name"],
    order: [["id", "desc"]],
  });
  return res.json({
    status: "1",
    message: "All Roles",
    data: rolesData,
    error: "",
  });
}

/*
        7. Get Customer & Employee Details using Id
*/
async function getCustEmpDetails(req, res) {
  const userId = req.params.id;
  const userData = await user.findOne({
    where: { id: userId },
    include: [
      { model: userType, attributes: ["name"] },
      { model: role },
      { model: wallet, attributes: ["id", "paymentType", "amount", "at","orderId"] },
    ],
    attributes: [
      "id",
      "firstName",
      "password",
      "lastName",
      "email",
      "countryCode",
      "phoneNum",
      "status",
      "userTypeId",
      "roleId",
    ],
  });
  const orderData = await order.findAll({
    where: { userId: userId },
    include: [
      { model: orderStatus, attributes: ["name"] },
      {
        model: restaurant,
        include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
        attributes: ["businessName"],
      },
    ],
    attributes: ["id", "orderNum", "orderStatusId", "scheduleDate", "total"],
  });
  // return res.json(userData);
  let userDetails = {
    id: `${userData.id}`,
    firstName: userData.firstName,
    password: userData.password,
    lastName: userData.lastName,
    email: userData.email,
    countryCode: userData.countryCode,
    phoneNum: userData.phoneNum,
    userType: userData.userType.name,

    status: userData.status === true ? "Active" : "Inactive",
  };
  let userRole = userData.role?.name ?? "No Role";
  let balance = userData.wallets.reduce(
    (previousValue, curentValue) => previousValue + curentValue.amount,
    0
  );
  return res.json({
    status: "1",
    message: "User Details by ID",
    data: {
      userDetails,
      userRole,
      balance: balance.toFixed(2),
      transactions: userData.wallets,
      orderData,
    },
    error: "",
  });
}

/*
        8. Get driver details using ID
*/
async function getDriverDetails(req, res) {
  const userId = req.params.id;
  const userData = await user.findOne({
    where: { id: userId },
    required: false,
    include: [
      { model: userType, required: false, attributes: ["name"] },
      {
        model: wallet,
        include:{model:unit,as:"currencyUnit",attributes:['symbol','shortCode']},
        required: false,
        attributes: ["id", "paymentType", "amount", "at"],
      },
      {
        model: driverDetails,
        required: false,
        where: { status: true },
        include: { model: serviceType, required: false, attributes: ["name"] },
        attributes: [
          "id",
          "profilePhoto",
          "licIssueDate",
          "licExpiryDate",
          "licNum",
          "licFrontPhoto",
          "licBackPhoto",
        ],
      },
      {
        model: vehicleDetails,
        required: false,
        where: { status: true },
        include: [
          { model: vehicleType, required: false, attributes: ["id", "name"] },
          {
            model: vehicleImages,
            as: "vehicleImages",
            attributes: ["name", "image"],
           
          },
          
        ],
        attributes: ["id", "make", "model", "registrationNum", "color"],
      },
    ],
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "countryCode",
      "phoneNum",
      "status",
    ],
  });

//   return res.json(userData);
  const allOrders = await order.findAll({
    where: { driverId: userId },
    include: [
      { model: orderStatus, attributes: ["name"] },
      {
        model: restaurant,
        include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
        attributes: ["businessName"],
      },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  // return res.json(allOrders)
  let riderRatings = await driverRating.findAll({
    where: { driverId: userId },
    include: { model: order, attributes: ["orderNum"] },
    attributes: ["id", "value", "comment", "orderId"],
  });

  //
  let balance = await driverEarning.findOne({where:{userId:userId}});


  let riderAvgRate = riderRatings.reduce(
    (previousValue, curentValue) => previousValue + curentValue.value,
    0
  );
  let avgRate = riderAvgRate / riderRatings.length;
  avgRate = avgRate ? avgRate.toFixed(2) : "No Rating";
  //return res.json(avgRate)
  let outObj = {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    countryCode: userData.countryCode,
    phoneNum: userData.phoneNum,
    status: userData.status,
    userType: userData.userType.name,
    availableBalance: balance ? balance?.availableBalance : 0.0,
    totalEarning: balance ? balance?.totalEarning : 0.0,
    avgRate,
    transactions: userData?.wallets ? userData?.wallets : [],
    driverDetails: userData.driverDetails,
    vehicleDetails: userData.vehicleDetails,
    feedbacks: riderRatings,
    allOrders:allOrders,
  };
  return res.json({
    status: "1",
    message: "Driver Details",
    data: outObj,
    error: "",
  });
}
/*
        9. Update user details
*/
async function updateUserDetails(req, res) {
  const { firstName, lastName, email, countryCode, phoneNum, password } =
    req.body;
  const userId = parseInt(req.params.id);
  const existEmail = await user.findOne({ where: { email: email } });
  if (existEmail) {
    if (email === existEmail.email && existEmail.id !== userId)
      throw new CustomException(
        "Users exists",
        "The email you entered is already taken"
      );
  }
  const existPhone = await user.findOne({
    where: { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
  });
  if (existPhone) {
    if (
      countryCode === existPhone.countryCode &&
      phoneNum === existPhone.phoneNum &&
      existPhone.id !== userId
    )
      throw new CustomException(
        "Users exists",
        "The phone number you entered is already taken"
      );
  }
  
  let userData = await user.findOne({where:{id:userId}});
      if (!userData) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
  if(userData){
      userData.firstName = firstName ;
      userData.lastName = lastName ;
      userData.email = email ;
      userData.countryCode = countryCode ;
      userData.phoneNum = phoneNum ;
      if(password){
          let hashedPassword = await bcrypt.hash(password, 10);
         
          userData.password = hashedPassword
      }
      await userData.save();
      return res.json({
    status: "1",
    message: "User Information updated",
    data: {},
    error: "",
  });
  }
}
/*
        10. Ban User (Change user status to false)
*/
async function banUser(req, res) {
  const userId = req.params.id;
  await user.update({ status: false }, { where: { id: userId } });
  return res.json({
    status: "1",
    message: "User banned",
    data: {},
    error: "",
  });
}
/*
        11. Approve User (Change user status to true)
*/
async function approveUser(req, res) {
  const userId = req.params.id;
  await user.update({ status: true }, { where: { id: userId } });
  return res.json({
    status: "1",
    message: "User Approved",
    data: {},
    error: "",
  });
}
/*
        12. Get all active Roles with userType
*/
async function allActiveRoleswithType(req, res) {
  const rolesData = await role.findAll({
    where: { status: true },
    attributes: ["id", "name"],
    order: [["id", "desc"]],
  });
  let outArr = [];
  let obj = {
    roleId: null,
    name: "Customer",
    userTypeId: 1,
  };
  outArr.push(obj);
  rolesData.map((role) => {
    let tmpObj = {
      roleId: role.id,
      name: role.name,
      userTypeId: 4,
    };
    outArr.push(tmpObj);
  });
  return res.json({
    status: "1",
    message: "All Active roles",
    data: outArr,
    error: "",
  });
}
/*
        13. Update role
*/
async function updateRole(req, res) {
  const { roleId, userTypeId } = req.body;
  const userId = req.params.id;
  // user.update({roleId: roleId, userTypeId: userTypeId},{where: {id: userId}});
  user.update({ roleId: roleId }, { where: { id: userId } });
  return res.json({
    status: "1",
    message: "Role updated",
    data: {},
    error: "",
  });
}

/*
        14. Get all restaurant owners
*/
async function getAllRestOwners(req, res) {
 const businessType = await orderApplication.findOne({
    where: { name: "restaurant" },
    order: [["id", "desc"]],
  });
  let list = [];
  let restList = await restaurant.findAll({where:[{businessType:businessType.id}],attributes:['businessName'],include:{model:user,attributes:['id','firstName','lastName','email','countryCode','phoneNum','status']}});
  return res.json({
    status: "1",
    message: "All Restaurant Owners Data",
    data: restList,
    error: "",
  });
}
async function getAllStoreOwners(req, res) {
  const businessType = await orderApplication.findOne({
    where: { name: "store" },
    order: [["id", "desc"]],
  });
  let list = [];
  let restList = await restaurant.findAll({where:[{businessType:businessType.id}],attributes:['businessName'],include:{model:user,attributes:['id','firstName','lastName','email','countryCode','phoneNum','status']}});
  return res.json({
    status: "1",
    message: "All Stores Owners Data",
    data: restList,
    error: "",
  });
}
//Module 6
/*
        1. Get all add on categories
*/
async function getAllAddOnCats(req, res) {
  const addOnData = await addOnCategory.findAll({
    order: [["id", "desc"]],
    attributes: ["id", "name", "status", "createdAt"],
  });

  return res.json({
    status: "1",
    message: "All Add-On Categories",
    data: addOnData,
    error: "",
  });
}

/*
        2. Edit/ Update add on category
*/
async function updateAddOn(req, res) {
  let id = parseInt(req.params.id);
  let { name } = req.body;
  const addOnData = await addOn.findOne({
    where: { name: name },
    attributes: ["id", "name"],
  });
  if (addOnData) {
    if (id !== addOnData.id)
      throw new CustomException(
        "Add-on category with this name exists",
        "Please try some other name"
      );
  }
  addOn.update({ name: name }, { where: { id: id } });
  return res.json({
    status: "1",
    message: "Add-On Category Updated",
    data: {},
    error: "",
  });
}
/*
        3. Change status of Add On Category
*/
async function changeAddOnCatStatus(req, res) {
  let id = req.params.id;
  let { status } = req.body;
  addOnCategory.update({ status: status }, { where: { id: id } });
  return res.json({
    status: "1",
    message: "Status Updated",
    data: {},
    error: "",
  });
}

/*
        4. Get all add on categories
*/
async function getAllAddOn(req, res) {
  const addOnData = await addOn.findAll({
    where: { orderApplicationName: "restaurant" },
    attributes: ["id", "name", "status", "createdAt"],
  });
  return res.json({
    status: "1",
    message: "All Add-Ons",
    data: addOnData,
    error: "",
  });
}
async function getAllAddOnStore(req, res) {
  const addOnData = await addOn.findAll({
    where: { orderApplicationName: "store" },
    attributes: ["id", "name", "status", "createdAt"],
  });
  return res.json({
    status: "1",
    message: "All Add-Ons",
    data: addOnData,
    error: "",
  });
}

/*
        5. Edit/ Update add on category
*/
async function updateAddOnCat(req, res) {
  let id = parseInt(req.params.id);
  let { name } = req.body;
  const addOnData = await addOnCategory.findOne({
    where: { name: name },
    attributes: ["id", "name"],
  });
  if (addOnData) {
    if (id !== addOnData.id)
      throw new CustomException(
        "Add-on category with this name exists",
        "Please try some other name"
      );
  }
  addOnCategory.update({ name: name }, { where: { id: id } });
  return res.json({
    status: "1",
    message: "Add-On Category Updated",
    data: {},
    error: "",
  });
}
/*
        6. Change status of Add On Category
*/
async function changeAddOnStatus(req, res) {
  let id = req.params.id;
  let { status } = req.body;
  addOn.update({ status: status }, { where: { id: id } });
  return res.json({
    status: "1",
    message: "Status Updated",
    data: {},
    error: "",
  });
}

// Module 7- Taxi App
//1. Add Vehicle Type
async function addVehicleType(req, res) {
  const { name } = req.body;
  let imagePathTemp = req.file.path;
  let imagePath = imagePathTemp.replace(/\\/g, "/");
  vehicleType
    .create({ name, status: true, image: imagePath, baseRate:0, perUnitRate:0 })
    .then((data) => {
      return res.json({
        status: "1",
        message: "Vehicle Added",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "1",
        message: "Database Error",
        data: {},
        error: "Error adding to databse",
      });
    });
}

async function updateVehicleType(req, res) {
  const { name, id } = req.body;
  let imagePathTemp = req.file.path;
  let imagePath = imagePathTemp.replace(/\\/g, "/");

  let type = await vehicleType.findOne({ where: { id: id } });
  if (type) {
    // Remove the old image
    if (type.image) {
      fs.unlink(type.image, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    type.name = name;
    type.image = imagePath;
    type.save()
      .then((data) => {
        return res.json({
          status: "1",
          message: "Vehicle Type Updated",
          data: {},
          error: "",
        });
      })
      .catch((err) => {
        return res.json({
          status: "1",
          message: "Database Error",
          data: {},
          error: "Error adding to database",
        });
      });
  } else {
    let response = ApiResponse("0", "Not found", {}, {});
    return res.json(response);
  }
}

// 2. Get All vehicle Types
async function getAllVehicles(req, res) {
  const allVehicles = await vehicleType.findAll({
    order: [["id", "desc"]],
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });
  return res.json({
    status: "1",
    message: "All Vehicles",
    data: allVehicles,
    error: "",
  });
}

//3. Change Status of vehicle
async function changeStatusVehicle(req, res) {
  let { status, vehicleId } = req.body;
  vehicleType.update({ status: status }, { where: { id: vehicleId } });
  return res.json({
    status: "1",
    message: `Vehcile status changed to ${status}`,
    data: {},
    error: "",
  });
}
//4. Update Vehicle
async function updateVehicle(req, res) {
  const { name, baseRate, perUnitRate, vehicleId } = req.body;
  if (req.file) {
    let imagePathTemp = req.file.path;
    let imagePath = imagePathTemp.replace(/\\/g, "/");
    vehicleType
      .update(
        { name, status: true, image: imagePath, baseRate, perUnitRate },
        { where: { id: vehicleId } }
      )
      .then((data) => {
        return res.json({
          status: "1",
          message:"Vehicle Updated",
          data: {},
          error: "",
        });
      })
      .catch((err) => {
        return res.json({
          status: "1",
          message: "Database Error",
          data: {},
          error: "Error adding to databse",
        });
      });
  } else {
    vehicleType
      .update(
        { name, status: true, baseRate, perUnitRate },
        { where: { id: vehicleId } }
      )
      .then((data) => {
        return res.json({
          status: "1",
          message: "Vehicle Updated",
          data: {},
          error: "",
        });
      })
      .catch((err) => {
        return res.json({
          status: "1",
          message: "Database Error",
          data: {},
          error: err,
        });
      });
  }
}

//Module 8- Orders
/*
        1. Get all orders
*/
async function getAllOrders(req, res) {
  const orderData = await order.findAll({
    order: [["id", "desc"]],
    include: [
      { model: orderApplication, attributes: ["id", "name"] },
      { model: orderMode, attributes: ["name"] },
      { model: paymentMethod, attributes: ["name"] },
      { model: orderStatus, attributes: ["name"] },
      {
        model: restaurant,
        include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
        attributes: ["businessName"],
      },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  //return res.json(orderData)
  return res.json({
    status: "1",
    message: "All Orders",
    data: orderData,
    error: "",
  });
}

async function getAllOrdersTaxi(req, res) {
  const orderData = await order.findAll({
    include: [
      {
        model: orderApplication,
        where: { name: "taxi" },
        attributes: ["id", "name"],
      },
      { model: orderMode, attributes: ["name"] },
      { model: paymentMethod, attributes: ["name"] },
      { model: orderStatus, attributes: ["name"] },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  // return res.json(orderData)
  return res.json({
    status: "1",
    message: "All Orders Taxi",
    data: orderData,
    error: "",
  });
}

async function getScheduledOrdersTaxi(req, res) {
  const orderData = await order.findAll({
    include: [
      {
        model: orderApplication,
        where: { name: "taxi" },
        attributes: ["id", "name"],
      },
      { model: orderMode, where: { name: "Scheduled" }, attributes: ["name"] },
      { model: paymentMethod, attributes: ["name"] },
      { model: orderStatus, attributes: ["name"] },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  // return res.json(orderData)
  return res.json({
    status: "1",
    message: "All Orders Taxi",
    data: orderData,
    error: "",
  });
}

async function getCompletedOrdersTaxi(req, res) {
  const orderData = await order.findAll({
    include: [
      {
        model: orderApplication,
        where: { name: "taxi" },
        attributes: ["id", "name"],
      },
      { model: orderMode, attributes: ["name"] },
      { model: paymentMethod, attributes: ["name"] },
      { model: orderStatus, where: { name: "Ride end" }, attributes: ["name"]},
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  // return res.json(orderData)
  return res.json({
    status: "1",
    message: "All Orders Taxi",
    data: orderData,
    error: "",
  });
}
/*
        2. Get Order Details by Id
*/
async function getOrderDetails(req, res) {
  let { orderId } = req.body;
  //if Application ID is 1 return food delivery Data
  
    const orderDetails = await order.findByPk(orderId, {
      include: [
        {
          model: restaurant,
          include: {
            model: unit,
            as: "currencyUnitID",
            attributes: ["symbol"],
          },
          attributes: ["businessName", "address"],
        },
        {
          model: user,
          
          attributes: [
              "userName",
           
            "email",
            "countryCode",
            "phoneNum",
          ],
        },
        {
          model: user,
          as: "DriverId",
          attributes: ["firstName", "lastName", "countryCode", "phoneNum","email"],
        },
        { model: address, as: "dropOffID", attributes: ["streetAddress","city","state"] },
        { model: orderStatus, attributes: ["name"] },
        { model: deliveryType, attributes: ["name"] },
        { model: orderType, attributes: ["type"] },
        { model: paymentMethod, attributes: ["name"] },
        {
          model: orderCharge,
         
        },
        { model: deliveryType, attributes: ["name"] },
        {
          model: orderHistory,
          include: [
            { model: orderStatus, attributes: ["name"] },
            {
              model: user,
              as: "cancelledBY",
              attributes: ["firstName", "lastName"],
            },
          ],
          attributes: ["time"],
        },
        {
          model: orderItems,
          include: [
            { model: R_PLink },
            {
              model: orderAddOns,
              include: { model: P_A_ACLink, include: { model: addOn } },
            },
          ],
        },
      ],
    });
    const response = ApiResponse("1","Order Details","",orderDetails);
    return res.json(response);
    //return res.json(orderDetails)
    let itemArr = [];
    orderDetails.orderItems.map((oi, idx) => {
      let itemPrice = parseFloat(oi.total);
      let addOnArr = [];
      //manipulating addons
      oi.orderAddOns.map((oao, ind) => {
        itemPrice = itemPrice + parseFloat(oao.total);
        let addOnObj = {
          name: oao.P_A_ACLink.addOn.name,
          price: oao.total,
        };
        addOnArr.push(addOnObj);
      });
      let itemObj = {
        itemName: oi.R_PLink.name,
        quantity: oi.quantity,
        itemPrice: itemPrice,
        addOns: addOnArr,
      };
      itemArr.push(itemObj);
    });
    //Calculation order complete time
    if (orderDetails.orderStatusId === 7) {
      //console.log(orderDetails.orderHistories[orderDetails.orderHistories.length-1].time)
      let startTime = new Date(orderDetails.orderHistories[0].time);
      let endTime = new Date(
        orderDetails.orderHistories[orderDetails.orderHistories.length - 1].time
      );
      var diff = Math.abs(endTime - startTime);
      diff = new Date(diff);
      //console.log('Time', diff.getMinutes())
    }
    let outObj = {
      orderNum: orderDetails.orderNum,
      restaurantName: orderDetails.restaurant.businessName,
      restaurantAddress: orderDetails.restaurant?.address,
      orderDate: orderDetails.scheduleDate,
      customerDetails: {
          userName : orderDetails.user?.userName,
       
        email: orderDetails.user.email,
        contact: `${orderDetails.user?.countryCode}${orderDetails?.user.phoneNum}`,
      },
      deliveryAddress: orderDetails.dropOffID?.streetAddress,
      status: orderDetails.orderStatus.name,
      orderType: orderDetails.deliveryType.name,
      paymentMethod: orderDetails.paymentMethod.name,
      note: orderDetails.note,
      items: itemArr,
      unit: orderDetails.restaurant.currencyUnitID.symbol,
      subTotal: orderDetails.orderCharge.basketTotal,
      orderCharge : orderDetails.orderCharge,
      discount: orderDetails.orderCharge.discount,
      VAT: orderDetails.orderCharge.VAT,
      deliveryCharge: orderDetails.orderCharge.deliveryFees,
      serviceCharges: orderDetails.orderCharge.serviceCharges,
      total: orderDetails.orderCharge.total,
      storeEarnings: orderDetails.orderCharge.restaurantEarnings,
      driverEarnings: orderDetails.orderCharge.driverEarnings,
       driverName: `${orderDetails.DriverId?.firstName} ${orderDetails.DriverId?.lastName}`,
      driverPhone: `${orderDetails.DriverId?.countryCode} ${orderDetails.DriverId?.phoneNum}`,
      driverEmail: `${orderDetails.DriverId.email} `,
      adminEarnings: orderDetails.orderCharge.adminEarnings,
      distRestToCust: orderDetails.distance,
      assignedDriverName: orderDetails.driverId
        ? `${orderDetails.DriverId?.firstName} ${orderDetails.DriverId?.lastName}`
        : "No driver assigned yet",
      assignedDriverPhoneNUm: orderDetails.driverId
        ? `${orderDetails.DriverId?.countryCode} ${orderDetails.DriverId?.phoneNum}`
        : "No driver assigned yet",
      OrderTimeStamps: orderDetails.orderHistories,
      OrderCompletedIn:
        orderDetails.orderStatusId === 7 ? diff.getMinutes() : "Incomplete",
      cancelledBy:
        orderDetails.orderStatusId === 12
          ? orderDetails.orderHistories[orderDetails.orderHistories.length - 1]
              .cancelledBY
            ? `${
                orderDetails.orderHistories[
                  orderDetails.orderHistories.length - 1
                ].cancelledBY.firstName
              } ${
                orderDetails.orderHistories[
                  orderDetails.orderHistories.length - 1
                ].cancelledBY.lastName
              }`
            : "Auto cancel"
          : "",
    };
    return res.json({
      status: "1",
      message: "Order details of Food",
      data: outObj,
      error: "",
    });
   
  
}

//3. Update contact us email
async function contactUsEmail(req, res) {
  const { email } = req.body;
  setting
    .update({ value: email }, { where: { content: "email" } })
    .then((data) => {
      return res.json({
        status: "1",
        message: "Email Updated",
        body: {},
        error: "",
      });
    });
}
//3. Update contact us Phone
async function contactUsPhone(req, res) {
  const { phone } = req.body;
  setting
    .update({ value: phone }, { where: { content: "phone" } })
    .then((data) => {
      return res.json({
        status: "1",
        message: "Phone Updated",
        body: {},
        error: "",
      });
    });
}

// Module 9 - Promotions
/* 
        1. Add Voucher
*/
async function addVoucher(req, res) {
  let {
    code,
    value,
    type,
    from,
    to,
    conditionalAmount,
    storeApplicable,
    unitId,
  } = req.body;
  const exist = await voucher.findOne({ where: { code: code } });
  if (exist)
    throw new CustomException(
      "Voucher with same voucher-code already exists",
      "Please try some other name"
    );
  storeApplicable = storeApplicable.toString();
  voucher
    .create({
      code,
      value,
      type,
      from,
      to,
      conditionalAmount,
      storeApplicable,
      status: true,
      unitId,
    })
    .then((data) => {
      return res.json({
        status: "1",
        message: "Voucher Added",
        data: data,
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error adding Voucher Added",
        data: {},
        error: `${err}`,
      });
    });
}
/*
        2. Get all vouchers
*/
async function getAllVouchers(req, res) {
  const AllVouchers = await voucher.findAll({
    attributes: [
      "id",
      "code",
      "value",
      "type",
      "to",
      "from",
      "storeApplicable",
      "status",
      "conditionalAmount",
    ],
  });
  
  
 return res.json({
    status: "1",
    message: "All Vouchers",
    data: AllVouchers,
    error: "",
  });
  // const resr =await  restaurant.findAll({
  //     where: {
  //       id: {
  //         [Op.or]: [1 , 2]
  //       }
  //     }
  //   })
  let allVouchers = AllVouchers.map((ele) => {
    if (ele.storeApplicable === "all") {
      ele.storeApplicable = "All restaurants";
    } else {
      let arr = ele.storeApplicable.split(",");
      ele.storeApplicable = arr.length.toString();
    }
    return ele;
  });
  return res.json({
    status: "1",
    message: "All Vouchers",
    data: allVouchers,
    error: "",
  });
}

/*
        3. Delete/Change Status of Voucher
*/
async function changeStatusOfVoucher(req, res) {
  let { status, voucherId } = req.body;
  voucher.update({ status: status }, { where: { id: voucherId } });
  return res.json({
    status: "1",
    message: `Status changed to ${status}`,
    data: {},
    error: "",
  });
}

/* 
        4. Update Voucher
*/
async function updateVoucher(req, res) {
  let {
    code,
    value,
    type,
    from,
    to,
    conditionalAmount,
    storeApplicable,
    status,
    voucherId,
  } = req.body;
  const exist = await voucher.findOne({
    where: { code: code, [Op.not]: [{ id: voucherId }] },
  });
  if (exist)
    throw new CustomException(
      "Voucher with same voucher-code already exists",
      "Please try some other name"
    );
  storeApplicable = storeApplicable.toString();
  voucher
    .update(
      {
        code,
        value,
        type,
        from,
        to,
        conditionalAmount,
        status,
        storeApplicable,
      },
      { where: { id: voucherId } }
    )
    .then((data) => {
      return res.json({
        status: "1",
        message: "Voucher updated",
        data: {},
        error: "",
      });
    })
    .catch((err) => {
      return res.json({
        status: "0",
        message: "Error adding Voucher Added",
        data: {},
        error: `${err}`,
      });
    });
}
/*
        5. Voucher associated restaurants
*/
async function voucherAssocaitedRest(req, res) {
  let voucherId = req.params.id;
  const voucherData = await voucher.findByPk(voucherId, {
    attributes: ["storeApplicable"],
  });
  let restArr =
    voucherData.storeApplicable === "all"
      ? "All restaurants"
      : voucherData.storeApplicable.split(",");
  if (restArr === "All restaurants") {
    return res.json({
      status: "1",
      message: "Associated Restaurants",
      body: {
        restData: "All restaurants",
      },
      error: "",
    });
  }
  const resr = await restaurant.findAll({
    where: { id: { [Op.or]: restArr } },
    attributes: ["businessName"],
  });
  return res.json({
    status: "1",
    message: "Associated Restaurants",
    body: {
      restData: resr,
    },
    error: "",
  });
}

/*
        6. Push Notifications 
*/
async function pushNotifications(req, res) {
  const { title, body, to } = req.body;
  let senderData = [];
  if (to === "all")
    senderData = await user.findAll({
      where: { status: true, [Op.or]: [{ userTypeId: 1 }, { userTypeId: 2 }] },
      attributes: ["deviceToken", "userTypeId"],
    });
  if (to === "users")
    senderData = await user.findAll({
      where: { status: true, userTypeId: 1 },
      attributes: ["deviceToken"],
    });
  if (to === "drivers")
    senderData = await user.findAll({
      where: { status: true, userTypeId: 2 },
      attributes: ["deviceToken"],
    });

  let DVS = [];
  senderData.map((ele) => {
    if (ele.deviceToken) DVS.push(ele.deviceToken);
  });
  let notification = {
    title: title,
    body: body,
  };
  sendNotification(DVS, notification);
  let dt = new Date();
  pushNotification.create({ at: dt, to, title, body });
  return res.json({
    status: "1",
    message: `Notification sent to ${to}`,
    data: "",
    error: "",
  });
}
/*
        7. Get all sent push notifications
*/
async function getAllPushNot(req, res) {
  const allNotData = await pushNotification.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });
  return res.json({
    status: "1",
    message: "All Push Notifications",
    data: allNotData,
    error: "",
  });
}

// Module 10 - Dash Board
/*
        1.  Get dashbaord data Stats
*/
async function dashbaordStats(req, res) {
  // getting all users
  const allUsers = await user.findAll({
    where: { status: true, userTypeId: [1, 2] },
    attributes: ["userTypeId"],
  });
  //getting all restaurants
  const allRestaurants = await restaurant.findAll({
    where: { status: true },
    attributes: ["id"],
  });
  //getting all orders
  const allOrders = await order.findAll({ attributes: ["orderStatusId"] });
  let allCustomers = allUsers.filter((ele) => ele.userTypeId == 1);
  let allDrivers = allUsers.filter((ele) => ele.userTypeId == 2);
  let allCompletedOrders = allOrders.filter(
    (ele) =>
      ele.orderStatusId == 7 ||
      ele.orderStatusId == 10 ||
      ele.orderStatusId == 11
  );
  let allCancelledOrders = allOrders.filter((ele) => ele.orderStatusId == 12);
  let latest_users = await user.findAll({
    limit: 5,
    order: [["createdAt", "DESC"]],
  });

  let latest_orders = await order.findAll({
    limit: 5,
    include: [
      { model: unit, as: "currencyUnitID" },
      { model: orderStatus },
      { model: orderItems, include: { model: R_PLink, attributes: ["image"] } },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.json({
    status: "1",
    message: "Stats Admin",
    data: {
      numOfCustomers: allCustomers.length,
      numOfDrivers: allDrivers.length,
      numOfStores: allRestaurants.length,
      allCompletedOrders: allCompletedOrders.length,
      allCancelledOrders: allCancelledOrders.length,
      allOngoingOrders:
        allOrders.length -
        allCompletedOrders.length -
        allCancelledOrders.length,
      latest_users: latest_users,
      latest_orders: latest_orders,
    },
    error: "",
  });
}

/*
        2.  Get most rated items
*/
async function topItems(req, res) {
  const restByRatings = await restaurantRating.findAll({
    include: { model: restaurant, attributes: ["logo", "businessName"] },
    attributes: [[sequelize.fn("avg", sequelize.col("value")), "Ratings"]],
    group: ["restaurantId"],
    order: sequelize.literal("Ratings DESC"),
  });

  const driverByRatings = await Sequelize.query(
    "SELECT AVG(driverRatings.value) AS rating, driverRatings.driverId, (SELECT users.firstName FROM users WHERE users.id = driverRatings.driverId ) AS firstName, (SELECT driverDetails.profilePhoto FROM driverDetails WHERE driverDetails.userId = driverRatings.driverId ) AS profilePhoto FROM driverRatings GROUP BY driverRatings.driverId ORDER BY rating DESC",
    { type: sequelize.QueryTypes.SELECT }
  );
  //return res.json(driverByRatings)
  const mostSoldItems = await orderItems.findAll({
    include: { model: R_PLink, attributes: ["name", "image"] },
    attributes: [[sequelize.fn("sum", sequelize.col("quantity")), "prodQuan"]],
    group: "RPLinkId",
    order: sequelize.literal("prodQuan DESC"),
  });
  return res.json({
    status: "1",
    message: "Most Rated Data",
    data: {
      mostRatedRestaurant: restByRatings.splice(0, 5),
      mostRatedDrivers: driverByRatings.splice(0, 5),
      mostSoldItems: mostSoldItems.splice(0, 5),
    },
    error: "",
  });
}

// Module 11
/*
        1. Restaurant wise Earnings
*/
async function earningAllRestaurants(req, res) {
  const allRestaurants = await restaurant.findAll({
    include: [
      { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
      {
        model: order,
        where: { orderStatusId: 7 },
        include: {
          model: orderCharge,
          attributes: ["adminEarnings", "restaurantEarnings"],
        },
        attributes: ["total"],
      },
      { model: wallet, attributes: ["amount"] },
    ],
    attributes: [
      "id",
      "businessName",
      "name",
      "address",
      "city",
      "logo",
      "comission",
    ],
  });
  let allRestaurantsData = [];
  allRestaurants.map((ele) => {
    let restEarningsBeforeComms = ele.orders.reduce(
      (pVal, cVal) => pVal + parseFloat(cVal.total),
      0
    );
    let restEarningsAfterComms = ele.orders.reduce(
      (pVal, cVal) => pVal + parseFloat(cVal.orderCharge.restaurantEarnings),
      0
    );
    let adminEarnings = ele.orders.reduce(
      (pVal, cVal) => pVal + parseFloat(cVal.orderCharge.adminEarnings),
      0
    );
    let balance = ele.wallets.reduce((pVal, cVal) => pVal + cVal.amount, 0);
    let restObj = {
      restId: ele.id,
      restName: ele.businessName,
      ownerName: ele.name,
      address: ele.address,
      city: ele.city,
      logo: ele.logo,
      adminCommission: `${ele.comission}%`,
      restUnit: ele.currencyUnitID.symbol,
      restEarningsBeforeComms: restEarningsBeforeComms.toFixed(2),
      restEarningsAfterComms: restEarningsAfterComms.toFixed(2),
      adminEarnings: adminEarnings.toFixed(2),
      // reversing the symbol as +ve shows --> restaurant has to receive & -ve shows --> restaurant has to pay
      balance: -1 * balance.toFixed(2),
    };
    allRestaurantsData.push(restObj);
  });
  return res.json({
    status: "1",
    message: "Restaurant wise earnings",
    data: allRestaurantsData,
    error: "",
  });
}
/*
        2. Restaurant wise payout requests uisng rest Id
*/
async function payoutRequestsByRest(req, res) {
  const restId = req.params.id;
  const allPayouts = await payout.findAll({
    where: { restaurantId: restId },
    include: { model: unit, attributes: ["symbol"] },
  });
  return res.json({
    status: "1",
    message: "All payout resuest by a restaurant",
    data: allPayouts,
    error: "",
  });
}

/*
        Get All Charges
*/
async function get_charges(req, res) {
  const data = await charge.findAll();
  return res.json({
    status: "1",
    message: "All Charges",
    data: data,
    error: "",
  });
}

/*
        Update Charge
*/
async function update_charge(req, res) {
  const chargeId = req.body.chargeId;
  const data = await charge.update(
    {
      title: req.body.title,
      value: req.body.value,
      amount: req.body.amount,
    },
    {
      where: { id: chargeId },
    }
  );
  return res.json({
    status: "1",
    message: "Charge Updated",
    data: data,
    error: "",
  });
}

/*
        Get Social Links
*/
async function get_social_links(req, res) {
  const data = await socialLink.findAll();
  return res.json({
    status: "1",
    message: "Social Links",
    data: data,
    error: "",
  });
}

/*
        Update Social Links
*/
async function update_social_links(req, res) {
  const { facebook, twitter, linkedin, instagram, whatsapp } = req.body;

  await socialLink.update(
    { link: facebook },
    { where: { social: "facebook" } }
  );
  await socialLink.update({ link: twitter }, { where: { social: "twitter" } });
  await socialLink.update(
    { link: instagram },
    { where: { social: "instagram" } }
  );
  await socialLink.update(
    { link: linkedin },
    { where: { social: "linkedin" } }
  );
  await socialLink.update(
    { link: whatsapp },
    { where: { social: "whatsapp" } }
  );

  const data = await socialLink.findAll();

  return res.json({
    status: "1",
    message: "Social Links",
    data: data,
    error: "",
  });
}

/*
        Get App Links
*/
async function get_app_links(req, res) {
  const data = await appLink.findAll();
  return res.json({
    status: "1",
    message: "app Links",
    data: data,
    error: "",
  });
}

/*
        Update app Links
*/
async function update_app_links(req, res) {
  const { ios, andriod } = req.body;

  await appLink.update({ link: ios }, { where: { app: "ios" } });
  await appLink.update({ link: andriod }, { where: { app: "andriod" } });
  const data = await appLink.findAll();

  return res.json({
    status: "1",
    message: "Social Links",
    data: data,
    error: "",
  });
}

/*
        Get App Pages
*/
async function get_app_pages(req, res) {
  const data = await appPage.findAll();
  return res.json({
    status: "1",
    message: "app Pages",
    data: data,
    error: "",
  });
}

/*
        Update app Pages
*/
async function update_app_pages(req, res) {
  const { terms, policy, about } = req.body;

  await appPage.update({ content: terms }, { where: { page: "terms" } });
  await appPage.update({ content: policy }, { where: { page: "policy" } });
  await appPage.update({ content: about }, { where: { page: "about" } });

  const data = await appPage.findAll();

  return res.json({
    status: "1",
    message: "App Pages",
    data: data,
    error: "",
  });
}

async function add_permission(req, res) {
  const { title } = req.body;
  const check = await permissions.findOne({ where: { title: title } });
  if (check) {
    return res.json({
      status: "0",
      message: "Permission already exists",
      data: {},
      error: "",
    });
  } else {
    const perm = new permissions();
    perm.title = title;
    perm.status = true;
    perm
      .save()
      .then((dat) => {
        return res.json({
          status: "1",
          message: "Added successfully!",
          data: {},
          error: "",
        });
      })
      .catch((error) => {
        return res.json({
          status: "0",
          message: error.message,
          data: {},
          error: "",
        });
      });
  }
}

async function get_permissions(req, res) {
  const perm = await permissions.findAll({ order: [["id", "desc"]] });
  return res.json({
    status: "1",
    message: "All Permissions",
    data: perm,
    error: "",
  });
}

async function changePermissionStatus(req,res){
    const {id ,status } = req.body;
    const dd = await permissions.findOne({where:{id:id}});
    if(dd){
        dd.status = status;
        dd.save().then(dat =>{
            const response = ApiResponse("1","Status Updated successfully","",{});
            return res.json(response);
        })
        .catch((error) => {
        return res.json({
          status: "0",
          message: error.message,
          data: {},
          error: "",
        });
      });
    }
}

async function updatePermission(req,res){
    const  {id,title} = req.body;
     const dd = await permissions.findOne({where:{id:id}});
    if(dd){
        dd.title = title;
        dd.save().then(dat =>{
            const response = ApiResponse("1","Permission Updated successfully","",{});
            return res.json(response);
        })
        .catch((error) => {
        return res.json({
          status: "0",
          message: error.message,
          data: {},
          error: "",
        });
      });
    } 
}


async function assign_permissions_to_role(req, res) {
  const { roleId, permissions } = req.body;
  console.log(req.body)
  
  let toBeDeleted = await rolePermissions.findAll({where:{roleId : roleId}});
 await Promise.all(toBeDeleted.map(record => record.destroy()));
  
  
  for (var i = 0; i < permissions.length; i++) {
    const check = await rolePermissions.findOne({
      where: [{ roleId: roleId }, { permissionId: permissions[i] }],
    });
    if (check) {
      check.status = true;
      await check.save();
    } else {
      const perm = new rolePermissions();
      perm.roleId = roleId;
      perm.permissionId = permissions[i];
      perm.status = true;
      await perm.save();
    }
  }
  return res.json({
    status: "1",
    message: "Permissions assign to Role",
    data: {},
    error: "",
  });
}

async function get_role_permissions(req, res) {
  //get role id from params
  const { roleId } = req.params;
  const perm = await rolePermissions.findAll({
    where: [{ roleId: roleId }, { status: true }],
    attributes: ["id"],
    include: { model: permissions, attributes: ["id", "title"] },
  });
  return res.json({
    status: "1",
    message: "Permissions of Role",
    data: perm,
    error: "",
  });
}

async function update_role_permissions(req, res) {
  const { roleId, permissions } = req.body;
  console.log(req.body)
  
  let old = rolePermissions.findAll({where:{roleId : roleId}});
  if(old.length > 0){
      for(const oldPer of old){
          await oldPer.destroy();
      }
  }
  
  
  for(const permissionId of permissions){
      let newPer = new rolePermissions();
      newPer.roleId = roleId ;
      newPer.permissionId = permissionId;
      newPer.status = true;
      await newPer.save();
      
  }

  return res.json({
    status: "1",
    message: "Permissions Updated successfully",
    data: {},
    error: "",
  });
}

async function getRestaurantProducts(req,res){
    const { restaurantId } = req.params;
    const rmc = await R_MCLink.findAll({where:{restaurantId:restaurantId},include:{model:R_PLink}});
    const data = {
        rmc:rmc
    };
    const response = ApiResponse("1","Restaurant Products","",data);
    return res.json(response)
    
}

async function restaurant_culteries(req,res){
    const data = await restaurant_cultery.findAll({where:{restaurantId:req.params.restaurantId},include:[{model:cutlery}]});
    const response = ApiResponse("1","Cultery data","",data);
    return res.json(response);
}

async function updateRestaurantCultery(req,res){
    const { id , name , image } = req.body;
    const data = await cutlery.findOne({where:[{status:true},{id:id}]});
    if(data){
        if(req.file){
            let tmpPath = req.file.path;
            let path = tmpPath.replace(/\\/g, "/");
            data.image = path;
        }
        
        data.name = name ;
        data.save().then(dat =>{
            const response = ApiResponse("1","Updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            const response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
    }
    else{
         const response = ApiResponse("0","Sorry! Not found","Error",{});
            return res.json(response);
    }
}
async function updateRestaurantCuisine(req,res){
    const { id , name , image } = req.body;
    const data = await cuisine.findOne({where:[{status:true},{id:id}]});
    if(data){
        if(req.file){
            let tmpPath = req.file.path;
            let path = tmpPath.replace(/\\/g, "/");
            data.image = path;
        }
        
        data.name = name ;
        data.save().then(dat =>{
            const response = ApiResponse("1","Updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            const response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
    }
    else{
         const response = ApiResponse("0","Sorry! Not found","Error",{});
            return res.json(response);
    }
}
async function updateDefaultValue(req,res){
    const { id , value } = req.body;
    const data = await defaultValues.findOne({where:[{id:id}]});
    if(data){
      
        
        data.value = value ;
        data.save().then(dat =>{
            const response = ApiResponse("1","Updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            const response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
    }
    else{
         const response = ApiResponse("0","Sorry! Not found","Error",{});
            return res.json(response);
    }
}

async function getAllDefaultValues(req,res){
    const data = await defaultValues.findAll({});
    return res.json(ApiResponse("1","All Default Values","",data));
}

async function getAllZones(req,res){
    let data = await zone.findAll({include:{model:zoneDetails}});
    const response = ApiResponse("1","All Zones","",data);
    return res.json(response);
}

async function addZone(req,res){
    
    try{
      const { name,baseCharges,baseDistance,perKmCharges,maxDeliveryCharges,adminComission,adminComissionOnDeliveryCharges,distanceUnitId,currencyUnitId,arr } = req.body;
    //   return res.json(req.body)
      let check = await zone.findOne({where:{name:name}});
      if(check){
          let response = ApiResponse('0',"Name already exists","Error",{});
          return res.json(response);
      }
    const coordinatesString = arr.map(coord => coord.join(',')).join('),(');
    const value = coordinatesString;
    const polygon = [];
    let lastcord;
        value.split('),(').map((single_array, index) => {
      if (index === 0) {
        lastcord = single_array.split(',');
      }
      const coords = single_array.split(',');
      polygon.push(new GeoPoint(parseFloat(coords[0]), parseFloat(coords[1])));
    });
    polygon.push(new GeoPoint(parseFloat(lastcord[0]), parseFloat(lastcord[1])));
    const newZone = await zone.create({
      name:name,
      coordinates: {
        type: 'Polygon',
        coordinates: [polygon.map(point => [point.latitude(), point.longitude()])],
      },
  
    });
    if(newZone){
        let details = new zoneDetails();
        details.baseCharges = baseCharges;
        details.baseDistance = baseDistance;
        details.perKmCharges = perKmCharges;
        details.maxDeliveryCharges = maxDeliveryCharges;
        details.adminComission = adminComission;
        details.adminComissionOnDeliveryCharges = adminComissionOnDeliveryCharges;
        details.distanceUnitId = distanceUnitId;
        details.currencyUnitId = currencyUnitId;
        details.zoneId = newZone.id;
        details.status = true;
        details.save().then((dat) =>{
            let response = ApiResponse("1","Zone added successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
    }
    else{
        let response = ApiResponse("0","Something went wrong","Error",{});
        return res.json(response);
    }
  
    }
    catch(error){
        let response = ApiResponse("0",error.message,"Error",{});
        return res.json(response);
    }
}

async function changeZoneStatus(req,res){
    const {zoneId , status } = req.body;
    let data = await zone.findOne({where:{id:zoneId}});
    if(data){
        data.status = status;
        data.save().then((dat)=>{
            let response = ApiResponse("1","Zone Status updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
    }
    else{
        let response = ApiResponse("0","Not found zone","Error",{});
        return res.json(response);
    }
}

async function updateZone(req,res){
   const { name,baseCharges,baseDistance,perKmCharges,maxDeliveryCharges,adminComission,adminComissionOnDeliveryCharges,distanceUnitId,currencyUnitId,zoneId } = req.body;
   let getZone = await zone.findOne({where:{id:zoneId}});
   if(getZone){
       getZone.name = name;
       getZone.save().then(async(dat)=>{
           let details = await zoneDetails.findOne({where:{zoneId : dat.id}});
           if(details){
               details.baseCharges = baseCharges;
               details.baseDistance = baseDistance;
               details.perKmCharges = perKmCharges;
               details.maxDeliveryCharges = maxDeliveryCharges;
               details.adminComission = adminComission;
               details.adminComissionOnDeliveryCharges = adminComissionOnDeliveryCharges;
               details.distanceUnitId = distanceUnitId;
               details.currencyUnitId = currencyUnitId;
               details.save().then(dd=>{
                   let response = ApiResponse("1","Zone and its details updated successfully","",{});
                   return res.json(response);
               })
               .catch((error)=>{
                    let response = ApiResponse("0",error.message,"Error",{});
                    return res.json(response);
                })
           }
           else{
                let response = ApiResponse("0","Zone is updated but details not found!","Error",{});
                return res.json(response);
           }
       })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
   }
   else{
       let response = ApiResponse("0","Sorry! Zone not found","Error",{});
        return res.json(response);
   }
}

async function sendingNotification(req,res){
    
    const { to , title , body } = req.body;
    let noti = new pushNotification();
    noti.at = Date.now();
    const deviceTokens = [];
    if(to == "All"){
        let data = await user.findAll({where:[{status:true}],attributes:['deviceToken']});
       
    
        data.forEach(item => {
            if(item.deviceToken){
               const tokens = item.deviceToken
            .replace(/[\[\]']+/g, '') // Remove square brackets and single quotes
            .split(','); // Split the string into an array of tokens
            deviceTokens.push(...tokens); // Add the tokens to the deviceTokens list  
            }
       
            });
        // return res.json(deviceTokens)
       
        let noti_body = {
            title:title,
            body:body
        }
        sendNotification(deviceTokens,noti_body);
        noti.title = title;
        noti.body = body;
        noti.to = "All";
        await noti.save();
        
        let response = ApiResponse("1",`Notifications to all send successfully!`,"",{});
        return res.json(response);
    }
    else if(to == "Retailer"){
        let type = await userType.findOne({where:{name:to}});
        let data = await user.findAll({where:[{status:true},{userTypeId:type.id}],attributes:['deviceToken']});
        data.forEach(item => {
        const tokens = item.deviceToken
            .replace(/[\[\]']+/g, '') // Remove square brackets and single quotes
            .split(','); // Split the string into an array of tokens
            deviceTokens.push(...tokens); // Add the tokens to the deviceTokens list
        });
       
        let noti_body = {
            title:title,
            body:body
        }
        sendNotification(deviceTokens,noti_body);
        noti.title = title;
        noti.body = body;
        noti.to = type.name;
        await noti.save();
        
        let response = ApiResponse("1",`Notifications to ${type.name} send successfully!`,"",{});
        return res.json(response);
    }
    else if(to == "Driver"){
        let type = await userType.findOne({where:{name:to}});
        let data = await user.findAll({where:[{status:true},{userTypeId:type.id}],attributes:['deviceToken']});
        data.forEach(item => {
        const tokens = item.deviceToken
            .replace(/[\[\]']+/g, '') // Remove square brackets and single quotes
            .split(','); // Split the string into an array of tokens
            deviceTokens.push(...tokens); // Add the tokens to the deviceTokens list
        });
       
        let noti_body = {
            title:title,
            body:body
        }
        sendNotification(deviceTokens,noti_body);
        noti.title = title;
        noti.body = body;
        noti.to = type.name;
        await noti.save();
        
        let response = ApiResponse("1",`Notifications to ${type.name} send successfully!`,"",{});
        return res.json(response);
    }
    else if(to == "Customer"){
        let type = await userType.findOne({where:{name:to}});
        let data = await user.findAll({where:[{status:true},{userTypeId:type.id}],attributes:['deviceToken']});
        data.forEach(item => {
        const tokens = item.deviceToken
            .replace(/[\[\]']+/g, '') // Remove square brackets and single quotes
            .split(','); // Split the string into an array of tokens
            deviceTokens.push(...tokens); // Add the tokens to the deviceTokens list
        });
       
        let noti_body = {
            title:title,
            body:body
        }
        sendNotification(deviceTokens,noti_body);
        noti.title = title;
        noti.body = body;
        noti.to = type.name;
        await noti.save();
        
        let response = ApiResponse("1",`Notifications to ${type.name} send successfully!`,"",{});
        return res.json(response);
    }
}


async function getDataForAddingRestaurant(req,res){
    let zoneData = await zone.findAll({where:{status:true}});
    let data = {
        zones:zoneData
    };
    let response = ApiResponse("1","Data for adding Restaurant","",data);
    return res.json(response);
}

async function storeAllOrders(req,res){
    let type = await orderApplication.findOne({where:{name:"store"}});
    let orders = await order.findAll({include:[{model:orderStatus},{model:orderMode},{model:orderCharge},{model:user,attributes:['firstName','lastName','userName']},{model:restaurant,attributes:['businessName',"packingFee"],where:{businessType:type.id}}]});
//   return res.json(orders)
    let data ={
        orders
    }
    let response = ApiResponse("1","Store All Orders","",data);
    return res.json(response);
}
async function restAllOrders(req,res){
    let type = await orderApplication.findOne({where:{name:"restaurant"}});
    let orders = await order.findAll({include:[{model:orderStatus},{model:orderMode},{model:orderCharge},{model:user,attributes:['firstName','lastName','userName']},{model:restaurant,attributes:['businessName','packingFee'],where:{businessType:type.id}}]});
    let data ={
        orders
    }
    let response = ApiResponse("1","Restaurant All Orders","",data);
    return res.json(response);
}
async function restAllDeliveredOrders(req,res){
    let type = await orderApplication.findOne({where:{name:"restaurant"}});
    let status = await orderStatus.findOne({name:"Delivered"})
    let orders = await order.findAll({where:{orderStatusId : status.id},include:[{model:orderStatus},{model:orderMode},{model:orderCharge},{model:user,attributes:['firstName','lastName','userName']},{model:restaurant,attributes:['businessName','packingFee'],where:{businessType:type.id}}]});
    let data ={
        orders
    }
    let response = ApiResponse("1","Restaurant All Delivered Orders","",data);
    return res.json(response);
}
async function restAllCancelledOrders(req, res) {
    try {
        let type = await orderApplication.findOne({ where: { name: "restaurant" } });
        let status = await orderStatus.findOne({ where: { name: "Cancelled" } });
        let orders = await order.findAll({
            where: { orderStatusId: status.id },
            include: [
                { model: orderStatus },
                { model: orderMode },
                { model: orderCharge },
                { model: user, attributes: ['firstName', 'lastName', 'userName'] },
                {
                    model: restaurant,
                    attributes: ['businessName', 'packingFee'],
                    where: { businessType: type.id }
                }
            ]
        });
        let data = {
            orders
        };
        let response = ApiResponse("1", "Restaurant All Cancelled Orders", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        let response = ApiResponse("0", "Error occurred", "An error occurred while fetching cancelled orders", {});
        return res.json(response);
    }
}

async function storeAllDeliveredOrders(req, res) {
    try {
        let type = await orderApplication.findOne({ where: { name: "store" } });
        let status = await orderStatus.findOne({ where: { name: "Delivered" } });
        let orders = await order.findAll({
            where: { orderStatusId: status.id },
            include: [
                { model: orderStatus },
                { model: orderMode },
                { model: orderCharge },
                { model: user, attributes: ['firstName', 'lastName', 'userName'] },
                {
                    model: restaurant,
                    attributes: ['businessName', 'packingFee'],
                    where: { businessType: type.id }
                }
            ]
        });
        let data = {
            orders
        };
        let response = ApiResponse("1", "Restaurant All Delivered Orders", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        let response = ApiResponse("0", "Error occurred", "An error occurred while fetching delivered orders", {});
        return res.json(response);
    }
}

async function storeAllCancelledOrders(req, res) {
    try {
        let type = await orderApplication.findOne({ where: { name: "store" } });
        let status = await orderStatus.findOne({ where: { name: "Cancelled" } });
        let orders = await order.findAll({
            where: { orderStatusId: status.id },
            include: [
                { model: orderStatus },
                { model: orderMode },
                { model: orderCharge },
                { model: user, attributes: ['firstName', 'lastName', 'userName'] },
                {
                    model: restaurant,
                    attributes: ['businessName', 'packingFee'],
                    where: { businessType: type.id }
                }
            ]
        });
        let data = {
            orders
        };
        let response = ApiResponse("1", "Restaurant All Cancelled Orders", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        let response = ApiResponse("0", "Error occurred", "An error occurred while fetching cancelled orders", {});
        return res.json(response);
    }
}
async function storeAllScheduleOrders(req, res) {
    try {
        let type = await orderApplication.findOne({ where: { name: "store" } });
        let mode = await orderMode.findOne({ where: { name: "Scheduled" } });
        let orders = await order.findAll({
            where: { orderModeId: mode.id },
            include: [
                { model: orderStatus },
                { model: orderMode },
                { model: orderCharge },
                { model: user, attributes: ['firstName', 'lastName', 'userName'] },
                {
                    model: restaurant,
                    attributes: ['businessName', 'packingFee'],
                    where: { businessType: type.id }
                }
            ]
        });
        let data = {
            orders
        };
        let response = ApiResponse("1", "Restaurant All Schedule Orders", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        let response = ApiResponse("0", "Error occurred", "An error occurred while fetching cancelled orders", {});
        return res.json(response);
    }
}
async function restAllScheduleOrders(req, res) {
    try {
        let type = await orderApplication.findOne({ where: { name: "restaurant" } });
        let mode = await orderMode.findOne({ where: { name: "Scheduled" } });
        let orders = await order.findAll({
            where: { orderModeId: mode.id },
            include: [
                { model: orderStatus },
                { model: orderMode },
                { model: orderCharge },
                { model: user, attributes: ['firstName', 'lastName', 'userName'] },
                {
                    model: restaurant,
                    attributes: ['businessName', 'packingFee'],
                    where: { businessType: type.id }
                }
            ]
        });
        let data = {
            orders
        };
        let response = ApiResponse("1", "Restaurant All Schedule Orders", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        let response = ApiResponse("0", "Error occurred", "An error occurred while fetching cancelled orders", {});
        return res.json(response);
    }
}


async function all_earnings(req,res){
    
    let online_method = await paymentMethod.findOne({where:{name:"Payrexx"}});
    let cod = await paymentMethod.findOne({where:{name:"COD"}});
    let deliveredStatus = await orderStatus.findOne({where:{name:"Delivered"}});
    
    //total earning
    // const total_earnings = await order.sum('total', {
    //   where: {
    //     orderStatusId: deliveredStatus.id
    //   }
    // });
    
    //total earning by cash on delivery
    // const total_earnings_by_cod = await order.sum('total', {
    //   where: {
    //     orderStatusId: deliveredStatus.id,
    //     paymentMethodId : cod.id
    //   }
    // });
    
    //total earning by online payment way
    // const total_online_earnings = await order.sum('total', {
    //   where: {
    //     orderStatusId: deliveredStatus.id,
    //     paymentMethodId : online_method.id
    //   }
    // });
    
    //admin earning by online way
    const admin_earning_online = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : online_method.id
      },
      attributes:['id'],
      include:{model:orderCharge,attributes:['adminEarnings']}
    });
    const totalAdminEarningsOnline = admin_earning_online.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.adminEarnings);
    }, 0);
    
    //admin overall earning
    const admin_total = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        // paymentMethodId : online_method.id
      },
      attributes:['id'],
      include:{model:orderCharge,attributes:['adminEarnings']}
    });
    const admin_total_earning = admin_total.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.adminEarnings);
    }, 0);
    
    //admin earning by cod
    const admin_earning_cod = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : cod.id
      },
      attributes:['id'],
      include:{model:orderCharge,attributes:['adminEarnings']}
    });
    const totalAdminEarningsCOD = admin_earning_cod.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.adminEarnings);
    }, 0);
    
    //total delivery charges 
    //  const delivery_charges = await order.findAll({
    //   where: {
    //     orderStatusId: deliveredStatus.id,
    //   },
    //   attributes:['id'],
    //   include:{model:orderCharge,attributes:['deliveryFees']}
    // });
    // const Total_deliveryFees = delivery_charges.reduce((sum, order) => {
    // return sum + parseFloat(order.orderCharge.deliveryFees);
    // }, 0);
    
    //Admin delivery charges 
     const admin_delivery_charges = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:{model:orderCharge,attributes:['adminDeliveryCharges']}
    });
    const admin_Total_deliveryFees = admin_delivery_charges.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.adminDeliveryCharges);
    }, 0);
    
    //total services Charges 
     const service_charges = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:{model:orderCharge,attributes:['serviceCharges']}
    });
    const total_services_charges = service_charges.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.serviceCharges);
    }, 0);
    
    //total discount 
    //  const discount = await order.findAll({
    //   where: {
    //     orderStatusId: deliveredStatus.id,
    //   },
    //   attributes:['id'],
    //   include:{model:orderCharge,attributes:['discount']}
    // });
    // const total_discount = discount.reduce((sum, order) => {
    // return sum + parseFloat(order.orderCharge.discount);
    // }, 0);
    
    let data = {
        // total_earnings,
        // total_earnings_by_cod,
        // total_online_earnings,
        totalAdminEarningsOnline,
        totalAdminEarningsCOD,
        // Total_deliveryFees,
        admin_Total_deliveryFees,
        // admin_delivery_charges_paid_to_drivers:parseFloat(Total_deliveryFees) - parseFloat(admin_Total_deliveryFees),
        total_services_charges,
        admin_total_earning
        // total_discount
    }
    let response = ApiResponse("1","Earning Details","",data);
    return res.json(response)
}

async function get_profile(req,res){
    let userId = req.user.id;
    let userData = await user.findOne({where:{id:userId},attributes:['id','firstName','lastName',"email",'countryCode','phoneNum']});
    let response = ApiResponse("1","Profile","",{userData});
    return res.json(response);
}

async function update_profile(req,res){
    const { userId , firstName,password, lastName,countryCode,phoneNum,email } = req.body;
    let userData = await user.findOne({where:{id:userId}});
    if(userData){
        userData.firstName = firstName;
        userData.lastName = lastName;
        userData.email = email;
        userData.countryCode = countryCode;
        userData.phoneNum = phoneNum;
        if(password){
           userData.password = await bcrypt.hash(password, 10); 
        }
        userData.save().then(dat =>{
            let response = ApiResponse("1","Update profile","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"Error",
            {});
            return res.json(repsonse);
        })
        
    }
}

async function restaurant_earnings(req,res){
    
    let type = await orderApplication.findOne({where:{name:"restaurant"}});
    let online_method = await paymentMethod.findOne({where:{name:"Payrexx"}});
    let cod = await paymentMethod.findOne({where:{name:"COD"}});
    let deliveredStatus = await orderStatus.findOne({where:{name:"Delivered"}});
    
    // Restaurant Earning by Online method
    const online = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : online_method.id
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['restaurantEarnings']},{model:restaurant,where:{businessType:type.id}}]
    });
    const online_earnings = online.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.restaurantEarnings);
    }, 0);
    
    // Restaurant Earning by COD
    const cod_payment = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : cod.id
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['restaurantEarnings']},{model:restaurant,where:{businessType:type.id}}]
    });
    const cod_earnings = cod_payment.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.restaurantEarnings);
    }, 0);
    
    // Restaurant Driver earning
    const drivers_orders = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['driverEarnings']},{model:user,as:"DriverId",where:{driverType:"Restaurant"},attributes:['driverType']},{model:restaurant,where:{businessType:type.id}}]
    });
    // return res.json(drivers_orders)
    const driver_earnings = drivers_orders.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.driverEarnings);
    }, 0);
    
    
    // Restaurant packing Fee
    const packingFee = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['packingFee']},{model:restaurant,where:{businessType:type.id}}]
    });
    const rest_packing_fee = packingFee?.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.packingFee);
    }, 0);
    
    
    let data = {
        online_earnings,
        cod_earnings,
        driver_earnings,
        rest_packing_fee
    };
    let response = ApiResponse("1","Restaurant Earning","",data);
    return res.json(response);
}
async function store_earnings(req,res){
    
    let type = await orderApplication.findOne({where:{name:"store"}});
    let online_method = await paymentMethod.findOne({where:{name:"Payrexx"}});
    let cod = await paymentMethod.findOne({where:{name:"COD"}});
    let deliveredStatus = await orderStatus.findOne({where:{name:"Delivered"}});
    
    // Restaurant Earning by Online method
    const online = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : online_method.id
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['restaurantEarnings']},{model:restaurant,where:{businessType:type.id}}]
    });
    const online_earnings = online.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.restaurantEarnings);
    }, 0);
    
    // Restaurant Earning by COD
    const cod_payment = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        paymentMethodId : cod.id
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['restaurantEarnings']},{model:restaurant,where:{businessType:type.id}}]
    });
    const cod_earnings = cod_payment.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.restaurantEarnings);
    }, 0);
    
    // Restaurant Driver earning
    const drivers_orders = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
        
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['driverEarnings']},{model:user,as:"DriverId",where:{driverType:"Restaurant"},attributes:['driverType']},{model:restaurant,where:{businessType:type.id}}]
    });
    // return res.json(drivers_orders)
    const driver_earnings = drivers_orders.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.driverEarnings);
    }, 0);
    
    
    // Restaurant packing Fee
    const packingFee = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['packingFee']},{model:restaurant,where:{businessType:type.id}}]
    });
    const rest_packing_fee = packingFee.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge.packingFee);
    }, 0);
    
    
    let data = {
        online_earnings,
        cod_earnings,
        driver_earnings,
        store_packing_fee:rest_packing_fee
    };
    let response = ApiResponse("1","Store Earning","",data);
    return res.json(response);
}


async function driver_earnings(req,res){
    let online_method = await paymentMethod.findOne({where:{name:"Payrexx"}});
    let cod = await paymentMethod.findOne({where:{name:"COD"}});
    let deliveredStatus = await orderStatus.findOne({where:{name:"Delivered"}});
    
    // OverAll delviery Charges
    const online = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['deliveryFees']}]
    });
    const deliveryFees = online.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.deliveryFees);
    }, 0);
    
    // Admin delviery Charges
    const adminCharges = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['adminDeliveryCharges']}]
    });
    const adminDeliveryCharges = adminCharges.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.adminDeliveryCharges);
    }, 0);
    
    // Admin delviery Charges from Feelancer Drivers
    const adminCommision_freelancer = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['adminDeliveryCharges']},{model:user,as:"DriverId",where:{driverType:"Freelancer"},attributes:['driverType']}]
    });
    const adminCommision_from_freelancer_driver = adminCommision_freelancer.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.adminDeliveryCharges);
    }, 0);
    
    
    // Admin delviery Charges from Restaurant Drivers
    const adminCommision_restauarnt = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['adminDeliveryCharges']},{model:user,as:"DriverId",where:{driverType:"Restaurant"},attributes:['driverType']}]
    });
    const adminCommision_from_restaurant_driver = adminCommision_restauarnt.reduce((sum, order) => {
    return sum + parseFloat(order?.orderCharge?.adminDeliveryCharges);
    }, 0);
    
    // Earnig by Tips
    const tipCharges = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['tip']}]
    });
    const tip_earning = tipCharges.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge?.tip);
    }, 0);
    
    // overall driver earnings
    const driverEarnings = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['driverEarnings']}]
    });
    const overall_driver_earnings = driverEarnings.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge?.driverEarnings);
    }, 0);

    // Restaurant Driver earning
    const drivers_orders = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['driverEarnings']},{model:user,as:"DriverId",where:{driverType:"Restaurant"},attributes:['driverType']}]
    });
    // return res.json(drivers_orders)
    const driver_earnings = drivers_orders.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge?.driverEarnings);
    }, 0);
    
    // Freelance Driver earning
    const freelancer_drivers = await order.findAll({
      where: {
        orderStatusId: deliveredStatus.id,
      },
      attributes:['id'],
      include:[{model:orderCharge,attributes:['driverEarnings']},{model:user,as:"DriverId",where:{driverType:"Freelancer"},attributes:['driverType']}]
    });
    // return res.json(drivers_orders)
    const freelance_earnings = freelancer_drivers.reduce((sum, order) => {
    return sum + parseFloat(order.orderCharge?.driverEarnings);
    }, 0);
    
    let data = {
        overall_driver_earnings,
        overall_delivery_fees:deliveryFees,
        earning_from_delivery_charges :deliveryFees !=null ? parseFloat(deliveryFees) - parseFloat(adminDeliveryCharges) : 0.0,
        tip_earning,
        store_driver_earning:driver_earnings,
        freelance_earnings,
        adminDeliveryCharges,
        adminCommision_from_freelancer_driver,
        adminCommision_from_restaurant_driver
    }
    let response = ApiResponse("1","Delivery Fee","",data);
    return res.json(response);
}

async function restaurantReports(req, res) {
    try {
        // Fetch necessary details
        const type = await orderApplication.findOne({ where: { name: "restaurant" } });
        const cod = await paymentMethod.findOne({ where: { name: "COD" } });
        const online = await paymentMethod.findOne({ where: { name: "Payrexx" } });
        const deliveredStatus = await orderStatus.findOne({ where: { name: 'delivered' } });
        const cancelStatus = await orderStatus.findOne({ where: { name: 'Cancelled' } });
        let totalOrdersAmount = 0;

        // Fetch all orders with their orderCharge and restaurantEarnings
        const orders = await order.findAll({
            include: [
                { model: restaurant, where: { businessType: type.id } },
                { model: orderCharge, attributes: ['restaurantEarnings'] }
            ],
            attributes: ['id', 'createdAt']
        });

        // Initialize an array to store the monthly earnings
        const monthlyEarnings = new Array(12).fill(0);
        const monthlyCounts = new Array(12).fill(0);

        // Sum the restaurantEarnings for each month
        orders.forEach(order => {
            
            totalOrdersAmount = totalOrdersAmount + parseFloat(order?.total);
            const date = new Date(order.createdAt);
            const month = date.getUTCMonth(); // getUTCMonth returns month index (0-11)
            if (order.orderCharge && order.orderCharge.restaurantEarnings) {
                monthlyEarnings[month] += parseFloat(order.orderCharge.restaurantEarnings);
            }
            monthlyCounts[month]++;
        });

        // Create the monthly data structure
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthlyData = monthNames.map((month, index) => ({
            month,
            ordersCount: monthlyCounts[index],
            restaurantEarnings: monthlyEarnings[index].toFixed(2)
        }));
        

        const totalRestaurants = await restaurant.count({ where: { businessType: type.id } });

        // Calculate totals for online and COD orders
        const [onlineOrders, codOrders] = await Promise.all([
            order.findAll({
                attributes: ['total'],
                where: { paymentMethodId: online.id },
                include: { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            }),
            order.findAll({
                attributes: ['total'],
                where: { paymentMethodId: cod.id },
                include: { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            })
        ]);

        const calculateTotal = orders => orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

        const onlineTotals = calculateTotal(onlineOrders);
        const codTotals = calculateTotal(codOrders);

        // Calculate earnings for complete, not complete, and cancelled orders
        const [completeOrders, cancelledOrders, notCompleteOrders] = await Promise.all([
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: deliveredStatus.id },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            }),
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: cancelStatus.id },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            }),
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: { [Op.notIn]: [deliveredStatus.id, cancelStatus.id] } },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            })
        ]);

        const calculateEarnings = orders => orders.reduce((sum, order) => {
            if (order.orderCharge && order.orderCharge.restaurantEarnings) {
                return sum + parseFloat(order.orderCharge.restaurantEarnings);
            }
            return sum;
        }, 0);

        const completeEarnings = calculateEarnings(completeOrders);
        const cancelledOrdersEarning = calculateEarnings(cancelledOrders);
        const notCompleteEarning = calculateEarnings(notCompleteOrders);

        // Calculate total discount given
        const discountOrders = await order.findAll({
            attributes: ['id'],
            include: [
                { model: orderCharge, attributes: ['discount'] },
                { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            ]
        });

        const discountAmount = discountOrders.reduce((sum, order) => {
            if (order.orderCharge && order.orderCharge.discount) {
                return sum + parseFloat(order.orderCharge.discount);
            }
            return sum;
        }, 0);
        
         const averageOrderValue = await order.findAll({
          include: {
            model: restaurant,
            attributes: [],
            where: { businessType: type.id }
          },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('total')), 'averageTotal']
          ],
          raw: true
        });
        

        const data = {
            summary_reports:{
                totalRegisteredRestaurants:totalRestaurants,
                newItems:25,
                totalOrders: orders.length,
                deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length,
                totalPayment: onlineTotals + codTotals,
                onlineTotals,
                codTotals,
                averageOrderValue:averageOrderValue[0]?.averageTotal,
            },
            sales_reports:{
                gross_sales:4380,
                total_tax:234,
                 totalOrdersAmount:totalOrdersAmount ? totalOrdersAmount : 0.0,
                total_commissions:723,
                 deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length
                
                
            },
            orderReports: {
                totalOrders: orders.length,
                totalOrdersAmount:totalOrdersAmount ? totalOrdersAmount : 0.0,
                completeOrdersEarning: completeEarnings,
                notCompleteEarning,
                cancelledOrdersEarning,
                discountAmount,
                  deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length
            },
            monthlyData
        };

        const response = ApiResponse("1", "Restaurant Reports", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        const response = ApiResponse("0", "Error generating restaurant reports", error.message);
        return res.status(500).json(response);
    }
}
async function storeReports(req,res){
  
     try {
        // Fetch necessary details
        const type = await orderApplication.findOne({ where: { name: "store" } });
        const cod = await paymentMethod.findOne({ where: { name: "COD" } });
        const online = await paymentMethod.findOne({ where: { name: "Payrexx" } });
        const deliveredStatus = await orderStatus.findOne({ where: { name: 'delivered' } });
        const cancelStatus = await orderStatus.findOne({ where: { name: 'Cancelled' } });
        let totalOrdersAmount = 0;

        // Fetch all orders with their orderCharge and restaurantEarnings
        const orders = await order.findAll({
            include: [
                { model: restaurant, where: { businessType: type.id } },
                { model: orderCharge, attributes: ['restaurantEarnings'] }
            ],
            attributes: ['id', 'createdAt']
        });

        // Initialize an array to store the monthly earnings
        const monthlyEarnings = new Array(12).fill(0);
        const monthlyCounts = new Array(12).fill(0);

        // Sum the restaurantEarnings for each month
        orders.forEach(order => {
            
            totalOrdersAmount = totalOrdersAmount + parseFloat(order?.total);
            const date = new Date(order.createdAt);
            const month = date.getUTCMonth(); // getUTCMonth returns month index (0-11)
            if (order.orderCharge && order.orderCharge.restaurantEarnings) {
                monthlyEarnings[month] += parseFloat(order.orderCharge.restaurantEarnings);
            }
            monthlyCounts[month]++;
        });

        // Create the monthly data structure
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthlyData = monthNames.map((month, index) => ({
            month,
            ordersCount: monthlyCounts[index],
            restaurantEarnings: monthlyEarnings[index].toFixed(2)
        }));
        

        const totalRestaurants = await restaurant.count({ where: { businessType: type.id } });

        // Calculate totals for online and COD orders
        const [onlineOrders, codOrders] = await Promise.all([
            order.findAll({
                attributes: ['total'],
                where: { paymentMethodId: online.id },
                include: { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            }),
            order.findAll({
                attributes: ['total'],
                where: { paymentMethodId: cod.id },
                include: { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            })
        ]);

        const calculateTotal = orders => orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

        const onlineTotals = calculateTotal(onlineOrders);
        const codTotals = calculateTotal(codOrders);

        // Calculate earnings for complete, not complete, and cancelled orders
        const [completeOrders, cancelledOrders, notCompleteOrders] = await Promise.all([
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: deliveredStatus.id },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            }),
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: cancelStatus.id },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            }),
            order.findAll({
                attributes: ['id'],
                where: { orderStatusId: { [Op.notIn]: [deliveredStatus.id, cancelStatus.id] } },
                include: [
                    { model: orderCharge, attributes: ['restaurantEarnings'] },
                    { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
                ]
            })
        ]);

        const calculateEarnings = orders => orders.reduce((sum, order) => {
            if (order.orderCharge && order.orderCharge.restaurantEarnings) {
                return sum + parseFloat(order.orderCharge.restaurantEarnings);
            }
            return sum;
        }, 0);

        const completeEarnings = calculateEarnings(completeOrders);
        const cancelledOrdersEarning = calculateEarnings(cancelledOrders);
        const notCompleteEarning = calculateEarnings(notCompleteOrders);

        // Calculate total discount given
        const discountOrders = await order.findAll({
            attributes: ['id'],
            include: [
                { model: orderCharge, attributes: ['discount'] },
                { model: restaurant, attributes: ['id'], where: { businessType: type.id } }
            ]
        });

        const discountAmount = discountOrders.reduce((sum, order) => {
            if (order.orderCharge && order.orderCharge.discount) {
                return sum + parseFloat(order.orderCharge.discount);
            }
            return sum;
        }, 0);
        
         const averageOrderValue = await order.findAll({
          include: {
            model: restaurant,
            attributes: [],
            where: { businessType: type.id }
          },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('total')), 'averageTotal']
          ],
          raw: true
        });
        

        const data = {
            summary_reports:{
                totalRegisteredRestaurants:totalRestaurants,
                newItems:25,
                totalOrders: orders.length,
                deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length,
                totalPayment: onlineTotals + codTotals,
                onlineTotals,
                codTotals,
                averageOrderValue:averageOrderValue[0]?.averageTotal,
            },
            sales_reports:{
                gross_sales:4380,
                total_tax:234,
                 totalOrdersAmount:totalOrdersAmount ? totalOrdersAmount : 0.0,
                total_commissions:723,
                 deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length
                
                
            }
            ,
       
            
            orderReports: {
                totalOrders: orders.length,
                totalOrdersAmount:totalOrdersAmount ? totalOrdersAmount : 0.0,
                completeOrdersEarning: completeEarnings,
                notCompleteEarning,
                cancelledOrdersEarning,
                discountAmount,
                  deliveredOrders:completeOrders.length,
                pickupOrders:notCompleteOrders.length
                
               
                
            },
            monthlyData
        };

        const response = ApiResponse("1", "Restaurant Reports", "", data);
        return res.json(response);
    } catch (error) {
        console.error(error);
        const response = ApiResponse("0", "Error generating restaurant reports", error.message);
        return res.status(500).json(response);
    }
}

async function getCountries(req,res){
    
    let countries = await country.findAll({});
    let data = {
        countries
    };
    let response = ApiResponse("1","All Countries","",data);
    return res.json(response)
}

async function addCountry(req, res) {
    const { name, shortName } = req.body;

   

    try {
        const check = await country.findOne({ where: { name: name } });
        if (check) {
            let response = ApiResponse("0", "Already exist with this name", "Error", {});
            
            return res.json(response);
        }

        let imagePathTemp = req.file.path;
        let imagePath = imagePathTemp.replace(/\\/g, "/");

        let count = new country();
        count.name = name;
        count.shortName = shortName;
        count.flag = imagePath;
        count.status = true;

        await count.save();

        let response = ApiResponse("1", "Added successfully", "", {});
        return res.json(response);
    } catch (error) {
       

        let response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
    }
}

async function changeCountryStatus(req, res) {
    const { id, status } = req.body;
    try {
        let count = await country.findOne({ where: { id: id } });
        if (count) {
            count.status = status;
            await count.save();

            let response = ApiResponse("1", "Updated successfully", "", {});
            return res.json(response);
        } else {
          

            let response = ApiResponse("0", "Not found!", "Error", {});
            return res.json(response);
        }
    } catch (error) {
       

        let response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
    }
}

async function editCountry(req, res) {
    const { id, name, shortName } = req.body;
    let data = await country.findOne({ where: { id: id } });
    console.log(req.file)
    
    if (data) {
        const previousImage = data.flag; // Store the previous image path
        
        data.name = name;
        data.shortName = shortName;
        
        if (req.file) {
            // Handle uploading of new image
            let imagePathTemp = req.file.path;
            let imagePath = imagePathTemp.replace(/\\/g, "/");
            data.flag = imagePath;

            // Delete previous image if it exists
            if (previousImage) {
                try {
                    fs.unlinkSync(previousImage);
                } catch (error) {
                    console.error('Error deleting previous image:', error);
                    // Handle error appropriately (e.g., log it, but continue)
                }
            }
        }
        
        data.save().then(dat => {
            let response = ApiResponse("1", "Updated successfully", "", {});
            return res.json(response);
        })
        .catch((error) => {
            let response = ApiResponse("0", error.message, "", {});
            return res.json(response);
        });
    } else {
        let response = ApiResponse("0", "Not found", "", {});
        return res.json(response);
    }
}

async function getCities(req,res){
    
    const cities = await city.findAll({include:{model:country}});
    let response = ApiResponse("1","All Cities","",cities);
    return res.json(response);
}

async function addCity(req,res){
    const { name , lat, lng, countryId } = req.body;
    const check = await city.findOne({where:{name:name}});
    if(check){
        let response = ApiResponse("0","Already exists","",{});
        return res.json(response);
    }
    else{
        let dd = new city();
        dd.name = name;
        dd.lat = lat;
        dd.lng = lng;
        dd.countryId = countryId;
        dd.status = true;
        dd.save().then(dat =>{
            let response = ApiResponse("1","Added successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"",{});
        return res.json(response); 
        })
    }
}
async function editCity(req,res){
    const { name , lat, lng, countryId ,cityId } = req.body;
    
    const check = await city.findOne({where:{id:cityId}});
    if(check){
        
         check.name = name;
        check.lat = lat;
        check.lng = lng;
        check.countryId = countryId;
        check.status = true;
        check.save().then(dat =>{
            let response = ApiResponse("1","Added successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"",{});
        return res.json(response); 
        })
    }
    
    else{
         let response = ApiResponse("0","Not found","",{});
        return res.json(response);
    }
}

async function changeStatusofCity(req,res){
    const { status,cityId } = req.body;
    
    const check = await city.findOne({where:{id:cityId}});
    if(check){

        check.status = status;
        check.save().then(dat =>{
            let response = ApiResponse("1","Status updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"",{});
        return res.json(response); 
        })
    }
    
    else{
         let response = ApiResponse("0","Not found","",{});
        return res.json(response);
    }
}

function addSetting(req, res) {
    const { content, value } = req.body;

    setting.update({ value: value }, { where: { content: content } })
        .then(([affectedRows]) => {
            if (affectedRows > 0) {
                let response = ApiResponse('1', 'Updated successfully', '', {});
                return res.json(response);
            } else {
                let response = ApiResponse('0', 'No matching records found', 'Error', {});
                return res.json(response);
            }
        })
        .catch(error => {
            let response = ApiResponse('0', error.message, 'Error', {});
            return res.json(response);
        });
}
async function updateSetting(req, res) {
    const { id , value } = req.body;
    let check = await setting.findOne({where:{id:id}});
    if(check){
        check.value = value;
        await check.save();
        
        let response = ApiResponse("1","Updated successfully","",{});
        return res.json(response);
    }
    else{
        let response = ApiResponse("0","Not found","",{});
        return res.json(response);
    }
}
async function getSetting(req, res) {
    
    let data = await setting.findAll({
            where: {
                [Op.or]: [
                    { content: "Terms and Conditions" },
                    { content: "Privacy and Policy" }
                ]
            }
        });
    let response = ApiResponse("1","Settings","",data);
    return res.json(response)
}

async function customerReports(req,res){
    
    // Get the current date and the date 2 days ago
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2);
    
    const getMonthName = (date) => {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
        ];
        return months[date.getMonth()];
    }
   
    const ordersPerMonth = {
        "January": 0, "February": 0, "March": 0, "April": 0, "May": 0,
        "June": 0, "July": 0, "August": 0, "September": 0, "October": 0,
        "November": 0, "December": 0
    };



    let usertype = await userType.findOne({where:{name:"Customer"},attributes:['id']});
    let totalUsers = await user.count({where:{userTypeId : usertype.id}});
    
    let returningCustomers = await user.findAll({
      where: {
        userTypeId: usertype.id,
        createdAt: {
          [Op.lte]: twoDaysAgo
        }
      },
      attributes: ['id']
    });
    const returningCustomersIds = returningCustomers.map(item => item.id);
    let newUsers = await user.findAll({
      where: {
        userTypeId: usertype.id,
        createdAt: {
          [Op.between]: [twoDaysAgo, currentDate]
        }
      },
      attributes:['id']
    });
    const newUsersIds = newUsers.map(item => item.id);
    
    let returningOrders = await order.findAll({where:{userId:returningCustomersIds},attributes:['id','total','orderNum','createdAt']});
    let newOrders = await order.findAll({where:{userId:newUsersIds},attributes:['id','total','orderNum','createdAt']});
    
     // Loop through the orders and count them by month
    returningOrders.forEach(order => {
        const createdAt = new Date(order.createdAt);
        const monthName = getMonthName(createdAt);
        ordersPerMonth[monthName]++;
    });

    const returningCustomersOrders = Object.keys(ordersPerMonth).map(month => {
        return { [month]: ordersPerMonth[month] };
    });
    
    newOrders.forEach(order => {
        const createdAt = new Date(order.createdAt);
        const monthName = getMonthName(createdAt);
        ordersPerMonth[monthName]++;
    });
    
    const newCustomersOrders = Object.keys(ordersPerMonth).map(month => {
        return { [month]: ordersPerMonth[month] };
    });
    let data = {
        totalUsers,
        newUsers:newUsers.length,
        ordersByReturningCustomers :returningOrders.length,
        ordersByNewCustomers :newOrders.length,
        totalOrders : returningOrders?.length + newOrders?.length,
        returningCustomers : returningCustomers.length,
        returningCustomersOrders,
        newCustomersOrders
    }
    let response = ApiResponse("1","Customer Reports","",data);
    return res.json(response)
}

async function orderMetrics(req,res){
    
        let delivery = await deliveryType.findOne({where:{name:"Delivery"}});
        let pickup = await deliveryType.findOne({where:{name:"Self-Pickup"}});
        let schedule = await orderMode.findOne({where:{name:"Scheduled"}});
        let complete = await orderStatus.findOne({where:{name:"Delivered"}});
        let Placed = await orderStatus.findOne({where:{name:"Placed"}});
        let pickupStatus = await orderStatus.findOne({where:{name:"Food Pickedup"}});
        let Preparing = await orderStatus.findOne({where:{name:"Preparing"}});
        let Cancelled = await orderStatus.findOne({where:{name:"Cancelled"}});
        let rest = await orderApplication.findOne({where:{name:"restaurant"}});
        let store = await orderApplication.findOne({where:{name:"store"}});
        
    
        let totalOrders = await order.count({});
        let PlacedOrders = await order.count({where:{orderStatusId : Placed.id}});
        let pickOrders = await order.count({where:{orderStatusId : pickupStatus.id}});
        let PreparingOrders = await order.count({where:{orderStatusId : Preparing.id}});
        let deliveryOrders = await order.count({where:{deliveryTypeId : delivery.id}});
        let selfPickupOrders = await order.count({where:{deliveryTypeId : pickup.id}});
        let scheduleOrders = await order.count({where:{orderModeId : schedule.id}});
        let completeOrders = await order.count({where:{orderStatusId : complete.id}});
        let cancelOrders = await order.count({where:{orderStatusId : Cancelled.id}});
        
        let restTotalOrders = await order.findAll({attributes:['total'],include:[{model:restaurant,attributes:['id'],where:{businessType:rest.id}}]});
        let restCompleteOrders = await order.findAll({where:{orderStatusId:complete.id},include:[{model:restaurant,where:{businessType:rest.id}}]});
        let restCancelledOrders = await order.findAll({where:{orderStatusId:Cancelled.id},include:[{model:restaurant,where:{businessType:rest.id}}]});
        let restPendingOrders = await order.findAll({
          where: { orderStatusId: { [Op.notIn]: [Cancelled.id, complete.id] } },
          include: [{
            model: restaurant,
            where: { businessType: rest.id }
          }]
        });
        
        const sum = restTotalOrders.reduce((acc, obj) => acc + parseFloat(obj.total), 0);
        const restAverageOrder = sum / restTotalOrders.length;
        
        //STORE
        let storeTotalOrders = await order.findAll({attributes:['total'],include:[{model:restaurant,attributes:['id'],where:{businessType:store.id}}]});
        let storeCompleteOrders = await order.findAll({where:{orderStatusId:complete.id},include:[{model:restaurant,where:{businessType:store.id}}]});
        let storeCancelledOrders = await order.findAll({where:{orderStatusId:Cancelled.id},include:[{model:restaurant,where:{businessType:store.id}}]});
        let storePendingOrders = await order.findAll({
          where: { orderStatusId: { [Op.notIn]: [Cancelled.id, complete.id] } },
          include: [{
            model: restaurant,
            where: { businessType: store.id }
          }]
        });
        
        const storesum = storeTotalOrders.reduce((acc, obj) => acc + parseFloat(obj.total), 0);
        const storeAverageOrder = storesum / storeTotalOrders.length;
        
        
        let data = {
            totalOrders,
            deliveryOrders,
            pickOrders,
            scheduleOrders,
            completeOrders,
            cancelOrders,
            PlacedOrders,
            selfPickupOrders,
            cancelOrders,
            PreparingOrders,
            
            restTotalOrders : restTotalOrders ? restTotalOrders.length:0,
            restCompleteOrders : restCompleteOrders ? restCompleteOrders.length :0,
            restCancelledOrders :restCancelledOrders? restCancelledOrders.length : 0,
            restPendingOrders : restPendingOrders ? restPendingOrders.length : 0,
            restAverageOrder:restAverageOrder ? restAverageOrder : 0,
            
            storeTotalOrders : storeTotalOrders ? storeTotalOrders.length:0,
            storeCompleteOrders : storeCompleteOrders ? storeCompleteOrders.length :0,
            storeCancelledOrders :storeCancelledOrders? storeCancelledOrders.length : 0,
            storePendingOrders : storePendingOrders ? storePendingOrders.length : 0,
            storeAverageOrder:storeAverageOrder ? storeAverageOrder : 0,
        }
        let response = ApiResponse("1","Order metrixs","",data);
        return res.json(response)
}

async function salesReports(req,res){
        
        let delivery = await deliveryType.findOne({where:{name:"Delivery"}});
        let selfpickup = await deliveryType.findOne({where:{name:"Self-Pickup"}});
        let complete = await orderStatus.findOne({where:{name:"Delivered"}});
        let rest = await orderApplication.findOne({where:{name:"restaurant"}});
        let store = await orderApplication.findOne({where:{name:"store"}});
        
        let totalSales = await order.sum('total', {});
        let restaurantSales = await order.findAll({include:[{model:restaurant,where:{businessType:rest.id}},{model:orderCharge,attributes:['restaurantEarnings']}],attributes:['id']});
        const totalRestaurantSales = restaurantSales.reduce((total, order) => {
            const earnings = order.orderCharge ? parseFloat(order.orderCharge.restaurantEarnings) : 0;
            return total + earnings;
        }, 0);
        let storeSales = await order.findAll({include:[{model:restaurant,where:{businessType:store.id}},{model:orderCharge,attributes:['restaurantEarnings']}],attributes:['id']});
        const totalStoreSales = storeSales.reduce((total, order) => {
            const earnings = order.orderCharge ? parseFloat(order.orderCharge.restaurantEarnings) : 0;
            return total + earnings;
        }, 0);
        let deliveryOrdersTotal = await order.sum('total', {where: {deliveryTypeId: delivery.id,orderStatusId: complete.id}});
        let selfpickupOrdersTotal = await order.sum('total', {where: {deliveryTypeId: selfpickup.id,orderStatusId: complete.id}});
        
        
        let totalOrders = await order.findAll({});
        
        const getMonthName = (date) => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
            ];
            return months[date.getMonth()];
        }
        const ordersPerMonth = {
            "January": 0, "February": 0, "March": 0, "April": 0, "May": 0,
            "June": 0, "July": 0, "August": 0, "September": 0, "October": 0,
            "November": 0, "December": 0
        };
        // Loop through the orders and count them by month
        totalOrders.forEach(order => {
            const createdAt = new Date(order.createdAt);
            const monthName = getMonthName(createdAt);
            ordersPerMonth[monthName]++;
        });
    
        const graphData = Object.keys(ordersPerMonth).map(month => {
            return { [month]: ordersPerMonth[month] };
        });
        let totalEarning = parseFloat(deliveryOrdersTotal) + parseFloat(selfpickupOrdersTotal);
        let data = {
            totalSales:totalSales ? totalSales : 0,
            totalRestaurantSales:totalRestaurantSales ? totalRestaurantSales :0,
            totalStoreSales:totalStoreSales ? totalStoreSales :0,
            totalEarning : totalEarning ? totalEarning : 0,
            deliveryOrdersEarnings:deliveryOrdersTotal ? deliveryOrdersTotal : 0,
            selfpickupOrdersEarnings:selfpickupOrdersTotal ? selfpickupOrdersTotal : 0,
            totalOrdersCount:totalOrders ? totalOrders.length : 0,
            averageTotal:parseFloat(totalSales) / parseFloat(totalOrders.length),
            totalOrders:graphData,
        }
        let response = ApiResponse("1","Sales Reports","",data);
        return res.json(response);
}

async function updateDirector(req,res){
    let { id,firstName, lastName,bankName,accountHolderName,accountNo,IBAN,swiftCode,bankAddress,bankCountry,streetAddress,zip,city,country, } = req.body;
    let dir = await director.findOne({where:{id:id}});
    if(dir){
        dir.firstName = firstName;
        dir.lastName = lastName;
        dir.bankName = bankName;
        dir.accountHolderName = accountHolderName;
        dir.accountNo = accountNo;
        dir.IBAN = IBAN;
        dir.swiftCode = swiftCode;
        dir.bankAddress = bankAddress;
        dir.bankCountry = bankCountry;
        dir.streetAddress = streetAddress;
        dir.zip = zip;
        dir.city = city;
        dir.country = country;
        dir.save().then(dat =>{
            let response = ApiResponse("1","Updated successfully","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"Error",{});
            return res.json(response);
        })
        
    }
    else{
        let response = ApiResponse("0","Something went wrong","Error",{});
        return res.json(response);
    }
}


module.exports = {
  addUserType,
  addRole,
  login,
  logout,
  changePassword,
  addAddressType,
  getAddressType,
  deleteAddressType,
  editAddressType,
  addMenuCategory,
  allMenuCategories,
  activeMenuCategories,
  editMenuCategories,
  changeStatusMenuCategories,
  addCuisine,
  getAllCuisines,
  getActiveCuisines,
  editCuisine,
  changeCuisineStatus,
  addPaymentMethod,
  getAllPaymentMethods,
  getactivePaymentMethods,
  editPaymentMethod,
  changePaymentMethodStatus,
  addDeliveryType,
  activeDeliveryTypes,
  update_role_permissions,
  addDeliveryFeeType,
  activeDeliveryFeeType,
  addUnit,
  getAllUnits,
  getSpecificUnits,
  editUnit,
  changeUnitStatus,
  addRestaurant,
  getAllRestaurants,
  getResGeneral,
  editResGeneral,
  getResMetaData,
  editResMetaData,
  getResDeliverySettings,
  editResDeliverySettings,
  getResPaymentSettings,
  editResPaymentSettings,
  getResCharges,
  editResCharges,
  getResImages,
  editResImages,
  changeRestaurantStatus,
  getMenuSettings,
  updateMenuSettings,
  addAddonCategory,
  addAddon,
  allRestaurantsforProd,
  menuCategoriesOfRestaurant,
  getAllProducts,
  getProductbyId,
  getAddOnCats,
  getAddOns,
  assignAddOnProd,
  addProduct,
  changeProductStatus,
  updateProduct,
  updateProductAddOn,
  getAllUsers,
  getAllCustomers,
  getAllDrivers,
  getAllEmployees,
  addUser,
  getAllActiveRoles,
  getCustEmpDetails,
  getDriverDetails,
  updateUserDetails,
  banUser,
  approveUser,
  allActiveRoleswithType,
  updateRole,
  getAllRestOwners,
  getAllAddOnCats,
  updateAddOnCat,
  changeAddOnCatStatus,
  getAllAddOn,
  updateAddOn,
  changeAddOnStatus,
  changeStatusOfProdAddOnCat,
  addVehicleType,
  getAllVehicles,
  changeStatusVehicle,
  updateVehicle,
  getAllOrders,
  getOrderDetails,
  contactUsEmail,
  contactUsPhone,
  get_role_permissions,
  addVoucher,
  getAllVouchers,
  changeStatusOfVoucher,
  updateVoucher,
  voucherAssocaitedRest,
  pushNotifications,
  getAllPushNot,
  dashbaordStats,
  topItems,
  assign_permissions_to_role,
  earningAllRestaurants,
  payoutRequestsByRest,
  get_charges,
  update_charge,
  get_social_links,
  update_social_links,
  get_app_links,
  update_app_links,
  get_app_pages,
  update_app_pages,
  getAllActiveUnits,
  getAllRelatedRestaurants,
  getUnits,
  getWallet,
  getAllOrdersTaxi,
  getScheduledOrdersTaxi,
  getCompletedOrdersTaxi,
  updatecuisineSettings,
  all_order_applications,
  get_all_business_types,
  getAllStoreOwners,
  get_module_types,
  add_permission,
  get_permissions,
  addAddonCategoryStore,
  addaddonStore,
  allStoresforProd,
  addMenuCategoryStore,
  addCuisineStore,
  getAddOnCatsStore,
  allMenuCategoriesStore,
  getAllCuisinesStore,
  getAllAddOnStore,
  getAllProductsStore,
  testing_link,
  allRoles,
  roleDetails,
  changeStatusOfRole,
  changePermissionStatus,
  updatePermission,
  getRestaurantProducts,
  restaurant_culteries,
  updateRestaurantCultery,
  getRestaurantCuisines,
  updateRestaurantCuisine,
  getAllStores,
  getAllDefaultValues,
  updateDefaultValue,
  updateUnit,
  getAllZones,
  addZone,
  changeZoneStatus,
  updateZone,
  sendingNotification,
  getDataForAddingRestaurant,
  get_all_culteries,
  restAddOns,
  addOnCategoryRest,
  addOnCategoryStore,
  storeAddOns,
  getSpecificRestOrders,
  storeAllOrders,
  restAllOrders,
  restAllDeliveredOrders,
  storeAllDeliveredOrders,
  restAllCancelledOrders,
  storeAllCancelledOrders,
  storeAllScheduleOrders,
  restAllScheduleOrders,
  addCuisine,
  updateVehicleType,
  all_earnings,
  get_profile,
  update_profile,
  restaurant_earnings,
  store_earnings,
  driver_earnings,
  restaurantReports,
  storeReports,
  getCountries,
  addCountry,
  changeCountryStatus,
  editCountry,
  getCities,
  addCity,
  editCity,
  changeStatusofCity,
  addSetting,
  customerReports,
  orderMetrics,
  salesReports,
  updateDirector,
  getSetting,
  updateSetting
};
