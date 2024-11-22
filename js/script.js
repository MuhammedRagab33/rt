<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مسح الوزن الصافي</title>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@2.1.0/dist/tesseract.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            text-align: center;
            max-width: 500px;
            width: 100%;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }

        .camera-container {
            position: relative;
            margin-bottom: 20px;
        }

        #video {
            width: 100%;
            height: auto;
            border-radius: 10px;
        }

        .scanned-weight {
            margin-bottom: 20px;
        }

        #weight-text {
            font-size: 18px;
            color: #333;
        }

        button {
            padding: 10px 15px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        }

        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }

        .draft {
            margin-top: 20px;
            text-align: left;
        }

        textarea {
            width: 100%;
            height: 100px;
            resize: none;
            padding: 10px;
            font-size: 16px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        #copy-all {
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>مسح الوزن الصافي</h1>
        <div class="camera-container">
            <video id="camera" width="100%" height="auto" autoplay></video>
            <canvas id="canvas" style="display: none;"></canvas>
        </div>
        <div class="scanned-weight">
            <h3>الوزن الممسوح:</h3>
            <p id="weight-text">انتظر لمسح الوزن...</p>
        </div>
        <button id="captureButton">التقاط الصورة</button>
        <button id="saveButton" disabled>حفظ الوزن في المسودة</button>
        <div class="draft">
            <h3>المسودة:</h3>
            <textarea id="results" readonly></textarea>
            <button id="copyButton">نسخ الكل</button>
        </div>
    </div>

    <script>
        const video = document.getElementById("camera");
        const captureButton = document.getElementById("captureButton");
        const detectedWeightContainer = document.getElementById("weight-text");
        const saveButton = document.getElementById("saveButton");
        const resultsArea = document.getElementById("results");
        const copyButton = document.getElementById("copyButton");

        // تشغيل الكاميرا الخلفية
        function initializeCamera() {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: { ideal: "environment" }, // طلب الكاميرا الخلفية
                    },
                })
                .then((stream) => {
                    video.srcObject = stream;
                    console.log("Camera is active!");
                })
                .catch((error) => {
                    console.error("Camera access error:", error);
                    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                        alert("No camera found on your device. Please check your device's camera.");
                    } else {
                        alert("Could not access the camera. Please ensure the camera is not in use by another app.");
                    }
                });
        }

        // محاولة الاتصال بالكاميرا عند تحميل الصفحة
        document.addEventListener("DOMContentLoaded", initializeCamera);

        // التقاط الصورة وتحليل الوزن الصافي
        captureButton.addEventListener("click", () => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // اقتصاص المنطقة المحتملة للوزن الصافي (يمكن تعديل الإحداثيات)
            const netWeightRegion = {
                x: canvas.width * 0.6, // نسبة العرض
                y: canvas.height * 0.75, // نسبة الطول
                width: canvas.width * 0.35,
                height: canvas.height * 0.1,
            };

            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = netWeightRegion.width;
            croppedCanvas.height = netWeightRegion.height;

            const croppedContext = croppedCanvas.getContext("2d");
            croppedContext.drawImage(
                canvas,
                netWeightRegion.x,
                netWeightRegion.y,
                netWeightRegion.width,
                netWeightRegion.height,
                0,
                0,
                netWeightRegion.width,
                netWeightRegion.height
            );

            // استخدام Tesseract.js للتعرف على النص
            Tesseract.recognize(
                croppedCanvas.toDataURL("image/png"),
                "eng", // اللغة الإنجليزية
                {
                    logger: (info) => console.log(info), // لمتابعة عملية التحليل
                }
            ).then(({ data: { text } }) => {
                // استخراج الوزن الصافي باستخدام Regex
                const match = text.match(/([\d.]+)\s*Kg/i);
                if (match) {
                    const netWeight = match[1];
                    detectedWeightContainer.textContent = `Net Weight: ${netWeight} Kg`;
                    saveButton.disabled = false;
                    saveButton.setAttribute("data-weight", netWeight); // تخزين الوزن مؤقتًا
                } else {
                    detectedWeightContainer.textContent = "No weight detected.";
                    saveButton.disabled = true;
                }
            });
        });

        // حفظ الوزن في المسودة
        saveButton.addEventListener("click", () => {
            const weight = saveButton.getAttribute("data-weight");
            if (weight) {
                resultsArea.value += `Net Weight: ${weight} Kg\n`;
                detectedWeightContainer.textContent = "No weight detected yet.";
                saveButton.disabled = true;
            }
        });

        // نسخ جميع الأوزان إلى الحافظة
        copyButton.addEventListener("click", () => {
            resultsArea.select();
            document.execCommand("copy");
            alert("All weights copied to clipboard!");
        });
    </script>
</body>
</html>
