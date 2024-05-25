var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb+srv://web:123@web.xsewfke.mongodb.net/?retryWrites=true&w=majority&appName=web', { useNewUrlParser: true, useUnifiedTopology: true });
var cs142models = require('./modelData/photoApp.js').cs142models;
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var versionNumber = 2.01;

var removePromises = [User.deleteMany({}), Photo.deleteMany({}), SchemaInfo.deleteMany({})];
Promise.all(removePromises).then(function () {
    var userModels = cs142models.userListModel();
    var mapFakeId2RealId = {}; // Map from fake id to real Mongo _id
    var userPromises = userModels.map(function (user) {
        return User.create({
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            email: user.last_name.toLowerCase() + "@gmail.com",
            password_digest: '3c53e115625c62868a32faaee3e0021b27850541',
            salt: "12345678",
        }).then(function (userObj) { // * object created by User.create(), gernerating an unique MongoDB assigned ID: "_id"
            userObj.save();
            mapFakeId2RealId[user._id] = userObj._id; // ! mapFakeId2RealId [fake]: real, we will only use the fake ID.
            user.objectID = userObj._id;    // keep the MongoDB assigned id in "user.objectID" (Object Type), and use the pretty id as "user._id" instead.
            console.log('Adding user:');
            console.log(user);
            console.log('Adding userObj:');
            console.log(userObj);

        }).catch(function (err){
            console.error('Error create user', err);
        });
    });


    var allPromises = Promise.all(userPromises).then(function () {
        var photoModels = [];
        var userIDs = Object.keys(mapFakeId2RealId); // Extracting all the fake IDs as a list: ["fakeId1", "fakeId2", "fakeId3"]
        for (var i = 0; i < userIDs.length; i++) {
            photoModels = photoModels.concat(cs142models.photoOfUserModel(userIDs[i]));
        }
        var photoPromises = photoModels.map(function (photo) {
            const likesObj = photo.likes.map(fakeID => mapFakeId2RealId[fakeID]);
            return Photo.create({
                file_name: photo.file_name,
                date_time: photo.date_time,
                user_id: mapFakeId2RealId[photo.user_id], // the MongoDB assigned id in the User object
                likes: likesObj, // likes now contain the MongoDB assigned id in the User Object (Author: Jian Zhong)
            }).then(function (photoObj) {
                photo.objectID = photoObj._id;           // the MongoDB assigned id in the Photo object
                if (photo.comments) {
                    photo.comments.forEach(function (comment) {
                        photoObj.comments = photoObj.comments.concat([{
                            comment: comment.comment,
                            date_time: comment.date_time,
                            user_id: comment.user.objectID // the MongoDB assigned id in the User object
                        }]);
                    });
                }
                // console.log("Adding photo:");
                // console.log(photoObj);
                photoObj.save();
            }).catch(function (err){
                console.error('Error create user', err);
            });
        });
        return Promise.all(photoPromises).then(function () {
            // Create the SchemaInfo object
            return SchemaInfo.create({
                version: versionNumber,
            }).then(function (schemaInfo) {
                console.log('SchemaInfo Object: ', schemaInfo, ' created with version ', versionNumber);
            }).catch(function (err){
                console.error('Error create schemaInfo', err);
            });
        });
    });

    allPromises.then(function () {
        mongoose.disconnect();
    });

}).catch(function(err){
    console.error('Error create schemaInfo', err);
});
