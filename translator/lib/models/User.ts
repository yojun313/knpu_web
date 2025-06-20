import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    openaiApiKey: {
      type: String,
      required: true,
      trim: true,
    },
    preferredModel: {
      type: String,
      default: "gpt-4o",
      enum: [
        // GPT-4.1 계열
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        // GPT-4o 계열
        "gpt-4o",
        "gpt-4o-mini",
        // GPT-4.5 계열
        "gpt-4.5-preview",
        // 기존 GPT-4 계열
        "gpt-4-turbo",
        "gpt-3.5-turbo",
        // o-시리즈 (추론 모델)
        "o3",
        "o3-pro",
        "o3-mini",
        "o4-mini",
        "o1",
        "o1-pro",
        "o1-mini",
      ],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)
