import User from '../models/User';
import bcrypt from 'bcryptjs';
//jwt authentication
import jwt from 'jsonwebtoken';
const jwt_Secret_Key = "Mykey";
const jwt_Refresh_Secret_Key = "MyRefreshKey";
//to get details of all users

export const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find();
    }
    catch (err) {
        return console.log(err);
    }
    if (!users) {
        return res.status(500).json({ message: "Unexpected error Occured" })
    }
    return res.status(200).json({ users });
};

//array for storing the refresh tokens
let REFRESHTOKEN = [];
//array is checked and filtered if non refresh token is present by using jwt.verify
// then new accesstoken and refreshtoken are made(1st accesstoken was made in login which expires in short time)
//for user not to login multiple times due to expiration of accesstoken so refresh token created so user logged in for once can have good experience
export const refreshToken = (req, res) => {
    // const cookies = req.headers.cookie;
    const refreshToken = req.body.token;
    if (!refreshToken) {
        return res.status(400).json({ message: "User not authenticated" });
    }
    if (REFRESHTOKEN.includes(!refreshToken)) {
        return res.status(403).json("Refresh token is not valid!");
    }
    jwt.verify(refreshToken, jwt_Refresh_Secret_Key, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ message: "Authentication failed" });
        }
        REFRESHTOKEN = REFRESHTOKEN.filter((token) => token !== refreshToken);
        const newAccressToken = jwt.sign({ id: user.id }, jwt_Secret_Key, { expiresIn: "1min" });
        const newRefreshToken = jwt.sign({ id: user.id }, jwt_Refresh_Secret_Key);
        REFRESHTOKEN.push(newRefreshToken);
        return res.status(200).json({ newAccressToken, newRefreshToken });
    });
}


// for registration of user

export const signUp = async (req, res, next) => {
    const { name, email, password } = req.body;
    /* if (!name && name.trim() === "" &&
         !email && email.trim() === "" &&
         !password && password.trim() === "") { return res.status(422).json({ message: "Invalid Inputs" }); }*/
    //if an user already exists
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    }
    catch (err) {
        return console.log(err);
    }
    if (existingUser) {
        return res.status(400).json({ message: "User Already Exists! Login Instead" });
    }

    //if an user doesn't exist then add its information

    // const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password);
    let user;
    try {
        user = new User({
            name, email, password: hashedPassword, blogs: [],
        });
        user = await user.save();
        /* const token = await jwt.sign(
             { id: user._id },
             jwt_Secret_Key,
             {
                 expiresIn: "35s",
             }
         );*/
    }
    catch (err) {
        return console.log(err);
    }
    if (!user) {
        return res.status(500).json({ message: "Unexpected error Occured" });
    }
    return res.status(202).json({ user })
}
//login of an user

export const login = async (req, res, next) => {
    const { email, password } = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    }
    catch (err) {
        return console.log(err);
    }
    if (!existingUser) {
        //return res.status(400).json({message:"User Already Exists! Login Instead"});
        return res.status(404).json({ message: "Couldn't find User with this Email" });
    }
    const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid Email/Incorrect password" });
    }
    //jwt token given by server

    const Accesstoken = jwt.sign({ id: existingUser.id }, jwt_Secret_Key);
    const Refreshtoken = jwt.sign({ id: existingUser.id }, jwt_Refresh_Secret_Key);
    REFRESHTOKEN.push(Refreshtoken);
    //console.log("Generated Token\n", token);
    return res.status(200).json({ message: "Login Successfull", user: existingUser, Accesstoken, Refreshtoken });


}
//verification of the token, so whether delete an user, logging out use verifyToken as a middleware

export const verifyToken = (req, res, next) => {
    //const cookies = req.headers.cookie;
    const headers = req.headers.authorization;
    //console.log(headers);
    const token = headers.split(" ")[1];
    //console.log(token);
    if (!token) {
        res.status(404).json({ message: "No token found" });
    }
    jwt.verify(token, jwt_Secret_Key, (err, user) => {
        if (err) {
            //console.log(err)
            return res.status(400).json({ message: "Invalid Token" });
        }
        console.log({ user });
        req.user = user;
    });
    next();
}
// for deleting a user

export const deleteId = async (req, res) => {
    const id = req.params.userId;
    console.log(req.user.id);
    // req.user.id we get it from verifyToken: req.user
    //req.params.id to get the id given as route parameter in link

    if (req.user.id === id) {
        //User.remove({ _id: req.params.id });
        await User.findByIdAndDelete(req.user.id);
        res.status(200).json("User has been deleted.");
    } else {
        res.status(403).json("You are not allowed to delete this user!");
    }
};

//logging out use only refreshtoken
export const logout = async (req, res) => {
    const refreshToken = req.body.token;
    REFRESHTOKEN = REFRESHTOKEN.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully.");
};

/*export const verifyToken = async (req, res, next) => {
//const cookies = req.headers.cookie;
const headers = req.headers['authorization'];
//console.log(headers);
const token = headers.split(" ")[1];
if (!token) {
res.status(404).json({ message: "No token found" });
}
jwt.verify(String(token), jwt_Secret_Key, (err, user) => {
if (err) {
    return res.status(400).json({ message: "Invalid TOken" });
}
console.log("id=" + " " + user.id);
req.id = user.id;
});
next();
}
 
export const getUser = async (req, res, next) => {
const userId = req.id;
let user;
try {
user = await User.findById(userId, "-password");
}
catch (err) {
return new Error(err);
}
if (!user) {
return res.status(404).json({ message: "User not found" });
}
return res.status(200).json({ user });
}
export const refreshToken = (req, res, next) => {
const cookies = req.headers.cookie;
const prevToken = cookies.split("=")[1];
if (!prevToken) {
return res.status(400).json({ message: "Couldn't find token" });
}
jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
if (err) {
    console.log(err);
    return res.status(403).json({ message: "Authentication failed" });
}
res.clearCookie(`${user.id}`);
req.cookies[`${user.id}`] = "";

const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "35s",
});
console.log("Regenerated Token\n", token);

res.cookie(String(user.id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 30), // 30 seconds
    httpOnly: true,
    sameSite: "lax",
});

req.id = user.id;
next();
});
}
export const logout = (req, res, next) => {
const cookies = req.headers.cookie;
const prevToken = cookies.split("=")[1];
if (!prevToken) {
return res.status(400).json({ message: "Couldn't find token" });
}
jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
if (err) {
    console.log(err);
    return res.status(403).json({ message: "Authentication failed" });
}
res.clearCookie(`${user.id}`);
req.cookies[`${user.id}`] = "";
return res.status(200).json({ message: "Successfully Logged Out" });
});
};*/
