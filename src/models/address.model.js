import mongoose from "mongoose";

const AdressSchema = new mongoose.Schema({
       address: {
        type: String,
      },
      phone: {
        type: String,
      },
      email: {
         type:String,
      },
      facebook: {
        type: String,
       
      },
      instagram: {
        type: String,
        
      },
      twitter: {
        type: String,
     
      },
      youtube: {
        type: String,
        required: true,
      },
      linkedin: {
        type: String,
   
      },
      image: {
        type: String,
      },
})

export const  Adreess = mongoose.Model('Adress', AdressSchema);