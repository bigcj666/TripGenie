"""One-off: save Wikipedia thumbnails for the demo cities. Not part of the app runtime."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "places"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("duanqiao", "断桥残雪"),
    ("louwailou", "楼外楼"),
    ("westlake", "西湖"),
    ("leifeng", "雷峰塔"),
    ("hefang", "河坊街"),
    ("lingyin", "灵隐寺"),
    ("xixi", "西溪国家湿地公园"),
    ("gongchen", "拱宸桥"),
    ("wuhou", "成都武侯祠"),
    ("jinli", "锦里"),
    ("dufu", "杜甫草堂"),
    ("kuanzhai", "宽窄巷子"),
    ("panda", "成都大熊猫繁育研究基地"),
    ("chunxi", "春熙路"),
    ("chengdu", "成都市"),
    ("bell", "西安钟楼"),
    ("muslim", "回民街"),
    ("terracotta", "秦始皇兵马俑"),
    ("wildgoose", "大雁塔"),
    ("tang", "大唐不夜城"),
    ("wall", "西安城墙"),
    ("museum", "陕西历史博物馆"),
]

UA = {"User-Agent": "TulingTrip/0.1 (educational local demo)"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read()


def main() -> None:
    for file_id, title in JOBS:
        dest_jpg = OUT / f"{file_id}.jpg"
        dest_png = OUT / f"{file_id}.png"
        if (dest_jpg.exists() and dest_jpg.stat().st_size > 2000) or (
            dest_png.exists() and dest_png.stat().st_size > 2000
        ):
            print("skip", file_id, flush=True)
            continue
        api = "https://zh.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title)
        try:
            data = json.loads(get(api).decode())
            src = (data.get("thumbnail") or {}).get("source")
            if not src:
                print("noimg", file_id, flush=True)
                continue
            blob = get(src.split("?")[0])
            ext = ".png" if blob.startswith(b"\x89PNG") else ".jpg"
            if ext == ".jpg" and not blob.startswith(b"\xff\xd8"):
                print("bad", file_id, blob[:24], flush=True)
                continue
            dest = OUT / f"{file_id}{ext}"
            dest.write_bytes(blob)
            print("ok", file_id, ext, len(blob), flush=True)
        except Exception as exc:
            print("fail", file_id, type(exc).__name__, exc, flush=True)
        time.sleep(0.8)
    print("done", flush=True)


if __name__ == "__main__":
    main()
