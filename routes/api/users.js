const express = require("express");

const router = express.Router();

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");
const { nanoid } = require("nanoid");

const { User } = require("../../models/user");

const { schemas } = require("../../middlewares/validationJoi");
const { authenticate, upload } = require("../../middlewares");

const { HttpError, sendEmail } = require("../../helpers");
const { required } = require("joi");
const { emit } = require("process");

require("dotenv").config();

const { SECRET_KEY, PROJECT_URL } = process.env;

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

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
    const verificationToken = nanoid();

    const avatarURL = gravatar.url(email);

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    const verifyEmail = {
      to: email,
      subject: "verify email",
      html: `<a target="_blank" href="${PROJECT_URL}/api/users/verify/${verificationToken}"> Click verify email </a>`,
    };

    await sendEmail(verifyEmail);

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:verificationToken", async (req, res) => {
  try {
    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw HttpError(404, error.message);
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });

    res.json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { error } = schemas.emailSchema.validate(req.body);
    if (error) {
      throw HttpError(400, "missing required field email");
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(404);
    }

    if (user.verify) {
      throw HttpError(400, "Verification has already been passed");
    }

    const verifyEmail = {
      to: email,
      subject: "verify email",
      html: `<a target="_blank" href="${PROJECT_URL}/api/users/verify/${verificationToken}"> Click verify email </a>`,
    };

    await sendEmail(verifyEmail);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.verify) {
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

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const { _id } = req.user;

      const { path: tempUpload, originalname } = req.file;

      const filename = `${_id}_${originalname}`;

      const resultUpload = path.join(avatarsDir, filename);
      await fs.rename(tempUpload, resultUpload);

      const avatar = await jimp.read(resultUpload);
      await avatar.resize(250, 250);
      await avatar.writeAsync(resultUpload);

      const avatarURL = path.join("avatars", filename);
      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({ avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
