// فتح الكاميرا
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("captureButton");
const detectedWeightContainer = document.getElementById("detectedWeight");
const saveButton = document.getElementById("saveButton");
const resultsArea = document.getElementById("results");

// الوصول إلى الكاميرا
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your device permissions.");
  });

// التقاط الصورة وتحليل الوزن الصافي
captureButton.addEventListener("click", () => {
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // اقتصاص منطقة الوزن الصافي
  const netWeightRegion = {
    x: canvas.width * 0.6, // تعديل حسب موقع الوزن
    y: canvas.height * 0.75, // تعديل حسب موقع الوزن
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

  // تحليل النص باستخدام Tesseract.js
  Tesseract.recognize(
    croppedCanvas.toDataURL("image/png"),
    'eng', // اللغة
    {
      logger: info => console.log(info), // لتتبع العملية (اختياري)
    }
  ).then(({ data: { text } }) => {
    const match = text.match(/([\d.]+)\s*Kg/i);
    if (match) {
      const netWeight = match[1];
      detectedWeightContainer.textContent = `Net Weight: ${netWeight} Kg`;
      saveButton.disabled = false;
      saveButton.setAttribute("data-weight", netWeight); // تخزين الوزن موقتًا في الزر
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
    detectedWeightContainer.textContent = "No weight detected yet";
    saveButton.disabled = true;
  }
});

// نسخ النصوص إلى الحافظة
document.getElementById("copyButton").addEventListener("click", () => {
  resultsArea.select();
  document.execCommand("copy");
  alert("Copied to clipboard!");
});
