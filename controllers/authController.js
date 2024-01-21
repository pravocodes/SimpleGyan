import userModel from "../models/userModel.js";
import { hashedPassword } from "../Helper/authHelper.js";
import fast2sms from "fast-two-sms";
import nodemailer from "nodemailer";

export const RegisterController = async (req, res) => {
  //firstname //lastname //email //phonenumber //state //country //

  try {
    const { FirstName, LastName, PhoneNumber, Nationality, Email, Password } =
      req.body;

    if (!FirstName || !LastName) {
      return res.send({ message: "Name is Required" });
    }
    if (!PhoneNumber) {
      res.send({ message: "PhoneNumber is Required" });
    }
    if (!Nationality) {
      res.send({ message: "Nationality is Required" });
    }
    if (!Email) {
      res.send({ message: "Email is Required" });
    }
    if (!Password) {
      res.send({ message: "Password is Required" });
    }

    const ExistingUser = await userModel.findOne({ Email });
    if (ExistingUser) {
      res.status(201).send({
        success: false,
        message: "User Already Exists",
      });
    }
    const hashPassword = await hashedPassword(Password);
    const user = await new userModel({
      FirstName,
      LastName,
      PhoneNumber,
      Nationality,
      isNumberVerified: false,
      isEmailVerified: false,
      Email,
      Password: hashPassword,
    }).save();

    res.status(200).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

export const otpSendController = async (req, res) => {
  const { PhoneNumber } = req.body;
  var otp = Math.floor(1000 + Math.random() * 9000);
  var options = {
    authorization: process.env.SMSAPIKEY,
    message: `Your Otp for GyanPoorti registration is ${otp}`,
    numbers: [PhoneNumber],
  };
  // console.log(options);
  fast2sms
    .sendMessage(options)
    .then(async (response) => {
      // console.log(response)

      if (response != "") {
        const user = await userModel.findOne({ PhoneNumber });
        if (user) {
          user.otp = otp;
          user.save();
        }
      }

      res.send({
        success: true,
        message: "Your Otp Send successfully",
        response,
      });
    })
    .catch((error) => {
      res.send(error);
    });
};

export const VerifyOTPController = async (req, res) => {
  try {
    const { PhoneNumber, OTP } = req.body;
    let user = await userModel.findOne({ PhoneNumber });
    if (!user || user.otp != OTP) {
      return res.json({
        success: false,
        message: "Invalid OTP or User not found",
      });
    } else {
      user.isNumberVerified = true;
      user.otp = 0;
      user.save();
      res.send({
        success: true,
        message: "User verified Successfully",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      message: "Error in verifing please try again",
      error,
    });
  }
};

export const mailSenderController = async (req, res) => {
  try {
    const { Email } = req.body;
    var mailotp = Math.floor(1000 + Math.random() * 9000);
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.USERMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailoption = {
      from: {
        name: "Gyan Poorti",
        address: process.env.USERMAIL,
      }, // sender address
      to: [Email], // list of receivers
      subject: "OTP Verification", // Subject line
      text: `Dear Customer,\n Your OTP is ${mailotp}. Do not share it with anyone by any means. This is confidential and to be used by you only.\n \n Warm regards, \n GyanPoorti (GP)`, // plain text body
      // html: "<b>Hello world?</b>", // html body
    };
    const sendMail = async (transporter, mailoption) => {
      try {
        await transporter.sendMail(mailoption);
        const user = await userModel.findOne({ Email });
        if (user) {
          user.mailotp = mailotp;
          user.save();
        }
        res.send("Email has been sent!");
      } catch (error) {
        res.send({
          success: false,
          message: "Error sending mail try after some time",
          error,
        });
      }
    };

    sendMail(transporter, mailoption);
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Mail not send try after some time",
      error,
    });
  }
};

export const verifyMailController = async (req, res) => {
  try {
    const { Email, OTP } = req.body;
    let user = await userModel.findOne({ Email });
    if (!user || user.mailotp != OTP) {
      return res.json({
        success: false,
        message: "Invalid OTP or User not found",
      });
    } else {
      user.isEmailVerified = true;
      user.mailotp = 0;
      user.save();
      res.json({
        success: true,
        message: "User verified Successfully",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      message: "Error in verifing please try again",
      error,
    });
  }
};
