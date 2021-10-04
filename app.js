const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User =require("./models/user");
// const Goods =require("./models/goods");
// const Cart =require("./models/cart");
const authMiddleware =require("./middlewares/auth-middleware");

mongoose.connect("mongodb://localhost/shopping-demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connectiong error:"));

const app = express();
const router = express.Router();

router.post("/users", async(req, res) => {
    const { email, nickname, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        res.status(400).send({
            errorMessage: '패스워드가 패스워드 확인란과 동일하지 않습니다.'
        });
        return;
    }

    const exisUsers = await User.find({
        $or: [{ email }, { nickname }],
    });
    if (exisUsers.length) {
        res.status(400).send({
            errorMessage: '이미 가입된 이메일 또는 닉네임이 있습니다.',
        })
        return;
    }

    const user = new User({ email, nickname, password });
    await user.save();

    res.status(201).send({});
});

router.post("/auth", async(req, res) => {
    const { email, password} = req.body;

    const user =await User.findOne({ email, password }).exec();

    if (!user) {
        res.status(401).send({
            errorMessage: "이메일 또는 패스워드가 잘못됐습니다.",            
        });
        return;
    }

    const token = jwt.sign({ userId: user.userId }, "my-secret-key");
    res.send({
        token,
    })
});

//사용자 정보 middleware
router.get("/users/me", authMiddleware,async (req, res) => {
    const { user }= res.locals;
    console.log(user);
    res.send({
        user: {
            email: user.email,
            nickname: user.nickname,
        }
    });
});





app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
    console.log("서버가 요청을 받을 준비가 됐어요")
});
