import mongoose from "mongoose";

const UserAddInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  jeevanKaFunda: {
    type: String,
    default: "",
  },
  iitjIs: {
    type: String,
    default: "",
  },
  crazyMoment: {
    type: String,
    default: "",
  },
  lifeTitle: {
    type: String,
    default: "",
  },
});

const UserAddInfo =
  mongoose.models.UserAddInfo ||
  mongoose.model("UserAddInfo", UserAddInfoSchema);

export default UserAddInfo;