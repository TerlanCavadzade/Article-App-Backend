let express = require("express");
let app = express();
let path = require("path");
let fs = require("fs");
let methodOverride = require("method-override");
let upload = require("express-fileupload");
const bcrypt = require("bcrypt");

let users = require("./model/users");
let files = require("./model/files");
let messages = require("./model/messages");
let reviews = require("./model/reviews");

const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost:27017/hpc", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO ERROR!!!!");
    console.log(err);
  });
mongoose.set("useFindAndModify", false);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(methodOverride("_method"));
app.use(upload());

let nodemailer = require("nodemailer");

let mail = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: "articlesend1920@gmail.com",
    pass: "iqtadczyonqrxszc",
  },
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.listen(3000, () => {
  console.log("listening on 3000");
});

//Register new user
app.post("/register", async (req, res) => {
  try {
    const { gmail, password } = req.body;
    const confirmNum = Math.floor(Math.random() * 10000) + 1000;
    const oldProfile = await users.findOne({
      gmail,
    });

    if (oldProfile) {
      return res.status(400).json({
        error: "this email has alredy exsists",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Invalid password",
      });
    }

    if (!gmail) {
      return res.status(400).json({
        error: "Invalid Email",
      });
    }

    if (gmail && password) {
      var mailOptions = {
        from: "articlesend1920@gmail.com",
        to: gmail,
        subject: "Confirm Number",
        text: `Welcome To AZHPC Your Confirm Number Is ${confirmNum}`,
      };

      mail.sendMail(mailOptions);

      const encryptedPassword = await bcrypt.hash(password, 10);

      const newuser = new users({
        gmail,
        password: encryptedPassword,
        admin: false,
        confirmNum,
      });

      await newuser.save();
      return res.status(200).json(newuser);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server error",
    });
  }
});

//Confirm Account
app.post("/confirm", async (req, res) => {
  try {
    const { id, num } = req.body;
    const user = await users.findById(id);
    const { confirmNum } = user;
    if (!id) {
      return res.status(400).json({
        error: "Id is not Valid",
      });
    }
    if (!num) {
      return res.status(400).json({
        error: "Enter Valid Num",
      });
    }
    if (num && confirmNum && id) {
      if (num === confirmNum) {
        await users.findByIdAndUpdate(
          id,
          {
            $set: {
              confirmNum: "confirmed",
            },
          },
          {
            runvalidators: true,
            new: true,
          }
        );
        return res.status(200).json(user);
      } else {
        return res.status(400).json({
          error: "wrong code",
        });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

//login auth
app.post("/login", async (req, res) => {
  try {
    const { gmail, password } = req.body;
    const profile = await users.findOne({
      gmail: gmail,
    });

    if (!gmail) {
      return res.status(400).json({
        error: "Enter Valid Email",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Enter Valid Password",
      });
    }

    if (!profile) {
      return res.status(400).json({
        error: "Email Couldnt Find Please First Register",
      });
    }

    if (profile && gmail && password) {
      if (await bcrypt.compare(password, profile.password)) {
        res.status(200).json(profile);
      } else {
        res.status(400).json({
          error: "Wrong Password",
        });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server error",
    });
  }
});

//Add User Information
app.post("/userprofile", async (req, res) => {
  try {
    const { id, googleScholarId, orcidId, researchGate, name } = req.body;
    if (!id) {
      return res.status(400).json({
        error: "Not Valid Id",
      });
    }
    if (!googleScholarId) {
      return res.status(400).json({
        error: "Enter Valid Scholar Id",
      });
    }
    if (id && googleScholarId) {
      let user = await users.findByIdAndUpdate(
        id,
        {
          googleScholarId,
          orcidId,
          researchGate,
          name,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      res.status(200).json(user);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server error",
    });
  }
});

// sending article
app.post("/users", async (req, res) => {
  try {
    const { name, keywords, id } = req.body;
    const file = req.files.file;
    const fileName = file.name;
    const underscore = fileName.replace(/ /g, "_");
    const underscoreName = name.replace(/ /g, "_");
    const filePath = `./public/uploads/${underscoreName}_${underscore}`;
    file.mv(filePath);

    console.log(req.body);

    if (!name) {
      return res.status(400).json({
        error: "enter valid name",
      });
    }
    if (!keywords) {
      return res.status(400).json({
        error: "enter valid keywords",
      });
    }
    if (!id) {
      return res.status(400).json({
        error: "enter valid id",
      });
    }
    if (id && name && keywords) {
      let data = {
        name,
        keywords,
        senderId: id,
        fileName,
        filePath,
      };
      let newfile = new files(data);
      await newfile.save();
      return res.status(200).json("Sent succesfully");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server Error",
    });
  }
});

// User Articles
app.get("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const articleList = await files.find({
      senderId: id,
    });
    return res.status(200).json(articleList);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server error",
    });
  }
});
//All Articles
app.get("/articles", async (req, res) => {
  try {
    const articleList = await files.find();
    return res.status(200).json(articleList);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

// Reviewer List
app.get("/reviewers", async (req, res) => {
  try {
    const reviewerList = await users.find({
      reviewer: true,
    });
    return res.status(200).json(reviewerList);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server Error",
    });
  }
});

// Send Message
app.post("/send", async (req, res) => {
  try {
    const { articleId, reviewerId } = req.body;
    if (!articleId) {
      res.status(400).json({
        error: "Invalid Article",
      });
    }
    if (!reviewerId) {
      res.status(400).json({
        error: "Invalid Reviewer",
      });
    }
    if (articleId && reviewerId) {
      const message = new messages({
        articleId,
        reviewerId,
      });
      await message.save();
      await files.findByIdAndUpdate(
        articleId,
        {
          $set: {
            status: "Sent To Reviewer",
          },
        },
        {
          runvalidators: true,
          new: true,
        }
      );
      res.status(200).json(message);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

// Get Reviewer Articles
app.get("/review/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const articleList = [];
    let articles = await messages.find({
      reviewerId: id,
    });
    for (let article of articles) {
      let selectedArticle = await files.findById(article.articleId);
      articleList.push(selectedArticle);
    }
    res.status(200).json(articleList);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server Error",
    });
  }
});

//Post Reviews
app.post("/postreview", async (req, res) => {
  try {
    const { articleId, reviewText } = req.body;
    if (!articleId) {
      return res.status(400).json({
        error: "Invalid Aritcle Id",
      });
    }
    if (!reviewText) {
      return res.status(400).json({
        error: "Enter Review",
      });
    }
    if (articleId && reviewText) {
      let oldReview = await reviews.findOne({
        articleId,
      });
      if (oldReview) {
        await reviews.findOneAndUpdate(articleId, {
          $set: {
            reviewText,
          },
        });
        return res.status(200).json("changed Succesfully");
      }
      let review = new reviews({
        articleId,
        reviewText,
      });
      await review.save();
      await files.findByIdAndUpdate(articleId, {
        $set: {
          status: "Reviewed",
        },
      });
      return res.status(200).json(review);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

//User Profile

app.post("/user", async (req, res) => {
  try {
    const { id } = req.body;
    let user = await users.findById(id);
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "server error",
    });
  }
});

//Get reviews

app.get("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let reviewList = await reviews.find({
      articleId: id,
    });
    let foundFile = await files.findById(id);
    if (!reviewList) {
      return res.status(400).json("Not Found");
    }
    return res.status(200).json({
      reviewList,
      foundFile,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server Error",
    });
  }
});

// Change Status
app.put("/submit", async (req, res) => {
  try {
    const { status, id } = req.body;
    await files.findByIdAndUpdate(id, {
      $set: {
        status: status,
      },
    });
    return res.status(200).json("Succesfully Sent");
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "Server Error",
    });
  }
});

// user profile
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  let filelist = await files.find({
    id: id,
  });
  let user = await users.findById(id);
  res.render("users/show.ejs", {
    user,
    filelist,
  });
});

// get userlist
app.get("/userlist", async (req, res) => {
  try {
    const userlist = await users.find();

    return res.status(200).json({
      data: userlist,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "server error",
    });
  }
});

//download pdf
app.get("/pdf/:id", async (req, res) => {
  let { id } = req.params;
  let file = await files.findById(id);
  console.log(id);
  const { filePath, fileName } = file;
  var createdfile = fs.createReadStream(filePath);
  var stat = fs.statSync(filePath);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  createdfile.pipe(res);
});
