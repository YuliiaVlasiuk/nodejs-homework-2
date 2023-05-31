const express = require("express");

const router = express.Router();

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");

const { User } = require("../../models/user");

const { schemas } = require("../../middlewares/validationJoi");
const { authenticate, upload } = require("../../middlewares");

const { HttpError } = require("../../helpers");
const { required } = require("joi");

require("dotenv").config();

const { SECRET_KEY } = process.env;

const avatarsDir = path.join(__dirname,"../../" ,"public", "avatars");
console.log(avatarsDir);

router.post("/register", async (req, res, next) => {
  try {
    const { error } = schemas.registerSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      throw HttpError(409, "Email already in use");
    }
    const hashPassword = await bcryptjs.hash(password, 10);

    const avatarURL = gravatar.url(email);

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(401, "Email or password invalide");
    }

    const passwordCompare = await bcryptjs.compare(password, user.password);

    if (!passwordCompare) {
      throw HttpError(401, "Email or password invalide");
    }

    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

router.get("/current", authenticate, async (req, res, next) => {
  try {
    const { email, subscription } = req.user;
    res.json({ email, subscription });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: "" });
    res.json({
      message: "Logout success",
    });
  } catch (error) {
    next(error);
  }
});

router.patch(  "/avatars",  authenticate, upload.single("avatar"),  async (req, res,next) => {
    try {
      const { _id } = req.user;

      const { path: tempUpload, originalname } = req.file;

   const filename=`${_id}_${originalname}`;

      const resultUpload = path.join(avatarsDir, filename);
      await fs.rename(tempUpload, resultUpload);

      const avatarURL = path.join("avatars", filename);
      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({ avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
