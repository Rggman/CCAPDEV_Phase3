const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://Apdev:sXtXAFkdAhrHcu1C@cluster0.aw8hi7o.mongodb.net/GameRevs?retryWrites=true&w=majority&appName=Cluster0")

.then(() => {
    console.log("Connected to MongoDB");
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

module.exports = { User, Review, Game, Comment };
