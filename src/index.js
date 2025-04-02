const express = require('express');


const session = require("express-session");
const path = require("path");
const hbs = require("hbs");
const { User, Review, Game, Comment } = require("./mongodb");

const app = express();
const templatePath = path.join(__dirname, "../templates");
const multer = require("multer");

const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10;


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/"); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); 
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "hbs");
app.set("views", templatePath);



/* PASSWORD HASHING FUNCTIONS */
async function hashPassword(textPassword) {
    try {
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hash = await bcrypt.hash(textPassword, salt); 
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

async function verifyPassword(inputPassword, dbPassword) {
    try {
        const match = await bcrypt.compare(inputPassword, dbPassword);
        return match;
    } catch (error) {
        console.error('Error verifying password:', error);
    }
}



/* HELPERS */
hbs.registerHelper("and", function (a, b) {
    return a && b;
});

hbs.registerHelper("eq", function (a, b) {
    return a === b;
});

hbs.registerHelper("eq", function (a, b) {
    return a == b;
});

hbs.registerHelper("neq", function (a, b) {
    return a !== b;
});

hbs.registerHelper("neq", function (a, b) {
    return a != b;
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});


hbs.registerHelper("gt", function (a, b) {
    return a > b;
});

hbs.registerHelper('lt', function(a, b) {
    return a < b;
});


hbs.registerHelper('add', function(a, b) {
    return a + b;
});

hbs.registerHelper('subtract', function(a, b) {
    return a - b;
});


hbs.registerHelper("range", function (start, end) {
    let result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});

hbs.registerHelper("rangeArray", function (start, array) {
    let result = [];
    for (let i = start; i <= upperbound; i++) {
        result.push(array[i]);
    }
    return result;
});

hbs.registerHelper("verifyID", function (reviewId, currentlyLoggedIn) {
    console.log(reviewId);
    console.log(currentlyLoggedIn);

    if(reviewId == currentlyLoggedIn){
        return true;
    } else {
        return false;
    }
});

hbs.registerHelper("paginate", function (currentPage, totalPages, options) {
    let pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        pages.push({
            number: i,
            isActive: i === currentPage
        });
    }

    return options.fn(pages);
});

hbs.registerHelper('includes', function(array, value) {
    return array.includes(value);
});

hbs.registerHelper('formatDate', function (date) {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toISOString().substring(0, 10);
});

hbs.registerHelper('removePath', function(filename) {
    return filename.replace("/images/", "");
});

hbs.registerHelper("eqAString", function (a, b) {
    if (!a || !b) return false;
    return a.toString() === b.toString();
});

hbs.registerHelper("eqAString", function (a, b) {
    if (!a || !b) return false;
    return a.toString() == b.toString();
});





/* STARTUP OF APPLICATION */

app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true
}));

app.use(async (req, res, next) => {
    if (!req.session) {
        console.error("Session is undefined in middleware.");
        return next();
    }

    if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        req.session.user = user ? user.toObject() : null;
    }

    if (!req.session.user) {
        loginGuest(req);
    }
    
    res.locals.user = req.session.user;
    next();
});




/* PROPER EXPRESS STUFF */

//--------//
//  HOME  //
//--------//

app.get("/home", async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render("home", { user: req.session.user }

        );
    } catch (err) {
        res.status(500).send("Error loading home page");
    }
});

//---------//
//  LOGIN  //
//---------//


// LOGIN.HBS //
app.get('/', function(req, res){
    res.redirect("/home");
});

// LOGIN.HBS //
app.get("/login", (req, res) => {
    res.render("login", { user: req.session.user });
});

// REGISTER.HBS //
app.get("/register", (req, res) => {
    res.render("register", { user: req.session.user });
});

// LOGOUT.HBS //
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect("/home");
        }
        res.redirect("/login"); 
    });
});

// creation of user account
app.post("/register", async (req, res) => {
    try {
        
        // call the hashing function
        const dbPassword = await hashPassword(req.body.password);

        const newUser = await User.create({
            email: req.body.email,
            username: req.body.username,
            password: dbPassword
        });

        // delete the current guest account
        delete req.session.user;
        // create a new session, with the new user
        req.session.userId = newUser._id;
        
        res.redirect("/home");
    } catch (error) {
        if (error.code === 11000) { 
            return res.render("register", { errorMessage: "Email or username is already taken" });
        }
        res.status(500).send("Error registering user");
        console.log(error);
    }
});

// login of user
app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });

        // call the verifying function
        if (user && verifyPassword(req.body.password, user.password)) {
            // delete current guest account
            delete req.session.user;
            // create a new session, with the new user
            req.session.userId = user._id;
            res.redirect("/home"); 
        } else {
            res.render("login", {
                user: req.session.user,
                errorMessage: "Wrong username or password"
            });
        }
    } catch (err) {
        res.render("login", {
            user: req.session.user,
            errorMessage: "Server error. Please try again."
        });
    }
});



//---------//
//  GAMES  //
//---------//

// GAMESPAGE.HBS //
app.get("/gamespage", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 8; 
        const skip = (page - 1) * limit;

        
        const sortBy = req.query.sortBy || "title"; 
        const order = req.query.order === "desc" ? -1 : 1; 

        
        const games = await Game.find()
            .sort({ [sortBy]: order }) 
            .skip(skip)
            .limit(limit)
            .lean();

        const totalGames = await Game.countDocuments();
        const totalPages = Math.ceil(totalGames / limit);

        res.render("gamespage", {
            games,
            currentPage: page,
            totalPages,
            sortBy,
            order,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).send("Server Error");
    }
});

// REVIEW.HBS //
app.get("/review/:title", async (req, res) => {
    try {
        const gameTitle = req.params.title;

        
        const game = await Game.findOne({ title: gameTitle }).populate({
            path: "reviews",
            populate: [
                { path: "userId", select: "username profilePicture" },
                { path: "comments", populate: { path: "userId", select: "username profilePicture" } } 
            ]
        });

        if (!game) {
            return res.status(404).render("error", { errorMessage: "Game not found" });
        }

        
        res.render("review", {
            currentlyLoggedInUser: req.session.user.username,
            profilePicture: req.session.profilePicture || "/images/user.png",
            gameTitle: game.title,
            gameDescription: game.description,
            gameGenres: game.genres.length > 0 ? game.genres : ["Unknown"],
            gamePlatforms: game.platforms.length > 0 ? game.platforms : ["Unknown"],
            gameDevelopers: game.developers || "Unknown",
            gameRating: game.rating || "Not Rated",
            gameCoverImage: game.coverImage || "/images/cover/user.png",
            gameBackgroundImage: game.backgroundImage || "/images/background/user.png",
            gameReleaseDate: game.releasedAt ? game.releasedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown",
            reviews: game.reviews.map(review => ({
                gameTitle: game.title, 
                username: review.userId?.username || "Anonymous",
                profilePicture: review.userId?.profilePicture || "/images/user.png",
                reviewText: review.reviewText,
                rating: review.rating,
                likes: review.likes || 0,
                repliesCount: review.comments?.length || 0,
                replies: review.comments.map(comment => ({
                    username: comment.userId?.username || "Anonymous",
                    profilePicture: comment.userId?.profilePicture || "/images/user.png",
                    commentText: comment.commentText
                })).slice(0,1),
                date: review.createdAt.toDateString()
            })).slice(0,3), 
            successMessage: req.query.success ? "Review submitted successfully!" : null,
            errorMessage: req.query.error ? "You must be leave a rating!" : null,

            profilePicture: req.user ? req.user.profilePicture : "/images/defaults/profile-picture.png",
            loggedInUsername: req.user ? req.user.username : "Guest"
        });

        

    } catch (error) {
        console.error(error);
        res.status(500).render("error", { errorMessage: "Failed to load game reviews" });
    }
});

// REVIEW.HBS //
app.get("/reviews/load/:title", async (req, res) => {
    try {
        const gameTitle = req.params.title;
        const offset = parseInt(req.query.offset) || 0;
        const limit = 3; 
        const loggedInUsername = req.session.user.username;

        
        const game = await Game.findOne({ title: gameTitle }).populate({
            path: "reviews",
            populate: [
                { path: "userId", select: "username profilePicture" },
                { path: "comments", populate: { path: "userId", select: "username profilePicture" } } 
            ]
        });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        
        const reviews = game.reviews.slice(offset, offset + limit).map(review => ({
            gameTitle: game.title,
            username: review.userId?.username || "Anonymous",
            profilePicture: review.userId?.profilePicture || "/images/user.png",
            reviewText: review.reviewText,
            rating: review.rating,
            likes: review.likes || 0,
            repliesCount: review.comments?.length || 0,
            replies: review.comments.map(comment => ({
                username: comment.userId?.username || "Anonymous",
                profilePicture: comment.userId?.profilePicture || "/images/user.png",
                commentText: comment.commentText
            })),
            date: review.createdAt.toDateString(),
            selfComment: review.userId?.username === loggedInUsername
        }));

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load more reviews" });
    }
});

// REVIEW.HBS //
app.get("/comments/load/:reviewIndex/:title", async (req, res) => {
    try{

        const gameTitle = req.params.title;
        const offset = parseInt(req.query.offset) || 0;
        const limit = 3; 
        const loggedInUsername = req.session.user.username;
        const reviewIndex = parseInt(req.params.reviewIndex);

        const game = await Game.findOne({ title: gameTitle }).populate({
            path: "reviews",
            populate: [
                { path: "userId", select: "username profilePicture" },
                { path: "comments", populate: { path: "userId", select: "username profilePicture" } } 
            ]
        });

        console.log(game);

        const replies = game.reviews[reviewIndex].comments.slice(offset, offset + limit).map(comment => ({
            username: comment.userId?.username || "Anonymous",
            profilePicture: comment.userId?.profilePicture || "/images/user.png",
            commentText: comment.commentText
        }));

        res.json(replies);
    } catch(error) {
        console.error(error);
    }
});

// REVIEW.HBS //
app.get("/reviews", async (req, res) => {
    try {
        const reviews = await Review.find().lean(); 
        res.render("reviews", { reviews }); 
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Server Error");
    }
});


// REVIEW.HBS //
app.get("/reviews/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const reviews = await Review.find({ userId }).populate("userId", "username profilePicture");
        
        if (!reviews.length) {
            return res.status(404).json({ message: "No reviews found for this user" });
        }

        res.json(reviews);
    } catch (err) {
        console.error("error: ", err);
        res.status(500).json({ message: "Server error" });
    }
});

// adding reviews
app.post("/add-review/:title", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect(`/review/${req.params.title}?error=true`);
        }

        
        const game = await Game.findOne({ title: req.params.title });
        if (!game) {
            return res.redirect(`/review/${req.params.title}?error=Game not found.`);
        }

        if(!req.body.reviewText) {
            return res.redirect(`/review/${req.params.title}?error=Please add a comment!`);
        }

        if(!req.body.rating) {
            return res.redirect(`/review/${req.params.title}?error=Please add a rating!`);
        }

        
        const review = await Review.create({
            userId: req.session.userId,
            gameTitle: req.params.title,
            reviewText: req.body.reviewText,
            rating: req.body.rating
        });

        
        await Game.findByIdAndUpdate(game._id, {
            $push: { reviews: review._id }
        });

        
        await User.findByIdAndUpdate(req.session.userId, { 
            $push: { reviews: review._id } 
        });

        
        const reviews = await Review.find({ gameTitle: req.params.title });
        let averageRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
        

        averageRating = Math.round(averageRating);

        await Game.findByIdAndUpdate(game._id, { rating: averageRating });

        res.redirect(`/review/${req.params.title}?success=Review submitted successfully!`);
    } catch (error) {
        console.error(error);
        res.redirect(`/review/${req.params.title}?error=Failed to submit review. Please try again.`);
    }
});

// deletion of reviews
app.post("/delete-review/:title/:reviewId", async (req, res) => {
    try{
        const game = await Game.findOne({ title: req.params.title });
        const reviewFromGame = game.reviews[req.params.reviewId];

        console.log(reviewFromGame.toString())

        const review = await Review.findOne({_id: reviewFromGame.toString()});

        for(let i = 0; i < review.comments.length; i++){
            await Comment.findByIdAndDelete(review.comments[i]._id);
        }

        await Review.findByIdAndDelete(review._id);
        await Game.findByIdAndUpdate(game._id, {
            $pull: {reviews: review._id}
        })

    } catch(error) {
        console.error(error);
    } 
});

// adding likes
app.post("/add-like/:title/:reviewId", async (req, res) => {
    try{
        const game = await Game.findOne({ title: req.params.title });
        const reviewFromGame = game.reviews[req.params.reviewId];

        const review = await Review.findOne({_id: reviewFromGame.toString()});

        const alreadyLiked = await Review.findOne({_id: reviewFromGame.toString(), likes: req.session.userId});

        console.log(review._id.toString());
        console.log(alreadyLiked);
        console.log(review);
        
        
        if(alreadyLiked != null){
            await Review.findByIdAndUpdate(review._id, {
                $pull: { likes: req.session.userId }
            });
        } else {
            await Review.findByIdAndUpdate(review._id, {
                $push: { likes: req.session.userId }
            });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error(error);
    }
});

// addition of comments in the reviews
app.post("/add-comment/:title/:reviewId/:text", async (req, res) => {
    try{
        const game = await Game.findOne({ title: req.params.title });
        const reviewFromGame = game.reviews[req.params.reviewId];

        const review = await Review.findOne({_id: reviewFromGame.toString()});

        
        const comment = await Comment.create({
            userId: req.session.userId,
            commentText: req.params.text
        })

        
        await Review.findByIdAndUpdate(review._id, {
            $push: {comments: comment._id}
        });


        res.redirect(`/review/${req.params.title}`);
    } catch(error){
        console.error(error);
    }
});

// editing of review
app.post("/edit-review/:title/:reviewId/:text", async (req, res) => {

    try{
        const game = await Game.findOne({ title: req.params.title });
        const reviewFromGame = game.reviews[req.params.reviewId];

        const review = await Review.findOne({_id: reviewFromGame.toString()});

        console.log(reviewFromGame.toString());
        console.log(review);

        await Review.findByIdAndUpdate(review._id, {
            reviewText: req.params.text
        });
        
        res.redirect(`/review/${req.params.title}`);
    } catch (error) {
        console.error(error);
    }
    
});





//------------//
//  PROFILES  //
//------------//

// PROFILE.HBS //

// opens only when guests check their own profiles
app.get("/profile", async (req, res) => {
    res.redirect("/login");
});

// PROFILE.HBS //
app.get("/profile/:username", async (req, res) => {
    try {
        const username = req.params.username; // user to check
        const sessionUser = req.session.user; // The logged-in user from session

        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).render("error", { message: "User not found" });
        }

        // Fetch user reviews
        const sortBy = req.query.sortBy || 'createdAt'; // Default sorting by createdAt (time)
        const order = req.query.order === 'desc' ? -1 : 1; // Default ascending order

        const reviews = await Review.find({ userId: user._id })
            .populate("userId", "username profilePicture")
            .sort({ [sortBy]: order }); // Sort reviews based on time

        // Extract game titles from reviews
        const gameTitles = reviews.map(review => review.gameTitle);

        // Fetch game details based on titles
        const games = await Game.find({ title: { $in: gameTitles } });

        res.render("profile", { 
            sessionUser: sessionUser,
            profileUser: user,
            reviews,
            games,
            sortBy, // Pass the sorting method
            order
        });

    } catch (err) {
        console.error("error:", err);
        res.status(500).render("error", { message: "Server error" });
    }
});


// updating user bio
app.post("/updatebio", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        const userId = req.session.userId;
        const newBio = req.body.newBio?.trim();

        if (!newBio) {
            return res.status(400).send("Bio cannot be empty.");
        }

        // Update the user's bio
        const updatedUser = await User.findByIdAndUpdate(userId, { profileBio: newBio }, { new: true });

        if (!updatedUser) {
            return res.status(404).send("User not found.");
        }

        // Redirect to /profile/username
        res.redirect(`/profile/${updatedUser.username}`);
    } catch (error) {
        console.error("Error updating bio:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.post("/editComment", async (req, res) => {

});

// updating profile picture
app.post("/update-profile-picture", upload.single("profilePicture"), async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized");
        }

        const newProfilePicture = req.file ? "/images/" + req.file.filename : req.user.profilePicture;

        await User.findByIdAndUpdate(req.session.userId, { profilePicture: newProfilePicture });

        res.redirect("/profile"); 
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).send("Internal Server Error");
    }
});





//---------//
//  ADMIN  //
//---------//

// ADMINHOME //
app.get("/adminhome", async (req, res) => {
    if (!req.session.user || req.session.user.profileType !== "Admin") {
        return res.status(403).send("Access Denied");
    }
    res.render("adminhome", { 
        user: req.session.user
     });
});

// ADMINGAME //
app.get("/admingame", async (req, res) => {
    if (!req.session.user || req.session.user.profileType !== "Admin") {
        return res.status(403).send("Access Denied");
    }
    try {
        const games = await Game.find().lean();
        res.render('admingame', { 
            games,
            successMessage: req.query.success || null,
            errorMessage: req.query.error || null,
            user: req.session.user
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ADMINUSER //
app.get("/adminuser", async (req, res) => {
    if (!req.session.user || req.session.user.profileType !== "Admin") {
        return res.status(403).send("Access Denied");
    }
    try {
        const users = await User.find().lean();
        res.render('adminuser', { 
            users,
            successMessage: req.query.success || null,
            errorMessage: req.query.error || null,
            user: req.session.user 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ADDGAMES.HBS //
app.get("/addgames", (req, res) => {
    res.render("addgames", { 
        user: req.session.user,
        defaultBanner: "/images/defaults/default-banner.jpg",
        defaultBackground: "/images/defaults/default-background.jpg",
    });
});

// MANAGEGAMES //
app.get("/managegames/:title", async (req, res) => {
    if (!req.session.user || req.session.user.profileType !== "Admin") {
        return res.status(403).send("Access Denied");
    }
    try {
        const gameTitle = req.params.title;
        const game = await Game.findOne({ title: gameTitle });
        res.render('managegames', { 
            game,
            user: req.session.user
        }); 
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// MANAGEUSERS //
app.get("/manageusers/:userId", async (req, res) => {
    if (!req.session.user || req.session.user.profileType !== "Admin") {
        return res.status(403).send("Access Denied");
    }
    try {
        const userID = req.params.userId;
        const userManage = await User.findById(userID);
        res.render('manageusers', { 
            userManage,
            user: req.session.user
        }); 
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// creation of game
app.post("/add-game", upload.fields([{ name: "coverImage" }, { name: "backgroundImage" }]), async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/addgames?error=Unauthorized");
        }

        // get the inputs
        const { title, description, releasedAt, developers } = req.body;

        
        const platforms = req.body.platforms
            ? (Array.isArray(req.body.platforms) ? req.body.platforms : [req.body.platforms])
            : [];

        const genres = req.body.genres
            ? (Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres])
            : [];

        console.log("Extracted Platforms:", platforms);
        console.log("Extracted Genres:", genres);

        const coverImage = req.files["coverImage"]
            ? "/images/" + req.files["coverImage"][0].filename
            : "/images/defaults/default-banner.jpg";

        const backgroundImage = req.files["backgroundImage"]
            ? "/images/" + req.files["backgroundImage"][0].filename
            : "/images/defaults/default-background.jpg";

        // create a game with the inputs
        const newGame = await Game.create({
            title,
            description,
            releasedAt,
            platforms,
            genres,
            developers,
            coverImage,
            backgroundImage
        });

        // store the new game in the database
        await newGame.save();

        
        res.redirect("/admingame?success=Game Added Successfully!");

    } catch (error) {
        console.error("Error adding game:", error);
        res.redirect("/admingame?error=Internal Server Error");
    }
});

// editing of game
app.post("/edit-game/:title", upload.fields([{ name: "coverImage" }, { name: "backgroundImage" }]), async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect(`/edit-game/${req.params.id}?error=Unauthorized`);
        }

        // get the inputs
        const gameTitle = req.params.title;
        const { title, description, releasedAt, developers } = req.body;

        
        const platforms = req.body.platforms
            ? (Array.isArray(req.body.platforms) ? req.body.platforms : [req.body.platforms])
            : [];

        const genres = req.body.genres
            ? (Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres])
            : [];

        console.log("Extracted Platforms:", platforms);
        console.log("Extracted Genres:", genres);

        // find the game
        const existingGame = await Game.findOne({ title: gameTitle });

        if (!existingGame) {
            return res.redirect(`/edit-game/${gameTitle}?error=Game not found`);
        }

        
        const coverImage = req.files["coverImage"]
            ? "/images/" + req.files["coverImage"][0].filename
            : existingGame.coverImage;

        
        const backgroundImage = req.files["backgroundImage"]
            ? "/images/" + req.files["backgroundImage"][0].filename
            : existingGame.backgroundImage;

        // set the game's new values
        existingGame.title = title;
        existingGame.description = description;
        existingGame.releasedAt = releasedAt;
        existingGame.platforms = platforms;
        existingGame.genres = genres;
        existingGame.developers = developers;
        existingGame.coverImage = coverImage;
        existingGame.backgroundImage = backgroundImage;

       // save the updated game
        await existingGame.save();

        // redirect with success message
        res.redirect(`/admingame?success=Game Updated Successfully!`);

    } catch (error) {
        console.error("Error updating game:", error);
        res.redirect(`/admingame?error=Internal Server Error`);
    }
});

// deletion of game
app.delete('/delete-game/:title', async (req, res) => {
    const gameTitle = req.params.title;

    try {
        
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // delete reviews of the game
        await Review.deleteMany({ gameTitle: gameTitle });

        // delete the game
        await Game.deleteOne({ title: gameTitle });
        
        res.status(200).json({ success: 'Game Deleted Successfully!' });
    } catch (error) {
        console.error("Error deleting game:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// deletion of user
app.delete('/delete-user/:userId', async (req, res) => {
    const userID = req.params.userId;

    try {
        
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // delete the reviews of the user
        await Review.deleteMany({ userId: userID });

        // delete the reviews of the user
        await Review.updateMany(
            { "comments.userId": userID },
            { $pull: { comments: { userId: userID } } }
        );

        // delete the user
        await User.deleteOne({ _id: userID });

        
        res.status(200).json({ success: 'User Deleted Successfully!' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// promotion of user
app.put('/promote-user/:userId', async (req, res) => {
    try {
        const userID = req.params.userId;
        await User.findByIdAndUpdate(userID, { profileType: 'Admin' });

        res.status(200).send('User promoted successfully');
    } catch (error) {
        res.status(500).send('Failed to promote user.');
    }
});


// SEARCH FUNCTION //
app.get("/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const users = await User.find({
            username: { $regex: query, $options: "i" }
        })
        .select("username profilePicture _id")
        .limit(3); 
        

        res.json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// FUNCTION FOR GUEST ACCOUNT //
function loginGuest(req) {
    req.session.user = {
        email: "guest@guest.com",
        username: "guest",
        profilePicture: "/images/defaults/profile-picture.png",
        profileBio: "Hello! Nice to meet you!",
        profileType: "Guest"
    };
}

// START OF APPLICATION //
app.listen(3000, () => {
    console.log("Server is running on port 3000. Access using localhost:3000.");
});

