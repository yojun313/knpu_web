import mongoose from "mongoose"

const TranslationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "ko",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Translation || mongoose.model("Translation", TranslationSchema)
