var mongoose = require('mongoose');
const cors = require('cors');
mongoose.Promise = require('bluebird');
var uriMongo = 'mongodb+srv://web:123@web.xsewfke.mongodb.net/?retryWrites=true&w=majority&appName=web';
mongoose.connect(uriMongo, { useNewUrlParser: true, useUnifiedTopology: true });
const { Mutex } = require('async-mutex');
const mutex = new Mutex();
const session = require('express-session'); 
const bodyParser = require('body-parser');  
const multer = require('multer');          
const processFormBody = multer({ storage: multer.memoryStorage() }).single('pimage');
var MongoStore = require('connect-mongo')(session);
const fs = require("fs"); 
var express = require('express');
var app = express();
app.use(cors({ credentials: true, origin: true }));
var async = require('async'); 
const { is } = require('bluebird');
const { makePasswordEntry, doesPasswordMatch } = require('./utils/hash_password');

var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
const { format, join, extname} = require('path');
const favicon = require("serve-favicon");



app.use(session({
    secret: 'your_secret_key', // Thay thế 'your_secret_key' bằng một chuỗi bí mật thực sự
    resave: false,
    saveUninitialized: false
}));

// Khi có request, session sẽ được tạo và lưu trữ trong request object
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID); // Log session ID để kiểm tra
    next();
});


function hasSessionRecord(req, res, next) {
    if (req.session.sessionUserID) {
        console.log('User ID:', req.session.sessionUserID); // Log user ID nếu đã đăng nhập
        next(); // Tiếp tục tới middleware hoặc route tiếp theo
    } else {
        console.log("Session: the user is not logged in.");
        res.status(401).send('The user is not logged in.');
    }
}

// Sử dụng middleware kiểm tra session cho một route cụ thể
app.get('/profile', hasSessionRecord, (req, res) => {
    // Handler cho route '/profile' khi người dùng đã đăng nhập
    res.send('Welcome to your profile!');
});


app.set("trust proxy", 1);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // Đặt domain của frontend ở đây
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", true); // Đặt true để cho phép chia sẻ cookie
    next();
});

app.use(session({
    secret: 'pimage',
    saveUninitialized: false, 
    resave: false, 
    store: new MongoStore({
        url: uriMongo,
        autoRemove: 'interval',
        autoRemoveInterval: 10 
    }),
    cookie: {
        sameSite: 'none',
        httpOnly: true,
        secure: false
    },
}));

app.use(favicon(join(__dirname,'icon', 'favicon.ico')));
app.use(express.static(__dirname));
app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'D:\\bai_tap_lon_web\\Sharing-Motion\\src\\server\\images');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + extname(file.originalname));
    }
});


const upload = multer({
    storage: storage,
    limits: { fileSize: 100000000 } 
});

app.post('/admin/login', async (request, response) => {
    try {
        const user = await User.findOne({ email: request.body.email });
        if (!user) {
            return response.status(400).json({ message: `Account "${request.body.email}" does not exist, please try again` });
        }
        if (!doesPasswordMatch(user.password_digest, user.salt, request.body.passwordClearText)) {
            return response.status(400).json({ message: `Password is not correct, please try again` });
        }
        const userObj = JSON.parse(JSON.stringify(user));
        request.session.sessionUserID = userObj._id;
        request.session.sessionUserFirstName = userObj.first_name;
        request.session.sessionUserLastName = userObj.last_name;
        response.status(200).json({
            first_name: userObj.first_name,
            last_name: userObj.last_name,
            id: userObj._id
        });
    } catch (error) {
        console.error(`** Error occurred: ${error}. **`);
        return response.status(400).json({ message: "Other error occurred" });
    }
});

app.post('/validate-session', hasSessionRecord, async (request, response) => {
    try {
        if (!request.session.sessionUserFirstName || !request.session.sessionUserLastName || !request.session.sessionUserID) {
            return response.status(400).json({ message: "Account not logined" });
        }
        response.status(200).json({
            first_name: request.session.sessionUserFirstName,
            last_name: request.session.sessionUserLastName,
            id: request.session.sessionUserID
        });
    } catch (error) {
        return response.status(400).json({ message: "Other error occurred" });
    }
});

app.post('/admin/logout', (request, response) => {
    if (!request.session.sessionUserID) {
        response.status(400).json({ message: "User is not logged in" });
    } else {
        request.session.destroy(err => {
            if (err) {
                response.status(400).send();
            }
            else {
                response.status(200).send();
            }
        });
    }
});


app.post('/user', async (request, response) => {
    try {
        const newUser = request.body;

        if (!(newUser.first_name && newUser.last_name && newUser.passwordClearText)) {
            response.status(400).json({ message: "The first_name, last_name, and password must be non-empty strings" });
            return;
        }
        console.log('Email register', newUser.email);
        const existingUser = await User.findOne({ email: newUser.email });

        if (!existingUser) {
            const passwordEntry = makePasswordEntry(newUser.passwordClearText);
            newUser.password_digest = passwordEntry.hash;
            newUser.salt = passwordEntry.salt;
            delete newUser.passwordClearText; // discard the password for safety
            await User.create(newUser);
            response.status(200).json({ message: "User created successfully!" });
        } else {
            response.status(400).json({ message: "The email already exists, please choose a different email" });
        }
    } catch (error) {
        response.status(500).json({ message: "Other error occurred" });
    }
});
app.post('/photos/new', upload.single('pimage'), async (request, response, next) => {
    try {
        if (!request.file) {
            return response.status(400).json({ message: 'Error: No photo received in request' });
        }
        const timestamp = new Date().valueOf();
        const newPhoto = await Photo.create({
            file_name: request.file.filename,
            date_time: timestamp,
            user_id: request.session.sessionUserID,
            comments: [],
            likes: [],
        });

        await newPhoto.save();
        response.status(200).send({status: 'success'});  
    } catch (error) {
        console.log("Error processing photo:", error);
        response.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/commentsOfPhoto/:photo_id', hasSessionRecord, async (request, response) => {
    try {
        if (Object.keys(request.body).length === 0) {
            return response.status(400).json({ message: "Server: empty comment is not allowed" });
        }

        const commentText = request.body.comment;    
        const photoID = request.params.photo_id;     

        const photo = await Photo.findOne({ _id: photoID });

        if (!photo) {
            return response.status(400).json({ message: "Server: Photo you just commented is not found" });
        }

        const commentObj = {
            comment: commentText,
            date_time: new Date().toISOString(),
            user_id: request.session.sessionUserID 
        };
        if (!photo.comments) {
            photo.comments = [commentObj];
        } else {
            photo.comments.push(commentObj);
        }
        await photo.save();
        response.status(200).send(); 
    } catch (error) {
        response.status(400).json({ message: "Other error occurred" });
    }
});


app.get('/', hasSessionRecord, function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});


app.get('/test/:p1', hasSessionRecord, async (request, response) => {
    const param = request.params.p1 || 'info';
    if (param === 'info') {
        try {
            const info = await SchemaInfo.find({});
            if (info.length === 0) {
                response.status(500).send('Missing SchemaInfo');
            } else {
                response.json(info[0]);
            }
        } catch (err) {
            response.status(500).send(JSON.stringify(err));
        }
    } else if (param === 'counts') {
        try {
            const userCount = User.countDocuments({});
            const photoCount = Photo.countDocuments({});
            const schemaInfoCount = SchemaInfo.countDocuments({});

            // Wait for all count queries to complete
            const [userCountResult, photoCountResult, schemaInfoCountResult] = await Promise.all([userCount, photoCount, schemaInfoCount]);

            // Construct the count object
            const counts = {
                user: userCountResult,
                photo: photoCountResult,
                schemaInfo: schemaInfoCountResult
            };

            response.json(counts);
        } catch (err) {
            console.error('Doing /test/counts error:', err);
            response.status(500).send(JSON.stringify(err));
        }
    } else {
        response.status(400).send('Bad param ' + param);
    }
});


app.get('/user/list', hasSessionRecord, async (request, response) => {
    try {
        const users = await User.find({});

        console.log("** Server: found all users Success! **");

        const newUsers = users.map(user => {
            const { first_name, last_name, _id } = user;
            return { first_name, last_name, _id };
        });
        response.status(200).json(newUsers);
    } catch (err) {
        // Error handling
        console.error("** Get user list: Error! **", err);
        response.status(500).send(JSON.stringify(err));
    }
});

function formatDateTime(dateTimeString) {
    const dateTime = new Date(dateTimeString);

    const options = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const dateTimeFormat = new Intl.DateTimeFormat('en-US', options);
    return dateTimeFormat.format(dateTime);
}


app.get('/user/:id', hasSessionRecord, async (request, response) => {
    try {
        const userID = request.params.id;
        const user = await User.findOne({ _id: userID });

        if (!user) {
            // handle not found
            console.log(`** User ${userID}: Not Found! **`);
            response.status(404).json({ message: `User ${userID} not found` });
            return;
        }

        // handle found
        const userObj = JSON.parse(JSON.stringify(user)); // convert mongoose data to JS data
        delete userObj.__v;                               // remove unnecessary property
        userObj.logged_user_first_name = request.session.sessionUserFirstName; // save logged user first name for TopBar
        userObj.logged_user_last_name = request.session.sessionUserLastName;
        userObj.logged_user_id = request.session.sessionUserID;
        response.status(200).json(userObj); // response the data back to the frontend browser
    } catch (error) {
        console.log(`** From "/user/:id": User ${userID}: Error **`, error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/user2/:id', hasSessionRecord, async function (request, response) {
    const userID = request.params.id;
    try {
      const user = await User.findOne({ _id: userID });

      if (!user) {
        return response.status(404).json({ message: `User not found` });
      }

      const userObj = JSON.parse(JSON.stringify(user)); 
      delete userObj.__v; 
      userObj.logged_user_first_name = request.session.sessionUserFirstName; 
      userObj.logged_user_last_name = request.session.sessionUserLastName;
      userObj.logged_user_id = request.session.sessionUserID;

      
      const photosData = await Photo.find({ user_id: userID });

      if (photosData.length === 0) {
        return response.status(200).json(userObj);
      }
      const photos = JSON.parse(JSON.stringify(photosData));
      photos.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
      if (photos.length > 0) {
        userObj.mostRecentPhotoName = photos[0].file_name;
        userObj.mostRecentPhotoDate = formatDateTime(photos[0].date_time);
      }

      photos.sort((a, b) => b.comments.length - a.comments.length);
      if (photos.length > 0) {
        userObj.mostCommentedPhotoName = photos[0].file_name;
        userObj.commentsCount = photos[0].comments.length;
      }
	photos.sort((a, b) => b.likes.length - a.likes.length);
      if (photos.length > 0) {
        userObj.mostLikedPhotoName = photos[0].file_name;
        userObj.likesCount = photos[0].likes.length;
      }
      return response.status(200).json(userObj);
    } catch (error) {
      return response.status(500).json({ message: "Internal Server Error" });
    }
  });


async function processPhotoLike(photos, response) {
    let processedPhotos = 0;

    for (const photo of photos) {
        try {
            for (let index = 0; index < photo.likes.length; index++) {
                const liked_user_id = photo.likes[index];
                const user = await User.findOne({ _id: liked_user_id });
                const userObj = JSON.parse(JSON.stringify(user));
                const { phone_number, __v, password_digest, salt, email, ...rest } = userObj;
                photo.likes[index] = rest;
            }
        } catch (error) {
            response.status(400).json({ message: "Error occurred in finding likes under a photo" });
            return;
        }

        processedPhotos += 1;
        if (processedPhotos === photos.length) {
            // All photos comments and likes processed!
            response.status(200).json(photos); // Send the response only when all processing is done
        }
    }
}

function sortedPhotos(photos) {
    return photos.sort((a, b) => {
        if (b.likes.length !== a.likes.length) {
          return b.likes.length - a.likes.length;
        }
        return new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      });
}

app.get('/photosOfUser/:id', hasSessionRecord, async function (request, response) {
    try {
        const id = request.params.id;

        const photosData = await Photo.find({ user_id: id });

        if (!photosData || photosData.length === 0) {
            console.log(`Photos with user id ${id}: Not Found`);
            return response.status(400).json({ message: `Photos with user id ${id}: Not Found` });
        }

        let photos = JSON.parse(JSON.stringify(photosData));
        sortedPhotos(photos);

        for (let photo of photos) {
            delete photo.__v;
            photo.date_time = formatDateTime(photo.date_time);

            for (let comment of photo.comments) {
                const user = await User.findOne({ _id: comment.user_id });
                if (user) {
                    const userObj = JSON.parse(JSON.stringify(user)); 
                    const { phone_number, __v, ...rest } = userObj; 
                    comment.user = rest;      
                    delete comment.user_id;  
                }
            }
        }

        processPhotoLike(photos, response);
    } catch (error) {
        response.status(400).json({ message: "Error" });
    }
});

app.post('/like/:photo_id', async (request, response) => {
    try {
        if (Object.keys(request.body).length === 0) {
            return response.status(400).json({ message: "Empty comment" });
        }
        const photoID = request.params.photo_id; 
        const userID = request.body.action;      
        const photo = await Photo.findOne({ _id: photoID });
        if (!photo) {
            return response.status(400).json({ message: "Photo you just commented is not found" });
        }
        const release = await mutex.acquire();
        if (photo.likes.includes(userID)) { 
            const indexToRemove = photo.likes.indexOf(userID);
            if (indexToRemove !== -1) {
                photo.likes.splice(indexToRemove, 1);
            }
        } else {                           
            photo.likes.push(userID);
        }
        await photo.save();
        release();
        response.status(200).json({ message: "Like updated successfully!" }); 
    } catch (error) {
        response.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/deleteUser/:id', async (request, response) => {
    const userIdToRemove = request.params.id;

    try {
        const result = await User.findByIdAndDelete(userIdToRemove);
        console.log('Deleted the User: ', result);
        const userPhotos = await Photo.find({ user_id: userIdToRemove });
        const deletionPromises = userPhotos.map(async (photo) => {
            const deletedPhoto = await Photo.findByIdAndDelete(photo._id);
            console.log('Deleted Photo:', deletedPhoto);
        });
        await Promise.all(deletionPromises);

        let updatedPhoto;
        const allPhotos = await Photo.find();   
        const updatePromises = allPhotos.map(async (photo) => {
            if (photo.likes.includes(userIdToRemove)) {
                updatedPhoto = await Photo.finByIdAndUpdate(photo._id, {$pull: { likes: userIdToRemove }}, { new: true }); // To return the updated document
            }
            const commentsToDelete = photo.comments.filter(comment => comment.user_id.toString() === userIdToRemove); // see if any photo has comment by the deleted user
            const commentUpdatePromises = commentsToDelete.map(async (commentToDelete) => {
                updatedPhoto = await Photo.findByIdAndUpdate(photo._id, {$pull: { comments: commentToDelete }}, { new: true });
            });
            const combinedPromises = updatedPhoto ? [updatedPhoto, ...commentUpdatePromises] : commentUpdatePromises;
            return combinedPromises;
        });

        const flattenedPromises = updatePromises.flat(); // Flatten the array of arrays into a single array of promises
        await Promise.all(flattenedPromises);
        response.status(200).json({ message: "User deleted successfully!" });
    } catch(error) {
        console.error('Error destroying User:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }

});

app.post('/deleteComment/:id', async (request, response) => {
    const commentIdToDelete = request.params.id;
    const photoID = request.body.photo_id;

    try {
        const photo = await Photo.findById(photoID);
        if (!photo) {
            console.log("Photo not found");
            response.status(404).json({ message: 'Photo not found' });
        }
        console.log("Photo found: ", photo);
        const commentToDelete = photo.comments.filter(comment => comment._id.toString() === commentIdToDelete);
        if (commentToDelete.length !== 1) {
            console.log("Comment not found");
            response.status(404).json({ message: 'Comment not found' });
        }

        const updatedPhoto = await Photo.findByIdAndUpdate(photoID, {$pull: { comments: commentToDelete[0] }}, { new: true });
        if (updatedPhoto) {
            console.log("Updated photo: ", updatedPhoto);
            response.status(200).json({ message: "Comment deleted successfully!" });
        }
    } catch(error) {
        console.error('Error deleting comment:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/deletePhoto/:id', async (request, response) => {
    const photoIdToDelete = request.params.id; // photo id to remove

    try {
        const deleted_photo = await Photo.findByIdAndDelete(photoIdToDelete);
        if (!deleted_photo) {
            console.log("Photo not found");
            response.status(404).json({ message: 'Photo not found' });
        }
        response.status(200).json({ message: "Photo deleted successfully!" });
    } catch(error) {
        console.error('Error deleting comment:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});

var server = app.listen(3000, () => {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});