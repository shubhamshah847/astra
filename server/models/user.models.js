import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name is required"],
        trim:true,
        maxlength:100
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        trim:true,
        lowercase:true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"email is not valid"]
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[8,"Password must be at least 8 characters"],
        select:false
    },
    
    isVerified:{
        type:Boolean,
        default:false
    },
    isOwner:{
        type:Boolean,
        default:false
    }
})

const userModel = mongoose.model("user",userSchema)

export default userModel ;