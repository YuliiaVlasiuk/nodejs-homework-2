const nodemailer=require("nodemailer");

const {UKR_NET_EMAIL,UKR_NET_PASSWORD}=process.env;

const nodemailerConfig={
  host:"smtp.ukr.net",
  port:465,
  auth:{
    user:UKR_NET_EMAIL,
    pass:UKR_NET_PASSWORD,
  }
}

const transport=nodemailer.createTransport(nodemailerConfig);

const sendEmail=async(data)=>{
const email={...data,from:UKR_NET_EMAIL};
await transport.sendMail(email);
return true;

}

module.exports=sendEmail;

// const email={
// from:UKR_NET_EMAIL,
// to:"yokofo8847@soremap.com",
// subject:"verify email",
// html:`<a href=""> Click verify email  </a>`
// }

// transport.sendMail(email).then(()=>console.log("email send succes")).catch(error=>console.log(error.message));