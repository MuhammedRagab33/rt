// اختيار عناصر HTML
const video = document.getElementById("camera");
const captureButton = document.getElementById("captureButton");
const detectedWeightContainer = document.getElementById("detectedWeight");
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
