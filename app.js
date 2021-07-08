const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middlewares/auth-middleware");
const Joi = require("joi");
const ejs = require("ejs");
const path = require("path");
const { response, json } = require("express");
const { fail } = require("assert");
const post = require("./models/post");
const comment = require("./models/comment");

mongoose.connect("mongodb://localhost:27017/admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: "test",
  pass: "test",
});
mongoose.set('useFindAndModify', false);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();


//로그인
router.post("/auth", async(req,res) => {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId, password }).exec();

    if (!user){
        res.status(400).send({
            errorMessage: '사용자 정보가 일치하지 않습니다'
        });
        return;
    }

    const token = jwt.sign({ userId: user.userId }, "secretKey");
    res.send({
        token,
    });

});

//댓글 본인확인
router.get("/_auth/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;

    _result = await Comment.findById(id)

    const userId = res.locals.user.userId

    if ( _result.userId !== userId) {
        res.status(400).send({
            errorMessage: '사용자가 일치하지 않습니다'
        });
    }else{
        res.status(200).send (_result);

    }

});

//게시글 본인확인
router.get("/auth/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;

    result = await Post.findById(id)

    const{ user:  { userId } }  = res.locals;

    if ( result.userId !== userId) {
        res.status(400).send({
            errorMessage: '사용자가 일치하지 않습니다'
        });
    }else{
        res.status(200).send ({});

    }

});

//token확인
router.get("/users/me", authMiddleware, async (req, res) => {
    res.send({ user: res.locals.user });
});

//댓글등록
router.post("/comment/:id", authMiddleware, async(req,res) => {
    const { comment } = req.body;
    const { id } = req.params;
    const{ user : { userId } }  = res.locals;

    const comments = new Comment({ comment, userId, postId: id });
    await comments.save();
    res.status(201).send({});
});

//댓글가져오기
router.get("/comments/:id", async(req, res) => {
    const { id } = req.params;

    const result = await Comment.find({postId: id}).sort('createdAt');
    
    res.json({result});
})

//댓글 삭제하기
router.delete('/_delete/:id', async(req,res) => {

    const { id } = req.params

    await Comment.findByIdAndDelete(id)

    res.send({ response : response });

});

//댓글 수정하기
router.put('/_edit/:id', async(req,res) => {

    const id = req.params.id;

    const comment = req.body.comment

    await Comment.findByIdAndUpdate( id, { comment : comment } )

    res.status(200).send({ response : response });

});

//게시글등록
router.post("/posting", authMiddleware, async(req, res) => {
    const { title, contents } = req.body;
    const userId = res.locals.user.userId

    const post = new Post({ title, contents, userId });
    await post.save();
    res.status(200).send({});
});

//게시글가져오기
router.get("/posts", async(req, res) => {
    const result = await Post.find().sort('-createdAt');
    res.json({result});
});

//게시글 수정
router.put('/edit/:id', async(req,res) => {

    const { title, _id, content } = req.body;

    await Post.findByIdAndUpdate(_id, { contents : content, title : title} )

    res.send({ response : response });

});

//게시글 삭제
router.delete('/delete/:id', async(req,res) => {

    const { id } = req.params

    await Post.findByIdAndDelete(id)

    await Comment.findOneAndDelete({ postId : id })

    res.send({ response : response });

});

//Detail Page 게시물 정보 가지고오기
router.get('/detail/:id', async(req, res) => {
    
    try {
        const { id }  = req.params;

        const result = await Post.findById(id)
    
        res.send(result)

    } catch (error) {
        console.error(error);
        next(error);
    }
    
   
})


//회원가입
router.post("/users", async(req, res) => {
    const { userId, password, confirmPassword } = req.body;

    const schema = Joi.object({
        userId: Joi.string()
        .min(3)
        .pattern(new RegExp("^[a-zA-Z0-9]"))
        .required(),
        password: Joi.string()
        .min(4)
        .pattern(new RegExp())
        .required(),
    });


    const { error, value } = schema.validate({ userId: userId, password: password });

    if (error){ 
        res.status(400).send({
            errorMessage: '형식을 확인해 주세요.'
        })

        return;
    }

    if(password === userId){
        res.status(400).send({
            errorMessage: "닉네임과 패스워드가 같습니다."
        })
        return;
    }


    if(password !== confirmPassword){
        res.status(400).send({
            errorMessage: "패스워드가 일치하지 않습니다.",
        })
        return;
    }

    const existUsers = await User.find({
        $or : [ { userId }],
    });
    if(existUsers.length) {
        res.status(400).send({
            errorMessage: "이미 가입된 닉네임 입니다." 
        });
        return;
    }

    const user = new User({ userId, password });
    await user.save();

    res.status(201).send({});

});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/test', (req, res) => {
    let name = req.query.name;
    res.render('test', { name });
})

app.get('/', (req, res) => {
    let name = req.query.name;
    res.render('main', { name });
})

app.get('/detail', (req, res) => {
    let name = req.query.name;
    res.render('detail', { name });
})

app.get('/edit', (req, res) => {
    let name = req.query.name;
    res.render('edit', { name });
})

app.get('/write', (req, res) => {
    let name = req.query.name;
    res.render('write', { name });
})

app.get('/register', (req, res) => {
    let name = req.query.name;
    res.render('register', { name });
})

app.get('/login', (req, res) => {
    let name = req.query.name;
    res.render('login', { name });
})

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.json());
app.use(express.static("assets"));



app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});