import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  files: [
    {
      name: String,
      type: String,
      content: String,
    },
  ],
})

const GeneralChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "새 일반 채팅",
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.GeneralChat || mongoose.model("GeneralChat", GeneralChatSchema)
