
import numpy as np
from PIL import Image, ImageOps
from pyzbar.pyzbar import decode
import io

def test_qr_detection():
    # Create a dummy "cyan on black" QR-like pattern if we don't have qrcode lib
    try:
        import qrcode
    except ImportError:
        print("qrcode library not found, attempting to install...")
        import subprocess
        subprocess.check_call(["pip", "install", "qrcode"])
        import qrcode

    # Generate a standard QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data("Test data 123456")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Try decoding standard
    print("Standard (Black on White):", "Found" if decode(img) else "Not found")

    # Inverted (White on Black)
    inverted_img = ImageOps.invert(img)
    print("Inverted (White on Black):", "Found" if decode(inverted_img) else "Not found")

    # Cyan on Black
    # Cyan is (0, 255, 255)
    # Background Black (0, 0, 0)
    data = np.array(img)
    cyan_on_black = np.zeros_like(data)
    pattern_mask = (data[:,:,0] < 128)
    cyan_on_black[pattern_mask] = [0, 255, 255]
    cyan_img = Image.fromarray(cyan_on_black)
    print("Cyan on Black:", "Found" if decode(cyan_img) else "Not found")

    # Gray Cyan on Black
    gray_cyan = cyan_img.convert("L")
    print("Gray Cyan on Black:", "Found" if decode(gray_cyan) else "Not found")

    # Inverted Gray Cyan on Black
    inverted_gray_cyan = ImageOps.invert(gray_cyan)
    print("Inverted Gray Cyan on Black:", "Found" if decode(inverted_gray_cyan) else "Not found")

    # Dark Blue on White (#0A1AFF)
    # Dark blue is (10, 26, 255) - wait, #0A1AFF is R:10, G:26, B:255
    data_white = np.ones_like(data) * 255
    pattern_mask = (data[:,:,0] < 128)
    data_white[pattern_mask] = [10, 26, 255]
    dark_blue_img = Image.fromarray(data_white)
    print("Dark Blue on White:", "Found" if decode(dark_blue_img) else "Not found")

    # Gray Dark Blue on White
    gray_dark_blue = dark_blue_img.convert("L")
    print("Gray Dark Blue on White:", "Found" if decode(gray_dark_blue) else "Not found")

if __name__ == "__main__":
    test_qr_detection()
