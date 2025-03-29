const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/GameRevs")
.then(() => {
    console.log("Connected to MongoDB");
    createAdminAccount();
    populateGames();
    populateUsers();
})
.catch((err) => {
    console.log("Error connecting to MongoDB", err);
});

const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    commentText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "/images/defaults/profile-picture.png" },
    profileBio: { type: String, default: "Hi nice to meet you!" },
    profileType: { type: String, enum: ["User", "Guest", "Admin"], default: "User" },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }] 
}, { timestamps: true });

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true,},
    genres: { type: [String], required: true }, 
    platforms: { type: [String], required: true },
    developers: { type: String, required: true},
    rating: { type: Number, min: 1, max: 5, default: 5 },
    coverImage: { type: String, default: "/images/defaults/default-banner.jpg" },
    backgroundImage: { type: String, default: "/images/defaults/default-background.jpg" },

    releasedAt: { type: Date},
    

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }] 
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameTitle: { type: String, required: true },
    reviewText: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment"}] 
}, { timestamps: true });



const User = mongoose.model("User", UserSchema);
const Review = mongoose.model("Review", ReviewSchema);
const Game = mongoose.model("Game", GameSchema);
const Comment = mongoose.model("Comment", CommentSchema);


async function createAdminAccount() {
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });

    if (!existingAdmin) {
        const admin = new User({
            email: "admin@gmail.com",
            username: "admin",
            password: "admin123",
            profilePicture: "/images/defaults/profile-picture.png",
            profileBio: "I am the original admin of GameRevs.",
            profileType: "Admin"
        });

        await admin.save();
        console.log("Admin account created successfully.");
    } else {
        console.log("Admin account already exists.");
    }
}

async function populateGames() {
    const games = [
        {
            title: "Marvel Rivals",
            description: "A fast-paced 6v6 hero shooter featuring iconic Marvel characters.",
            genres: ["Shooter", "RPG", "Action"],
            platforms: ["PC"],
            developers: "NetEase Games, Marvel Games",
            releasedAt: new Date("2024-05-01"),
            coverImage: "/images/banner/cover-marvelrivals.jpg",
            backgroundImage: "/images/background/bg-marvelrivals.jpg"
        },
        {
            title: "Genshin Impact",
            description: "An open-world action RPG with gacha mechanics and an expansive storyline.",
            genres: ["RPG", "Adventure", "Puzzle", "Action"],
            platforms: ["PC", "PS5"],
            developers: "HoYoverse",
            releasedAt: new Date("2020-09-28"),
            coverImage: "/images/banner/cover-genshin.jpg",
            backgroundImage: "/images/background/bg-genshin.jpg"
        },
        {
            title: "Roblox",
            description: "A user-generated online gaming platform with millions of unique games.",
            genres: ["Adventure"],
            platforms: ["PC", "PS5", "Xbox Series"],
            developers: "Roblox Corporation",
            releasedAt: new Date("2006-09-01"),
            coverImage: "/images/banner/cover-roblox.JPG",
            backgroundImage: "/images/background/bg-roblox.jpg"
        },
        {
            title: "Counter-Strike 2",
            description: "The next evolution of the iconic tactical shooter, featuring improved visuals and gameplay mechanics.",
            genres: ["Shooter", "Multiplayer", "Action"],
            platforms: ["PC"],
            developers: "Valve",
            releasedAt: new Date("2023-09-27"),
            coverImage: "/images/banner/cover-cs2.jpg",
            backgroundImage: "/images/background/bg-cs2.jpg"
        },
        {
            title: "Grand Theft Auto V",
            description: "An open-world crime action game featuring a compelling single-player story and online multiplayer.",
            genres: ["Action", "RPG", "Adventure"],
            platforms: ["PC", "PS5", "Xbox Series"],
            developers: "Rockstar",
            releasedAt: new Date("2013-09-17"),
            coverImage: "/images/banner/cover-gtav.png",
            backgroundImage: "/images/background/bg-gtav.jpg"
        }
    ];

    try {
        for (const game of games) {
            const exists = await Game.exists({ title: game.title });
            if (!exists) {
                await Game.create(game);
                console.log(`Inserted game: ${game.title}`);
            } else {
                console.log(`Skipped game(already exists): ${game.title}`);
            }
        }
    } catch (error) {
        console.error("Error creating game:", error);
    }

}

async function populateUsers() {
   const users = [
    { email: "owen@gmail.com", username: "owen", password: "123" },
    { email: "phillip@gmail.com", username: "phillip", password: "123" },
    { email: "seig@gmail.com", username: "seig", password: "123"  },
    { email: "uno@gmail.com", username: "uno", password: "123"  },
    { email: "quatro@gmail.com", username: "quatro", password: "123" }
   ]

   try {
        for (const user of users) {
            const exists = await User.exists({ email: user.email });
            if (!exists) {
                await User.create(user);
                console.log(`Inserted user: ${user.username}`);
            } else {
                console.log(`Skipped user(already exists): ${user.username}`);
            }
        }
    } catch (error) {
        console.error("Error creating users:", error);
    }
}

module.exports = { User, Review, Game, Comment };
