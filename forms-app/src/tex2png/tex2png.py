#Skrypt pozwalający na konwersję symboli matematycznych i przekształcanie
#wynikowych zdjęć.

import sys, os
#Biblioteka służąca konwersji latex -> pdf
import tex2pix
#Biblioteka służąca konwersji pdf -> png
from pdf2image import convert_from_path
#Biblioteka openCV  - zmienia rozmiar wynikowego obrazu
import cv2
#Biblioteka pozwalająca na konwersję obrazu do formatu base64.
import base64

#Deklaracje nazw plików pośrednich:
tex = "qst"+sys.argv[2]+".tex"
pdf = "temp"+sys.argv[2]+".pdf"
pic = "temp"+sys.argv[2]+".png" ## pdf-size png
png = "pictures/qst"+sys.argv[2]+".png"  ## output
bas = "pictures/base64"+sys.argv[2]+".txt" ## base64 output

#Tworzenie pliu .tex o odpowiedniej zawartości:
template = open("texTemplate.tex", "r");
texContent = template.read().replace("%excercise%", sys.argv[1])

texFile= open(tex,  "w")
texFile.write(texContent)
texFile.close()

#Konwersja .tex -> .pdf
texReader = open(tex)
renderer = tex2pix.Renderer(texReader, runbibtex=True, extras=[])
renderer.mkpdf(pdf)

#Konwersja .pdf -> .png
pages = convert_from_path(pdf)
pages[0].save(pic, 'PNG')

# Przycinanie zdjęcia do odpowiedniego rozmiaru.
## Poniższy kod został wzięty ze strony stackoverflow. Rozwiązywany
## w nim problem nie stanowi przedmiotu pracy:
## https://stackoverflow.com/questions/48395434/how-to-crop-or-remove-white-background-from-an-image

## (1) Convert to gray, and threshold
img =cv2.imread(pic)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
th, threshed = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

## (2) Morph-op to remove noise
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11,11))
morphed = cv2.morphologyEx(threshed, cv2.MORPH_CLOSE, kernel)

## (3) Find the max-area contour
cnts = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[-2]
cnt = sorted(cnts, key=cv2.contourArea)[-1]

## (4) Crop and save it
x,y,w,h = cv2.boundingRect(cnt)
dst = img[y:y+h, x:x+w]
cv2.imwrite(png, dst)


# Konwersja .png -> base64
with open(png, "rb") as image_file:
    b64 = base64.b64encode(image_file.read())
base64File = open(bas, "w")
base64File.write(b64.decode('utf-8'))
base64File.close()

# Usunięcie zbędnych plików.
os.remove(tex)
os.remove(pic)
os.remove(pdf)
print("zakończone")
