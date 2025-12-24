from fastapi import APIRouter
import csv
import os

router = APIRouter()

csv_path = os.path.join(os.path.dirname(__file__), '..', 'forms', '경찰청_전국 경찰서 명칭 및 주소.csv')

@router.get("/stations")
def get_police_stations():
    stations = []

    with open(csv_path, newline="", encoding="cp949") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stations.append({
                "name": row["경찰서명"]
            })

    return stations
