const express = require("express");
const Joi = require("joi");

const { Contact } = require("../../models/contact");

const { schemas } = require("../../middlewares/validationJoi");

const { HttpError } = require("../../helpers");

const { isValidId,authenticate } = require("../../middlewares");

const router = express.Router();

router.get("/",authenticate,  async (req, res, next) => {
  try {

    const {_id:owner}=req.user;

    const {page=1,limit=10}=req.query;
    const skip=(page-1)*limit;

    const allContacts = await Contact.find({owner},"-createdAt -updatedAt",{skip,limit}).populate("owner",);
    res.json(allContacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id",authenticate, isValidId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const contactById = await Contact.findById(id);

    if (!contactById) {
      throw HttpError(404, `Contacts with id : ${id} not found`);
    }
    res.json(contactById);
  } catch (error) {
    next(error);
  }
});

router.post("/",authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.contactAddSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const {_id:owner}=req.user;
    console.log(req.user);
    const newContact = await Contact.create({...req.body,owner});
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, isValidId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const delContact = await Contact.findByIdAndDelete(id);
    if (!delContact) {
      throw HttpError(404, `Contacts with id : ${id} not found`);
    }

    res.json({ message: "Delete success" });
  } catch (error) {
    next(error);
  }
});

router.put("/:id",authenticate, isValidId, async (req, res, next) => {
  try {
    const { error } = schemas.contactAddSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const { id } = req.params;
    const newContact = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!newContact) {
      throw HttpError(404, `Contacts with id : ${id} not found`);
    }
    res.json(newContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/favorite", authenticate, isValidId, async (req, res, next) => {
  try {
    const { error } = schemas.updateFavoriteSchema.validate(req.body);
    if (error) {
      throw HttpError(400, "missing field favorite");
    }
    const { id } = req.params;
    const newContact = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!newContact) {
      throw HttpError(404, " Not found ");
    }
    res.json(newContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
