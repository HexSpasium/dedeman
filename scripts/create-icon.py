from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path("build")
OUT.mkdir(parents=True, exist_ok=True)
S = 1024
im = Image.new("RGBA", (S, S), (12, 13, 16, 255))
d = ImageDraw.Draw(im)

# Premium charcoal tile with a fine champagne-gold frame.
d.rounded_rectangle((54, 54, 970, 970), radius=210, fill=(18, 19, 22, 255), outline=(190, 155, 91, 255), width=18)
d.rounded_rectangle((92, 92, 932, 932), radius=176, outline=(75, 65, 48, 255), width=4)

try:
    font = ImageFont.truetype("arialbd.ttf", 350)
except OSError:
    font = ImageFont.load_default()

label = "PD"
box = d.textbbox((0, 0), label, font=font, stroke_width=0)
w, h = box[2] - box[0], box[3] - box[1]
d.text(((S-w)/2, (S-h)/2 - 20), label, font=font, fill=(226, 195, 133, 255), stroke_width=1)

# Export a multi-resolution Windows icon.
im.save(OUT / "park-dedeman.ico", format="ICO", sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print("Created build/park-dedeman.ico")
