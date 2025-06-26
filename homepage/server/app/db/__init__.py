from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("MONGO_URI")
client = MongoClient(uri)

homepage_db = client["homepage"]
members_db = homepage_db["members"]
news_db = homepage_db["news"]